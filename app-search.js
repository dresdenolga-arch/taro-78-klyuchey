"use strict";

  // ---------- 10. Вид: Поиск ----------

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function allTags() {
    const set = new Set();
    Object.values(CARD_META).forEach((m) => (m.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }

  function renderSearchView() {
    const tags = allTags();
    $content.innerHTML =
      '<div class="search-wrap">' +
        '<input type="text" class="search-input" id="searchInput" placeholder="Например: тень, деньги, отношения, Отшельник…" value="' + (state.searchTerm || "") + '">' +
        (tags.length
          ? '<div class="deck-picker" id="tagFilters">' +
              '<button class="chip tag-filter ' + (!state.searchTag ? "active" : "") + '" data-t="">Все темы</button>' +
              tags.map((t) => '<button class="chip tag-filter ' + (state.searchTag === t ? "active" : "") + '" data-t="' + t + '">' + t + '</button>').join("") +
            '</div>'
          : "") +
        '<div id="searchResults"></div>' +
      '</div>';
    const input = document.getElementById("searchInput");
    input.focus();
    input.addEventListener("input", () => {
      state.searchTerm = input.value;
      runSearch(input.value);
    });
    const tf = document.getElementById("tagFilters");
    if (tf) {
      tf.querySelectorAll(".tag-filter").forEach((c) => {
        c.addEventListener("click", () => {
          state.searchTag = c.dataset.t || null;
          renderSearchView();
        });
      });
    }
    if (state.searchTerm || state.searchTag) runSearch(input.value);
  }

  function cardNamesForTag(tag) {
    if (!tag) return null;
    return Object.keys(CARD_META).filter((name) => (CARD_META[name].tags || []).includes(tag));
  }

  function runSearch(term) {
    const box = document.getElementById("searchResults");
    const tagCardNames = cardNamesForTag(state.searchTag);

    if ((!term || term.trim().length < 2) && !tagCardNames) {
      box.innerHTML = '<p class="search-empty">Введите минимум 2 символа или выберите тему.</p>';
      return;
    }

    const q = (term || "").trim();
    const re = q.length >= 2 ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
    const results = [];

    if (tagCardNames) {
      // Тема выбрана — ищем только внутри разделов карт с этим тегом.
      tagCardNames.forEach((name) => {
        const card = CARDS.find((c) => c.name === name);
        if (!card) return;
        const lesson = LESSONS.find((l) => l.id === card.lesson);
        const text = state.lessonText.get(card.lesson) || "";
        const section = findCardSection(text, card);
        if (section) {
          section.split("\n").forEach((line) => {
            const t = line.trim();
            if (!t || t.startsWith("#")) return;
            if (re && !re.test(t)) return;
            results.push({ lesson, snippet: t, cardName: name });
          });
        } else if (CARD_META[name] && CARD_META[name].summary) {
          const t = CARD_META[name].summary;
          if (!re || re.test(t)) results.push({ lesson, snippet: t, cardName: name });
        }
      });
    } else {
      LESSONS.forEach((l) => {
        const text = state.lessonText.get(l.id) || "";
        text.split("\n").forEach((line) => {
          const t = line.trim();
          if (!t || t.startsWith("#")) return;
          if (re && !re.test(t)) return;
          results.push({ lesson: l, snippet: t });
        });
      });
    }

    if (!results.length) {
      box.innerHTML = '<p class="search-empty">Ничего не найдено.</p>';
      return;
    }

    const shown = results.slice(0, 60);
    box.innerHTML = shown.map((r, i) =>
      '<div class="search-result" data-i="' + i + '">' +
        '<div class="sr-title">' + r.lesson.title + (r.cardName ? " · " + r.cardName : "") + '</div>' +
        '<div class="sr-snippet">' + (re ? escapeHtml(r.snippet).replace(re, (m) => "<mark>" + m + "</mark>") : escapeHtml(r.snippet)) + '</div>' +
      '</div>'
    ).join("") + (results.length > 60 ? '<p class="search-empty">Показаны первые 60 результатов из ' + results.length + '.</p>' : "");

    box.querySelectorAll(".search-result").forEach((el, i) => {
      el.addEventListener("click", () => {
        const r = shown[i];
        state.highlight = q || r.cardName || null;
        activateTab("lessons");
        openLesson(r.lesson.id, r.cardName || null);
      });
    });
  }
