/**
 * EVE Note — OpenAI proxy (Vercel serverless function).
 * Keeps the API key server-side. Falls back gracefully when the key is absent.
 *
 * Set the environment variable in your host dashboard (never in the client):
 *   OPENAI_API_KEY=sk-...
 * Optional:
 *   OPENAI_MODEL=gpt-4o-mini
 */

const SYSTEM = `You are EVE, the AI assistant inside EVE Note — an elegant personal knowledge app.
Tone: warm, intelligent, calm, and concise. Format responses as clean HTML fragments using only
<h4>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <span class="mark">, <pre>, <code>.
Never include <script>, <style>, <html>, <head>, or <body> tags. Keep answers short unless expanding.`;

const TASK_INSTRUCTIONS = {
  summarize: "Summarize the note in 1-3 sentences. Also return a short 'summary' field.",
  improve: "Rewrite the note to be clearer and better organized, preserving the author's voice and meaning. Return the improved note HTML in 'content'.",
  grammar: "Correct grammar, spelling, and punctuation without changing the voice. Return the corrected note HTML in 'content'.",
  brainstorm: "Offer 5-7 related ideas as a bullet list, grounded in the note's themes.",
  expand: "Develop the short thought into a fuller idea with a couple of short sections. Return note HTML in 'content'.",
  actions: "Convert the note into a checklist of concrete action items. Return checklist HTML in 'content'.",
  chat: "Answer as EVE, using the user's notes, events, and any attached note as context."
};

function noteDigest(notes = [], limit = 12) {
  return notes
    .filter((n) => !n.deleted)
    .slice(0, limit)
    .map((n) => `- ${n.title}${n.summary ? `: ${n.summary}` : ""} [tags: ${(n.tags || []).join(", ")}]`)
    .join("\n");
}

function buildMessages(task, payload = {}) {
  const context = [
    payload.title && `Current note title: ${payload.title}`,
    payload.content && `Current note text:\n${payload.content}`,
    payload.message && `User message: ${payload.message}`,
    payload.attached && `Attached note — ${payload.attached.title}: ${payload.attached.summary || ""}`,
    payload.notes && `Recent notes:\n${noteDigest(payload.notes)}`,
    payload.events && `Upcoming events:\n${payload.events.slice(0, 10).map((e) => `- ${e.date} ${e.start} ${e.title}`).join("\n")}`
  ].filter(Boolean).join("\n\n");

  return [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: `${TASK_INSTRUCTIONS[task] || TASK_INSTRUCTIONS.chat}\n\n${context}\n\nRespond with a JSON object: {"html": "..."} and optionally "summary" or "content". JSON only, no markdown fences.`
    }
  ];
}

function extractJson(text = "") {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fall through */ }
  }
  return { html: `<p>${cleaned.replace(/</g, "&lt;")}</p>` };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "OPENAI_API_KEY not configured", fallback: true });
  }

  const { task = "chat", payload = {} } = req.body || {};

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: buildMessages(task, payload)
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(response.status).json({ error: "OpenAI error", detail: detail.slice(0, 300), fallback: true });
    }

    const data = await response.json();
    const out = extractJson(data.choices?.[0]?.message?.content || "");
    return res.status(200).json(out);
  } catch (err) {
    return res.status(500).json({ error: "Proxy failure", detail: String(err).slice(0, 200), fallback: true });
  }
};
