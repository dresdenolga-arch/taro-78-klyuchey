  // ---------- 7. Вид: Уроки ----------

  function openLesson(id, headingTermToScroll) {
    state.currentLesson = id;
    state.view = "lessons";
    render();
    if (headingTermToScroll) {
      setTimeout(() => scrollToHeadingContaining(headingTermToScroll), 60);
    }
  }

  function scrollToHeadingContaining(term) {
    const heads = $content.querySelectorAll("h1, h2");
    const t = norm(term);
    for (const h of heads) {
      if (norm(h.textContent).includes(t)) {
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }

  function renderLessonsView() {
    if (!state.currentLesson) state.currentLesson = LESSONS[0].id;
    const lesson = LESSONS.find((l) => l.id === state.currentLesson);
    const raw = state.lessonText.get(lesson.id) || "";
    let html = renderMarkdown(raw);
    if (state.highlight) html = highlightText(html, state.highlight);

    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    const toc = [];
    wrap.querySelectorAll("h1").forEach((h) => {
      const id = slugify(h.textContent) || Math.random().toString(36).slice(2);
      h.id = id;
      if (!/^Конспект/i.test(h.textContent.trim())) toc.push({ id, text: h.textContent });
    });

    const done = !!progress.lessonsRead[lesson.id];

    $content.innerHTML =
      '<div class="lesson-toolbar">' +
        '<button class="btn ' + (done ? "know" : "primary") + '" id="toggleReadBtn">' +
          (done ? "✓ Прочитано" : "Отметить как прочитано") +
        '</button>' +
      '</div>' +
      '<details class="lesson-toc" ' + (toc.length > 6 ? "" : "open") + '>' +
        '<summary>Содержание урока (' + toc.length + ')</summary>' +
        '<div class="lesson-toc-list">' +
          toc.map((t) => '<a data-id="' + t.id + '">' + t.text + '</a>').join("") +
        '</div>' +
      '</details>' +
      '<div class="prose"></div>';

    $content.querySelector(".prose").appendChild(wrap);

    document.getElementById("toggleReadBtn").addEventListener("click", () => {
      progress.lessonsRead[lesson.id] = !progress.lessonsRead[lesson.id];
      saveProgress(progress);
      updateProgressPill();
      renderSidebarLessons();
      renderLessonsView();
    });

    $content.querySelectorAll(".lesson-toc-list a").forEach((a) => {
      a.addEventListener("click", () => {
        const el = document.getElementById(a.dataset.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    if (state.highlight) {
      const firstMark = $content.querySelector("mark");
      if (firstMark) setTimeout(() => firstMark.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      state.highlight = null;
    }

    renderSidebarLessons();
  }
