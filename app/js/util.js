// Мелкие помощники: экранирование, форматирование, иконки, общие куски разметки.

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

/** 120000 → «120 000» */
export const num = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

export function salaryText(min, max) {
  if (!min && !max) return 'Зарплата по договорённости';
  if (min && max && min !== max) return `${num(min)} — ${num(max)} ₽`;
  return `от ${num(min || max)} ₽`;
}

export function expText(years) {
  const y = Number(years) || 0;
  if (y <= 0) return 'Без опыта';
  if (y <= 1) return 'До 1 года';
  if (y <= 3) return '1–3 года';
  if (y <= 6) return '3–6 лет';
  return 'Более 6 лет';
}

export function expBucket(years) {
  const y = Number(years) || 0;
  if (y <= 0) return 'no';
  if (y <= 1) return 'lt1';
  if (y <= 5) return '1-5';
  return 'gt5';
}

/** «19 августа» */
export function ruDate(iso) {
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d)) return '';
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function timeHM(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/** Стабильный «псевдослучайный» 0..1 из строки — чтобы цифры не прыгали при перерисовке. */
export function seeded(str, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function pickBy(str, arr, salt = 0) {
  return arr[Math.floor(seeded(str, salt) * arr.length) % arr.length];
}

/** Цвет логотипа компании — детерминированный по названию. */
export function logoColor(name) {
  const palette = ['#EF3124', '#1F68EB', '#6D3BF0', '#0F9D58', '#E8890C', '#0E7490', '#B5179E', '#2B3A67'];
  return pickBy(name, palette, 7);
}

export function initials(name) {
  const clean = String(name).replace(/^(ООО|АО|ПАО|ЗАО|ИП|ОАО|ФГБУ|ГАУ|МБУ|ГБУ)\s+/i, '').trim();
  const words = clean.split(/[\s-]+/).filter(Boolean);
  return ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase() || 'К';
}

// ── Иконки ────────────────────────────────────────────────────────────────
export const ico = {
  person: '<svg viewBox="0 0 24 24"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4 0-8 2-8 4.6V21h16v-2.4c0-2.6-4-4.6-8-4.6Z"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 5-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevD: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 9 7 7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" stroke-linecap="round"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="#1B1B1B"><path d="M3 3h7v2H5v3H3V3Zm11 0h7v5h-2V5h-5V3ZM3 16h2v3h5v2H3v-5Zm16 0h2v5h-7v-2h5v-3Z"/><rect x="7" y="7" width="4" height="4" rx="1"/><rect x="13" y="7" width="4" height="4" rx="1"/><rect x="7" y="13" width="4" height="4" rx="1"/><rect x="13" y="13" width="2" height="2" rx=".5"/><rect x="16" y="16" width="1.6" height="1.6" rx=".4"/></svg>',
  nfc: '<svg viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" stroke-width="2" stroke-linecap="round"><path d="M7 8a6 6 0 0 1 0 8M11 5.5a10 10 0 0 1 0 13M15 3a14 14 0 0 1 0 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.1-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.9 12 21 12 21Z"/></svg>',
  heartO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20.4S4.8 15.7 4.8 10.8A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.2 3.2c0 4.9-7.2 9.6-7.2 9.6Z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9h-6v-5h-4v5H4v-9Z"/></svg>',
  pay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="12" r="2.6"/><path d="M9 12h6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 9.4V7h-2v6.4l4.2 2.5 1-1.7-3.2-1.8Z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M3 5h18v11H8l-5 4V5Zm3 3v2h12V8H6Zm0 4v2h8v-2H6Z"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="m3 20 18-8L3 4l3 8-3 8Z"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="#1B1B1B"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm9 3.5-2.1 1.2.4 2.4-2.2 1-1.7-1.7-2.3.8L12 18h-2.4l-1.1-2.3-2.3-.8L4.5 16l-2.2-1 .4-2.4L.6 11.4 2.7 10l-.4-2.4 2.2-1 1.7 1.7 2.3-.8L9.6 5H12l1.1 2.5 2.3.8L17.1 6l2.2 1-.4 2.4L21 12Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>',
  verified: '<svg viewBox="0 0 24 24"><path d="m12 2 2.4 1.8 3-.3 1 2.8 2.6 1.5-.9 2.9.9 2.9-2.6 1.5-1 2.8-3-.3L12 22l-2.4-1.8-3 .3-1-2.8-2.6-1.5.9-2.9-.9-2.9 2.6-1.5 1-2.8 3 .3L12 2Z" fill="#1F68EB"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="#B0B3B9"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z"/></svg>',
  arrowUpR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
};

// ── Общие куски разметки ──────────────────────────────────────────────────
export function statusBar(time = '15:15', battery = 85) {
  return `<div class="statusbar">
    <span>${time}</span>
    <span class="statusbar__right">
      <span class="statusbar__dots">••••</span>
      <svg width="17" height="13" viewBox="0 0 17 13" fill="#1B1B1B"><path d="M8.5 11.6 10.8 9a3.4 3.4 0 0 0-4.6 0l2.3 2.6ZM3.6 6.1a7.3 7.3 0 0 1 9.8 0l1.4-1.6a9.4 9.4 0 0 0-12.6 0l1.4 1.6Zm1.5 1.7 1.4 1.5a3.1 3.1 0 0 1 4 0l1.4-1.5a5.2 5.2 0 0 0-6.8 0Z"/></svg>
      <span class="statusbar__batt">${battery}</span>
    </span>
  </div>`;
}

export function homeIndicator() {
  return '<div class="home-indicator"></div>';
}

const TABS = [
  ['home', 'Главный', ico.home],
  ['payments', 'Платежи', ico.pay],
  ['benefit', 'Выгода', ico.heart],
  ['history', 'История', ico.clock],
  ['chats', 'Чаты', ico.chat],
];

export function tabbar(active, badges = {}) {
  return `<nav class="tabbar">${TABS.map(([id, label, svg]) => `
    <button class="tabbar__item ${id === active ? 'is-on' : ''}" data-tab="${id}">
      <span class="tabbar__ico">${svg}${badges[id] ? `<i class="tabbar__badge">${badges[id]}</i>` : ''}</span>
      <span>${label}</span>
    </button>`).join('')}</nav>`;
}

// ── Тост ──────────────────────────────────────────────────────────────────
let toastTimer;
export function toast(message, ms = 2200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), ms);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
