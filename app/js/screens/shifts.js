// «Альфа-Подработка» — разовые смены без оформления в штат.
//
// Сценарий отличается от поиска постоянной работы: человеку нужны деньги на
// этой неделе, а не карьера. Поэтому здесь нет резюме и откликов — есть
// календарь, ставка в час и выплата на карту сразу после смены.

import { ico, statusBar, homeIndicator, esc, toast, num, plural, seeded, logoColor, initials } from '../util.js';
import { art } from '../art.js';
import { store } from '../store.js';
import { nav } from '../router.js';
import { award } from '../gamify.js';

// Роли и ставки взяты по рынку разовых смен; работодатели — те же компании,
// чьи постоянные вакансии уже есть в сервисе.
const ROLES = [
  ['Сборщик заказов', 'Пятёрочка', 280, 'Собрать заказы онлайн-доставки по терминалу'],
  ['Продавец-кассир', 'Пятёрочка', 260, 'Касса и выкладка товара в зале'],
  ['Пекарь', 'Перекрёсток', 300, 'Выпечка по стандартам, витрина, чистота зоны'],
  ['Комплектовщик склада', 'X5 Group', 290, 'Комплектация паллет по заданию терминала'],
  ['Промоутер', 'Альфа-Банк', 350, 'Рассказать о продуктах банка у стойки в ТЦ'],
  ['Курьер пеший', 'Перекрёсток', 320, 'Доставка заказов в радиусе двух километров'],
  ['Грузчик', 'X5 Group', 330, 'Разгрузка машины, перемещение товара на склад'],
  ['Мерчендайзер', 'Пятёрочка', 280, 'Выкладка и контроль ценников по планограмме'],
  ['Оператор чата', 'Альфа-Банк', 250, 'Ответы клиентам в чате, из дома'],
  ['Хостес на мероприятие', 'АльфаСтрахование', 340, 'Встреча гостей и регистрация на конференции'],
];

const SLOTS = [['08:00', '14:00'], ['09:00', '18:00'], ['10:00', '16:00'], ['12:00', '20:00'], ['14:00', '22:00'], ['18:00', '23:00']];

const STREETS = ['ул. Тверская, 12', 'Ленинский пр-т, 45', 'ул. Профсоюзная, 78', 'Каширское ш., 14',
  'ул. Академика Королёва, 8', 'Варшавское ш., 118', 'ул. Мясницкая, 24', 'пр-т Мира, 102'];
const METRO = ['Тверская', 'Академическая', 'Профсоюзная', 'Каширская', 'ВДНХ', 'Нагатинская', 'Чистые пруды', 'Алексеевская'];

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const hoursBetween = (a, b) => {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return Math.round(((bh * 60 + bm) - (ah * 60 + am)) / 60);
};

/** Смены на ближайшую неделю. Набор детерминированный — не прыгает при перерисовке. */
function buildShifts(city = 'Москва') {
  const out = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const key = date.toISOString().slice(0, 10);
    const count = 5 + Math.floor(seeded(key, 3) * 4);
    for (let i = 0; i < count; i++) {
      const id = `sh-${key}-${i}`;
      const [role, company, baseRate, what] = ROLES[Math.floor(seeded(id, 7) * ROLES.length)];
      const [from, to] = SLOTS[Math.floor(seeded(id, 11) * SLOTS.length)];
      const hours = hoursBetween(from, to);
      // ставка немного гуляет по конкретной смене — как на реальных площадках
      const rate = baseRate + Math.round(seeded(id, 13) * 6) * 10;
      const urgent = seeded(id, 17) > 0.82;
      out.push({
        id, dayKey: key, dayOffset: d,
        role, company, what,
        from, to, hours,
        rate: urgent ? rate + 50 : rate,
        total: (urgent ? rate + 50 : rate) * hours,
        address: `${city}, ${STREETS[Math.floor(seeded(id, 19) * STREETS.length)]}`,
        metro: METRO[Math.floor(seeded(id, 23) * METRO.length)],
        spots: 1 + Math.floor(seeded(id, 29) * 5),
        urgent,
        remote: role === 'Оператор чата',
      });
    }
  }
  return out;
}

