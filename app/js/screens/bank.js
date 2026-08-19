// Экраны приложения Альфа-Банка: Главный, Платежи, Выгода, История, Чаты.
// Разметка собрана по скриншотам из папки «Screen of design/Alfa Mobile app».

import { ico, statusBar, tabbar, homeIndicator, esc, toast, ruDate, timeHM } from '../util.js';
import { art, bigNumber } from '../art.js';
import { store } from '../store.js';
import { nav } from '../router.js';

// ── Общее ─────────────────────────────────────────────────────────────────
const badges = () => {
  const u = store.unreadTotal();
  return u ? { chats: u } : {};
};

function compactHead() {
  return `<div class="bank-head" id="headCompact" style="display:none">
    <div class="avatar" data-go="profile">${ico.person}</div>
    <div class="bank-head__spacer"></div>
    <button class="icon-btn">${ico.search}</button>
    <button class="icon-btn">${ico.qr}</button>
    <button class="icon-btn">${ico.nfc}</button>
  </div>`;
}

// ── Главный ───────────────────────────────────────────────────────────────
function home() {
  const s = store.get();

  const stories = [
    [art.plane, 'Кэшбэк до 100%', '#1F68EB', '#fff'],
    [art.speech, '500 ₽ за добрые слова', '#E9E4FF', '#1B1B1B'],
    [art.leaf, 'Кэшбэк до 100% в Азбуке вкуса', '#7B2FF7', '#fff'],
    [art.gift, 'Приветственный бонус', '#FFE9E7', '#1B1B1B'],
  ];

  const transfers = [
    [art.phoneOut, 'По номеру телефона'],
    [art.globe, 'За рубеж'],
    [art.person, 'Себе'],
    ['ЕА', 'Екатерина Аркадьевн…'],
    ['ЕВ', 'Екатерина Валериевн…'],
  ];

  const recommend = [
    ['Пригласите и заработайте', 'Платим за каждого друга', '#E5D9FF', art.handshake],
    ['2500 ₽ за кредитку', '', '#B8F5EF', art.card],
    ['500 ₽ за Иностранца', '', '#E5D9FF', art.wifi],
    ['5000 ₽ за бизнес-счёт', '', '#EFE4FF', art.folder],
  ];

  const credits = [
    ['Получите деньги', 'На выгодных условиях', '#C3D7FA', ''],
    ['Наличными', 'До 7,5 млн ₽ быстро', '#F1F2F4', art.wallet],
    ['Кредитная карта', 'За 5 минут', '#F1F2F4', art.card],
  ];

  const profit = [
    ['Забирайте весь кэшбэк', 'А ещё скидки и промокоды', '#FBD3BC', ''],
    ['Ого, вот это кэшбэк', '', '#EF3124', art.percent],
    ['Суперкэшбэк до 100%', '', '#1F68EB', art.alfaA],
  ];

  const services = [
    ['work', art.briefcase, 'Работа', 'новое'],
    ['ins', art.umbrella, 'Страховки', 'до 10%'],
    ['travel', art.plane, 'Тревел', 'до 10%'],
    ['fuel', art.droplet, 'Заправки', 'до 3%'],
    ['afisha', art.ticket, 'Афиша', 'до 5%'],
    ['sim', art.phone, 'Связь', 'до 10%'],
  ];

  const partners = [
    [art.burger, '«Вкусно…', 'до 100%', '#1B4332'],
    [art.bag, 'Авито', 'до 100%', '#fff'],
    [art.leaf, 'Азбука вк…', 'до 100%', '#123524'],
    [art.store, 'Магнит Д…', 'до 35%', '#F1F2F4'],
    [art.cart, 'Пятёрочка', 'до 20%', '#0E7C3F'],
  ];

  const travel = [
    ['Отдыхайте с выгодой', 'Билеты, туры, отели', '#C9BEFF', ''],
    ['Суперкэшбэк на поездки', '', '#1F68EB', art.plane],
    ['Мои поездки', 'История и управление', '#F1F2F4', art.suitcase],
  ];

  const insurance = [
    ['Не рискуйте', 'Защитите себя и своё имущество', '#FBC7C2', ''],
    ['−20% и кэшбэк', 'На полис в поездку', '#F1F2F4', art.suitcase],
    ['Защита карты', 'От мошенников', '#F1F2F4', art.shield],
  ];

  const invest = [
    ['Заработайте больше', 'Инвестиции от 100 ₽', '#B9F08A', ''],
    ['Дарим 7000 ₽', 'Инвесткопилка', '#7B2FF7', art.gift],
    ['Цифровые активы', 'Инвестиции будущего', '#9FEDE4', art.crystal],
  ];

  const newProduct = [
    ['Карты, счета и сервисы', 'На лучших условиях', '#DCC9FF', ''],
    ['Накопить', 'Стабильный доход', '#F1F2F4', art.safe],
    ['Взять кредит', 'На любые цели', '#F1F2F4', art.bolt],
  ];

  const tile = ([title, sub, bg, emoji]) => `
    <div class="tile pressable" style="background:${bg};${bg === '#EF3124' || bg === '#1F68EB' || bg === '#7B2FF7' ? 'color:#fff' : ''}">
      <h3>${esc(title)}</h3>${sub ? `<p style="${bg === '#EF3124' || bg === '#1F68EB' || bg === '#7B2FF7' ? 'color:rgba(255,255,255,.75)' : ''}">${esc(sub)}</p>` : ''}
      ${emoji ? `<div class="tile__emoji">${emoji}</div>` : ''}
    </div>`;

  const section = (title, items) => `
    <div class="sec-head"><h2>${title}</h2>${ico.chevR}</div>
    <div class="rail">${items.map(tile).join('')}</div>`;

  const html = `
${statusBar()}
${compactHead()}
<div class="scroll" id="homeScroll">
  <div class="bank-head" id="headFull">
    <div class="avatar" data-go="profile">${ico.person}</div>
    <div class="bank-head__name" data-go="profile">${esc(s.user.name)} ${ico.chevR}</div>
    <div class="bank-head__spacer"></div>
    <button class="pill-money">${art.money} К деньгам</button>
  </div>

  <div class="acct">
    <div>
      <div class="acct__label">Текущий счёт</div>
      <div class="acct__sum">214 380,50 ₽</div>
    </div>
    <div class="acct__spacer"></div>
    <div class="mini-card"><span class="mini-card__a">А</span><span class="mini-card__num">7712</span><span class="mini-card__ps">МИР</span></div>
  </div>

  <div class="acct">
    <div>
      <div class="acct__label">Текущий счёт BYN</div>
      <div class="acct__sum">0 BYN</div>
    </div>
    <div class="acct__spacer"></div>
    <div class="mini-card"><span class="mini-card__a">А</span><span class="mini-card__cloud">${art.cloud}</span><span class="mini-card__num">3908</span><span class="mini-card__ps">МИР</span></div>
  </div>

  <div class="promo-acct">
    <div class="promo-acct__top">
      <div>
        <div class="promo-acct__label">+1 категория кэшбэка</div>
        <div class="promo-acct__title">С Альфа-Смарт</div>
      </div>
      <div class="acct__spacer"></div>
      <div class="promo-acct__x">${ico.close}</div>
    </div>
    <div class="promo-acct__strip">И выше ставка по накоплениям</div>
  </div>
  <div class="stack-hint"></div>

  <div class="chevron-down">${ico.chevD}</div>

  <div class="searchrow">
    <div class="searchfield">${ico.search}<span>Поиск</span></div>
    <button class="icon-btn">${ico.qr}</button>
    <button class="icon-btn">${ico.nfc}</button>
  </div>

  <div class="chiprow">
    <button class="chip chip--blue">${ico.plus} Новый продукт</button>
    <button class="chip">Платёжный стикер</button>
    <button class="chip">Автоплатежи</button>
  </div>

  <!-- Баннер нового продукта: Альфа-Работа -->
  <div class="hero-banner pressable" data-go="rabota">
    <div>
      <span class="hero-banner__tag">Новый сервис</span>
      <div class="hero-banner__title">Альфа-Работа</div>
      <div class="hero-banner__sub">Работа рядом — там же, где ваша зарплата. Отклик в два касания, ответ работодателя в чате.</div>
    </div>
    <button class="hero-banner__cta" data-go="rabota">Найти работу</button>
    <div class="hero-banner__emoji">${art.briefcase}</div>
  </div>

  <div class="rail" style="padding-top:14px">
    ${stories.map(([e, cap, bg, fg]) => `
      <div class="story pressable" style="background:${bg}">
        <div class="story__art">${e}</div>
        <div class="story__cap" style="background:#fff;color:#1B1B1B">${esc(cap)}</div>
      </div>`).join('')}
  </div>

  <div class="sec-head"><h2>Быстрые переводы</h2>${ico.chevR}</div>
  <div class="rail">
    ${transfers.map(([e, name], i) => `
      <div class="transfer pressable">
        <div class="transfer__circle" style="${i > 2 ? `background:${i === 3 ? '#FDE9E7;color:#EF3124' : '#FFF0DC;color:#E8890C'};font-size:22px;font-weight:700` : ''}">${e}</div>
        <div class="transfer__name">${esc(name)}</div>
      </div>`).join('')}
  </div>

  ${section('Деньги за рекомендации', recommend)}
  ${section('Кредиты', credits)}
  ${section('Альфа-Выгодно', profit)}

  <div class="services" style="padding-top:18px">
    ${services.map(([id, e, name, rate]) => `
      <button class="service pressable ${id === 'work' ? 'service--work' : ''}" data-service="${id}">
        <span class="service__tile">${e}${id === 'work' ? '<i class="service__new">NEW</i>' : ''}</span>
        <span class="service__name">${esc(name)}</span><br>
        <span class="service__rate" style="${id === 'work' ? 'color:#EF3124;font-weight:600' : ''}">${esc(rate)}</span>
      </button>`).join('')}
  </div>

  <div class="sec-head"><h2>Лучший кэшбэк от партнёров</h2>${ico.chevR}</div>
  <div class="rail">
    ${partners.map(([e, name, rate, bg]) => `
      <div class="transfer pressable">
        <div class="transfer__circle" style="background:${bg};border-radius:24px;width:72px;height:72px">${e}</div>
        <div class="transfer__name">${esc(name)}<br><span style="color:var(--ink-2)">${esc(rate)}</span></div>
      </div>`).join('')}
  </div>

  ${section('Альфа-Тревел', travel)}
  ${section('Страхование', insurance)}
  ${section('Инвестиции', invest)}
  ${section('Новый продукт', newProduct)}

  <div class="src-note">Прототип. Данные счетов и предложений — демонстрационные.</div>
</div>
${tabbar('home', badges())}
${homeIndicator()}`;

  return {
    html,
    mount(root) {
      // Шапка схлопывается при прокрутке — как в приложении
      const sc = root.querySelector('#homeScroll');
      const full = root.querySelector('#headFull');
      const compact = root.querySelector('#headCompact');
      const onScroll = () => {
        const collapsed = sc.scrollTop > 96;
        compact.style.display = collapsed ? '' : 'none';
        full.style.opacity = collapsed ? '0' : '1';
      };
      sc.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      root.querySelectorAll('[data-service]').forEach((el) => {
        el.addEventListener('click', () => {
          if (el.dataset.service === 'work') nav.go('rabota');
          else toast('Раздел вне рамок прототипа');
        });
      });
      root.querySelectorAll('.story, .tile, .transfer, .chip, .pill-money, .acct, .promo-acct').forEach((el) => {
        if (el.closest('[data-go]')) return;
        el.addEventListener('click', () => toast('Экран вне рамок прототипа'));
      });
    },
  };
}

