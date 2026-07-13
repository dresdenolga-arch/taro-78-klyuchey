"use strict";

  // ---------- 5b. Личные заметки (localStorage) ----------

  const NOTES_KEY = "tarot78_notes_v1";

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(NOTES_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveNotes(n) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(n));
  }
  let notes = loadNotes();

  function getNote(key) {
    return notes[key] || "";
  }
  function setNote(key, text) {
    if (text && text.trim()) notes[key] = text;
    else delete notes[key];
    saveNotes(notes);
  }

  function escapeForTextarea(s) {
    return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function noteBoxHtml(key, label) {
    return (
      '<div class="note-box">' +
        '<div class="note-label">' + (label || "Личная заметка") + '</div>' +
        '<textarea class="note-input" data-key="' + key + '" placeholder="Твои мысли, ассоциации, наблюдения…">' +
          escapeForTextarea(getNote(key)) +
        '</textarea>' +
      '</div>'
    );
  }

  function bindNoteBoxes(root) {
    root.querySelectorAll(".note-input").forEach((ta) => {
      let t = null;
      ta.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => setNote(ta.dataset.key, ta.value), 400);
      });
    });
  }
