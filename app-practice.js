"use strict";

  // ---------- 9. Вид: Практика ----------

  const PRACTICE_TABS = [
    { id: "daily", label: "✨ Карта дня" },
    { id: "cards", label: "🃏 Карточки" },
    { id: "quiz", label: "🧠 Квиз" },
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
