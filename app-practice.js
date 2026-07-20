"use strict";

  // ---------- 9. Вид: Практика ----------

  const PRACTICE_TABS = [
    { id: "daily", label: "✨ Карта дня" },
    { id: "cards", label: "🃏 Карточки" },
    { id: "quiz", label: "🧠 Квиз" },
    { id: "solar", label: "🔮 Соляр" },
    { id: "spreads", label: "🧩 Расклады" },
  ];

  function renderPracticeSubnav() {
    return '<div class="practice-subnav">' +
      PRACTICE_TABS.map((t) =>
        '<button class="chip practice-tab ' + (state.practiceMode === t.id ? "active" : "") + '" data-mode="' + t.id + '">' + t.label + '</button>'
      ).join("") +
    '</div>';
  }

  function bindPracticeSubnav() {
    $content.querySelectorAll(".practice-tab").forEach((b) => {
      b.addEventListener("click", () => {
        state.practiceMode = b.dataset.mode;
        renderPracticeView();
      });
    });
  }

  function renderPracticeView() {
    if (state.practiceMode === "cards") renderFlashSubview();
    else if (state.practiceMode === "quiz") renderQuizSubview();
    else if (state.practiceMode === "solar") renderSolarSubview();
    else if (state.practiceMode === "spreads") renderSpreadsSubview();
    else renderDailySubview();
  }

  // ----- Карта дня -----

  const DAILY_QUESTIONS = [
    "Где сегодня может проявиться энергия этой карты?",
    "Что эта карта предлагает потренировать именно сегодня?",
    "Какой ресурс карты можно использовать прямо сейчас?",
  ];

  function dayIndexSeed() {
    const d = new Date();
    const days = Math.floor(d.getTime() / 86400000);
    return days % CARDS.length;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  let dailyCard = null;
  function renderDailySubview(forceRandom) {
    if (!dailyCard || forceRandom) {
      dailyCard = forceRandom
        ? CARDS[Math.floor(Math.random() * CARDS.length)]
        : CARDS[dayIndexSeed()];
    }
    const todayStr = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    const answerShown = !!state._dailyAnswerShown;

    $content.innerHTML =
      renderPracticeSubnav() +
      '<div class="daily-wrap">' +
        '<div class="daily-date">' + (forceRandom ? "Случайная карта для практики" : "Карта дня · " + todayStr) + '</div>' +
        '<div class="flashcard">' +
          '<div class="flash-tag">' + dailyCard.group + '</div>' +
          '<div class="flash-name">' + dailyCard.name + '</div>' +
          (!answerShown
            ? '<div class="flash-hint">Загадай вопрос или просто вспомни значение карты, потом жми «Показать»</div><button class="btn primary" id="showDailyBtn" style="margin-top:14px;">Показать разбор</button>'
            : '<div class="flash-answer prose" id="dailyAnswer"></div>') +
        '</div>' +
        (answerShown
          ? '<div class="daily-reflect">' +
              '<div class="dr-title">Вопросы дня</div>' +
              '<ol>' + DAILY_QUESTIONS.map((q) => "<li>" + q + "</li>").join("") + '</ol>' +
              '<div id="eveningNote"></div>' +
            '</div>'
          : "") +
        '<div class="flash-footer" style="margin-top:18px;">' +
          '<button class="btn ghost small" id="anotherCardBtn">🎲 Другая случайная карта</button>' +
          '<button class="btn ghost small" id="openDailyInLesson">Открыть в уроке целиком</button>' +
        '</div>' +
      '</div>';

    bindPracticeSubnav();

    if (answerShown) {
      const text = state.lessonText.get(dailyCard.lesson) || "";
      const section = findCardSection(text, dailyCard);
      $content.querySelector("#dailyAnswer").innerHTML = section
        ? renderMarkdown(section)
        : "<p><em>Не нашлось точного раздела — открой урок целиком.</em></p>";
      document.getElementById("eveningNote").innerHTML = noteBoxHtml("daily:" + todayKey(), "Вечерняя заметка (" + todayStr + ")");
      bindNoteBoxes($content);
    } else {
      document.getElementById("showDailyBtn").addEventListener("click", () => {
        state._dailyAnswerShown = true;
        renderDailySubview(false);
      });
    }

    document.getElementById("anotherCardBtn").addEventListener("click", () => {
      state._dailyAnswerShown = false;
      renderDailySubview(true);
    });
    document.getElementById("openDailyInLesson").addEventListener("click", () => goToLessonForCard(dailyCard));
  }

  // ----- Карточки (флеш-карты, recall) -----

  function cardsInDeck(filter) {
    if (filter === "Все") return CARDS.slice();
    return CARDS.filter((c) => c.group === filter);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startDeck(filter) {
    state.deckFilter = filter;
    state.deckQueue = shuffle(cardsInDeck(filter));
    state.deckIndex = 0;
    state.answerShown = false;
  }

  function bindDeckChips() {
    $content.querySelectorAll(".deck-chip").forEach((c) => {
      c.addEventListener("click", () => {
        startDeck(c.dataset.g);
        renderFlashSubview();
      });
    });
  }

  function renderFlashSubview() {
    if (!state.deckQueue.length) startDeck(state.deckFilter);

    const total = state.deckQueue.length;
    const card = state.deckQueue[state.deckIndex];

    const chips = ["Все"].concat(GROUPS).map(
      (g) => '<button class="chip deck-chip ' + (g === state.deckFilter ? "active" : "") + '" data-g="' + g + '">' + g + '</button>'
    ).join("");

    if (!card) {
      $content.innerHTML = renderPracticeSubnav() + '<div class="deck-picker">' + chips + '</div><p>В этой колоде пока нет карт.</p>';
      bindPracticeSubnav();
      bindDeckChips();
      return;
    }

    const rating = progress.cards[card.name];
    const ratingLabel = rating ? (" · отмечено: " + (rating === "know" ? "знаю" : "повторить")) : "";

    $content.innerHTML =
      renderPracticeSubnav() +
      '<div class="deck-picker">' + chips + '</div>' +
      '<div class="flash-wrap">' +
        '<div class="flash-progress">Карта ' + (state.deckIndex + 1) + ' из ' + total + ' · колода «' + state.deckFilter + '»' + ratingLabel + '</div>' +
        '<div class="flashcard" id="flashcard">' +
          '<div class="flash-tag">' + card.group + '</div>' +
          '<div class="flash-name">' + card.name + '</div>' +
          (!state.answerShown
            ? '<div class="flash-hint">Вспомни значение, тень и ключи, потом жми «Показать»</div><button class="btn primary" id="showAnswerBtn" style="margin-top:14px;">Показать ответ</button>'
            : '<div class="flash-answer prose" id="flashAnswer"></div>') +
        '</div>' +
        (state.answerShown
          ? '<div class="flash-actions"><button class="btn review" id="markReview">Повторить ещё раз</button><button class="btn know" id="markKnow">Знаю ✓</button></div>'
          : "") +
        '<div class="flash-footer">' +
          '<button class="btn ghost small" id="skipBtn">Пропустить →</button>' +
          '<button class="btn ghost small" id="openInLesson">Открыть в уроке целиком</button>' +
          '<button class="btn ghost small" id="openInLibrary">Учебная страница карты</button>' +
        '</div>' +
      '</div>';

    bindPracticeSubnav();
    bindDeckChips();

    if (state.answerShown) {
      const text = state.lessonText.get(card.lesson) || "";
      const section = findCardSection(text, card);
      const target = $content.querySelector("#flashAnswer");
      target.innerHTML = section
        ? renderMarkdown(section)
        : "<p><em>Не нашлось точного раздела в тексте урока — открой урок целиком, чтобы найти карту вручную.</em></p>";
    } else {
      document.getElementById("showAnswerBtn").addEventListener("click", () => {
        state.answerShown = true;
        renderFlashSubview();
      });
    }

    document.getElementById("skipBtn").addEventListener("click", nextCard);
    document.getElementById("openInLesson").addEventListener("click", () => goToLessonForCard(card));
    document.getElementById("openInLibrary").addEventListener("click", () => openCard(card.name));

    if (state.answerShown) {
      document.getElementById("markKnow").addEventListener("click", () => rateCard(card, "know"));
      document.getElementById("markReview").addEventListener("click", () => rateCard(card, "review"));
    }
  }

  function rateCard(card, rating) {
    progress.cards[card.name] = rating;
    saveProgress(progress);
    updateProgressPill();
    nextCard();
  }

  function nextCard() {
    state.deckIndex++;
    state.answerShown = false;
    if (state.deckIndex >= state.deckQueue.length) {
      state.deckQueue = shuffle(cardsInDeck(state.deckFilter));
      state.deckIndex = 0;
    }
    renderFlashSubview();
  }

  // ----- Квиз (вопросы на понимание, самопроверка) -----

  function quizCardsInDeck(filter) {
    const base = filter === "Все" ? CARDS.slice() : CARDS.filter((c) => c.group === filter);
    return base.filter((c) => CARD_META[c.name] && CARD_META[c.name].quiz && CARD_META[c.name].quiz.length);
  }

  function startQuizDeck(filter) {
    state.quizFilter = filter;
    state.quizQueue = shuffle(quizCardsInDeck(filter));
    state.quizIndex = 0;
    state.quizAnswerShown = false;
    state.quizQuestion = null;
  }

  function bindQuizChips() {
    $content.querySelectorAll(".quiz-chip").forEach((c) => {
      c.addEventListener("click", () => {
        startQuizDeck(c.dataset.g);
        renderQuizSubview();
      });
    });
  }

  function renderQuizSubview() {
    if (!state.quizQueue.length) startQuizDeck(state.quizFilter);

    const chips = ["Все"].concat(GROUPS).map(
      (g) => '<button class="chip quiz-chip ' + (g === state.quizFilter ? "active" : "") + '" data-g="' + g + '">' + g + '</button>'
    ).join("");

    const total = state.quizQueue.length;
    const card = state.quizQueue[state.quizIndex];

    if (!card) {
      $content.innerHTML =
        renderPracticeSubnav() +
        '<div class="deck-picker">' + chips + '</div>' +
        '<div class="quiz-placeholder"><p>Для этой колоды пока нет вопросов — метаданные карт ещё загружаются или их нет для этой группы.</p></div>';
      bindPracticeSubnav();
      bindQuizChips();
      return;
    }

    if (!state.quizQuestion) {
      const qs = CARD_META[card.name].quiz;
      state.quizQuestion = qs[Math.floor(Math.random() * qs.length)];
    }

    const rating = progress.quiz[card.name];
    const ratingLabel = rating ? (" · отмечено: " + (rating === "know" ? "знаю" : "повторить")) : "";

    $content.innerHTML =
      renderPracticeSubnav() +
      '<div class="deck-picker">' + chips + '</div>' +
      '<div class="flash-wrap">' +
        '<div class="flash-progress">Вопрос ' + (state.quizIndex + 1) + ' из ' + total + ' · колода «' + state.quizFilter + '»' + ratingLabel + '</div>' +
        '<div class="flashcard" id="quizCard">' +
          '<div class="flash-tag">' + card.group + ' · ' + card.name + '</div>' +
          '<div class="quiz-question">' + escapeHtml(state.quizQuestion.q) + '</div>' +
          (!state.quizAnswerShown
            ? '<button class="btn primary" id="showQuizAnswerBtn" style="margin-top:14px;">Показать ответ</button>'
            : '<div class="flash-answer prose" id="quizAnswer"><p>' + escapeHtml(state.quizQuestion.a) + '</p></div>') +
        '</div>' +
        (state.quizAnswerShown
          ? '<div class="flash-actions"><button class="btn review" id="quizMarkReview">Повторить ещё раз</button><button class="btn know" id="quizMarkKnow">Знаю ✓</button></div>'
          : "") +
        '<div class="flash-footer">' +
          '<button class="btn ghost small" id="quizSkipBtn">Пропустить →</button>' +
          '<button class="btn ghost small" id="quizOpenInLibrary">Учебная страница карты</button>' +
        '</div>' +
      '</div>';

    bindPracticeSubnav();
    bindQuizChips();

    if (!state.quizAnswerShown) {
      document.getElementById("showQuizAnswerBtn").addEventListener("click", () => {
        state.quizAnswerShown = true;
        renderQuizSubview();
      });
    } else {
      document.getElementById("quizMarkKnow").addEventListener("click", () => rateQuiz(card, "know"));
      document.getElementById("quizMarkReview").addEventListener("click", () => rateQuiz(card, "review"));
    }
    document.getElementById("quizSkipBtn").addEventListener("click", nextQuizCard);
    document.getElementById("quizOpenInLibrary").addEventListener("click", () => openCard(card.name));
  }

  function rateQuiz(card, rating) {
    progress.quiz[card.name] = rating;
    saveProgress(progress);
    nextQuizCard();
  }

  function nextQuizCard() {
    state.quizIndex++;
    state.quizAnswerShown = false;
    state.quizQuestion = null;
    if (state.quizIndex >= state.quizQueue.length) {
      state.quizQueue = shuffle(quizCardsInDeck(state.quizFilter));
      state.quizIndex = 0;
    }
    renderQuizSubview();
  }

  // ----- Соляр (тренажёр: карта в доме) -----

  function houseById(id) {
    return HOUSES.find((h) => h.id === id) || null;
  }

  function solarCardQuickSummary(card) {
    const meta = CARD_META[card.name];
    if (meta && meta.summary) return meta.summary;
    const text = state.lessonText.get(card.lesson) || "";
    const section = findCardSection(text, card);
    return extractPreview(section, 320) || "Раздел по этой карте пока не найден в тексте урока.";
  }

  function renderSolarHousePicker() {
    $content.innerHTML =
      renderPracticeSubnav() +
      '<div class="solar-intro prose"><p>Выбери дом Соляра — тему года, которую тренируешься трактовать. Затем возьми карту (наугад или свою) и разбери её в этом доме по методу автора.</p></div>' +
      '<div class="library-grid solar-house-grid">' +
        HOUSES.map((h) =>
          '<button class="library-item solar-house-item" data-h="' + h.id + '">' +
            '<span class="li-name">' + h.name + '</span>' +
            '<span class="li-group">' + h.theme + '</span>' +
          '</button>'
        ).join("") +
      '</div>';
    bindPracticeSubnav();
    $content.querySelectorAll(".solar-house-item").forEach((el) => {
      el.addEventListener("click", () => {
        state.solarHouse = Number(el.dataset.h);
        state.solarCard = null;
        renderSolarSubview();
      });
    });
  }

  function solarCardsForQuery(q) {
    if (!q || !q.trim()) return [];
    const n = norm(q);
    return CARDS.filter((c) => norm(c.name).includes(n)).slice(0, 12);
  }

  function renderSolarCardResults() {
    const box = document.getElementById("solarPickResults");
    if (!box) return;
    const results = solarCardsForQuery(state.solarQuery);
    box.innerHTML = results.length
      ? results.map((c) => '<button class="library-item solar-pick-item" data-name="' + c.name + '"><span class="li-name">' + c.name + '</span><span class="li-group">' + c.group + '</span></button>').join("")
      : (state.solarQuery && state.solarQuery.trim() ? '<p class="search-empty">Ничего не найдено.</p>' : "");
    box.querySelectorAll(".solar-pick-item").forEach((el) => {
      el.addEventListener("click", () => {
        state.solarCard = el.dataset.name;
        renderSolarSubview();
      });
    });
  }

  function renderSolarCardPicker(house) {
    $content.innerHTML =
      renderPracticeSubnav() +
      '<button class="btn ghost small" id="solarBackToHouses">← Другой дом</button>' +
      '<div class="solar-house-header prose">' +
        '<h2>' + house.name + '</h2>' +
        '<p>' + house.theme + '</p>' +
      '</div>' +
      '<div class="cp-actions">' +
        '<button class="btn primary" id="solarRandomCardBtn">🎲 Случайная карта</button>' +
      '</div>' +
      '<input type="text" class="search-input" id="solarCardQuery" placeholder="Или найди карту по имени…" value="' + (state.solarQuery || "") + '">' +
      '<div class="library-grid" id="solarPickResults"></div>';

    bindPracticeSubnav();
    document.getElementById("solarBackToHouses").addEventListener("click", () => {
      state.solarHouse = null;
      renderSolarSubview();
    });
    document.getElementById("solarRandomCardBtn").addEventListener("click", () => {
      state.solarCard = CARDS[Math.floor(Math.random() * CARDS.length)].name;
      renderSolarSubview();
    });
    const input = document.getElementById("solarCardQuery");
    input.addEventListener("input", () => {
      state.solarQuery = input.value;
      renderSolarCardResults();
    });
    renderSolarCardResults();
  }

  function renderSolarWorkspace(house, card) {
    const summary = solarCardQuickSummary(card);
    const noteKey = "solar:" + house.id + ":" + card.name;

    $content.innerHTML =
      renderPracticeSubnav() +
      '<div class="solar-actions-top">' +
        '<button class="btn ghost small" id="solarBackToHouses">← Другой дом</button>' +
        '<button class="btn ghost small" id="solarBackToCards">🎲 Другая карта</button>' +
      '</div>' +
      '<div class="card-page">' +
        '<div class="cp-tag">Соляр · ' + house.name + '</div>' +
        '<h1 class="cp-name">' + card.name + ' — Дом ' + house.id + '</h1>' +
        '<div class="cp-quick">' +
          '<div class="cp-quick-label">Тема дома</div>' +
          '<p>' + escapeHtml(house.theme) + '</p>' +
        '</div>' +
        '<div class="cp-quick">' +
          '<div class="cp-quick-label">Карта коротко</div>' +
          '<p>' + escapeHtml(summary) + '</p>' +
        '</div>' +
        '<div class="daily-reflect">' +
          '<div class="dr-title">Разбери карту в доме по методу автора</div>' +
          '<ol>' + SOLAR_QUESTIONS.map((q) => "<li>" + q + "</li>").join("") + '</ol>' +
        '</div>' +
        '<div class="cp-note"></div>' +
        '<div class="cp-actions">' +
          '<button class="btn small" id="solarOpenLesson">Открыть урок про этот дом</button>' +
          '<button class="btn small" id="solarOpenCard">Учебная страница карты</button>' +
        '</div>' +
      '</div>';

    bindPracticeSubnav();
    $content.querySelector(".cp-note").innerHTML = noteBoxHtml(noteKey, "Моя трактовка");
    bindNoteBoxes($content);

    document.getElementById("solarBackToHouses").addEventListener("click", () => {
      state.solarHouse = null;
      state.solarCard = null;
      renderSolarSubview();
    });
    document.getElementById("solarBackToCards").addEventListener("click", () => {
      state.solarCard = CARDS[Math.floor(Math.random() * CARDS.length)].name;
      renderSolarSubview();
    });
    document.getElementById("solarOpenLesson").addEventListener("click", () => {
      openLesson(house.lesson, house.headingTerm);
    });
    document.getElementById("solarOpenCard").addEventListener("click", () => openCard(card.name));
  }

  function renderSolarSubview() {
    if (!state.solarHouse) { renderSolarHousePicker(); return; }
    const house = houseById(state.solarHouse);
    if (!house) { state.solarHouse = null; renderSolarHousePicker(); return; }
    if (!state.solarCard) { renderSolarCardPicker(house); return; }
    const card = CARDS.find((c) => c.name === state.solarCard);
    if (!card) { state.solarCard = null; renderSolarCardPicker(house); return; }
    renderSolarWorkspace(house, card);
  }

  // ----- Расклады (подбор схемы под ситуацию + разбор по позициям) -----

  function renderSpreadsPicker() {
    const cat = state.spreadsCategory ? SITUATION_CATEGORIES.find((c) => c.id === state.spreadsCategory) : null;
    const suggestedSpreads = cat ? SPREADS.filter((s) => cat.spreadIds.includes(s.id)) : [];
    const suggestedHouses = cat ? cat.houseIds.map((id) => houseById(id)).filter(Boolean) : [];

    $content.innerHTML =
      renderPracticeSubnav() +
      '<div class="solar-intro prose"><p>Опиши свою ситуацию своими словами или выбери тему — подберу подходящую схему расклада. Карты можно тянуть прямо на сайте или ввести те, что уже выпали у тебя на столе.</p></div>' +
      '<textarea class="note-input spreads-query" id="spreadsQueryInput" placeholder="Например: не понимаю, продолжать ли эти отношения…">' + escapeHtml(state.spreadsQuery || "") + '</textarea>' +
      '<button class="btn small" id="spreadsGuessBtn" style="margin:8px 0 16px;">Подобрать по описанию</button>' +
      '<div class="deck-picker" id="spreadsCatChips">' +
        SITUATION_CATEGORIES.map((c) => '<button class="chip spreads-cat-chip ' + (state.spreadsCategory === c.id ? "active" : "") + '" data-c="' + c.id + '">' + c.label + '</button>').join("") +
      '</div>' +
      (cat
        ? (
          '<div class="solar-house-header prose"><h2>Подходящие схемы для темы «' + cat.label + '»</h2></div>' +
          '<div class="library-grid">' +
            suggestedSpreads.map((s) => '<button class="library-item spreads-pick-item" data-s="' + s.id + '"><span class="li-name">' + s.name + '</span><span class="li-group">' + s.cardsCount + ' карты · ' + escapeHtml(s.whenToUse) + '</span></button>').join("") +
          '</div>' +
          (suggestedHouses.length
            ? '<div class="solar-house-header prose"><h2>А ещё можно посмотреть в Соляре</h2><p>Для этой темы обычно смотрят: ' + suggestedHouses.map((h) => h.name).join(", ") + '.</p></div>' +
              '<div class="cp-actions">' + suggestedHouses.map((h) => '<button class="btn small" data-jump-house="' + h.id + '">' + h.name.replace(/^Дом \d+\.\s*/, "") + '</button>').join("") + '</div>'
            : "")
        )
        : "") +
      '<div class="solar-house-header prose"><h2>Или выбери схему сама</h2></div>' +
      '<div class="library-grid">' +
        SPREADS.map((s) => '<button class="library-item spreads-pick-item" data-s="' + s.id + '"><span class="li-name">' + s.name + '</span><span class="li-group">' + s.cardsCount + ' карты</span></button>').join("") +
      '</div>';

    bindPracticeSubnav();

    const qInput = document.getElementById("spreadsQueryInput");
    qInput.addEventListener("input", () => { state.spreadsQuery = qInput.value; });
    document.getElementById("spreadsGuessBtn").addEventListener("click", () => {
      const guessed = guessSituationCategory(qInput.value);
      state.spreadsCategory = guessed ? guessed.id : "general";
      renderSpreadsPicker();
    });
    $content.querySelectorAll(".spreads-cat-chip").forEach((c) => {
      c.addEventListener("click", () => { state.spreadsCategory = c.dataset.c; renderSpreadsPicker(); });
    });
    $content.querySelectorAll(".spreads-pick-item").forEach((el) => {
      el.addEventListener("click", () => {
        state.spreadsSpread = el.dataset.s;
        state.spreadsCards = {};
        renderSpreadsSubview();
      });
    });
    $content.querySelectorAll("[data-jump-house]").forEach((el) => {
      el.addEventListener("click", () => {
        state.solarHouse = Number(el.dataset.jumpHouse);
        state.solarCard = null;
        state.practiceMode = "solar";
        renderPracticeView();
      });
    });
  }

  function renderSpreadsPositions(spread) {
    $content.innerHTML =
      renderPracticeSubnav() +
      '<button class="btn ghost small" id="spreadsBackToPicker">← Другая схема</button>' +
      '<div class="solar-house-header prose"><h2>' + spread.name + '</h2><p>' + escapeHtml(spread.whenToUse) + '</p></div>' +
      '<div class="library-grid">' +
        spread.positions.map((p) => {
          const filled = state.spreadsCards[p.id];
          return '<button class="library-item spreads-position-item" data-p="' + p.id + '">' +
            '<span class="li-name">' + p.label + '</span>' +
            '<span class="li-group">' + (filled ? "✓ " + filled : escapeHtml(p.hint)) + '</span>' +
          '</button>';
        }).join("") +
      '</div>';

    bindPracticeSubnav();
    document.getElementById("spreadsBackToPicker").addEventListener("click", () => {
      state.spreadsSpread = null;
      state.spreadsCards = {};
      renderSpreadsSubview();
    });
    $content.querySelectorAll(".spreads-position-item").forEach((el) => {
      el.addEventListener("click", () => {
        state.spreadsPickPosition = el.dataset.p;
        state.spreadsPickQuery = "";
        renderSpreadsSubview();
      });
    });
  }

  function renderSpreadsCardResults(positionId) {
    const box = document.getElementById("spreadsPickResults");
    if (!box) return;
    const results = solarCardsForQuery(state.spreadsPickQuery);
    box.innerHTML = results.length
      ? results.map((c) => '<button class="library-item spreads-card-item" data-name="' + c.name + '"><span class="li-name">' + c.name + '</span><span class="li-group">' + c.group + '</span></button>').join("")
      : (state.spreadsPickQuery && state.spreadsPickQuery.trim() ? '<p class="search-empty">Ничего не найдено.</p>' : "");
    box.querySelectorAll(".spreads-card-item").forEach((el) => {
      el.addEventListener("click", () => {
        state.spreadsCards[positionId] = el.dataset.name;
        state.spreadsPickPosition = null;
        renderSpreadsSubview();
      });
    });
  }

  function renderSpreadsCardPicker(spread, positionId) {
    const position = spread.positions.find((p) => p.id === positionId);
    $content.innerHTML =
      renderPracticeSubnav() +
      '<button class="btn ghost small" id="spreadsPickBack">← Назад к позициям</button>' +
      '<div class="solar-house-header prose"><h2>' + position.label + '</h2><p>' + escapeHtml(position.hint) + '</p></div>' +
      '<div class="cp-actions"><button class="btn primary" id="spreadsRandomCardBtn">🎲 Случайная карта</button></div>' +
      '<input type="text" class="search-input" id="spreadsPickInput" placeholder="Или введи карту, которая выпала у тебя…" value="' + (state.spreadsPickQuery || "") + '">' +
      '<div class="library-grid" id="spreadsPickResults"></div>';

    bindPracticeSubnav();
    document.getElementById("spreadsPickBack").addEventListener("click", () => {
      state.spreadsPickPosition = null;
      renderSpreadsSubview();
    });
    document.getElementById("spreadsRandomCardBtn").addEventListener("click", () => {
      state.spreadsCards[positionId] = CARDS[Math.floor(Math.random() * CARDS.length)].name;
      state.spreadsPickPosition = null;
      renderSpreadsSubview();
    });
    const input = document.getElementById("spreadsPickInput");
    input.addEventListener("input", () => {
      state.spreadsPickQuery = input.value;
      renderSpreadsCardResults(positionId);
    });
    renderSpreadsCardResults(positionId);
  }

  function renderSpreadsResult(spread) {
    const noteKey = "spread:" + spread.id + ":" + spread.positions.map((p) => state.spreadsCards[p.id]).join("|");

    $content.innerHTML =
      renderPracticeSubnav() +
      '<div class="solar-actions-top">' +
        '<button class="btn ghost small" id="spreadsBackToPositions">← Изменить карты</button>' +
        '<button class="btn ghost small" id="spreadsStartOver">Новый расклад</button>' +
      '</div>' +
      '<div class="card-page">' +
        '<div class="cp-tag">Расклад</div>' +
        '<h1 class="cp-name">' + spread.name + '</h1>' +
        spread.positions.map((p) => {
          const cardName = state.spreadsCards[p.id];
          const card = CARDS.find((c) => c.name === cardName);
          const summary = card ? solarCardQuickSummary(card) : "";
          return '<div class="cp-quick">' +
            '<div class="cp-quick-label">' + p.label + ' — ' + cardName + '</div>' +
            '<p>' + escapeHtml(summary) + '</p>' +
          '</div>';
        }).join("") +
        '<div class="cp-note"></div>' +
      '</div>';

    bindPracticeSubnav();
    $content.querySelector(".cp-note").innerHTML = noteBoxHtml(noteKey, "Моя трактовка расклада целиком");
    bindNoteBoxes($content);

    document.getElementById("spreadsBackToPositions").addEventListener("click", () => {
      renderSpreadsPositions(spread);
    });
    document.getElementById("spreadsStartOver").addEventListener("click", () => {
      state.spreadsSpread = null;
      state.spreadsCards = {};
      state.spreadsCategory = null;
      renderSpreadsSubview();
    });
  }

  function renderSpreadsSubview() {
    if (!state.spreadsSpread) { renderSpreadsPicker(); return; }
    const spread = SPREADS.find((s) => s.id === state.spreadsSpread);
    if (!spread) { state.spreadsSpread = null; renderSpreadsPicker(); return; }
    if (state.spreadsPickPosition) { renderSpreadsCardPicker(spread, state.spreadsPickPosition); return; }
    const allFilled = spread.positions.every((p) => state.spreadsCards[p.id]);
    if (!allFilled) { renderSpreadsPositions(spread); return; }
    renderSpreadsResult(spread);
  }