// ── Платежи ───────────────────────────────────────────────────────────────
function payments() {
  const grid = [
    [art.phone, 'Мобильная связь'], [art.home, 'ЖКХ'], [art.wifi, 'Интернет'], [art.car, 'Штрафы'],
    [art.bank, 'Налоги'], [art.tv, 'ТВ'], [art.edu, 'Образование'], [art.parking, 'Парковка'],
  ];
  const html = `
${statusBar()}
<div class="bank-head">
  <div class="avatar" data-go="profile">${ico.person}</div>
  <div class="bank-head__name">Платежи</div>
  <div class="bank-head__spacer"></div>
  <button class="icon-btn">${ico.qr}</button>
</div>
<div class="scroll">
  <div class="searchrow"><div class="searchfield">${ico.search}<span>Поиск по услугам</span></div></div>
  <div class="blockcard">
    <div class="blockrow"><div class="blockrow__ico">${art.phoneOut}</div><div class="blockrow__body">
      <div class="blockrow__title">По номеру телефона</div><div class="blockrow__sub">В Альфа-Банк и другие банки</div></div>${`<svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg>`}</div>
    <div class="blockrow"><div class="blockrow__ico">${art.card}</div><div class="blockrow__body">
      <div class="blockrow__title">По номеру карты</div><div class="blockrow__sub">Между своими и чужими картами</div></div><svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg></div>
    <div class="blockrow"><div class="blockrow__ico">${art.receipt}</div><div class="blockrow__body">
      <div class="blockrow__title">По реквизитам</div><div class="blockrow__sub">Юрлицам и ИП</div></div><svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg></div>
  </div>
  <div class="sec-head"><h2>Оплата услуг</h2></div>
  <div class="paygrid">
    ${grid.map(([e, n]) => `<div class="paygrid__item pressable"><div class="paygrid__tile">${e}</div><div class="paygrid__name">${esc(n)}</div></div>`).join('')}
  </div>
  <div class="sec-head"><h2>Зарплата и доходы</h2></div>
  <div class="blockcard">
    <div class="blockrow" data-go="rabota"><div class="blockrow__ico" style="background:#FDE9E7">${art.briefcase}</div><div class="blockrow__body">
      <div class="blockrow__title">Альфа-Работа</div><div class="blockrow__sub">Найти работу с зарплатой на карту Альфа-Банка</div></div><svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg></div>
    <div class="blockrow"><div class="blockrow__ico">${art.chartUp}</div><div class="blockrow__body">
      <div class="blockrow__title">Зарплатный проект</div><div class="blockrow__sub">Для работодателей</div></div><svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg></div>
  </div>
  <div style="height:20px"></div>
</div>
${tabbar('payments', badges())}
${homeIndicator()}`;
  return {
    html,
    mount(root) {
      root.querySelectorAll('.paygrid__item, .searchfield').forEach((el) =>
        el.addEventListener('click', () => toast('Экран вне рамок прототипа')));
      root.querySelectorAll('.blockrow').forEach((el) => {
        if (!el.dataset.go) el.addEventListener('click', () => toast('Экран вне рамок прототипа'));
      });
    },
  };
}