let cache = null;
const allShifts = (city) => (cache ||= buildShifts(city));
export const getShift = (id) => allShifts().find((s) => s.id === id);

const dayLabel = (offset, date) =>
  offset === 0 ? 'Сегодня' : offset === 1 ? 'Завтра' : `${DAYS[date.getDay()]}, ${date.getDate()}`;

// ── Лента смен ────────────────────────────────────────────────────────────
function shifts(params = {}) {
  const s = store.get();
  const day = params.day ?? 0;
  const list = allShifts(s.user.city).filter((x) => x.dayOffset === day);
  const booked = new Set(s.myShifts.map((x) => x.id));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { i, label: dayLabel(i, d), count: allShifts().filter((x) => x.dayOffset === i).length };
  });

  const weekMoney = s.myShifts.reduce((a, b) => a + b.total, 0);

  const card = (x) => `
    <div class="shift pressable" data-go="shiftDetail" data-params='${JSON.stringify({ id: x.id })}'>
      <div class="shift__time">
        <b>${x.from}</b><span>${x.to}</span>
      </div>
      <div class="shift__body">
        <div class="shift__tags">
          ${x.urgent ? '<span class="tag tag--hot">Срочно · +50 ₽/час</span>' : ''}
          ${x.remote ? '<span class="tag">Из дома</span>' : `<span class="tag">м. ${esc(x.metro)}</span>`}
        </div>
        <div class="shift__role">${esc(x.role)}</div>
        <div class="shift__company">${esc(x.company)}</div>
        <div class="shift__pay">
          <b>${num(x.total)} ₽</b>
          <span>${x.hours} ${plural(x.hours, 'час', 'часа', 'часов')} · ${num(x.rate)} ₽/час</span>
        </div>
        ${booked.has(x.id)
          ? '<div class="shift__booked">✓ Вы записаны</div>'
          : `<div class="shift__spots">Осталось ${x.spots} ${plural(x.spots, 'место', 'места', 'мест')}</div>`}
      </div>
    </div>`;

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="navbar__title">Альфа-Подработка<small>${esc(s.user.city)}</small></div>
  <button class="icon-btn" data-go="myShifts">${art.clock}</button>
</div>
<div class="scroll">
  <div class="shift-hero">
    <span class="shift-hero__tag">Разовые смены</span>
    <div class="shift-hero__title">Работа на один день —<br>деньги в тот же вечер</div>
    <div class="shift-hero__sub">Без оформления в штат и без резюме. Выбираете смену, приходите, получаете на карту Альфа-Банка в течение двух часов после её окончания.</div>
    <div class="shift-hero__stats">
      <div><b>${num(s.myShifts.length)}</b><span>${plural(s.myShifts.length, 'смена', 'смены', 'смен')} у вас</span></div>
      <div><b>${num(weekMoney)} ₽</b><span>заработаете</span></div>
      <div><b>2 ч</b><span>до выплаты</span></div>
    </div>
  </div>

  <div class="chiprow" style="padding-top:14px">
    ${days.map((d) => `
      <button class="chip ${d.i === day ? 'chip--dark' : ''}" data-day="${d.i}">
        ${esc(d.label)} <span style="opacity:.5">${d.count}</span>
      </button>`).join('')}
  </div>

  <div class="result-count">${list.length} ${plural(list.length, 'смена', 'смены', 'смен')} на этот день</div>
  ${list.map(card).join('')}

  <div class="src-note">Смены — демонстрационные данные прототипа: работодатели настоящие, конкретные слоты сгенерированы.</div>
