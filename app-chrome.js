  // ---------- 6. UI: каркас ----------

  const $content = document.getElementById("content");
  const $lessonList = document.getElementById("lessonList");
  const $progressPill = document.getElementById("progressPill");
  const $sidebar = document.getElementById("sidebar");
  const $overlay = document.getElementById("overlay");

  document.getElementById("menuToggle").addEventListener("click", () => {
    $sidebar.classList.toggle("open");
    $overlay.classList.toggle("show");
  });
  $overlay.addEventListener("click", () => {
    $sidebar.classList.remove("open");
    $overlay.classList.remove("show");
  });

  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.view = btn.dataset.view;
      $sidebar.classList.remove("open");
      $overlay.classList.remove("show");
      render();
    });
  });

  function activateTab(name) {
    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));
    const btn = document.querySelector('.nav-tab[data-view="' + name + '"]');
    if (btn) btn.classList.add("active");
  }

  function updateProgressPill() {
    const lessonsDone = Object.values(progress.lessonsRead).filter(Boolean).length;
    const known = Object.values(progress.cards).filter((v) => v === "know").length;
    $progressPill.textContent = "Уроков: " + lessonsDone + "/12 · Карт выучено: " + known + "/" + CARDS.length;
  }

  function renderSidebarLessons() {
    $lessonList.innerHTML = "";
    LESSONS.forEach((l) => {
      const item = document.createElement("div");
      item.className = "lesson-item" + (state.currentLesson === l.id && state.view === "lessons" ? " active" : "");
      const done = !!progress.lessonsRead[l.id];
      item.innerHTML = '<span class="lesson-check ' + (done ? "done" : "") + '"></span><span>' + l.title + '</span>';
      item.addEventListener("click", () => {
        state.view = "lessons";
        activateTab("lessons");
        openLesson(l.id);
      });
      $lessonList.appendChild(item);
    });
  }
