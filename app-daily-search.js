  // ---------- 9. Вид: Карта дня ----------

  function dayIndexSeed() {
    const d = new Date();
    const days = Math.floor(d.getTime() / 86400000);
    return days % CARDS.length;
  }

  let dailyCard = null;
  function renderDailyView(forceRandom) {
    if (!dailyCard || forceRandom) {
      dailyCard = forceRandom
        ? CARDS[Math.floor(Math.random() * CARDS.length)]
        : CARDS[dayIndexSeed()];
    }

    const todayStr = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    const answerShown = !!state._dailyAnswerShown;

    $content.innerHTML =
      '<div class="daily-wrap">' +
        '<div class="daily-date">' + (forceRandom ? "Случайная карта для практики" : "Карта дня · " + todayStr) + '</div>' +
        '<div class="flashcard">' +
          '<div class="flash-tag">' + dailyCard.group + '</div>' +
          '<div class="flash-name">' + dailyCard.name + '</div>' +
          (!answerShown
            ? '<div class="flash-hint">Загадай вопрос или просто вспомни значение карты, потом жми «Показать»</div><button class="btn primary" id="showDailyBtn" style="margin-top:14px;">Показать разбор</button>'
            : '<div class="flash-answer prose" id="dailyAnswer"></div>') +
        '</div>' +
        '<div class="flash-footer" style="margin-top:18px;">' +
          '<button class="btn ghost small" id="anotherCardBtn">🎲 Другая случайная карта</button>' +
          '<button class="btn ghost small" id="openDailyInLesson">Открыть в уроке целиком</button>' +
        '</div>' +
      '</div>';

    if (answerShown) {
      const text = state.lessonText.get(dailyCard.lesson) || "";
      const section = findCardSection(text, dailyCard);
      $content.querySelector("#dailyAnswer").innerHTML = section
        ? renderMarkdown(section)
        : "<p><em>Не нашлось точного раздела — открой урок целиком.</em></p>";
    } else {
      document.getElementById("showDailyBtn").addEventListener("click", () => {
        state._dailyAnswerShown = true;
        renderDailyView(false);
      });
    }

    document.getElementById("anotherCardBtn").addEventListener("click", () => {
      state._dailyAnswerShown = false;
      renderDailyView(true);
    });
    document.getElementById("openDailyInLesson").addEventListener("click", () => goToLessonForCard(dailyCard));
  }

  // ---------- 10. Вид: Поиск ----------

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function renderSearchView() {
    $content.innerHTML =
      '<div class="search-wrap">' +
        '<input type="text" class="search-input" id="searchInput" placeholder="Например: тень, деньги, отношения, Отшельник…" value="' + (state.searchTerm || "") + '">' +
        '<div id="searchResults"></div>' +
      '</div>';
    const input = document.getElementById("searchInput");
    input.focus();
    input.addEventListener("input", () => {
      state.searchTerm = input.value;
      runSearch(input.value);
    });
    if (state.searchTerm) runSearch(state.searchTerm);
  }

  function runSearch(term) {
    const box = document.getElementById("searchResults");
    if (!term || term.trim().length < 2) {
      box.innerHTML = '<p class="search-empty">Введите минимум 2 символа.</p>';
      return;
    }
    const q = term.trim();
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const results = [];
    LESSONS.forEach((l) => {
      const text = state.lessonText.get(l.id) || "";
      text.split("\n").forEach((line) => {
        const t = line.trim();
        if (t && !t.startsWith("#") && re.test(t)) {
          results.push({ lesson: l, snippet: t });
        }
      });
    });

    if (!results.length) {
      box.innerHTML = '<p class="search-empty">Ничего не найдено.</p>';
      return;
    }

    const shown = results.slice(0, 60);
    box.innerHTML = shown.map((r, i) =>
      '<div class="search-result" data-i="' + i + '">' +
        '<div class="sr-title">' + r.lesson.title + '</div>' +
        '<div class="sr-snippet">' + escapeHtml(r.snippet).replace(re, (m) => "<mark>" + m + "</mark>") + '</div>' +
      '</div>'
    ).join("") + (results.length > 60 ? '<p class="search-empty">Показаны первые 60 результатов из ' + results.length + '.</p>' : "");

    box.querySelectorAll(".search-result").forEach((el, i) => {
      el.addEventListener("click", () => {
        const r = shown[i];
        state.highlight = q;
        activateTab("lessons");
        openLesson(r.lesson.id);
      });
    });
  }