</div>
${homeIndicator()}`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-day]').forEach((b) =>
        b.addEventListener('click', () => nav.replace('shifts', { day: Number(b.dataset.day) })));
    },
  };
}

// ── Карточка смены ────────────────────────────────────────────────────────
function shiftDetail(params) {
  const x = getShift(params.id);
  if (!x) return { html: `${statusBar()}<div class="empty"><div class="empty__title">Смена не найдена</div></div>` };
  const booked = store.get().myShifts.some((b) => b.id === x.id);
  const d = new Date();
  d.setDate(d.getDate() + x.dayOffset);

  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button></div>
<div class="scroll">
  <div class="vd">
    <div class="vd__tags" style="margin:0 0 12px">
      ${x.urgent ? '<span class="tag tag--hot">Срочная смена</span>' : ''}
      <span class="tag tag--partner">Альфа-Подработка</span>
    </div>
    <div class="vd__title">${esc(x.role)}</div>
    <div class="vd__salary"><b>${num(x.total)} ₽</b> за смену · ${num(x.rate)} ₽ в час</div>

    <div class="vd__stats">
      <div class="vd__stat"><b>${d.getDate()} ${MONTHS[d.getMonth()]}</b><span>${dayLabel(x.dayOffset, d).toLowerCase()}</span></div>
      <div class="vd__stat"><b>${x.from}–${x.to}</b><span>${x.hours} ${plural(x.hours, 'час', 'часа', 'часов')}</span></div>
      <div class="vd__stat"><b>${x.spots}</b><span>${plural(x.spots, 'место', 'места', 'мест')}</span></div>
    </div>

    <h3>Работодатель</h3>
    <div class="vd__company pressable" data-go="company" data-params='${JSON.stringify({ name: x.company })}'>
      <div class="vd__logo" style="background:${logoColor(x.company)}">${esc(initials(x.company))}</div>
      <div style="flex:1 1 auto"><div class="vd__cname">${esc(x.company)}${ico.verified}</div>
      <div class="vd__crate">Проверенный работодатель сервиса</div></div>
      ${ico.chevR}
    </div>

    <h3>Что делать</h3>
    <p>${esc(x.what)}.</p>

    <h3>Где</h3>
    <p>${x.remote ? 'Из дома — нужен компьютер и стабильный интернет' : `${esc(x.address)}<br>м. ${esc(x.metro)}`}</p>

    <h3>Что нужно</h3>
    <ul>
      <li>Паспорт и СНИЛС</li>
      <li>Возраст от 18 лет</li>
      ${x.remote ? '<li>Компьютер и гарнитура</li>' : '<li>Удобная обувь, остальное выдадут на месте</li>'}
      <li>Медкнижка — если её нет, оформим за счёт работодателя</li>
    </ul>

    <div class="info-card" style="margin-top:16px">
      <span>${art.card}</span>
      <span>Деньги придут на вашу карту Альфа-Банка в течение двух часов после смены. Налог удерживается автоматически — вы оформлены как самозанятый.</span>
    </div>
  </div>
  <div style="height:12px"></div>
</div>
<div class="sticky-foot">
  ${booked
    ? '<button class="btn-ghost" id="cancel">Отменить запись</button>'
    : '<button class="btn-primary" id="book">Записаться на смену</button>'}
  <div class="legal">Записываясь, вы соглашаетесь с правилами сервиса и условиями самозанятости</div>
</div>`;

  return {
    html,
    mount(root) {
      root.querySelector('#book')?.addEventListener('click', () => {
        store.update((st) => ({ ...st, myShifts: [...st.myShifts, { ...x, bookedAt: Date.now() }] }));
        const r = award('shiftBooked');
        toast(`Вы записаны · +${r.points} баллов`);
        if (r.unlocked.length) setTimeout(() => toast(`Достижение: ${r.unlocked[0].title}`), 2400);
        nav.replace('shiftDone', { id: x.id });
      });
      root.querySelector('#cancel')?.addEventListener('click', () => {
        store.update((st) => ({ ...st, myShifts: st.myShifts.filter((b) => b.id !== x.id) }));
        toast('Запись отменена');
        nav.refresh();
      });
    },
  };
}

