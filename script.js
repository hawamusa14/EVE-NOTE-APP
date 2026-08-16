/* EVE Note — application logic */
(() => {
  "use strict";

  const STORAGE_KEY = "eve-note-v1";
  const TAGS = ["Work", "School", "Personal", "Ideas", "Projects", "Journal", "Planning"];
  const PROMPTS = [
    "Summarize my recent notes",
    "What ideas have I been working on?",
    "Help me brainstorm",
    "What should I prioritize?",
    "Find connections between my notes"
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const todayISO = () => formatISO(new Date());
  const formatISO = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };
  const parseISO = (s) => {
    const [y, m, d] = (s || "").split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const prettyDate = (s) => parseISO(s).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const prettyTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const displayTime = (hhmm) => {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  const escapeHtml = (s = "") => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const highlight = (text, q) => {
    const safe = escapeHtml(text || "");
    if (!q) return safe;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    return safe.replace(re, "<mark>$1</mark>");
  };
  const debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  function sampleData() {
    const day = (offset, hour, min = 0) => {
      const d = new Date(2026, 7, 16 + offset, hour, min);
      return d.toISOString();
    };
    const notes = [
      {
        id: "n_rahma",
        title: "Ideas for Rahma Collective",
        content: `<p>Brainstorming community programming, mentorship opportunities, and upcoming events. I want Rahma Collective to feel like a home for women who are building, learning, and serving together.</p><ul><li>Mentorship circles</li><li>Workshops that are actually useful</li><li>A book club with a soul</li></ul>`,
        summary: "Brainstorming community programming, mentorship opportunities, and upcoming events.",
        tags: ["Ideas", "Projects"],
        createdAt: day(-4, 9, 12),
        updatedAt: day(-1, 18, 40),
        scheduledDate: "2026-08-20",
        favorite: true,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_bookclub",
        title: "Women’s Book Club",
        content: `<p>A monthly gathering. Tea, honest conversation, and a book that leaves something in the room after we close it.</p><blockquote>Reading as a form of community care.</blockquote><p>Next: choose the first three titles and a gentle discussion format — not a seminar, a circle.</p>`,
        summary: "Planning a monthly women’s book club with tea, conversation, and books that linger.",
        tags: ["Personal", "Ideas"],
        createdAt: day(-6, 20, 5),
        updatedAt: day(-2, 11, 20),
        scheduledDate: "2026-08-20",
        favorite: true,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_mentor",
        title: "Mentorship Program Outline",
        content: `<h2>Shape</h2><p>Pair emerging designers and community builders with women a few steps further along. Monthly conversations, one shared project, no pressure to be perfect.</p><ul class="checklist"><li><input type="checkbox"> Draft values</li><li><input type="checkbox"> Invite three mentors</li><li><input type="checkbox"> Write the welcome note</li></ul>`,
        summary: "A gentle mentorship structure pairing emerging builders with experienced women.",
        tags: ["Work", "Projects"],
        createdAt: day(-8, 14, 0),
        updatedAt: day(-3, 16, 10),
        scheduledDate: "2026-08-17",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_workshops",
        title: "Community Workshop Notes",
        content: `<p>Workshops should feel like a studio, not a lecture. Hands on. Beautiful materials. Time to talk.</p><ol><li>Intro to visual storytelling</li><li>Hosting with intention</li><li>Service as design</li></ol>`,
        summary: "Studio-style community workshops on storytelling, hosting, and service.",
        tags: ["Work", "Ideas"],
        createdAt: day(-5, 13, 30),
        updatedAt: day(-5, 15, 2),
        scheduledDate: "2026-08-22",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_journal",
        title: "Daily Journal — August 16",
        content: `<p>Soft morning. I keep returning to the idea that a second brain should feel like a garden, not a filing cabinet.</p><p>What I want from EVE: not more output — more understanding.</p>`,
        summary: "A morning reflection on wanting a second brain that feels like a garden.",
        tags: ["Journal", "Personal"],
        createdAt: day(0, 8, 5),
        updatedAt: day(0, 8, 22),
        scheduledDate: "2026-08-16",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_youth",
        title: "Youth Programming Brainstorm",
        content: `<p>Young people in the community need rooms that take them seriously. Creative labs, leadership circles, and service days they help design.</p>`,
        summary: "Ideas for youth labs, leadership circles, and service they help design.",
        tags: ["Ideas", "Projects"],
        createdAt: day(-10, 16, 45),
        updatedAt: day(-7, 10, 0),
        scheduledDate: "2026-08-25",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_service",
        title: "Service Day Planning",
        content: `<p>A day of service that is quiet, organized, and kind. Pack kits, visit elders, leave the space more beautiful than we found it.</p>`,
        summary: "Planning a calm, well-hosted community service day.",
        tags: ["Planning", "Work"],
        createdAt: day(-2, 12, 0),
        updatedAt: day(-2, 12, 40),
        scheduledDate: "2026-08-28",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_design",
        title: "Design System Thoughts",
        content: `<p>Pink and black can be elegant if the pink is dusty, the black is warm, and nothing shouts. Typography does the emotional work. Space does the rest.</p><p>Interfaces for women who think in constellations, not folders.</p>`,
        summary: "Notes on a dusty-pink, warm-black visual system that feels intelligent rather than loud.",
        tags: ["Work", "Ideas"],
        createdAt: day(-12, 11, 11),
        updatedAt: day(-4, 9, 9),
        scheduledDate: "",
        favorite: true,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_islam",
        title: "Islam & Community Reflection",
        content: `<p>Service, sisterhood, knowledge. The work is not separate from faith — it is one of the ways faith becomes visible in a city.</p>`,
        summary: "A reflection on faith made visible through sisterhood, knowledge, and service.",
        tags: ["Personal", "Journal"],
        createdAt: day(-9, 21, 30),
        updatedAt: day(-6, 21, 0),
        scheduledDate: "2026-08-21",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_fall",
        title: "Project Timeline — Fall 2026",
        content: `<h2>September</h2><p>Open the book club. Invite mentors.</p><h2>October</h2><p>First workshop. Youth listening session.</p><h2>November</h2><p>Service day. Share what we learned.</p>`,
        summary: "A seasonal plan for book club, workshops, youth listening, and service.",
        tags: ["Planning", "Projects"],
        createdAt: day(-3, 17, 0),
        updatedAt: day(0, 7, 50),
        scheduledDate: "2026-08-16",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_school",
        title: "Studio critique notes",
        content: `<p>Feedback from last critique: let the concept breathe. Fewer elements, more intention. The constellation metaphor is strong — follow it all the way through.</p>`,
        summary: "Critique notes urging fewer elements and a fully committed constellation metaphor.",
        tags: ["School", "Work"],
        createdAt: day(-11, 15, 20),
        updatedAt: day(-11, 16, 0),
        scheduledDate: "",
        favorite: false,
        deleted: false,
        aiProcessed: true
      },
      {
        id: "n_old",
        title: "Unused event names",
        content: `<p>Scratch list that no longer belongs.</p>`,
        summary: "An old scratch list moved out of the way.",
        tags: ["Ideas"],
        createdAt: day(-20, 10, 0),
        updatedAt: day(-15, 10, 0),
        scheduledDate: "",
        favorite: false,
        deleted: true,
        aiProcessed: false
      }
    ];

    const events = [
      { id: "e1", title: "Design review", date: "2026-08-16", start: "10:00", end: "11:00", description: "Walk through the EVE Note visual system.", tag: "Work", reminder: "60" },
      { id: "e2", title: "Gym", date: "2026-08-16", start: "14:00", end: "15:00", description: "Strength session.", tag: "Personal", reminder: "15" },
      { id: "e3", title: "Mentorship call", date: "2026-08-17", start: "11:00", end: "12:00", description: "First conversation with a potential mentor.", tag: "Projects", reminder: "60" },
      { id: "e4", title: "Meeting", date: "2026-08-20", start: "10:00", end: "11:00", description: "Rahma Collective planning.", tag: "Work", reminder: "60" },
      { id: "e5", title: "Gym", date: "2026-08-20", start: "14:00", end: "15:00", description: "", tag: "Personal", reminder: "15" },
      { id: "e6", title: "Book Club", date: "2026-08-20", start: "19:00", end: "21:00", description: "Opening gathering.", tag: "Ideas", reminder: "1440" },
      { id: "e7", title: "Workshop prep", date: "2026-08-22", start: "16:00", end: "18:00", description: "Materials and flow.", tag: "Planning", reminder: "60" },
      { id: "e8", title: "Rahma planning session", date: "2026-08-25", start: "18:00", end: "19:30", description: "Youth programming and fall timeline.", tag: "Projects", reminder: "60" }
    ];

    return {
      notes,
      events,
      settings: {
        name: "Hawa",
        role: "Designer",
        compact: false,
        reduceMotion: false
      },
      chat: [
        {
          id: "c0",
          role: "eve",
          html: `<h4>Hello, Hawa</h4><p>Your notes are already forming a constellation — Rahma Collective at the center, with mentorship, book club, and service orbiting nearby.</p><p>Ask me to summarize, prioritize, or sit with a single idea.</p>`
        }
      ]
    };
  }

  const Store = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return sampleData();
        const data = JSON.parse(raw);
        if (!data.notes || !data.settings) return sampleData();
        return data;
      } catch {
        return sampleData();
      }
    },
    save(state) {
      const { notes, events, settings, chat } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes, events, settings, chat }));
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      return sampleData();
    }
  };

  const state = {
    ...Store.load(),
    view: "home",
    editingId: null,
    calCursor: new Date(2026, 7, 1),
    selectedDate: todayISO(),
    notesQuery: "",
    notesTag: "",
    notesFavOnly: false,
    notesSort: "edited",
    notesLayout: "grid",
    attachedNoteId: null,
    graphSearch: ""
  };

  const persist = debounce(() => Store.save(state), 200);

  function liveNotes() {
    return state.notes.filter((n) => !n.deleted);
  }
  function getNote(id) {
    return state.notes.find((n) => n.id === id);
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function greeting() {
    const h = new Date().getHours();
    const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return `${part}, ${state.settings.name || "Hawa"}.`;
  }

  function setActiveNav(view) {
    $$("[data-nav]").forEach((el) => el.classList.toggle("is-active", el.dataset.nav === view));
  }

  function navigate(view, extra = {}) {
    state.view = view;
    if (extra.tag != null) state.notesTag = extra.tag;
    if (extra.date) state.selectedDate = extra.date;
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.dataset.view === view));
    setActiveNav(view);
    closeSidebar();
    if (view === "home") renderHome();
    if (view === "notes") renderNotes();
    if (view === "favorites") renderFavorites();
    if (view === "trash") renderTrash();
    if (view === "calendar") renderCalendar();
    if (view === "graph") Graph.show();
    if (view === "chat") renderChat();
    if (view === "settings") renderSettings();
    if (view === "profile") renderProfile();
    if (location.hash.replace("#", "") !== view) {
      history.replaceState(null, "", `#${view}`);
    }
  }

  function renderSidebar() {
    $("#sidebarName").textContent = state.settings.name;
    $("#sidebarAvatar").textContent = (state.settings.name || "H")[0].toUpperCase();
    $("#sidebarRole").textContent = state.settings.role;
    $("#sidebarTags").innerHTML = TAGS.map((t) =>
      `<button class="tag-item" type="button" data-tag="${t}">${t}</button>`
    ).join("");
    document.body.classList.toggle("reduce-motion", state.settings.reduceMotion);
    $("#app").classList.toggle("is-collapsed", state.settings.compact);
  }

  function noteCardHTML(note, { showFav = true } = {}) {
    const tags = (note.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    return `
      <article class="note-card" data-open="${note.id}">
        <div class="note-card-top">
          <h3>${escapeHtml(note.title || "Untitled")}</h3>
          ${showFav ? `<button class="fav-mark" data-fav="${note.id}" aria-label="Favorite">${note.favorite ? "♥" : "♡"}</button>` : ""}
        </div>
        <p>${escapeHtml(note.summary || "No summary yet.")}</p>
        <div class="meta">
          <span>${prettyDate(formatISO(note.createdAt))} · ${prettyTime(note.createdAt)}</span>
          <span>Edited ${prettyTime(note.updatedAt || note.createdAt)}</span>
          ${note.aiProcessed ? `<span><i class="ai-dot"></i>AI</span>` : ""}
          ${note.scheduledDate ? `<span>Scheduled ${prettyDate(note.scheduledDate)}</span>` : ""}
        </div>
        <div class="tag-row">${tags}</div>
      </article>`;
  }

  function bindNoteGrid(el) {
    el.onclick = (e) => {
      const fav = e.target.closest("[data-fav]");
      if (fav) {
        e.stopPropagation();
        toggleFav(fav.dataset.fav);
        return;
      }
      const card = e.target.closest("[data-open]");
      if (card) Editor.open(card.dataset.open);
    };
  }

  function renderHome() {
    $("#greeting").textContent = greeting();
    const recent = liveNotes().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
    $("#homeNotes").innerHTML = recent.length
      ? recent.map((n) => noteCardHTML(n)).join("")
      : `<p class="empty">No notes yet — begin with a single thought.</p>`;
    bindNoteGrid($("#homeNotes"));

    const todays = state.events
      .filter((e) => e.date === todayISO())
      .sort((a, b) => a.start.localeCompare(b.start));
    $("#homeSchedule").innerHTML = todays.length
      ? todays.map((e) => `
          <div class="event-row">
            <time>${displayTime(e.start)}</time>
            <div><strong>${escapeHtml(e.title)}</strong><br><small>${escapeHtml(e.tag)}${e.description ? " · " + escapeHtml(e.description) : ""}</small></div>
          </div>`).join("")
      : `<p class="empty">A quiet day — add a plan when you are ready.</p>`;
  }

  function filteredNotes(source = liveNotes()) {
    let list = source.slice();
    const q = state.notesQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((n) =>
        `${n.title} ${n.summary} ${n.content} ${(n.tags || []).join(" ")}`.toLowerCase().includes(q)
      );
    }
    if (state.notesTag) list = list.filter((n) => (n.tags || []).includes(state.notesTag));
    if (state.notesFavOnly) list = list.filter((n) => n.favorite);
    if (state.notesSort === "edited") list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (state.notesSort === "created") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (state.notesSort === "title") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (state.notesSort === "date") list.sort((a, b) => (b.scheduledDate || "").localeCompare(a.scheduledDate || ""));
    return list;
  }

  function renderNotes() {
    $("#notesTitle").textContent = state.notesTag ? state.notesTag : "Notes";
    $("#notesSubtitle").textContent = state.notesTag
      ? `Notes tagged ${state.notesTag}.`
      : "Your library of thoughts and ideas.";
    const sel = $("#filterTag");
    sel.innerHTML = `<option value="">All tags</option>` + TAGS.map((t) =>
      `<option value="${t}" ${t === state.notesTag ? "selected" : ""}>${t}</option>`
    ).join("");
    $("#filterFav").classList.toggle("is-active", state.notesFavOnly);
    const grid = $("#notesGrid");
    grid.classList.toggle("is-list", state.notesLayout === "list");
    const list = filteredNotes();
    grid.innerHTML = list.length ? list.map((n) => noteCardHTML(n)).join("") : `<p class="empty">No notes match this view.</p>`;
    bindNoteGrid(grid);
  }

  function renderFavorites() {
    const list = liveNotes().filter((n) => n.favorite);
    $("#favGrid").innerHTML = list.length ? list.map((n) => noteCardHTML(n)).join("") : `<p class="empty">Mark a note with a heart and it will gather here.</p>`;
    bindNoteGrid($("#favGrid"));
  }

  function renderTrash() {
    const list = state.notes.filter((n) => n.deleted);
    $("#trashGrid").innerHTML = list.length
      ? list.map((n) => `
          <article class="note-card">
            <h3>${escapeHtml(n.title)}</h3>
            <p>${escapeHtml(n.summary || "")}</p>
            <div class="meta">${prettyDate(formatISO(n.updatedAt))}</div>
            <button class="btn-ghost" data-restore="${n.id}" type="button">Restore</button>
            <button class="btn-ghost" data-purge="${n.id}" type="button">Delete forever</button>
          </article>`).join("")
      : `<p class="empty">Nothing in the quiet archive.</p>`;
    $("#trashGrid").onclick = (e) => {
      const r = e.target.closest("[data-restore]");
      const p = e.target.closest("[data-purge]");
      if (r) {
        const n = getNote(r.dataset.restore);
        if (n) { n.deleted = false; persist(); renderTrash(); toast("Note restored"); }
      }
      if (p) {
        state.notes = state.notes.filter((n) => n.id !== p.dataset.purge);
        persist(); renderTrash(); toast("Permanently deleted");
      }
    };
  }

  function toggleFav(id) {
    const n = getNote(id);
    if (!n) return;
    n.favorite = !n.favorite;
    persist();
    if (state.view === "home") renderHome();
    if (state.view === "notes") renderNotes();
    if (state.view === "favorites") renderFavorites();
    if (state.editingId === id) $("#favBtn").textContent = n.favorite ? "♥" : "♡";
  }

  /* ---------- Editor ---------- */
  const Editor = {
    saveTimer: null,
    open(id) {
      const note = id ? getNote(id) : createNote();
      if (!note) return;
      state.editingId = note.id;
      $("#editor").hidden = false;
      $("#noteTitle").value = note.title || "";
      $("#noteBody").innerHTML = note.content || "";
      $("#noteWhen").textContent = `${prettyDate(formatISO(note.createdAt))} · ${prettyTime(note.createdAt)}`;
      $("#noteDate").value = note.scheduledDate || "";
      $("#favBtn").textContent = note.favorite ? "♥" : "♡";
      $("#noteSummary").textContent = note.summary || "EVE will summarize this note after you write.";
      renderNoteTags(note);
      const link = $("#scheduledLink");
      if (note.scheduledDate) {
        link.hidden = false;
        link.textContent = `Scheduled for ${prettyDate(note.scheduledDate)}`;
      } else {
        link.hidden = true;
      }
      $("#aiOutput").innerHTML = "";
      $("#noteTitle").focus();
    },
    close() {
      this.flush();
      $("#editor").hidden = true;
      state.editingId = null;
      if (state.view === "home") renderHome();
      if (state.view === "notes") renderNotes();
      if (state.view === "calendar") renderCalendar();
      if (state.view === "graph") Graph.build();
    },
    current() {
      return getNote(state.editingId);
    },
    flush() {
      const note = this.current();
      if (!note || note.deleted) return;
      note.title = $("#noteTitle").value.trim() || "Untitled note";
      note.content = $("#noteBody").innerHTML;
      note.scheduledDate = $("#noteDate").value;
      note.updatedAt = new Date().toISOString();
      if (note.content && note.content.replace(/<[^>]+>/g, "").trim()) {
        note.summary = EveAI.quickSummary(note.content, note.title);
        $("#noteSummary").textContent = note.summary;
      }
      persist();
      const pill = $("#savePill");
      pill.classList.add("is-on");
      pill.textContent = "Saved";
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => pill.classList.remove("is-on"), 1400);
      const link = $("#scheduledLink");
      if (note.scheduledDate) {
        link.hidden = false;
        link.textContent = `Scheduled for ${prettyDate(note.scheduledDate)}`;
      }
    }
  };

  const autosave = debounce(() => Editor.flush(), 400);

  function createNote(partial = {}) {
    const now = new Date().toISOString();
    const note = {
      id: uid("n"),
      title: "",
      content: "",
      summary: "",
      tags: [],
      createdAt: now,
      updatedAt: now,
      scheduledDate: partial.scheduledDate || "",
      favorite: false,
      deleted: false,
      aiProcessed: false,
      ...partial
    };
    state.notes.unshift(note);
    persist();
    return note;
  }

  function renderNoteTags(note) {
    $("#noteTags").innerHTML = (note.tags || []).map((t) =>
      `<span class="tag">${escapeHtml(t)} <span class="x" data-remove-tag="${escapeHtml(t)}">×</span></span>`
    ).join("");
    $("#tagOptions").innerHTML = TAGS.map((t) => `<option value="${t}">`).join("");
  }

  function addTag(name) {
    const note = Editor.current();
    if (!note) return;
    const tag = name.trim().replace(/^#/, "");
    if (!tag) return;
    note.tags = note.tags || [];
    if (!note.tags.includes(tag)) note.tags.push(tag);
    if (!TAGS.includes(tag)) TAGS.push(tag);
    renderNoteTags(note);
    persist();
  }

  /* ---------- Calendar ---------- */
  function notesForDate(iso) {
    return liveNotes().filter((n) => n.scheduledDate === iso || formatISO(n.createdAt) === iso);
  }
  function eventsForDate(iso) {
    return state.events.filter((e) => e.date === iso).sort((a, b) => a.start.localeCompare(b.start));
  }

  function renderCalendar() {
    const y = state.calCursor.getFullYear();
    const m = state.calCursor.getMonth();
    $("#calMonth").textContent = state.calCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const first = new Date(y, m, 1);
    const start = first.getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < start; i++) {
      const d = new Date(y, m, -start + i + 1);
      cells.push({ date: d, muted: true });
    }
    for (let d = 1; d <= days; d++) cells.push({ date: new Date(y, m, d), muted: false });
    while (cells.length % 7) {
      const last = cells[cells.length - 1].date;
      const n = new Date(last);
      n.setDate(n.getDate() + 1);
      cells.push({ date: n, muted: true });
    }
    $("#calGrid").innerHTML = cells.map(({ date, muted }) => {
      const iso = formatISO(date);
      const hasNotes = notesForDate(iso).length > 0;
      const selected = iso === state.selectedDate;
      const isToday = iso === todayISO();
      return `<button type="button" class="cal-day${muted ? " muted" : ""}${selected ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-date="${iso}">
        <span>${date.getDate()}</span>
        ${hasNotes ? `<i class="note-dot" title="Notes this day"></i>` : ""}
      </button>`;
    }).join("");
    renderDayPanel();
  }

  function renderDayPanel() {
    const iso = state.selectedDate;
    $("#dayTitle").textContent = prettyDate(iso);
    const ev = eventsForDate(iso);
    $("#dayEvents").innerHTML = ev.length
      ? ev.map((e) => `<div class="day-item"><strong>${escapeHtml(e.title)}</strong><div class="meta">${displayTime(e.start)} — ${displayTime(e.end)} · ${escapeHtml(e.tag)}</div><p>${escapeHtml(e.description || "")}</p></div>`).join("")
      : `<p class="empty">No events yet.</p>`;
    const ns = notesForDate(iso);
    $("#dayNotes").innerHTML = ns.length
      ? ns.map((n) => `<button class="day-item" data-open="${n.id}" type="button"><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.summary || "")}</p></button>`).join("")
      : `<p class="empty">No notes on this day.</p>`;
    bindNoteGrid($("#dayNotes"));
  }

  function openEventModal(date) {
    const form = $("#eventForm");
    form.reset();
    form.date.value = date || state.selectedDate || todayISO();
    $("#eventModal").hidden = false;
    form.title.focus();
  }

  /* ---------- Graph ---------- */
  const Graph = {
    nodes: [],
    edges: [],
    cam: { x: 0, y: 0, scale: 1 },
    drag: null,
    pan: null,
    hover: null,
    selected: null,
    stars: [],
    raf: null,
    pinch: null,

    show() {
      this.build();
      this.resize();
      this.draw();
      if (!this.bound) this.bind();
      requestAnimationFrame(() => {
        this.resize();
        this.draw();
      });
    },

    build() {
      const notes = liveNotes();
      const W = $("#graphCanvas").clientWidth || 800;
      const H = $("#graphCanvas").clientHeight || 560;
      this.nodes = notes.map((n, i) => {
        const angle = (i / Math.max(notes.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const radius = 140 + (i % 5) * 42;
        return {
          id: n.id,
          title: n.title,
          note: n,
          x: W / 2 + Math.cos(angle) * radius,
          y: H / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          r: 6
        };
      });
      this.edges = [];
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const a = this.nodes[i].note;
          const b = this.nodes[j].note;
          const sharedTags = (a.tags || []).filter((t) => (b.tags || []).includes(t));
          const wordsA = (a.title + " " + (a.summary || "")).toLowerCase();
          const wordsB = (b.title + " " + (b.summary || "")).toLowerCase();
          const keys = ["rahma", "community", "mentorship", "book", "workshop", "islam", "youth", "service", "design", "women", "collective"];
          const sharedKeys = keys.filter((k) => wordsA.includes(k) && wordsB.includes(k));
          if (sharedTags.length || sharedKeys.length) {
            this.edges.push({ a: this.nodes[i], b: this.nodes[j], weight: sharedTags.length + sharedKeys.length });
          }
        }
      }
      const counts = Object.fromEntries(this.nodes.map((n) => [n.id, 0]));
      this.edges.forEach((e) => { counts[e.a.id]++; counts[e.b.id]++; });
      this.nodes.forEach((n) => { n.r = 5 + Math.min(10, (counts[n.id] || 0) * 1.6); });
      this.stars = Array.from({ length: 90 }, () => ({
        x: Math.random(),
        y: Math.random(),
        s: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.45 + 0.08
      }));
      this.simulate(90);
      if (this.nodes.length) {
        this.cam.x = this.nodes.reduce((s, n) => s + n.x, 0) / this.nodes.length;
        this.cam.y = this.nodes.reduce((s, n) => s + n.y, 0) / this.nodes.length;
      }
    },

    simulate(steps) {
      const nodes = this.nodes;
      const edges = this.edges;
      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            let dx = nodes[j].x - nodes[i].x;
            let dy = nodes[j].y - nodes[i].y;
            let dist = Math.hypot(dx, dy) || 1;
            const force = 4200 / (dist * dist);
            dx /= dist; dy /= dist;
            nodes[i].vx -= dx * force; nodes[i].vy -= dy * force;
            nodes[j].vx += dx * force; nodes[j].vy += dy * force;
          }
        }
        edges.forEach((e) => {
          let dx = e.b.x - e.a.x;
          let dy = e.b.y - e.a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const want = 130;
          const f = (dist - want) * 0.012;
          dx /= dist; dy /= dist;
          e.a.vx += dx * f; e.a.vy += dy * f;
          e.b.vx -= dx * f; e.b.vy -= dy * f;
        });
        const cx = ($("#graphCanvas").clientWidth || 800) / 2;
        const cy = ($("#graphCanvas").clientHeight || 560) / 2;
        nodes.forEach((n) => {
          n.vx += (cx - n.x) * 0.002;
          n.vy += (cy - n.y) * 0.002;
          n.vx *= 0.82; n.vy *= 0.82;
          n.x += n.vx; n.y += n.vy;
        });
      }
    },

    resize() {
      const canvas = $("#graphCanvas");
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      this.ctx = canvas.getContext("2d");
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = rect.width;
      this.h = rect.height;
    },

    toScreen(x, y) {
      return {
        x: (x - this.cam.x) * this.cam.scale + this.w / 2,
        y: (y - this.cam.y) * this.cam.scale + this.h / 2
      };
    },
    toWorld(x, y) {
      return {
        x: (x - this.w / 2) / this.cam.scale + this.cam.x,
        y: (y - this.h / 2) / this.cam.scale + this.cam.y
      };
    },

    nodeAt(sx, sy) {
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        const p = this.toScreen(n.x, n.y);
        if (Math.hypot(p.x - sx, p.y - sy) < Math.max(14, n.r + 8)) return n;
      }
      return null;
    },

    draw() {
      const ctx = this.ctx;
      if (!ctx) return;
      ctx.clearRect(0, 0, this.w, this.h);
      this.stars.forEach((s) => {
        ctx.fillStyle = `rgba(247,228,234,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x * this.w, s.y * this.h, s.s, 0, Math.PI * 2);
        ctx.fill();
      });
      const q = (state.graphSearch || "").toLowerCase();
      const selected = this.selected;
      const linked = new Set();
      if (selected) {
        this.edges.forEach((e) => {
          if (e.a === selected || e.b === selected) { linked.add(e.a); linked.add(e.b); }
        });
      }
      this.edges.forEach((e) => {
        const pa = this.toScreen(e.a.x, e.a.y);
        const pb = this.toScreen(e.b.x, e.b.y);
        const active = !selected || e.a === selected || e.b === selected;
        ctx.strokeStyle = active ? `rgba(232,164,188,${0.18 + e.weight * 0.12})` : "rgba(232,164,188,0.04)";
        ctx.lineWidth = active ? 1.2 : 0.6;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });
      this.nodes.forEach((n) => {
        const p = this.toScreen(n.x, n.y);
        const match = !q || n.title.toLowerCase().includes(q) || (n.note.tags || []).join(" ").toLowerCase().includes(q);
        const dim = (selected && n !== selected && !linked.has(n)) || (q && !match);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, n.r * 4);
        g.addColorStop(0, dim ? "rgba(232,164,188,0.12)" : "rgba(243,201,214,0.95)");
        g.addColorStop(1, "rgba(232,164,188,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = dim ? "rgba(232,164,188,0.25)" : "#e8a4bc";
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fdf8fa";
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.2, n.r * 0.28), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = dim ? "rgba(247,240,243,0.35)" : "#f7f0f3";
        ctx.font = "12px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(n.title.slice(0, 28), p.x, p.y + n.r + 14);
      });
    },

    openCard(node) {
      this.selected = node;
      const card = $("#graphCard");
      card.hidden = false;
      $("#graphCardTitle").textContent = node.note.title;
      $("#graphCardSummary").textContent = node.note.summary || "No summary yet.";
      $("#graphCardMeta").textContent = prettyDate(formatISO(node.note.createdAt));
      $("#graphCardTags").innerHTML = (node.note.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
      this.draw();
    },

    bind() {
      this.bound = true;
      const canvas = $("#graphCanvas");
      const pos = (e) => {
        const r = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - r.left, y: t.clientY - r.top };
      };

      canvas.addEventListener("pointerdown", (e) => {
        canvas.setPointerCapture(e.pointerId);
        const p = pos(e);
        const node = this.nodeAt(p.x, p.y);
        if (node) {
          this.drag = { node, dx: 0, dy: 0 };
          this.openCard(node);
        } else {
          const w = this.toWorld(p.x, p.y);
          this.pan = { x: w.x, y: w.y };
        }
      });
      canvas.addEventListener("pointermove", (e) => {
        const p = pos(e);
        this.hover = this.nodeAt(p.x, p.y);
        canvas.style.cursor = this.hover ? "pointer" : this.pan ? "grabbing" : "grab";
        if (this.drag) {
          const w = this.toWorld(p.x, p.y);
          this.drag.node.x = w.x;
          this.drag.node.y = w.y;
          this.draw();
        } else if (this.pan) {
          const w = this.toWorld(p.x, p.y);
          this.cam.x -= w.x - this.pan.x;
          this.cam.y -= w.y - this.pan.y;
          this.draw();
        }
      });
      const end = () => { this.drag = null; this.pan = null; };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
      canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.92 : 1.08;
        this.cam.scale = Math.min(2.4, Math.max(0.45, this.cam.scale * factor));
        this.draw();
      }, { passive: false });

      canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          this.pinch = { d, scale: this.cam.scale };
        }
      }, { passive: true });
      canvas.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && this.pinch) {
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          this.cam.scale = Math.min(2.4, Math.max(0.45, this.pinch.scale * (d / this.pinch.d)));
          this.draw();
        }
      }, { passive: true });

      window.addEventListener("resize", () => {
        if (state.view === "graph") { this.resize(); this.draw(); }
      });
    }
  };

  /* ---------- Chat ---------- */
  function renderChat() {
    const thread = $("#chatThread");
    thread.innerHTML = state.chat.map((m) =>
      `<div class="msg ${m.role === "user" ? "user" : "eve"}">${m.role === "user" ? escapeHtml(m.text) : m.html}</div>`
    ).join("");
    thread.scrollTop = thread.scrollHeight;
    $("#promptRow").innerHTML = PROMPTS.map((p) => `<button class="prompt-chip" type="button">${p}</button>`).join("");
  }

  async function sendChat(text) {
    const message = (text || "").trim();
    if (!message) return;
    state.chat.push({ id: uid("c"), role: "user", text: message });
    renderChat();
    const typing = document.createElement("div");
    typing.className = "msg eve typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    $("#chatThread").appendChild(typing);
    const attached = getNote(state.attachedNoteId);
    const html = await EveAI.chat({
      message,
      notes: state.notes,
      events: state.events,
      attached
    });
    typing.remove();
    state.chat.push({ id: uid("c"), role: "eve", html });
    persist();
    renderChat();
  }

  /* ---------- Search ---------- */
  function searchAll(q) {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const hits = [];
    liveNotes().forEach((n) => {
      const blob = `${n.title} ${n.summary} ${(n.tags || []).join(" ")}`.toLowerCase();
      if (blob.includes(query)) hits.push({ type: "Note", title: n.title, meta: n.summary, id: n.id, kind: "note" });
    });
    TAGS.filter((t) => t.toLowerCase().includes(query)).forEach((t) =>
      hits.push({ type: "Tag", title: t, meta: "Open notes with this tag", kind: "tag", id: t })
    );
    state.events.forEach((e) => {
      if (`${e.title} ${e.description} ${e.tag}`.toLowerCase().includes(query)) {
        hits.push({ type: "Event", title: e.title, meta: `${prettyDate(e.date)} · ${displayTime(e.start)}`, kind: "event", id: e.date });
      }
    });
    return hits.slice(0, 18);
  }

  function renderSearch(q) {
    const hits = searchAll(q);
    $("#searchResults").innerHTML = hits.length
      ? hits.map((h) => `
          <button class="search-hit" data-kind="${h.kind}" data-id="${escapeHtml(h.id)}" type="button">
            <small>${h.type}</small>
            <div><strong>${highlight(h.title, q)}</strong></div>
            <div class="muted">${highlight(h.meta || "", q)}</div>
          </button>`).join("")
      : (q ? `<p class="empty">No matches in notes, tags, or events.</p>` : `<p class="empty">Search notes, tags, events, and ideas.</p>`);
  }

  /* ---------- Settings / profile ---------- */
  function renderSettings() {
    $("#settingName").value = state.settings.name;
    $("#settingRole").value = state.settings.role;
    $("#settingCompact").checked = state.settings.compact;
    $("#settingMotion").checked = state.settings.reduceMotion;
  }

  function renderProfile() {
    const name = state.settings.name || "Hawa";
    $("#profileName").textContent = name;
    $("#profileRole").textContent = state.settings.role;
    $("#profileAvatar").textContent = name[0].toUpperCase();
    const live = liveNotes();
    $("#profileStats").innerHTML = [
      ["Notes", live.length],
      ["Favorites", live.filter((n) => n.favorite).length],
      ["Events", state.events.length],
      ["Tags in use", new Set(live.flatMap((n) => n.tags || [])).size]
    ].map(([l, v]) => `<div class="stat"><strong>${v}</strong>${l}</div>`).join("");
  }

  /* ---------- AI toolbar ---------- */
  async function runAI(kind) {
    const note = Editor.current();
    if (!note) return;
    Editor.flush();
    const box = $("#aiOutput");
    box.innerHTML = `<div class="ai-card typing"><i></i><i></i><i></i></div>`;
    const payload = { title: note.title, content: note.content, tags: note.tags, notes: state.notes, events: state.events };

    if (kind === "ask") {
      state.attachedNoteId = note.id;
      Editor.close();
      navigate("chat");
      sendChat(`Help me think about my note “${note.title}”.`);
      return;
    }

    const map = {
      summarize: EveAI.summarize,
      improve: EveAI.improve,
      grammar: EveAI.grammar,
      brainstorm: EveAI.brainstorm,
      expand: EveAI.expand,
      actions: EveAI.actions
    };
    const result = await map[kind](payload);
    note.aiProcessed = true;
    if (result.summary) {
      note.summary = result.summary;
      $("#noteSummary").textContent = result.summary;
    }
    persist();
    const actions = [];
    if (result.content) actions.push(`<button class="btn-ghost" data-apply="replace" type="button">Replace note</button>`);
    if (kind === "actions" && result.content) actions.push(`<button class="btn-ghost" data-apply="insert" type="button">Insert checklist</button>`);
    box.innerHTML = `<div class="ai-card" data-content="${encodeURIComponent(result.content || "")}">${result.html}${actions.join("")}</div>`;
  }

  /* ---------- Events ---------- */
  function openSidebar() {
    $("#sidebar").classList.add("is-open");
    $("#sidebarBackdrop").hidden = false;
  }
  function closeSidebar() {
    $("#sidebar").classList.remove("is-open");
    $("#sidebarBackdrop").hidden = true;
  }

  function wire() {
    document.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-nav]");
      if (nav) {
        e.preventDefault();
        navigate(nav.dataset.nav);
      }
      const tag = e.target.closest("[data-tag]");
      if (tag) {
        state.notesTag = tag.dataset.tag;
        state.notesFavOnly = false;
        navigate("notes");
      }
    });

    $("#newNoteBtn").onclick = $("#newNoteTop").onclick = () => Editor.open(createNote().id);
    $("#askEveTop").onclick = () => navigate("chat");
    $("#menuBtn").onclick = openSidebar;
    $("#sidebarClose").onclick = closeSidebar;
    $("#sidebarBackdrop").onclick = closeSidebar;
    $("#collapseBtn").onclick = () => {
      state.settings.compact = !state.settings.compact;
      persist();
      renderSidebar();
    };

    $("#quickActions").onclick = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const a = btn.dataset.action;
      if (a === "new-note") Editor.open(createNote().id);
      if (a === "ask-eve") navigate("chat");
      if (a === "brainstorm") { navigate("chat"); sendChat("Help me brainstorm"); }
      if (a === "calendar") navigate("calendar");
    };

    $("#notesSearch").addEventListener("input", (e) => { state.notesQuery = e.target.value; renderNotes(); });
    $("#filterTag").onchange = (e) => { state.notesTag = e.target.value; renderNotes(); };
    $("#filterSort").onchange = (e) => { state.notesSort = e.target.value; renderNotes(); };
    $("#filterFav").onclick = () => { state.notesFavOnly = !state.notesFavOnly; renderNotes(); };
    $$(".view-toggle .chip").forEach((c) => {
      c.onclick = () => {
        state.notesLayout = c.dataset.layout;
        $$(".view-toggle .chip").forEach((x) => x.classList.toggle("is-active", x === c));
        renderNotes();
      };
    });

    $("#editorBack").onclick = () => Editor.close();
    $("#favBtn").onclick = () => toggleFav(state.editingId);
    $("#deleteNoteBtn").onclick = () => {
      const n = Editor.current();
      if (!n) return;
      n.deleted = true;
      persist();
      Editor.close();
      toast("Moved to Recently Deleted");
    };
    $("#noteTitle").addEventListener("input", autosave);
    $("#noteBody").addEventListener("input", autosave);
    $("#noteBody").addEventListener("change", autosave);
    $("#noteDate").addEventListener("change", () => Editor.flush());
    $("#scheduledLink").onclick = () => {
      const n = Editor.current();
      if (!n?.scheduledDate) return;
      Editor.close();
      state.selectedDate = n.scheduledDate;
      state.calCursor = parseISO(n.scheduledDate);
      navigate("calendar");
    };
    $("#tagInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag(e.target.value);
        e.target.value = "";
      }
    });
    $("#noteTags").onclick = (e) => {
      const x = e.target.closest("[data-remove-tag]");
      if (!x) return;
      const note = Editor.current();
      note.tags = note.tags.filter((t) => t !== x.dataset.removeTag);
      renderNoteTags(note);
      persist();
    };

    $(".format-bar").onclick = (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      $("#noteBody").focus();
      const cmd = btn.dataset.cmd;
      if (cmd) document.execCommand(cmd, false, btn.dataset.val || null);
    };
    $("#highlightBtn").onclick = () => {
      $("#noteBody").focus();
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("hiliteColor", false, "rgba(232,164,188,0.45)");
    };
    $("#linkBtn").onclick = () => {
      const url = prompt("Link URL");
      if (url) document.execCommand("createLink", false, url);
    };
    $("#checkBtn").onclick = () => {
      document.execCommand("insertHTML", false, `<ul class="checklist"><li><input type="checkbox"> New item</li></ul>`);
      autosave();
    };
    $(".ai-actions").onclick = (e) => {
      const b = e.target.closest("[data-ai]");
      if (b) runAI(b.dataset.ai);
    };
    $("#aiOutput").onclick = (e) => {
      const apply = e.target.closest("[data-apply]");
      if (!apply) return;
      const card = e.target.closest("[data-content]");
      const html = decodeURIComponent(card.dataset.content || "");
      if (apply.dataset.apply === "replace") $("#noteBody").innerHTML = html;
      if (apply.dataset.apply === "insert") $("#noteBody").innerHTML += html;
      Editor.flush();
      toast("Note updated");
    };

    $("#calPrev").onclick = () => { state.calCursor.setMonth(state.calCursor.getMonth() - 1); renderCalendar(); };
    $("#calNext").onclick = () => { state.calCursor.setMonth(state.calCursor.getMonth() + 1); renderCalendar(); };
    $("#calToday").onclick = () => {
      state.calCursor = new Date();
      state.selectedDate = todayISO();
      renderCalendar();
    };
    $("#calGrid").onclick = (e) => {
      const day = e.target.closest("[data-date]");
      if (!day) return;
      state.selectedDate = day.dataset.date;
      renderCalendar();
    };
    $("#addEventBtn").onclick = () => openEventModal();
    $("#addEventForDay").onclick = () => openEventModal(state.selectedDate);
    $("#addNoteForDay").onclick = () => Editor.open(createNote({ scheduledDate: state.selectedDate }).id);
    $("#eventCancel").onclick = () => { $("#eventModal").hidden = true; };
    $("#eventForm").onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      state.events.push({
        id: uid("e"),
        title: f.title.value,
        date: f.date.value,
        start: f.start.value,
        end: f.end.value,
        description: f.description.value,
        tag: f.tag.value,
        reminder: f.reminder.value
      });
      persist();
      $("#eventModal").hidden = true;
      state.selectedDate = f.date.value;
      renderCalendar();
      toast("Event saved");
    };

    $("#graphReset").onclick = () => {
      Graph.cam.scale = 1;
      Graph.build();
      Graph.resize();
      Graph.draw();
    };
    $("#graphSearch").addEventListener("input", (e) => {
      state.graphSearch = e.target.value;
      Graph.draw();
    });
    $("#graphCardClose").onclick = () => {
      $("#graphCard").hidden = true;
      Graph.selected = null;
      Graph.draw();
    };
    $("#graphOpenNote").onclick = () => {
      if (Graph.selected) Editor.open(Graph.selected.id);
    };

    $("#promptRow").onclick = (e) => {
      const p = e.target.closest(".prompt-chip");
      if (p) sendChat(p.textContent);
    };
    $("#chatForm").onsubmit = (e) => {
      e.preventDefault();
      const t = $("#chatText");
      sendChat(t.value);
      t.value = "";
    };
    $("#chatText").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        $("#chatForm").requestSubmit();
      }
    });
    $("#attachNoteBtn").onclick = () => {
      $("#attachList").innerHTML = liveNotes().map((n) =>
        `<button class="search-hit" data-attach="${n.id}" type="button">${escapeHtml(n.title)}</button>`
      ).join("");
      $("#attachModal").hidden = false;
    };
    $("#attachCancel").onclick = () => { $("#attachModal").hidden = true; };
    $("#attachList").onclick = (e) => {
      const b = e.target.closest("[data-attach]");
      if (!b) return;
      state.attachedNoteId = b.dataset.attach;
      $("#attachModal").hidden = true;
      toast(`Attached “${getNote(b.dataset.attach).title}”`);
    };
    $("#micBtn").onclick = () => {
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Rec) { toast("Voice capture is not available in this browser"); return; }
      const rec = new Rec();
      rec.lang = "en-US";
      rec.onresult = (ev) => {
        $("#chatText").value += ev.results[0][0].transcript;
      };
      rec.start();
      toast("Listening…");
    };

    const openSearch = () => {
      $("#searchModal").hidden = false;
      $("#globalSearch").value = "";
      renderSearch("");
      $("#globalSearch").focus();
    };
    $("#searchTrigger").onclick = openSearch;
    $("#searchTrigger").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") openSearch(); });
    $("#globalSearch").addEventListener("input", (e) => renderSearch(e.target.value));
    $("#searchResults").onclick = (e) => {
      const hit = e.target.closest(".search-hit");
      if (!hit) return;
      $("#searchModal").hidden = true;
      if (hit.dataset.kind === "note") Editor.open(hit.dataset.id);
      if (hit.dataset.kind === "tag") { state.notesTag = hit.dataset.id; navigate("notes"); }
      if (hit.dataset.kind === "event") {
        state.selectedDate = hit.dataset.id;
        state.calCursor = parseISO(hit.dataset.id);
        navigate("calendar");
      }
    };

    $("#settingName").addEventListener("input", (e) => {
      state.settings.name = e.target.value; persist(); renderSidebar();
    });
    $("#settingRole").addEventListener("input", (e) => {
      state.settings.role = e.target.value; persist(); renderSidebar();
    });
    $("#settingCompact").onchange = (e) => {
      state.settings.compact = e.target.checked; persist(); renderSidebar();
    };
    $("#settingMotion").onchange = (e) => {
      state.settings.reduceMotion = e.target.checked; persist(); renderSidebar();
    };
    $("#resetData").onclick = () => {
      Object.assign(state, Store.reset(), { view: state.view, calCursor: new Date(2026, 7, 1), selectedDate: todayISO() });
      persist();
      renderSidebar();
      navigate("home");
      toast("Sample notes restored");
    };

    $("#searchModal").addEventListener("click", (e) => { if (e.target.id === "searchModal") e.currentTarget.hidden = true; });
    $("#eventModal").addEventListener("click", (e) => { if (e.target.id === "eventModal") e.currentTarget.hidden = true; });
    $("#attachModal").addEventListener("click", (e) => { if (e.target.id === "attachModal") e.currentTarget.hidden = true; });
    $("#editor").addEventListener("click", (e) => { if (e.target.id === "editor") Editor.close(); });

    document.addEventListener("keydown", (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
      if (meta && e.key.toLowerCase() === "n") { e.preventDefault(); Editor.open(createNote().id); }
      if (e.key === "Escape") {
        if (!$("#searchModal").hidden) $("#searchModal").hidden = true;
        else if (!$("#eventModal").hidden) $("#eventModal").hidden = true;
        else if (!$("#attachModal").hidden) $("#attachModal").hidden = true;
        else if (!$("#editor").hidden) Editor.close();
        else closeSidebar();
      }
    });
  }

  function init() {
    renderSidebar();
    wire();
    const hash = (location.hash || "#home").slice(1);
    navigate(["home", "notes", "calendar", "graph", "chat", "favorites", "trash", "settings", "profile"].includes(hash) ? hash : "home");
    window.addEventListener("hashchange", () => {
      const v = location.hash.slice(1);
      if (v && v !== state.view) navigate(v);
    });
  }

  init();
})();
