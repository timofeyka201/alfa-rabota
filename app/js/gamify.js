// «Альфа-Карьера» — программа прогресса соискателя.
//
// Зачем она в продукте: поиск работы — редкий сценарий, человек заходит раз
// в несколько дней и быстро отваливается. Баллы, стрик и ежедневные задания
// дают повод возвращаться, а награды завязаны на реальные деньги банка —
// кэшбэк и бонусы. Это же и есть бизнес-смысл: активный соискатель чаще
// открывает приложение банка, а вышедший на работу приносит зарплатный проект.

import { store } from './store.js';

const today = () => new Date().toISOString().slice(0, 10);

// ── За что начисляем ──────────────────────────────────────────────────────
export const ACTIONS = {
  visit:        { points: 5,   title: 'Заход в сервис' },
  resumeAdded:  { points: 50,  title: 'Резюме добавлено' },
  resumeBuilt:  { points: 80,  title: 'Резюме собрано по шаблону' },
  vacancyView:  { points: 2,   title: 'Просмотр вакансии' },
  favorite:     { points: 5,   title: 'Вакансия сохранена' },
  response:     { points: 25,  title: 'Отклик отправлен' },
  vcvDone:      { points: 100, title: 'VCV-скрининг пройден' },
  vcvHigh:      { points: 60,  title: 'VCV выше 75 баллов' },
  chatReply:    { points: 10,  title: 'Ответ работодателю' },
  invited:      { points: 150, title: 'Приглашение на встречу' },
  shiftBooked:  { points: 40,  title: 'Смена забронирована' },
  guideRead:    { points: 15,  title: 'Инструкция прочитана' },
};

// ── Уровни ────────────────────────────────────────────────────────────────
export const LEVELS = [
  { n: 1, name: 'Новичок',   from: 0,    perk: 'Доступ ко всем вакансиям сервиса' },
  { n: 2, name: 'Соискатель', from: 150,  perk: 'Отклик поднимается выше в списке работодателя' },
  { n: 3, name: 'Активный',  from: 400,  perk: '+1% кэшбэка в категории «Транспорт» на месяц' },
  { n: 4, name: 'Профи',     from: 900,  perk: 'Приоритетный отклик и метка «Проверенный кандидат»' },
  { n: 5, name: 'Эксперт',   from: 1800, perk: 'Персональный карьерный консультант банка' },
];

export function levelOf(earned) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (earned >= l.from) cur = l;
  const next = LEVELS.find((l) => l.from > earned) || null;
  const span = next ? next.from - cur.from : 1;
  const done = next ? earned - cur.from : span;
  return { ...cur, next, progress: Math.min(100, Math.round((done / span) * 100)), toNext: next ? next.from - earned : 0 };
}

// ── Достижения ────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: 'first-resume', title: 'Первое резюме',    hint: 'Добавьте резюме любым способом', art: 'doc',      check: (s) => s.resumes.length >= 1 },
  { id: 'first-apply',  title: 'Первый отклик',    hint: 'Откликнитесь на любую вакансию',  art: 'heartRed', check: (s) => s.responses.length >= 1 },
  { id: 'vcv-master',   title: 'Готов к разговору', hint: 'Пройдите VCV-скрининг',          art: 'camera',   check: (s) => s.responses.some((r) => r.vcv) },
  { id: 'vcv-ace',      title: 'Сильный кандидат', hint: 'Наберите 75+ баллов в VCV',       art: 'star',     check: (s) => s.responses.some((r) => (r.vcv?.total ?? 0) >= 75) },
  { id: 'five-apply',   title: 'Серия откликов',   hint: 'Отправьте 5 откликов',            art: 'bolt',     check: (s) => s.responses.length >= 5 },
  { id: 'invited',      title: 'Позвали на встречу', hint: 'Получите приглашение',          art: 'handshake', check: (s) => s.responses.some((r) => r.status === 'invited') },
  { id: 'streak-3',     title: 'Три дня подряд',   hint: 'Заходите 3 дня подряд',           art: 'bell',     check: (s) => s.game.streak >= 3 },
  { id: 'streak-7',     title: 'Неделя в деле',    hint: 'Заходите 7 дней подряд',          art: 'gift',     check: (s) => s.game.streak >= 7 },
  { id: 'shift',        title: 'Первая смена',     hint: 'Запишитесь на подработку',        art: 'clock',    check: (s) => s.myShifts.length >= 1 },
  { id: 'collector',    title: 'Есть из чего выбрать', hint: 'Сохраните 5 вакансий',        art: 'folder',   check: (s) => s.favorites.length >= 5 },
];