// ── Выгода ────────────────────────────────────────────────────────────────
function benefit(params = {}) {
  const tab = params.tab || 'all';
  const segs = [['all', 'Всё'], ['offers', 'Предложения'], ['cashback', 'Кэшбэк и сервисы'], ['money', 'Деньги вам']];

  const services = [
    ['work', art.briefcase, 'Работа', 'новое'],
    ['ins', art.umbrella, 'Страховки', 'до 10%'],
    ['travel', art.plane, 'Тревел', 'до 10%'],
    ['fuel', art.droplet, 'Заправки', 'до 3%'],
    ['afisha', art.ticket, 'Афиша', 'до 5%'],
    ['sim', art.phone, 'Связь', 'до 10%'],
  ];

  const html = `
${statusBar('15:17', 84)}
<div class="bank-head">
  <div class="avatar" data-go="profile">${ico.person}</div>
  <div class="bank-head__name">Выгода</div>
  <div class="bank-head__spacer"></div>
  <button class="icon-btn">${ico.search}</button>
</div>
<div class="segs">
  ${segs.map(([id, label]) => `<button class="seg ${id === tab ? 'is-on' : ''}" data-seg="${id}">${label}</button>`).join('')}
</div>
<div class="scroll">
  <div class="rail" style="padding-bottom:8px">
    <div class="tile pressable" style="width:236px;min-height:184px;background:#1F68EB;color:#fff">
      <h3 style="font-size:20px">SELA: до 30% кэшбэка</h3>
      <p style="color:rgba(255,255,255,.8)">21 августа на покупки от 3000 ₽ в SELA и SELA Home</p>
      <div class="tile__emoji">${bigNumber('30', 'blueDeep')}</div>
    </div>
    <div class="tile pressable" style="width:236px;min-height:184px;background:#6AF12A">
      <h3 style="font-size:20px">+1 категория кэшбэка</h3>
      <p style="color:rgba(27,27,27,.6)">Переводите зарплату и повышайте ставку по накоплениям</p>
      <div class="tile__emoji">${art.heartGreen}</div>
    </div>
  </div>

  <div class="sec-head"><h2>Кэшбэк</h2></div>
  <div class="balance-card">
    <div class="balance-card__top">
      <div class="balance-card__label">Баланс ${ico.info}</div>
      <div class="balance-card__val">0 ₽</div>
    </div>
    <div class="balance-card__strip"><span>Начислим 10 сентября <b>162 ₽</b></span>${ico.chevR}</div>
  </div>
  <div class="info-card">
    <span style="font-size:26px">${art.smile}</span>
    <span>Кэшбэк от банка, доходы от накоплений и рекомендаций — в разделе Моя выгода</span>
    ${ico.chevR}
  </div>
  <div class="duo">
    <div class="duo__card pressable"><h3>Категории в августе</h3><div class="duo__art">${art.burger}</div></div>
    <div class="duo__card pressable" style="background:#C3D7FA"><h3>Получите суперкэшбэк</h3><p>В августе</p><div class="duo__art">${art.wheel}</div></div>
  </div>

  <div class="sec-head"><h2>Ещё больше выгоды</h2></div>
  <div class="duo" style="padding-top:0">
    <div class="duo__card pressable"><h3>Предложения партнёров</h3><div class="duo__art">${art.tag}</div></div>
    <div class="duo__card pressable"><h3>Лучший кэшбэк</h3><div class="duo__art">${art.bolt}</div></div>
  </div>

  <div class="info-card" style="margin-top:10px">
    <div style="flex:1 1 auto">
      <div style="font-size:18px;font-weight:700;letter-spacing:-.02em">Промокоды</div>
      <div style="color:var(--ink-2);margin-top:3px">Выгодные покупки в наших сервисах и не только</div>
    </div>
    <span style="font-size:34px">${art.ticket}</span>
  </div>

  <div class="services" style="padding-top:18px">
    ${services.map(([id, e, name, rate]) => `
      <button class="service pressable ${id === 'work' ? 'service--work' : ''}" data-service="${id}">
        <span class="service__tile">${e}${id === 'work' ? '<i class="service__new">NEW</i>' : ''}</span>
        <span class="service__name">${esc(name)}</span><br>
        <span class="service__rate" style="${id === 'work' ? 'color:#EF3124;font-weight:600' : ''}">${esc(rate)}</span>
      </button>`).join('')}
  </div>

  <div class="sec-head"><h2>Задания и награды</h2>${ico.chevR}</div>
  <div class="rail">
    <div class="tile pressable" style="width:280px;min-height:150px;background:#DCEDFF">
      <h3 style="font-size:30px;font-weight:800">3%</h3>
      <p style="color:#1B1B1B;font-size:16px">кэшбэка на красоту</p>
      <div style="margin-top:auto;display:flex;align-items:center;gap:10px">
        <span style="font-size:14px;color:var(--ink-2);flex:1 1 auto">За покупки на 20 000 ₽</span>
        <span style="background:#1B1B1B;color:#fff;padding:10px 18px;border-radius:100px;font-size:15px;font-weight:600">Начать</span>
      </div>
    </div>
    <div class="tile pressable" style="width:280px;min-height:150px;background:#FFF0DC">
      <h3 style="font-size:20px">Найдите работу — получите 3000 ₽</h3>
      <p>Выйдите на работу через Альфа-Работу и получите бонус</p>
      <div class="tile__emoji">${art.briefcase}</div>
    </div>
  </div>
  <div style="height:20px"></div>
</div>
${tabbar('benefit', badges())}
${homeIndicator()}`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-seg]').forEach((el) =>
        el.addEventListener('click', () => nav.replace('benefit', { tab: el.dataset.seg })));
      root.querySelectorAll('[data-service]').forEach((el) => {
        el.addEventListener('click', () => {
          if (el.dataset.service === 'work') nav.go('rabota');
          else toast('Раздел вне рамок прототипа');
        });
      });
      root.querySelectorAll('.tile, .duo__card, .info-card, .balance-card__strip').forEach((el) =>
        el.addEventListener('click', (e) => {
          if (el.textContent.includes('Альфа-Работу')) { nav.go('rabota'); return; }
          toast('Экран вне рамок прототипа');
        }));
    },
  };
}

