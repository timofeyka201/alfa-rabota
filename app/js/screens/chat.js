// Отклики и чат соискателя с работодателем.

import { ico, statusBar, homeIndicator, esc, toast, timeHM, ruDate, logoColor, initials, seeded, salaryText } from '../util.js';
import { art } from '../art.js';
import { store } from '../store.js';
import { nav } from '../router.js';

const STATUS = {
  sent: ['Отправлен', 'status--sent'],
  viewed: ['Просмотрен', 'status--view'],
  invited: ['Приглашение', 'status--invite'],
  rejected: ['Отказ', 'status--reject'],
};

const HR_NAMES = ['Анна Ковалёва', 'Дмитрий Резник', 'Марина Соболева', 'Игорь Панов', 'Ольга Тимченко'];
const hrName = (id) => HR_NAMES[Math.floor(seeded(id, 31) * HR_NAMES.length) % HR_NAMES.length];

// ── Имитация работодателя ─────────────────────────────────────────────────
const timers = new Map();

function push(respId, msg, { unread = true, status } = {}) {
  const resp = store.getResponse(respId);
  if (!resp) return;
  store.pushMessage(respId, msg);
  if (status) resp.status = status;
  const onScreen = nav.current() === 'chat';
  if (unread && !onScreen) resp.unread = (resp.unread || 0) + 1;
  store.update({});
  if (onScreen) nav.refresh();
}

/** Запускает сценарий ответов HR после отправки отклика. */
export function startEmployerReply(respId) {
  const resp = store.getResponse(respId);
  if (!resp || timers.has(respId)) return;

  const hr = hrName(respId);
  const good = (resp.vcv?.total ?? 60) >= 55;

  const script = [
    [5000, {
      from: 'sys',
      text: `Ваш отклик просмотрел работодатель${resp.vcv ? `. Результат VCV-скрининга — ${resp.vcv.total} из 100` : ''}`,
    }, 'viewed'],
    [11000, {
      from: 'hr', author: hr,
      text: `Здравствуйте, Тимофей! Меня зовут ${hr.split(' ')[0]}, я нанимающий менеджер в «${resp.vacancy.company}».\n\nПосмотрели ваш отклик${resp.vcv ? ' и видеоответы' : ''} — ${good ? 'выглядит интересно' : 'спасибо за подробные ответы'}. Расскажите, когда вам удобно созвониться на 20 минут?`,
    }, good ? 'invited' : 'viewed'],
  ];

  const ids = script.map(([delay, msg, status]) =>
    setTimeout(() => push(respId, msg, { status }), delay));
  timers.set(respId, ids);
}

/** Контекстный ответ HR на сообщение соискателя. */
function replyTo(respId, text) {
  const resp = store.getResponse(respId);
  const hr = hrName(respId);
  const t = text.toLowerCase();

  let answer;
  if (/(завтра|сегодня|понедельник|вторник|среда|четверг|пятниц|\d{1,2}[:.]\d{2}|утром|днём|вечером|удобно|созвон)/.test(t)) {
    answer = `Отлично, записал. Пришлю приглашение с ссылкой на встречу — оно придёт сюда же и в календарь.\n\nВстреча займёт 20–30 минут: обсудим опыт и ответим на ваши вопросы.`;
    resp.status = 'invited';
  } else if (/(зарплат|оклад|доход|вилк|деньг|сколько плат)/.test(t)) {
    answer = `По этой позиции вилка ${salaryText(resp.vacancy.salaryMin, resp.vacancy.salaryMax)} на руки до вычета налогов. Финальная цифра — по итогам встречи, плюс годовая премия.`;
  } else if (/(удал|офис|гибрид|график|из дома)/.test(t)) {
    answer = `Формат обсуждаемый: сейчас команда работает в гибриде, 2–3 дня в офисе. Полная удалёнка возможна для части ролей — обсудим на встрече.`;
  } else if (/(тест|задани|собесед|этап|как проход)/.test(t)) {
    answer = `Процесс короткий: созвон с нанимающим менеджером, затем встреча с командой. Тестовое не даём — вы уже прошли VCV-скрининг, этого достаточно.`;
  } else if (/(спасибо|хорошо|понял|ок|договорил)/.test(t)) {
    answer = `Спасибо! Тогда до связи. Если появятся вопросы — пишите прямо сюда, отвечаю в рабочее время.`;
  } else {
    answer = `Принял, спасибо. Уточню у команды и вернусь с ответом в течение дня. Если удобно, предложите пару слотов для короткого созвона.`;
  }

  setTimeout(() => push(respId, { from: 'hr', author: hr, text: answer }), 1600 + Math.random() * 1400);
}