// ── Ежедневные задания ────────────────────────────────────────────────────
export const QUESTS = [
  { id: 'q-view',  title: 'Посмотрите 3 вакансии', goal: 3, action: 'vacancyView', reward: 30 },
  { id: 'q-apply', title: 'Отправьте отклик',      goal: 1, action: 'response',    reward: 60 },
  { id: 'q-fav',   title: 'Сохраните 2 вакансии',  goal: 2, action: 'favorite',    reward: 25 },
];

/** Сбрасывает прогресс заданий, если наступил новый день. */
function rollQuests(g) {
  if (g.quests.date !== today()) {
    g.quests = { date: today(), progress: {}, claimed: [] };
  }
}

export function questState() {
  const g = store.get().game;
  rollQuests(g);
  return QUESTS.map((q) => {
    const have = g.quests.progress[q.action] || 0;
    return { ...q, have: Math.min(have, q.goal), done: have >= q.goal, claimed: g.quests.claimed.includes(q.id) };
  });
}

export function claimQuest(id) {
  const q = questState().find((x) => x.id === id);
  if (!q || !q.done || q.claimed) return null;
  const g = store.get().game;
  g.quests.claimed.push(id);
  g.points += q.reward;
  g.earned += q.reward;
  store.update({});
  return q.reward;
}

// ── Награды: баллы меняются на деньги банка ───────────────────────────────
export const REWARDS = [
  { id: 'cb-1',    cost: 300,  title: '+1% кэшбэка на месяц',  sub: 'В категории на ваш выбор',        money: 0,    art: 'percent' },
  { id: 'bonus-500', cost: 600, title: '500 Альфа-бонусов',    sub: 'Списываются как рубли в партнёрах', money: 500, art: 'coin' },
  { id: 'sub-3',   cost: 900,  title: 'Альфа-Смарт на 3 месяца', sub: 'Подписка банка бесплатно',      money: 0,    art: 'sparkle' },
  { id: 'cash-1000', cost: 1200, title: '1 000 ₽ на карту',    sub: 'Зачисление в течение суток',      money: 1000, art: 'money' },
];

export function claimReward(id) {
  const r = REWARDS.find((x) => x.id === id);
  const g = store.get().game;
  if (!r || g.points < r.cost || g.rewards.includes(id)) return null;
  g.points -= r.cost;
  g.money += r.money;
  g.rewards.push(id);
  store.update({});
  return r;
}

// ── Начисление ────────────────────────────────────────────────────────────
/**
 * Начисляет баллы за действие и подтягивает всё, что от него зависит:
 * прогресс заданий и новые достижения.
 * @returns {{points:number, levelUp:object|null, unlocked:Array}}
 */
export function award(action, times = 1) {
  const cfg = ACTIONS[action];
  const s = store.get();
  const g = s.game;
  if (!cfg) return { points: 0, levelUp: null, unlocked: [] };

  rollQuests(g);
  const before = levelOf(g.earned);

  const gain = cfg.points * times;
  g.points += gain;
  g.earned += gain;
  g.counters[action] = (g.counters[action] || 0) + times;
  g.quests.progress[action] = (g.quests.progress[action] || 0) + times;

  const after = levelOf(g.earned);
  const levelUp = after.n > before.n ? after : null;

  const unlocked = ACHIEVEMENTS.filter((a) => !g.achievements.includes(a.id) && a.check(s));
  unlocked.forEach((a) => g.achievements.push(a.id));

  store.update({});
  return { points: gain, levelUp, unlocked };
}

/** Ежедневный заход: считает стрик и начисляет за возвращение. */
export function touchDaily() {
  const g = store.get().game;
  const t = today();
  if (g.lastVisit === t) { rollQuests(g); return { first: false, streak: g.streak }; }

  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  g.streak = g.lastVisit === yest ? g.streak + 1 : 1;
  g.lastVisit = t;
  store.update({});
  award('visit');
  return { first: true, streak: g.streak };
}

/** Календарь стрика на неделю: какие дни уже закрыты. */
export function streakDays() {
  const g = store.get().game;
  const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const now = new Date();
  const idx = (now.getDay() + 6) % 7; // понедельник первый
  return names.map((name, i) => ({
    name,
    done: i <= idx && (idx - i) < g.streak,
    isToday: i === idx,
  }));
}

export function achievementState() {
  const s = store.get();
  return ACHIEVEMENTS.map((a) => ({ ...a, got: s.game.achievements.includes(a.id) }));
}