// ── История ───────────────────────────────────────────────────────────────
function history() {
  const days = [
    ['Сегодня', [
      [art.coffee, 'Кофемания', 'Кафе и рестораны', '−540 ₽'],
      [art.taxi, 'Яндекс Go', 'Такси', '−389 ₽'],
      [art.cart, 'Пятёрочка', 'Супермаркеты', '−1 245,60 ₽'],
    ]],
    ['Вчера', [
      [art.briefcase, 'Альфа-Работа', 'Бонус за трудоустройство', '+3 000 ₽', true],
      [art.phone, 'МТС', 'Связь', '−650 ₽'],
      [art.clapper, 'Кинопоиск', 'Подписки', '−399 ₽'],
    ]],
    ['17 августа', [
      [art.bank, 'Перевод себе', 'Между счетами', '−15 000 ₽'],
      [art.money, 'Зарплата', 'ООО «Альфа-Пример»', '+142 500 ₽', true],
    ]],
  ];

  const html = `
${statusBar()}
<div class="bank-head">
  <div class="avatar" data-go="profile">${ico.person}</div>
  <div class="bank-head__name">История</div>
  <div class="bank-head__spacer"></div>
  <button class="icon-btn">${ico.search}</button>
</div>
<div class="scroll">
  <div class="chiprow" style="padding-top:4px">
    <button class="chip chip--blue">Все операции</button>
    <button class="chip">Расходы</button>
    <button class="chip">Поступления</button>
  </div>
  <div class="list">
    ${days.map(([label, items]) => `
      <div class="daylabel">${label}</div>
      ${items.map(([e, name, cat, sum, isIn]) => `
        <div class="txn pressable">
          <div class="txn__ico">${e}</div>
          <div class="txn__body"><div class="txn__name">${esc(name)}</div><div class="txn__cat">${esc(cat)}</div></div>
          <div class="txn__sum ${isIn ? 'txn__sum--in' : ''}">${esc(sum)}</div>
        </div>`).join('')}`).join('')}
  </div>
  <div style="height:20px"></div>
</div>
${tabbar('history', badges())}
${homeIndicator()}`;
  return {
    html,
    mount(root) {
      root.querySelectorAll('.txn, .chip').forEach((el) =>
        el.addEventListener('click', () => toast('Экран вне рамок прототипа')));
    },
  };
}