// ── Подтверждение записи ──────────────────────────────────────────────────
function shiftDone(params) {
  const x = getShift(params.id);
  const d = new Date();
  if (x) d.setDate(d.getDate() + x.dayOffset);

  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.close}</button></div>
<div class="scroll">
  <div class="vcv-hero" style="padding-top:26px">
    <div class="vcv-hero__emoji">${art.clock}</div>
    <div class="vcv-hero__title">Смена ваша</div>
    <div class="vcv-hero__text">${x ? `${esc(x.role)} · ${d.getDate()} ${MONTHS[d.getMonth()]}, ${x.from}–${x.to}` : ''}</div>
  </div>
  <div class="vcv-steps">
    <div class="vcv-step"><div class="vcv-step__n">1</div><div>
      <div class="vcv-step__t">Напомним за день и за час</div>
      <div class="vcv-step__s">Push придёт в это же приложение</div></div></div>
    <div class="vcv-step"><div class="vcv-step__n">2</div><div>
      <div class="vcv-step__t">Отметьтесь по QR на месте</div>
      <div class="vcv-step__s">Код покажет администратор смены</div></div></div>
    <div class="vcv-step"><div class="vcv-step__n">3</div><div>
      <div class="vcv-step__t">Деньги на карту через 2 часа</div>
      <div class="vcv-step__s">${x ? num(x.total) + ' ₽ ' : ''}придут автоматически, без заявлений</div></div></div>
  </div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" data-go="myShifts">Мои смены</button>
  <div class="legal"><u data-go="back">Вернуться к списку смен</u></div>
</div>`;
  return { html };
}

// ── Мои смены ─────────────────────────────────────────────────────────────
function myShifts() {
  const s = store.get();
  const list = [...s.myShifts].sort((a, b) => a.dayOffset - b.dayOffset);
  const total = list.reduce((a, b) => a + b.total, 0);

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="navbar__title">Мои смены</div>
</div>
<div class="scroll">
  ${list.length ? `
    <div class="balance-card" style="margin-bottom:14px">
      <div class="balance-card__top">
        <div class="balance-card__label">Заработаете за неделю</div>
        <div class="balance-card__val">${num(total)} ₽</div>
      </div>
      <div class="balance-card__strip"><span>Выплата на карту •• 7712 после каждой смены</span>${ico.chevR}</div>
    </div>
    ${list.map((x) => {
      const d = new Date(); d.setDate(d.getDate() + x.dayOffset);
      return `<div class="shift pressable" data-go="shiftDetail" data-params='${JSON.stringify({ id: x.id })}'>
        <div class="shift__time"><b>${x.from}</b><span>${x.to}</span></div>
        <div class="shift__body">
          <div class="shift__tags"><span class="tag">${d.getDate()} ${MONTHS[d.getMonth()]}</span>
            <span class="tag tag--match">Записаны</span></div>
          <div class="shift__role">${esc(x.role)}</div>
          <div class="shift__company">${esc(x.company)}</div>
          <div class="shift__pay"><b>${num(x.total)} ₽</b><span>${x.hours} ${plural(x.hours, 'час', 'часа', 'часов')}</span></div>
        </div>
      </div>`;
    }).join('')}
  ` : `
    <div class="empty">
      <div class="empty__emoji">${art.clock}</div>
      <div class="empty__title">Смен пока нет</div>
      <div class="empty__text">Выберите смену в календаре — записаться можно за пару минут, резюме не нужно</div>
    </div>`}
</div>
${list.length ? '' : '<div class="sticky-foot"><button class="btn-primary" data-go="shifts">Выбрать смену</button></div>'}
${homeIndicator()}`;

  return { html };
}

export const shiftScreens = { shifts, shiftDetail, shiftDone, myShifts };
