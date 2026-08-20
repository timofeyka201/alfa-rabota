// Состояние прототипа. Живёт в localStorage, чтобы демо переживало перезагрузку.

const KEY = 'alfa-rabota-demo-v1';

const initial = () => ({
  user: { name: 'Тимофей', city: 'Москва', role: 'Продакт-менеджер' },
  resumes: [],
  responses: [],   // { id, vacancyId, vacancy:{...}, status, createdAt, vcv, unread }
  chats: {},       // responseId -> [{ from:'me'|'hr'|'sys', text, ts, author }]
  favorites: [],
  filters: null,
  seenBanner: false,
  employerLead: false,
  myShifts: [],    // смены Альфа-Подработки, на которые записались
  game: {
    points: 0,        // текущий баланс карьерных баллов
    earned: 0,        // сколько накоплено за всё время — по нему считается уровень
    money: 0,         // выплачено рублями за достижения
    streak: 0,        // дней подряд
    lastVisit: null,  // YYYY-MM-DD последнего захода
    counters: {},     // действие → сколько раз сделано
    achievements: [], // выданные достижения
    rewards: [],      // забранные награды
    quests: { date: null, progress: {}, claimed: [] },
  },
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const base = initial();
    const saved = JSON.parse(raw);
    // game вложенный, поверхностного слияния мало: у сохранений прошлых
    // версий внутри него не хватает полей, и обращение к ним падает
    return {
      ...base, ...saved,
      game: { ...base.game, ...(saved.game || {}), quests: { ...base.game.quests, ...(saved.game?.quests || {}) } },
    };
  } catch {
    return initial();
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* приватный режим — просто работаем в памяти */ }
}

export const store = {
  get: () => state,

  update(patch) {
    state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
    persist();
    return state;
  },

  reset() {
    state = initial();
    persist();
  },

  // ── Резюме ──────────────────────────────────────────────────────────────
  addResume(resume) {
    const item = {
      id: 'r' + Date.now(),
      status: 'checking',
      createdAt: Date.now(),
      ...resume,
    };
    state.resumes = [item, ...state.resumes];
    persist();
    // «Проверка» резюме — через пару секунд оно становится активным
    setTimeout(() => {
      const r = state.resumes.find((x) => x.id === item.id);
      if (r) { r.status = 'ready'; persist(); }
    }, 6000);
    return item;
  },

  removeResume(id) {
    state.resumes = state.resumes.filter((r) => r.id !== id);
    persist();
  },

  // ── Отклики ─────────────────────────────────────────────────────────────
  hasResponse(vacancyId) {
    return state.responses.some((r) => r.vacancyId === vacancyId);
  },

  addResponse(data) {
    const item = {
      id: 'resp' + Date.now(),
      status: 'sent',
      createdAt: Date.now(),
      unread: 0,
      ...data,
    };
    state.responses = [item, ...state.responses];
    state.chats[item.id] = [];
    persist();
    return item;
  },

  updateResponse(id, patch) {
    const r = state.responses.find((x) => x.id === id);
    if (r) Object.assign(r, patch);
    persist();
    return r;
  },

  getResponse(id) {
    return state.responses.find((x) => x.id === id);
  },

  // ── Чат ─────────────────────────────────────────────────────────────────
  chat(responseId) {
    return state.chats[responseId] || [];
  },

  pushMessage(responseId, msg) {
    if (!state.chats[responseId]) state.chats[responseId] = [];
    state.chats[responseId].push({ ts: Date.now(), ...msg });
    persist();
  },

  unreadTotal() {
    return state.responses.reduce((sum, r) => sum + (r.unread || 0), 0);
  },

  // ── Избранное ───────────────────────────────────────────────────────────
  toggleFavorite(id) {
    const i = state.favorites.indexOf(id);
    if (i >= 0) state.favorites.splice(i, 1);
    else state.favorites.push(id);
    persist();
    return i < 0;
  },

  isFavorite: (id) => state.favorites.includes(id),
};