// ── Чаты ──────────────────────────────────────────────────────────────────
function chats() {
  const s = store.get();

  // Чаты по откликам из Альфа-Работы поднимаются наверх списка
  const workChats = s.responses
    .filter((r) => store.chat(r.id).length)
    .map((r) => {
      const msgs = store.chat(r.id);
      const last = msgs[msgs.length - 1];
      return `<div class="listitem pressable" data-go="chat" data-params='${JSON.stringify({ id: r.id })}'>
        <div class="listitem__ico" style="background:#FDE9E7">${art.briefcase}</div>
        <div class="listitem__body">
          <div class="listitem__row">
            <span class="listitem__name">${esc(r.vacancy.company)}</span>
            <span class="listitem__time">${timeHM(last.ts)}</span>
          </div>
          <div class="listitem__text">${esc(r.vacancy.title)}: ${esc(last.text)}</div>
        </div>
        ${r.unread ? `<span class="listitem__badge">${r.unread}</span>` : ''}
      </div>`;
    }).join('');

  const stock = [
    [art.bell, 'Уведомления', '15:08', 'Списание со счёта 4*7712; Перевод на сумму 900,00 RUB;…', '', '#FFF6E0'],
    [art.speech, 'Чат с банком', '14 мая', 'Комиссия за переводы через СБП:…', '', '#EF3124'],
    [art.folderTabs, 'Обращения в банк', '', 'Здесь можно подать обращение и посмотреть уже созданные', '', '#E4F0FF'],
    [art.star, 'Альфа-Выгодно', '10:41', 'Оплату за отель теперь можно ПОДЕЛИТЬ. Без коми…', '99+', '#F3E8FF'],
    [art.new, 'Что нового', '18 авг.', 'ААА — Альфа-Банк получил НАИВЫСШИЙ кредитный рейт…', '1', '#E8F5FF'],
    [art.chartUp, 'Про инвестиции', '17 авг.', 'Ви.ру: прибыль за первое полугодие выросла…', '1', '#FDE9E7'],
  ].map(([e, name, time, text, badge, bg]) => `
    <div class="listitem pressable">
      <div class="listitem__ico" style="background:${bg}">${e}</div>
      <div class="listitem__body">
        <div class="listitem__row"><span class="listitem__name">${esc(name)}</span><span class="listitem__time">${time}</span></div>
        <div class="listitem__text">${esc(text)}</div>
      </div>
      ${badge ? `<span class="listitem__badge ${badge === '99+' || badge === '1' ? 'listitem__badge--mute' : ''}">${badge}</span>` : ''}
    </div>`).join('');

  const html = `
${statusBar('15:21', 83)}
<div class="bank-head">
  <div class="avatar" data-go="profile">${ico.person}</div>
  <div class="bank-head__name">Чаты</div>
  <div class="bank-head__spacer"></div>
  <button class="icon-btn">${ico.gear}</button>
</div>
<div class="scroll">
  <div style="padding:0 var(--pad) 8px"><div class="searchfield">${ico.search}<span>Поиск по чатам</span></div></div>
  <div class="list">
    ${workChats}
    ${stock}
  </div>
  <div style="height:20px"></div>
</div>
${tabbar('chats', badges())}
${homeIndicator()}`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('.listitem').forEach((el) => {
        if (!el.dataset.go) el.addEventListener('click', () => toast('Чат вне рамок прототипа'));
      });
      root.querySelector('.searchfield')?.addEventListener('click', () => toast('Поиск вне рамок прототипа'));
    },
  };
}