// ── Список откликов ───────────────────────────────────────────────────────
function responses() {
  const s = store.get();

  const list = s.responses.length
    ? s.responses.map((r) => {
      const [label, cls] = STATUS[r.status] || STATUS.sent;
      const msgs = store.chat(r.id);
      const last = msgs[msgs.length - 1];
      return `<div class="resp pressable" data-go="chat" data-params='${JSON.stringify({ id: r.id })}'>
        <span class="status ${cls}">${label}</span>
        ${r.vcv ? `<span class="status status--invite" style="margin-left:6px">VCV ${r.vcv.total}/100</span>` : ''}
        <div class="resp__title">${esc(r.vacancy.title)}</div>
        <div class="resp__company">${esc(r.vacancy.company)}</div>
        <div class="resp__date">${ruDate(new Date(r.createdAt))} · резюме: ${esc(r.resumeName)}</div>
        ${last ? `<div class="resp__actions">
          <button class="resp__btn resp__btn--acc">Открыть чат${r.unread ? `<span class="resp__unread">${r.unread}</span>` : ''}</button>
        </div>` : ''}
      </div>`;
    }).join('')
    : `<div class="empty">
        <div class="empty__emoji">${art.heartYellow}</div>
        <div class="empty__title">Откликов пока нет</div>
        <div class="empty__text">Найдите вакансию и нажмите «Откликнуться» — здесь появится статус и чат с работодателем</div>
      </div>`;

  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Отклики</div></div>
<div class="scroll">
  ${list}
  ${s.responses.length ? '<div class="src-note">Ответы работодателей в прототипе имитируются: первое сообщение приходит через несколько секунд после отклика.</div>' : ''}
</div>
${s.responses.length ? '' : '<div class="sticky-foot"><button class="btn-primary" data-go="back">К вакансиям</button></div>'}
${homeIndicator()}`;

  return { html };
}

// ── Чат ───────────────────────────────────────────────────────────────────
function chat(params) {
  const r = store.getResponse(params.id);
  if (!r) return { html: '<div class="empty"><div class="empty__title">Отклик не найден</div></div>' };

  r.unread = 0;
  store.update({});

  const msgs = store.chat(r.id);
  const hr = hrName(r.id);

  const rendered = msgs.map((m, i) => {
    const prev = msgs[i - 1];
    const dayChanged = !prev || new Date(prev.ts).toDateString() !== new Date(m.ts).toDateString();
    const day = dayChanged ? `<div class="chat-day">${ruDate(new Date(m.ts))}</div>` : '';
    if (m.from === 'sys') return `${day}<div class="msg msg--sys">${esc(m.text)}</div>`;
    if (m.from === 'me') return `${day}<div class="msg msg--out">${esc(m.text)}<div class="msg__time">${timeHM(m.ts)} ✓✓</div></div>`;
    return `${day}<div class="msg msg--in">
      <div class="msg__author">${esc(m.author || hr)}</div>${esc(m.text)}
      <div class="msg__time" style="text-align:left">${timeHM(m.ts)}</div></div>`;
  }).join('');

  const quick = r.status === 'invited'
    ? ['Завтра после 15:00', 'В четверг утром', 'Какой формат работы?', 'Что по зарплате?']
    : ['Спасибо за ответ!', 'Какие следующие этапы?', 'Расскажите про команду', 'Возможна ли удалёнка?'];

  const html = `
${statusBar()}
<div class="chat-head">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="chat-head__logo" style="background:${logoColor(r.vacancy.company)}">${esc(initials(r.vacancy.company))}</div>
  <div style="flex:1 1 auto">
    <div class="chat-head__name">${esc(r.vacancy.company)}</div>
    <div class="chat-head__status">${hr} · онлайн</div>
  </div>
  <button class="navbar__btn" id="more">
    <svg viewBox="0 0 24 24" fill="#1B1B1B" stroke="none"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
  </button>
</div>

<div class="chat-pin" data-go="vacancy" data-params='${JSON.stringify({ id: r.vacancyId })}'>
  <div style="flex:1 1 auto">
    <div class="chat-pin__lbl">${STATUS[r.status]?.[0] || 'Отклик'} · ${r.vcv ? `VCV ${r.vcv.total}/100` : 'без скрининга'}</div>
    <div class="chat-pin__title">${esc(r.vacancy.title)}</div>
  </div>
  ${ico.chevR}
</div>

<div class="chat-body" id="body">${rendered}</div>

<div class="quick-replies">
  ${quick.map((q) => `<button class="quick-reply" data-quick="${esc(q)}">${esc(q)}</button>`).join('')}
</div>

<div class="chat-foot">
  <input id="msg" placeholder="Сообщение" autocomplete="off">
  <button class="chat-send" id="send">${ico.send}</button>
</div>
${homeIndicator()}`;

  return {
    html,
    mount(root) {
      const body = root.querySelector('#body');
      const input = root.querySelector('#msg');
      body.scrollTop = body.scrollHeight;

      const send = (text) => {
        const t = String(text || '').trim();
        if (!t) return;
        store.pushMessage(r.id, { from: 'me', text: t });
        input.value = '';
        nav.refresh();
        replyTo(r.id, t);
      };

      root.querySelector('#send').addEventListener('click', () => send(input.value));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(input.value); });
      root.querySelectorAll('[data-quick]').forEach((b) =>
        b.addEventListener('click', () => send(b.dataset.quick)));
      root.querySelector('#more').addEventListener('click', () => toast('Меню чата — заглушка прототипа'));
    },
  };
}

export const chatScreens = { responses, chat };
