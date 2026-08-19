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
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    return { ...initial(), ...JSON.parse(raw) };
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
