"use strict";

/* 78 ключей — учебный курс Таро
   Полностью статичное приложение: без бэкенда, без сборки.
   Данные — markdown-конспекты в ./data, прогресс — в localStorage браузера. */

  // ---------- 1. Данные курса ----------

  const LESSONS = [
    { id: 1,  file: "data/urok-01.md", title: "Урок 1. Начало. Тузы" },
    { id: 2,  file: "data/urok-02.md", title: "Урок 2. Маг. Жрица. Двойки. Тройки" },
    { id: 3,  file: "data/urok-03.md", title: "Урок 3. Императрица. Император. Четвёрки" },
    { id: 4,  file: "data/urok-04.md", title: "Урок 4. Иерофант. Влюблённые. Пятёрки. Пажи" },
    { id: 5,  file: "data/urok-05.md", title: "Урок 5. Колесница. Правосудие. Шестёрки. Рыцари" },
    { id: 6,  file: "data/urok-06.md", title: "Урок 6. Отшельник. Колесо Фортуны. Семёрки" },
    { id: 7,  file: "data/urok-07.md", title: "Урок 7. Повешенный. Сила. Восьмёрки" },
    { id: 8,  file: "data/urok-08.md", title: "Урок 8. Смерть. Умеренность. Девятки" },
    { id: 9,  file: "data/urok-09.md", title: "Урок 9. Дьявол. Королевы" },
    { id: 10, file: "data/urok-10.md", title: "Урок 10. Башня. Звезда. Луна" },
    { id: 11, file: "data/urok-11.md", title: "Урок 11. Белая карта. Суд. Солнце. Десятки" },
    { id: 12, file: "data/urok-12.md", title: "Урок 12. Короли. Мир. Шут" },
  ];

  const SUITS = ["Жезлов", "Кубков", "Мечей", "Пентаклей"];
  const PIP_RANKS = [
    ["Туз", 1], ["Двойка", 2], ["Тройка", 2], ["Четвёрка", 3], ["Пятёрка", 4],
    ["Шестёрка", 5], ["Семёрка", 6], ["Восьмёрка", 7], ["Девятка", 8], ["Десятка", 11],
  ];
  const COURT_RANKS = [["Паж", 4], ["Рыцарь", 5], ["Королева", 9], ["Король", 12]];

  const MAJORS = [
    ["Шут", 12, ["ШУТ"]],
    ["Маг", 2, ["МАГ"]],
    ["Жрица", 2, ["ЖРИЦА"]],
    ["Императрица", 3, ["ИМПЕРАТРИЦА"]],
    ["Император", 3, ["ИМПЕРАТОР"]],
    ["Иерофант", 4, ["ИЕРОФАНТ"]],
    ["Влюблённые", 4, ["ВЛЮБЛЕННЫЕ", "ВЛЮБЛЁННЫЕ"]],
    ["Колесница", 5, ["КОЛЕСНИЦА"]],
    ["Правосудие", 5, ["ПРАВОСУДИЕ"]],
    ["Отшельник", 6, ["ОТШЕЛЬНИК"]],
    ["Колесо Фортуны", 6, ["КОЛЕСО ФОРТУНЫ", "ФОРТУНА"]],
    ["Повешенный", 7, ["ПОВЕШЕННЫЙ"]],
    ["Сила", 7, ["СИЛА"]],
    ["Смерть", 8, ["СМЕРТЬ"]],
    ["Умеренность", 8, ["УМЕРЕННОСТЬ"]],
    ["Дьявол", 9, ["ДЬЯВОЛ"]],
    ["Башня", 10, ["БАШНЯ"]],
    ["Звезда", 10, ["ЗВЕЗДА"]],
    ["Луна", 10, ["ЛУНА"]],
    ["Суд", 11, ["СУД"]],
    ["Солнце", 11, ["СОЛНЦЕ"]],
    ["Мир", 12, ["МИР"]],
    ["Белая карта", 11, ["БЕЛАЯ КАРТА", "БЛАНКА"]],
  ];

  function norm(s) {
    return s.toUpperCase().replace(/Ё/g, "Е").trim();
  }

  function buildCards() {
    const cards = [];
    MAJORS.forEach(([name, lesson, aliases]) => {
      cards.push({ name, lesson, group: "Старшие арканы", aliases });
    });
    PIP_RANKS.forEach(([rank, lesson]) => {
      SUITS.forEach((suit) => {
        const name = rank + " " + suit;
        cards.push({ name, lesson, group: rank, aliases: [norm(name)] });
      });
    });
    COURT_RANKS.forEach(([rank, lesson]) => {
      SUITS.forEach((suit) => {
        const name = rank + " " + suit;
        cards.push({ name, lesson, group: rank, aliases: [norm(name)] });
      });
    });
    return cards;
  }

  const CARDS = buildCards();

  const GROUPS = [
    "Старшие арканы", "Туз", "Двойка", "Тройка", "Четвёрка", "Пятёрка",
    "Шестёрка", "Семёрка", "Восьмёрка", "Девятка", "Десятка",
    "Паж", "Рыцарь", "Королева", "Король",
  ];

  // ---------- 2. Состояние ----------

  const state = {
    lessonText: new Map(),
    view: "lessons",
    currentLesson: null,
    deckFilter: "Все",
    deckQueue: [],
    deckIndex: 0,
    answerShown: false,
    searchTerm: "",
    highlight: null,
  };

  const PROGRESS_KEY = "tarot78_progress_v1";
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { lessonsRead: {}, cards: {} };
    } catch (e) {
      return { lessonsRead: {}, cards: {} };
    }
  }
  function saveProgress(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
  let progress = loadProgress();
