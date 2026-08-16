#!/usr/bin/env python3
"""
EVE Note — local dev server with OpenAI proxy.

Serves the static site AND the /api/eve endpoint, reading OPENAI_API_KEY
from .env. No dependencies beyond the Python standard library.

Usage:
    python3 server.py            # http://localhost:5173
    PORT=8000 python3 server.py  # custom port
"""

import json
import os
import re
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "5173"))

SYSTEM = """You are EVE, the AI assistant inside EVE Note — an elegant personal knowledge app.
Tone: warm, intelligent, calm, and concise. Format responses as clean HTML fragments using only
<h4>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <span class="mark">, <pre>, <code>.
Never include <script>, <style>, <html>, <head>, or <body> tags. Keep answers short unless expanding."""

TASK_INSTRUCTIONS = {
    "summarize": "Summarize the note in 1-3 sentences. Also return a short 'summary' field.",
    "improve": "Rewrite the note to be clearer and better organized, preserving the author's voice and meaning. Return the improved note HTML in 'content'.",
    "grammar": "Correct grammar, spelling, and punctuation without changing the voice. Return the corrected note HTML in 'content'.",
    "brainstorm": "Offer 5-7 related ideas as a bullet list, grounded in the note's themes.",
    "expand": "Develop the short thought into a fuller idea with a couple of short sections. Return note HTML in 'content'.",
    "actions": "Convert the note into a checklist of concrete action items. Return checklist HTML in 'content'.",
    "chat": "Answer as EVE, using the user's notes, events, and any attached note as context.",
}


def load_env():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def note_digest(notes, limit=12):
    lines = []
    for n in notes:
        if n.get("deleted"):
            continue
        tags = ", ".join(n.get("tags") or [])
        lines.append(f"- {n.get('title', '')}: {n.get('summary', '')} [tags: {tags}]")
        if len(lines) >= limit:
            break
    return "\n".join(lines)


def strip_html(text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text or "")).strip()


def build_messages(task, payload):
    parts = []
    if payload.get("title"):
        parts.append(f"Current note title: {payload['title']}")
    if payload.get("content"):
        parts.append(f"Current note text:\n{strip_html(payload['content'])}")
    if payload.get("message"):
        parts.append(f"User message: {payload['message']}")
    if payload.get("attached"):
        a = payload["attached"]
        parts.append(f"Attached note — {a.get('title', '')}: {a.get('summary', '')}")
    if payload.get("notes"):
        parts.append(f"Recent notes:\n{note_digest(payload['notes'])}")
    if payload.get("events"):
        ev = "\n".join(f"- {e.get('date')} {e.get('start')} {e.get('title')}" for e in payload["events"][:10])
        parts.append(f"Upcoming events:\n{ev}")

    instruction = TASK_INSTRUCTIONS.get(task, TASK_INSTRUCTIONS["chat"])
    user = (
        f"{instruction}\n\n" + "\n\n".join(parts) +
        '\n\nRespond with a JSON object: {"html": "..."} and optionally "summary" or "content". '
        "JSON only, no markdown fences."
    )
    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user},
    ]


def extract_json(text):
    cleaned = re.sub(r"```json|```", "", text or "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return {"html": f"<p>{cleaned}</p>"}


def call_openai(task, payload):
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key or key.startswith("sk-your"):
        return None, "OPENAI_API_KEY not configured"

    body = json.dumps({
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "temperature": 0.6,
        "response_format": {"type": "json_object"},
        "messages": build_messages(task, payload),
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            data = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return None, f"OpenAI error {e.code}: {e.read().decode()[:200]}"
    except Exception as e:
        return None, f"Proxy failure: {e}"

    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    return extract_json(content), None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        pass  # quiet logs

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path.rstrip("/") not in ("/api/eve",):
            self._send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        result, err = call_openai(body.get("task", "chat"), body.get("payload", {}))
        if err:
            self._send_json(503, {"error": err, "fallback": True})
        else:
            self._send_json(200, result)


if __name__ == "__main__":
    load_env()
    has_key = bool(os.environ.get("OPENAI_API_KEY")) and not os.environ["OPENAI_API_KEY"].startswith("sk-your")
    print(f"\n  EVE Note  →  http://localhost:{PORT}\n")
    print(f"  AI mode: {'OpenAI (live)' if has_key else 'mock (no OPENAI_API_KEY in .env)'}\n")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
