  // ---------- 11. Роутер ----------

  function render() {
    updateProgressPill();
    if (state.view === "lessons") renderLessonsView();
    else if (state.view === "library") renderLibraryView();
    else if (state.view === "practice") renderPracticeView();
    else if (state.view === "search") renderSearchView();
    if (state.view !== "lessons") renderSidebarLessons();
  }

  // ---------- 12. Старт ----------

  (async function init() {
    renderSidebarLessons();
    await loadAllLessons();
    const loadingMsg = document.getElementById("loadingMsg");
    if (loadingMsg) loadingMsg.remove();
    render();
  })();
