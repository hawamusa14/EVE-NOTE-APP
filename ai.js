/**
 * EveAI — isolated AI service for EVE Note.
 * Swap `complete()` with a real model endpoint later; the rest of the app
 * only talks to the public methods below.
 */
const EveAI = (() => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function complete(task, payload) {
    // Seam for a live API:
    // return fetch("/api/eve", { method: "POST", body: JSON.stringify({ task, payload }) })
    await wait(520 + Math.random() * 480);
    return mock(task, payload);
  }

  function plain(html = "") {
    return String(html)
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function firstSentences(text, n = 2) {
    const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    return (parts.slice(0, n).join(" ") || text).slice(0, 280);
  }

  function keywords(text) {
    const stop = new Set("the a an and or of to in for on with from this that it is are was be as by at we i you our your".split(" "));
    return [...new Set(
      plain(text).toLowerCase().match(/[a-z][a-z’']{3,}/g) || []
    )].filter((w) => !stop.has(w)).slice(0, 8);
  }

  function mock(task, payload) {
    const text = plain(payload.content || payload.message || "");
    const title = payload.title || "this note";
    const notes = payload.notes || [];
    const events = payload.events || [];

    switch (task) {
      case "summarize":
        return summarizeLocal(text, title);
      case "improve":
        return improveLocal(text, title);
      case "grammar":
        return grammarLocal(text);
      case "brainstorm":
        return brainstormLocal(text, title, payload.tags);
      case "expand":
        return expandLocal(text, title);
      case "actions":
        return actionsLocal(text, title);
      case "chat":
        return chatLocal(payload.message, notes, events, payload.attached);
      default:
        return { html: "<p>EVE is still learning that request.</p>", summary: "" };
    }
  }

  function summarizeLocal(text, title) {
    if (!text) {
      return {
        summary: `A new thought titled “${title}” is waiting to be written.`,
        html: `<p>There isn’t enough writing yet to summarize. Add a few sentences and ask again.</p>`
      };
    }
    const keys = keywords(text);
    const summary = firstSentences(text);
    return {
      summary,
      html: `<h4>Summary</h4><blockquote>${summary}</blockquote><p>Key threads: <span class="mark">${keys.slice(0, 5).join(", ") || "emerging ideas"}</span>.</p>`
    };
  }

  function improveLocal(text, title) {
    if (!text) {
      return { html: "<p>Write a draft first — EVE polishes what you begin.</p>", content: "" };
    }
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const body = sentences.map((s) => `<p>${s.replace(/^\w/, (c) => c.toUpperCase())}</p>`).join("");
    const content = `
      <h2>${title}</h2>
      <p><em>A clearer arrangement of your original thinking:</em></p>
      ${body}
      <blockquote>Keep the heart of this idea. EVE only refined the shape.</blockquote>
    `;
    return {
      html: `<h4>Improved draft</h4>${content}`,
      content
    };
  }

  function grammarLocal(text) {
    if (!text) return { html: "<p>Nothing to correct yet.</p>", content: "" };
    let fixed = text
      .replace(/\bi\b/g, "I")
      .replace(/\s+,/g, ",")
      .replace(/\s+\./g, ".")
      .replace(/\bteh\b/gi, "the")
      .replace(/\brecieve\b/gi, "receive")
      .replace(/\bseperate\b/gi, "separate")
      .replace(/\bdefinately\b/gi, "definitely")
      .replace(/(^|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase());
    if (!/[.!?]$/.test(fixed)) fixed += ".";
    return {
      html: `<h4>Grammar</h4><p>${fixed}</p>`,
      content: `<p>${fixed}</p>`
    };
  }

  function brainstormLocal(text, title, tags = []) {
    const seeds = [...keywords(title + " " + text), ...tags].filter(Boolean);
    const ideas = [
      `Host a small gathering that grows out of ${seeds[0] || "this idea"} — intimate, intentional, and easy to repeat.`,
      `Document the why in a one-page manifesto so others can join without losing the original spirit.`,
      `Pair this with mentorship: one experienced voice, one emerging voice, one shared practice.`,
      `Create a monthly ritual (tea, reading, service) that keeps ${seeds[1] || "the community"} returning.`,
      `Map who is already doing adjacent work and send three thoughtful invitations.`,
      `Design a simple artifact — a zine, a guide, a constellation of quotes — that travels farther than a meeting.`
    ];
    return {
      html: `<h4>Brainstorm</h4><ul>${ideas.map((i) => `<li>${i}</li>`).join("")}</ul>`,
      ideas
    };
  }

  function expandLocal(text, title) {
    const core = text || `the spark inside “${title}”`;
    const content = `
      <h2>${title}</h2>
      <p>${firstSentences(plain(core), 1) || "This thought wants more room."}</p>
      <h2>What this could become</h2>
      <p>Start with the feeling underneath the words. Then give it a shape people can enter: a gathering, a practice, a page, a plan. Name the people it is for. Name what would make it feel alive rather than merely busy.</p>
      <h2>Next layer</h2>
      <ul>
        <li>Write the invitation in one sentence.</li>
        <li>Choose a first, small, beautiful version.</li>
        <li>Decide what you will not do — so the idea stays elegant.</li>
      </ul>
    `;
    return { html: `<h4>Expanded</h4>${content}`, content };
  }

  function actionsLocal(text, title) {
    const bits = (plain(text).match(/[^.!?]+[.!?]?/g) || [title]).slice(0, 6);
    const items = bits.map((b) => b.replace(/^[\s•-]+/, "").slice(0, 90));
    const htmlList = `<ul class="checklist">${items.map((i) => `<li><input type="checkbox"> ${i}</li>`).join("")}</ul>`;
    return {
      html: `<h4>Action items</h4>${htmlList}`,
      content: `<h2>Action items</h2>${htmlList}`
    };
  }

  function listTitles(notes, n = 5) {
    return notes.filter((x) => !x.deleted).slice(0, n).map((n) => n.title);
  }

  function chatLocal(message, notes, events, attached) {
    const q = (message || "").toLowerCase();
    const live = notes.filter((n) => !n.deleted);
    const titles = listTitles(live);
    const tagCounts = {};
    live.forEach((n) => (n.tags || []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const attachBlock = attached
      ? `<blockquote>Reading <strong>${attached.title}</strong>: ${attached.summary || "no summary yet."}</blockquote>`
      : "";

    if (/summar/i.test(q) || /recent notes/i.test(q)) {
      return `${attachBlock}<h4>Recent notes</h4><p>Here is the shape of what you have been holding:</p><ul>${live.slice(0, 6).map((n) => `<li><strong>${n.title}</strong> — ${n.summary || "A thought in progress."}</li>`).join("")}</ul>`;
    }
    if (/ideas|working on/i.test(q)) {
      return `${attachBlock}<h4>Ideas in motion</h4><p>Your constellation currently leans toward <span class="mark">${topTags.map((t) => t[0]).join(", ") || "fresh thinking"}</span>.</p><ul>${titles.map((t) => `<li>${t}</li>`).join("")}</ul><p>The strongest cluster is community-building — Rahma Collective, mentorship, and gatherings that feel like home.</p>`;
    }
    if (/brainstorm/i.test(q)) {
      return `${attachBlock}<h4>Let’s open this</h4><ol><li>What would feel nourishing rather than productive?</li><li>Who is this really for — name three people.</li><li>What is the smallest beautiful version?</li></ol><p>From your notes, I would braid <strong>mentorship</strong>, <strong>a women’s book club</strong>, and <strong>youth programming</strong> into one seasonal offering.</p>`;
    }
    if (/priorit/i.test(q)) {
      const upcoming = (events || []).slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 4);
      return `${attachBlock}<h4>What to hold first</h4><p>Protect energy for what is already on the calendar, then tend the ideas that keep returning.</p><ol><li>Honor today’s commitments without overfilling them.</li><li>Advance one Rahma Collective thread — not all of them.</li><li>Leave a quiet page for journal thinking; it feeds everything else.</li></ol>${upcoming.length ? `<p>Coming up:</p><ul>${upcoming.map((e) => `<li>${e.date} — ${e.title} (${e.start})</li>`).join("")}</ul>` : ""}`;
    }
    if (/connect|connection/i.test(q)) {
      return `${attachBlock}<h4>Connections</h4><p>Your notes want to touch. <span class="mark">Rahma Collective</span> is the center of gravity — community, mentorship, workshops, book club, youth, and service all orbit it.</p><p>Islam and journal reflections are the interior of that work: the why beneath the programming.</p><p>Open the Idea Graph to see the constellation; the brightest links are shared tags and repeated words.</p>`;
    }
    if (attached) {
      return `${attachBlock}<h4>On this note</h4><p>I am with you in <strong>${attached.title}</strong>. ${attached.summary || "Let’s grow this thought carefully."}</p><ul><li>Keep the original voice — it already sounds like you.</li><li>Name one next step that could happen this week.</li><li>Tag it so it can find its neighbors in the graph.</li></ul>`;
    }
    return `${attachBlock}<h4>I’m here</h4><p>EVE is listening. You can ask me to summarize, find patterns, prioritize, or sit with a single note.</p><p>Right now your second brain holds <strong>${live.length} notes</strong>${titles[0] ? `, including “${titles[0]}”` : ""}.</p>`;
  }

  const api = {
    summarize: (payload) => complete("summarize", payload),
    improve: (payload) => complete("improve", payload),
    grammar: (payload) => complete("grammar", payload),
    brainstorm: (payload) => complete("brainstorm", payload),
    expand: (payload) => complete("expand", payload),
    actions: (payload) => complete("actions", payload),
    chat: (payload) => complete("chat", payload),
    quickSummary(content, title) {
      return summarizeLocal(plain(content), title || "Untitled").summary;
    }
  };
  globalThis.EveAI = api;
  return api;
})();