// ── Профиль ───────────────────────────────────────────────────────────────
function profile() {
  const s = store.get();
  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Профиль</div></div>
<div class="scroll">
  <div style="text-align:center;padding:12px 0 22px">
    <div class="avatar" style="width:92px;height:92px;margin:0 auto 14px">${ico.person}</div>
    <div style="font-size:23px;font-weight:700;letter-spacing:-.02em">${esc(s.user.name)}</div>
    <div style="font-size:15px;color:var(--ink-2);margin-top:4px">+7 (999) ••• 12-34</div>
  </div>
  <div class="blockcard">
    <div class="blockrow" data-go="rabota"><div class="blockrow__ico" style="background:#FDE9E7">${art.briefcase}</div>
      <div class="blockrow__body"><div class="blockrow__title">Альфа-Работа</div>
      <div class="blockrow__sub">${s.responses.length ? `Откликов: ${s.responses.length}` : 'Резюме и отклики'}</div></div>
      <svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg></div>
    <div class="blockrow"><div class="blockrow__ico">${art.lock}</div><div class="blockrow__body"><div class="blockrow__title">Безопасность</div></div>
      <svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg></div>
    <div class="blockrow"><div class="blockrow__ico">${art.gear}</div><div class="blockrow__body"><div class="blockrow__title">Настройки</div></div>
      <svg class="blockrow__chev" viewBox="0 0 24 24" fill="none"><path d="m9 5 7 7-7 7" stroke-linecap="round"/></svg></div>
  </div>
</div>
${homeIndicator()}`;
  return {
    html,
    mount(root) {
      root.querySelectorAll('.blockrow').forEach((el) => {
        if (!el.dataset.go) el.addEventListener('click', () => toast('Экран вне рамок прототипа'));
      });
    },
  };
}

export const bankScreens = { home, payments, benefit, history, chats, profile };
