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
    const heads = $content.querySelectorAll("summary, h1, h2");
    const t = norm(term);
    for (const h of heads) {
      if (norm(h.textContent).includes(t)) {
        const details = h.closest("details");
        if (details) details.open = true;
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }

  // Оборачивает каждую карточную секцию (h1, кроме титульного) в <details>,
  // чтобы урок раскрывался слоями, а не одним длинным полотном.
  function wrapSections(wrapEl) {
    const out = document.createDocumentFragment();
    let current = null;
    let cardH1Count = 0;
    Array.from(wrapEl.childNodes).forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "H1") {
        if (cardH1Count === 0 && /^Конспект/i.test(node.textContent.trim())) {
          current = null;
          out.appendChild(node);
          return;
        }
        cardH1Count++;
        current = document.createElement("details");
        current.className = "section-card";
        if (cardH1Count === 1) current.open = true;
        const summary = document.createElement("summary");
        summary.id = node.id;
        summary.textContent = node.textContent;
        current.appendChild(summary);
        out.appendChild(current);
      } else if (current) {
        current.appendChild(node);
      } else {
        out.appendChild(node);
      }
    });
    out.querySelectorAll(".section-card").forEach((det) => {
      const p = det.querySelector("p");
      if (p) {
        const preview = document.createElement("div");
        preview.className = "section-preview";
        preview.textContent = extractPreview(p.textContent, 160);
        det.querySelector("summary").after(preview);
      }
    });
    return out;
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

    const sections = wrapSections(wrap);
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
      '<div class="prose"></div>' +
      '<div class="lesson-note"></div>';

    $content.querySelector(".prose").appendChild(sections);
    $content.querySelector(".lesson-note").innerHTML = noteBoxHtml("lesson:" + lesson.id, "Заметки к уроку");
    bindNoteBoxes($content);

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
        if (el) {
          const details = el.closest("details");
          if (details) details.open = true;
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    if (state.highlight) {
      const firstMark = $content.querySelector("mark");
      if (firstMark) {
        const details = firstMark.closest("details");
        if (details) details.open = true;
        setTimeout(() => firstMark.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      }
      state.highlight = null;
    }

    renderSidebarLessons();
  }
