  // ---------- 8. Вид: Карточки (флеш-карты) ----------

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
    $content.querySelectorAll(".chip").forEach((c) => {
      c.addEventListener("click", () => {
        startDeck(c.dataset.g);
        renderCardsView();
      });
    });
  }

  function goToLessonForCard(card) {
    activateTab("lessons");
    openLesson(card.lesson, card.name);
  }

  function renderCardsView() {
    if (!state.deckQueue.length) startDeck(state.deckFilter);

    const total = state.deckQueue.length;
    const card = state.deckQueue[state.deckIndex];

    const chips = ["Все"].concat(GROUPS).map(
      (g) => '<button class="chip ' + (g === state.deckFilter ? "active" : "") + '" data-g="' + g + '">' + g + '</button>'
    ).join("");

    if (!card) {
      $content.innerHTML = '<div class="deck-picker">' + chips + '</div><p>В этой колоде пока нет карт.</p>';
      bindDeckChips();
      return;
    }

    const rating = progress.cards[card.name];
    const ratingLabel = rating ? (" · отмечено: " + (rating === "know" ? "знаю" : "повторить")) : "";

    $content.innerHTML =
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
          : '') +
        '<div class="flash-footer">' +
          '<button class="btn ghost small" id="skipBtn">Пропустить →</button>' +
          '<button class="btn ghost small" id="openInLesson">Открыть в уроке целиком</button>' +
        '</div>' +
      '</div>';

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
        renderCardsView();
      });
    }

    document.getElementById("skipBtn").addEventListener("click", nextCard);
    document.getElementById("openInLesson").addEventListener("click", () => goToLessonForCard(card));

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
    renderCardsView();
  }
