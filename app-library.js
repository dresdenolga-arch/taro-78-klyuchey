"use strict";

  // ---------- 8. Вид: Карты (учебная библиотека) ----------

  // Ключевые "стемы" тегов для поиска соответствующего раздела/абзаца внутри
  // полного конспекта конкретной карты (заголовки и формулировки не всегда
  // совпадают с тегом дословно, поэтому ищем по корню слова).
  var TAG_STEMS = {
    "тень": "тень",
    "ресурс": "ресурс",
    "отношения": "отношени",
    "деньги": "деньг",
    "тело": "тел",
    "практикум": "практик"
  };

  function jumpToCardTag(tag) {
    var details = document.getElementById("cpFullDetails");
    var prose = document.getElementById("cpFullProse");
    if (!details || !prose) return;
    details.open = true;
    var stem = norm(TAG_STEMS[tag] || tag);

    var target = null;
    var heads = prose.querySelectorAll("h1, h2, h3, h4");
    for (var i = 0; i < heads.length; i++) {
      if (norm(heads[i].textContent).includes(stem)) { target = heads[i]; break; }
    }
    if (!target) {
      var blocks = prose.querySelectorAll("p, li");
      for (var j = 0; j < blocks.length; j++) {
        if (norm(blocks[j].textContent).includes(stem)) { target = blocks[j]; break; }
      }
    }

    setTimeout(function () {
      var scrollEl = target || details;
      scrollEl.scrollIntoView({ behavior: "smooth", block: target ? "center" : "start" });
      if (target) {
        target.classList.add("tag-jump-flash");
        setTimeout(function () { target.classList.remove("tag-jump-flash"); }, 1600);
      }
    }, 60);
  }

  function openCard(name) {
    state.libraryCard = name;
    state.view = "library";
    activateTab("library");
    render();
  }

  function libraryFilteredCards() {
    let list = state.libraryFilter === "Все" ? CARDS.slice() : CARDS.filter((c) => c.group === state.libraryFilter);
    if (state.libraryQuery && state.libraryQuery.trim()) {
      const q = norm(state.libraryQuery);
      list = list.filter((c) => norm(c.name).includes(q));
    }
    return list;
  }

  function renderLibraryList() {
    const chips = ["Все"].concat(GROUPS).map(
      (g) => '<button class="chip lib-chip ' + (g === state.libraryFilter ? "active" : "") + '" data-g="' + g + '">' + g + '</button>'
    ).join("");
    const list = libraryFilteredCards();
    const known = progress.cards;

    $content.innerHTML =
      '<div class="library-wrap">' +
        '<input type="text" class="search-input" id="libraryQuery" placeholder="Найти карту по имени…" value="' + (state.libraryQuery || "") + '">' +
        '<div class="deck-picker">' + chips + '</div>' +
        '<div class="library-grid">' +
          list.map((c) => {
            const mark = known[c.name] === "know" ? " · выучено" : "";
            return '<button class="library-item" data-name="' + c.name + '"><span class="li-name">' + c.name + '</span><span class="li-group">' + c.group + mark + '</span></button>';
          }).join("") +
        '</div>' +
      '</div>';

    $content.querySelectorAll(".lib-chip").forEach((c) => {
      c.addEventListener("click", () => { state.libraryFilter = c.dataset.g; renderLibraryList(); });
    });
    const input = document.getElementById("libraryQuery");
    input.addEventListener("input", () => { state.libraryQuery = input.value; renderLibraryList(); });
    $content.querySelectorAll(".library-item").forEach((el) => {
      el.addEventListener("click", () => openCard(el.dataset.name));
    });
  }

  function renderCardPage(card) {
    const text = state.lessonText.get(card.lesson) || "";
    const section = findCardSection(text, card);
    const meta = CARD_META[card.name] || null;
    const summary = meta && meta.summary ? meta.summary : extractPreview(section, 320);
    const tags = meta && meta.tags && meta.tags.length ? meta.tags : [];
    const rating = progress.cards[card.name];

    $content.innerHTML =
      '<button class="btn ghost small" id="backToLibrary">← Все карты</button>' +
      '<div class="card-page">' +
        '<div class="cp-tag">' + card.group + '</div>' +
        '<h1 class="cp-name">' + card.name + '</h1>' +
        (rating ? '<div class="cp-rating ' + rating + '">' + (rating === "know" ? "✓ отмечено: знаю" : "○ отмечено: повторить") + '</div>' : "") +
        '<div class="cp-quick">' +
          '<div class="cp-quick-label">Коротко</div>' +
          '<p>' + escapeHtml(summary || "Раздел по этой карте пока не найден в тексте урока.") + '</p>' +
        '</div>' +
        (tags.length ? '<div class="tag-row">' + tags.map((t) => '<button type="button" class="tag-chip" data-tag="' + t + '">' + t + '</button>').join("") + '</div>' : "") +
        '<div class="cp-actions">' +
          '<button class="btn small" id="openInLessonBtn">Открыть весь урок</button>' +
          '<button class="btn small primary" id="trainCardBtn">Тренировать эту карту</button>' +
        '</div>' +
        '<details class="section-card cp-full" id="cpFullDetails">' +
          '<summary>Полный конспект</summary>' +
          '<div class="prose" id="cpFullProse">' + (section ? renderMarkdown(section) : "<p><em>Текст не найден — открой урок целиком.</em></p>") + '</div>' +
        '</details>' +
        '<div class="cp-note"></div>' +
      '</div>';

    $content.querySelector(".cp-note").innerHTML = noteBoxHtml("card:" + card.name, "Личная заметка к карте");
    bindNoteBoxes($content);

    document.getElementById("backToLibrary").addEventListener("click", () => {
      state.libraryCard = null;
      render();
    });
    $content.querySelectorAll(".tag-chip").forEach((btn) => {
      btn.addEventListener("click", () => jumpToCardTag(btn.dataset.tag));
    });

    document.getElementById("openInLessonBtn").addEventListener("click", () => goToLessonForCard(card));
    document.getElementById("trainCardBtn").addEventListener("click", () => {
      state.practiceMode = "cards";
      startDeck(card.group);
      activateTab("practice");
      state.view = "practice";
      render();
    });
  }

  function renderLibraryView() {
    if (state.libraryCard) {
      const card = CARDS.find((c) => c.name === state.libraryCard);
      if (card) { renderCardPage(card); return; }
    }
    renderLibraryList();
  }
