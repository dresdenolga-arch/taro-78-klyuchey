  // ---------- 3. Загрузка markdown ----------

  async function loadAllLessons() {
    await Promise.all(
      LESSONS.map(async (l) => {
        try {
          const res = await fetch(l.file);
          if (!res.ok) throw new Error(String(res.status));
          state.lessonText.set(l.id, await res.text());
        } catch (e) {
          state.lessonText.set(l.id, "# " + l.title + "\n\n*Не удалось загрузить файл " + l.file + ". Если вы открыли index.html двойным щелчком — браузер блокирует локальную загрузку файлов. Разместите папку на любом хостинге (см. инструкцию) или запустите локальный сервер.*");
        }
      })
    );
  }

  // ---------- 4. Поиск карты в тексте урока ----------

  function findCardSection(mdText, card) {
    const lines = mdText.split("\n");
    const aliases = card.aliases && card.aliases.length ? card.aliases : [norm(card.name)];
    let start = -1, startLevel = 0;
    for (let i = 0; i < lines.length; i++) {
      const m = /^(#{1,2})\s+(.*)$/.exec(lines[i]);
      if (!m) continue;
      if (/^Конспект/i.test(m[2].trim())) continue;
      const headingNorm = norm(m[2]);
      if (aliases.some((a) => headingNorm.includes(a))) {
        start = i;
        startLevel = m[1].length;
        break;
      }
    }
    if (start === -1) return null;
    let end = lines.length;
    for (let j = start + 1; j < lines.length; j++) {
      const m = /^(#{1,2})\s+/.exec(lines[j]);
      if (m && m[1].length <= startLevel) { end = j; break; }
    }
    return lines.slice(start, end).join("\n").trim();
  }

  // ---------- 5. Рендер markdown ----------

  function renderMarkdown(md) {
    marked.setOptions({ breaks: false, gfm: true });
    return marked.parse(md);
  }

  function slugify(text) {
    return text
      .toString().toLowerCase().trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/(^-|-$)/g, "");
  }

  function walkAndHighlight(node, re) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        if (re.test(child.textContent)) {
          const span = document.createElement("span");
          span.innerHTML = child.textContent.replace(re, "<mark>$1</mark>");
          child.replaceWith(span);
        }
      } else if (child.nodeType === 1 && child.tagName !== "MARK") {
        walkAndHighlight(child, re);
      }
    });
  }

  function highlightText(html, term) {
    if (!term) return html;
    const re = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    walkAndHighlight(wrap, re);
    return wrap.innerHTML;
  }
