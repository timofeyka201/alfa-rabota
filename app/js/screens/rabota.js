// Сервис «Альфа-Работа»: лента вакансий, фильтры, карточка вакансии,
// страница условий для работодателей.

import { ico, statusBar, homeIndicator, esc, toast, salaryText, expText, num, seeded, plural, logoColor, initials, ruDate } from '../util.js';
import { art, starMark } from '../art.js';
import { store } from '../store.js';
import { nav } from '../router.js';
import {
  ALFA_JOBS, PARTNER_JOBS, loadSnapshot, loadLive,
  FILTER_DEFS, emptyFilters, countActive, applyFilters, FORMAT_LABEL,
} from '../data.js';

// Кеш ленты партнёров на время сессии
let partnerFeed = null;
let feedState = 'idle'; // idle | loading | snapshot | live
let uiState = { tab: 'alfa', query: '' };

export function getJob(id) {
  return [...ALFA_JOBS, ...PARTNER_JOBS, ...(partnerFeed || [])].find((j) => j.id === id);
}

/** Псевдо-«совпадение по навыкам» — стабильное для конкретной вакансии. */
export const matchPct = (id) => 62 + Math.floor(seeded(id, 3) * 36);
const viewersNow = (id) => 3 + Math.floor(seeded(id, 11) * 48);

// ── Карточка вакансии в ленте ─────────────────────────────────────────────
export function vacancyCard(v, opts = {}) {
  const applied = store.hasResponse(v.id);
  const fav = store.isFavorite(v.id);
  const match = matchPct(v.id);
  const viewers = viewersNow(v.id);

  const tags = [];
  if (v.kind === 'alfa') tags.push('<span class="tag tag--alfa">Альфа-Банк</span>');
  else if (v.partner) tags.push('<span class="tag tag--partner">Партнёр Alfa Group</span>');
  tags.push(`<span class="tag">${expText(v.experience)}</span>`);
  if (v.format) tags.push(`<span class="tag">${FORMAT_LABEL[v.format] || ''}</span>`);
  if (match >= 85) tags.push(`<span class="tag tag--match">${art.thumb} Подходит на ${match}%</span>`);

  return `<div class="vac pressable" data-go="vacancy" data-params='${JSON.stringify({ id: v.id })}'>
    <div class="vac__tags">${tags.join('')}</div>
    <div class="vac__title">${esc(v.title)}</div>
    <div class="vac__company">${esc(v.company)}${v.kind === 'alfa' || v.partner ? ico.verified : ''}</div>
    ${v.desc ? `<div class="vac__desc">${esc(v.desc)}</div>` : ''}
    <div class="vac__salary">${salaryText(v.salaryMin, v.salaryMax)}</div>
    <div class="vac__meta">
      <span>${esc(v.city)}</span>
      <span class="vac__live">● ${viewers} ${plural(viewers, 'смотрит', 'смотрят', 'смотрят')} сейчас</span>
    </div>
    <div class="vac__foot" data-stop>
      ${applied
        ? '<span class="vac__applied">✓ Отклик отправлен</span>'
        : `<button class="btn-apply" data-apply="${v.id}">Откликнуться</button>`}
      <div style="flex:1 1 auto"></div>
      <button class="vac__fav ${fav ? 'is-on' : ''}" data-fav="${v.id}" aria-label="В избранное">${ico.heartO}</button>
    </div>
  </div>`;
}

// ── Баннер работодателям ──────────────────────────────────────────────────
const employerBanner = () => `
  <div class="empl-banner pressable" data-go="employer">
    <span class="empl-banner__tag">Реклама · Альфа-Банк</span>
    <div class="empl-banner__title">Вы работодатель? Тоже хотите разместиться на АльфаРабота?</div>
    <div class="empl-banner__sub">Размещение почти бесплатно для клиентов зарплатного проекта. Отклики уже с пройденным VCV-скринингом.</div>
    <span class="empl-banner__link">Читать условия подключения ${ico.arrowUpR}</span>
  </div>`;

// ── Главный экран сервиса ─────────────────────────────────────────────────
function rabota(params = {}) {
  if (params.tab) uiState.tab = params.tab;
  const s = store.get();
  const tab = uiState.tab;
  const filters = s.filters || emptyFilters();
  const activeCount = countActive(filters);

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.close}</button>
  <div class="navbar__title">Вакансии<small>${esc(s.user.city)}</small></div>
  <button class="icon-btn" data-go="rabotaProfile">${ico.edit}</button>
</div>

<div class="switch">
  <button class="switch__btn ${tab === 'alfa' ? 'is-on' : ''}" data-rtab="alfa">В Альфа-Банке</button>
  <button class="switch__btn ${tab === 'partners' ? 'is-on' : ''}" data-rtab="partners">У партнёров</button>
</div>

<div class="duo-nav">
  <button class="duo-nav__card pressable" data-go="responses">
    <span class="duo-nav__label">Отклики</span><span class="duo-nav__emoji">${art.heartRed}</span>
    ${s.responses.length ? `<span class="duo-nav__count">${s.responses.length}</span>` : ''}
  </button>
  <button class="duo-nav__card pressable" data-go="resumes">
    <span class="duo-nav__label">Резюме</span><span class="duo-nav__emoji">${art.folder}</span>
    ${s.resumes.length ? `<span class="duo-nav__count">${s.resumes.length}</span>` : ''}
  </button>
</div>

<div style="padding:0 var(--pad) 12px">
  <div class="searchfield">${ico.search}<input id="q" placeholder="Должность или компания" value="${esc(uiState.query)}"></div>
</div>

<div class="filterrow">
  <button class="fchip fchip--icon fchip--rel ${activeCount ? 'is-on' : ''}" data-go="filters">
    ${ico.filter}${activeCount ? `<i class="fchip__dot"></i>` : ''}
  </button>
  ${['track', 'exp', 'format', 'schedule'].map((k) => {
    const n = (filters[k] || []).length;
    return `<button class="fchip ${n ? 'is-on' : ''}" data-go="filters" data-params='${JSON.stringify({ focus: k })}'>
      ${FILTER_DEFS[k].label}${n ? ` · ${n}` : ''} ${ico.chevD}</button>`;
  }).join('')}
</div>

<div class="scroll" id="feed">
  <div class="loading"><div class="spinner"></div>Загружаем вакансии…</div>
</div>
${homeIndicator()}`;

  return {
    html,
    mount(root) {
      const feed = root.querySelector('#feed');

      root.querySelectorAll('[data-rtab]').forEach((el) =>
        el.addEventListener('click', () => {
          uiState.tab = el.dataset.rtab;
          nav.replace('rabota', {});
        }));

      const input = root.querySelector('#q');
      let t;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { uiState.query = input.value; draw(); }, 220);
      });

      function draw() {
        const base = tab === 'alfa'
          ? ALFA_JOBS
          : [...PARTNER_JOBS, ...(partnerFeed || [])];
        const list = applyFilters(base, filters, uiState.query);

        if (!list.length) {
          feed.innerHTML = `
            <div class="empty">
              <div class="empty__emoji">${art.search}</div>
              <div class="empty__title">Ничего не нашлось</div>
              <div class="empty__text">Попробуйте изменить фильтры или запрос</div>
            </div>
            ${employerBanner()}`;
          bind();
          return;
        }

        const cards = list.map((v, i) => {
          // Рекламный баннер работодателям — между вакансиями
          const banner = (i === 2 || (i > 0 && i % 12 === 0)) ? employerBanner() : '';
          return banner + vacancyCard(v);
        }).join('');

        const note = tab === 'partners'
          ? `<div class="src-note">${feedState === 'live'
              ? 'Вакансии партнёров загружены из открытого API «Работа России» (opendata.trudvsem.ru).'
              : 'Показан сохранённый срез API «Работа России». Живой запрос недоступен — работаем офлайн.'}</div>`
          : '<div class="src-note">Вакансии Альфа-Банка. Демонстрационные данные прототипа.</div>';

        feed.innerHTML = `<div class="result-count">${num(list.length)} ${plural(list.length, 'вакансия', 'вакансии', 'вакансий')}</div>${cards}${note}`;
        bind();
      }

      function bind() {
        feed.querySelectorAll('[data-apply]').forEach((btn) =>
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.go('apply', { id: btn.dataset.apply });
          }));
        feed.querySelectorAll('[data-fav]').forEach((btn) =>
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const on = store.toggleFavorite(btn.dataset.fav);
            btn.classList.toggle('is-on', on);
            toast(on ? 'Вакансия сохранена' : 'Убрали из сохранённых');
          }));
      }

      // Сначала мгновенно показываем снапшот, потом подтягиваем живые данные
      (async () => {
        if (!partnerFeed) {
          feedState = 'loading';
          partnerFeed = await loadSnapshot();
          feedState = 'snapshot';
          draw();
          const live = await loadLive(s.user.city, 60);
          if (live.length) {
            const ids = new Set(live.map((v) => v.id));
            partnerFeed = [...live, ...partnerFeed.filter((v) => !ids.has(v.id))];
            feedState = 'live';
            if (nav.current() === 'rabota') {
              // За время запроса экран могли перерисовать (например, переключили
              // вкладку) — тогда этот draw() писал бы в открепившийся от DOM узел.
              if (feed.isConnected) draw();
              else nav.refresh();
            }
          }
        } else {
          draw();
        }
      })();
    },
  };
}

// ── Фильтры ───────────────────────────────────────────────────────────────
function filters() {
  const draft = { ...emptyFilters(), ...(store.get().filters || {}) };

  const group = (key) => {
    const def = FILTER_DEFS[key];
    const opts = def.options.map((o) => (Array.isArray(o) ? o : [o, o]));
    return `<h3>${def.label}</h3>
      <div class="flt__wrap">
        ${opts.map(([val, label]) => `
          <button class="fchip ${draft[key].includes(val) ? 'is-on' : ''}" data-grp="${key}" data-val="${esc(val)}">${esc(label)}</button>`).join('')}
      </div>`;
  };

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back" style="width:auto;padding:0 6px;color:var(--red)">
    <span style="font-size:16px;color:var(--red);font-weight:500">Закрыть</span>
  </button>
  <div class="navbar__title" style="text-align:center;margin-right:64px">Фильтры</div>
</div>
<div class="scroll">
  <div class="flt">
    ${group('track')}
    ${group('exp')}
    ${group('level')}
    ${group('format')}
    ${group('schedule')}
    ${group('employment')}

    <h3>Доход от</h3>
    <div class="range">
      <input type="range" id="sal" min="0" max="400000" step="10000" value="${draft.salaryFrom}">
      <span class="range__val" id="salVal">${draft.salaryFrom ? num(draft.salaryFrom) + ' ₽' : 'любой'}</span>
    </div>

    <div class="flt__toggle" style="margin-top:14px">
      <span>Можно совмещать</span><button class="tgl ${draft.combine ? 'is-on' : ''}" data-tgl="combine"></button>
    </div>
    <div class="flt__toggle">
      <span>Без опыта</span><button class="tgl ${draft.noExperience ? 'is-on' : ''}" data-tgl="noExperience"></button>
    </div>
    <div class="flt__toggle">
      <span>Быстрый отклик</span><button class="tgl ${draft.fastResponse ? 'is-on' : ''}" data-tgl="fastResponse"></button>
    </div>
  </div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="applyF">Показать вакансии</button>
  <div class="legal"><u id="clearF">Сбросить все фильтры</u></div>
</div>`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-grp]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const { grp, val } = btn.dataset;
          const arr = draft[grp];
          const i = arr.indexOf(val);
          if (i >= 0) arr.splice(i, 1); else arr.push(val);
          btn.classList.toggle('is-on', i < 0);
        }));

      root.querySelectorAll('[data-tgl]').forEach((btn) =>
        btn.addEventListener('click', () => {
          draft[btn.dataset.tgl] = !draft[btn.dataset.tgl];
          btn.classList.toggle('is-on', draft[btn.dataset.tgl]);
        }));

      const sal = root.querySelector('#sal');
      const salVal = root.querySelector('#salVal');
      sal.addEventListener('input', () => {
        draft.salaryFrom = Number(sal.value);
        salVal.textContent = draft.salaryFrom ? num(draft.salaryFrom) + ' ₽' : 'любой';
      });

      root.querySelector('#applyF').addEventListener('click', () => {
        store.update({ filters: draft });
        nav.back();
      });
      root.querySelector('#clearF').addEventListener('click', () => {
        store.update({ filters: emptyFilters() });
        toast('Фильтры сброшены');
        nav.back();
      });
    },
  };
}

// ── Карточка вакансии ─────────────────────────────────────────────────────
function vacancy(params) {
  const v = getJob(params.id);
  if (!v) return { html: `<div class="empty"><div class="empty__title">Вакансия не найдена</div></div>` };

  const applied = store.hasResponse(v.id);
  const match = matchPct(v.id);
  const viewers = viewersNow(v.id);
  const similar = [...ALFA_JOBS, ...PARTNER_JOBS, ...(partnerFeed || [])]
    .filter((x) => x.id !== v.id && (x.track === v.track || x.kind === v.kind))
    .slice(0, 6);

  const bullets = (arr, text) => {
    if (arr?.length) return `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (!text) return '';
    const parts = String(text).split(/(?:;|\.\s+(?=[А-ЯЁ]))/).map((x) => x.trim()).filter((x) => x.length > 12);
    if (parts.length > 1) return `<ul>${parts.slice(0, 12).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `<p>${esc(text)}</p>`;
  };

  const tags = [
    expText(v.experience),
    FORMAT_LABEL[v.format],
    v.schedule === 'free' ? 'Свободный график' : `График ${v.schedule || '5/2'}`,
    v.employment === 'part' ? 'Частичная' : 'Полная',
    v.level,
  ].filter(Boolean);

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div style="flex:1 1 auto"></div>
  <button class="vac__fav ${store.isFavorite(v.id) ? 'is-on' : ''}" id="favBtn">${ico.heartO}</button>
</div>
<div class="scroll">
  <div class="vd">
    <div class="vd__tags" style="margin:0 0 12px">
      ${v.kind === 'alfa' ? '<span class="tag tag--alfa">Работа в Альфа-Банке</span>' : ''}
      ${v.partner ? '<span class="tag tag--partner">Партнёр Alfa Group</span>' : ''}
      ${v.source === 'trudvsem' ? '<span class="tag">Работа России</span>' : ''}
      <span class="tag tag--match">${art.thumb} Подходит на ${match}%</span>
    </div>

    <div class="vd__title">${esc(v.title)}</div>
    <div class="vd__salary"><b>${salaryText(v.salaryMin, v.salaryMax)}</b> в месяц до вычета налогов</div>
    <div class="vd__tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>

    <div class="vd__stats">
      <div class="vd__stat"><b>${viewers}</b><span>смотрят сейчас</span></div>
      <div class="vd__stat"><b>${1 + Math.floor(seeded(v.id, 21) * 9)} дн.</b><span>средний ответ</span></div>
      <div class="vd__stat"><b>${match}%</b><span>совпадение</span></div>
    </div>

    <h3>Компания</h3>
    <div class="vd__company">
      <div class="vd__logo" style="background:${logoColor(v.company)}">${esc(initials(v.company))}</div>
      <div>
        <div class="vd__cname">${esc(v.company)}${v.kind === 'alfa' || v.partner ? ico.verified : ''}</div>
        <div class="vd__crate">${starMark} ${(4 + seeded(v.company, 5) * 0.9).toFixed(1).replace('.', ',')} · ${100 + Math.floor(seeded(v.company, 9) * 1400)} отзывов</div>
      </div>
    </div>

    <h3>Адрес</h3>
    <p>${esc(v.address || v.city)}</p>

    ${v.desc ? `<h3>О вакансии</h3><p>${esc(v.desc)}</p>` : ''}

    <h3>Что делать</h3>
    ${bullets(v.duties, v.dutyText)}

    <h3>Что ждём от вас</h3>
    ${bullets(v.reqs, v.reqsText)}
    ${v.education ? `<p style="color:var(--ink-2)">Образование: ${esc(v.education)}</p>` : ''}

    ${v.perks?.length ? `<h3>Мы предлагаем</h3><ul>${v.perks.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}

    ${v.kind === 'alfa' || v.partner ? `
    <div class="info-card" style="margin:20px 0 0">
      <span style="font-size:26px">${art.card}</span>
      <span>Зарплата приходит на карту Альфа-Банка — видна в приложении в день выплаты</span>
    </div>` : ''}

    ${v.date ? `<p style="color:var(--ink-3);font-size:13.5px;margin-top:18px">Опубликовано ${ruDate(v.date)}</p>` : ''}
  </div>

  ${employerBanner()}

  <div class="sec-head"><h2>Вам может подойти</h2></div>
  <div class="rail">
    ${similar.map((x) => `
      <div class="tile pressable" style="background:#fff;width:230px;min-height:140px" data-go="vacancy" data-params='${JSON.stringify({ id: x.id })}'>
        <div class="vac__tags" style="margin-bottom:8px"><span class="tag">${expText(x.experience)}</span></div>
        <h3 style="font-size:16px">${esc(x.title)}</h3>
        <p style="margin-top:6px;font-size:15px;color:var(--ink)">${salaryText(x.salaryMin, x.salaryMax)}</p>
      </div>`).join('')}
  </div>
  <div style="height:16px"></div>
</div>
<div class="sticky-foot">
  ${applied
    ? `<button class="btn-ghost" data-go="responses">Отклик отправлен — открыть чат</button>`
    : `<button class="btn-primary" id="applyBtn">Откликнуться</button>
       <div class="legal">Нажимая «Откликнуться», вы соглашаетесь<br><u>с условиями и документами сервиса</u></div>`}
</div>`;

  return {
    html,
    mount(root) {
      root.querySelector('#applyBtn')?.addEventListener('click', () => nav.go('apply', { id: v.id }));
      root.querySelector('#favBtn')?.addEventListener('click', (e) => {
        const on = store.toggleFavorite(v.id);
        e.currentTarget.classList.toggle('is-on', on);
        toast(on ? 'Вакансия сохранена' : 'Убрали из сохранённых');
      });
      root.querySelector('.legal u')?.addEventListener('click', () => toast('Документы сервиса — заглушка'));
    },
  };
}

// ── Условия для работодателей ─────────────────────────────────────────────
function employer() {
  const tariffs = [
    {
      name: 'Старт', price: '0 ₽', unit: 'за размещение',
      cond: 'Нужен зарплатный проект в Альфа-Банке',
      hit: true,
      list: [
        'До 10 активных вакансий одновременно',
        'Неограниченные отклики',
        'VCV-скрининг: 50 кандидатов в месяц',
        'Чат с кандидатом внутри приложения',
        'Карточка компании с рейтингом',
      ],
    },
    {
      name: 'Партнёр', price: '0 ₽', unit: 'за размещение',
      cond: 'Зарплатный проект + РКО в Альфа-Банке',
      list: [
        'До 100 активных вакансий',
        'VCV-скрининг без ограничений',
        'Приоритет в выдаче и метка «Партнёр»',
        'Аналитика воронки найма',
        'Персональный менеджер',
        'Продвижение в баннерах Альфа-Мобайла',
      ],
    },
    {
      name: 'Без зарплатного проекта', price: '4 900 ₽', unit: 'за вакансию в месяц',
      cond: 'Для компаний без счетов в Альфа-Банке',
      list: [
        'До 5 активных вакансий',
        'VCV-скрининг: 20 кандидатов в месяц',
        'Базовая карточка компании',
      ],
      no: ['Приоритет в выдаче', 'Персональный менеджер'],
    },
  ];

  const steps = [
    ['Оставьте заявку', 'Прямо здесь — нужен только ИНН. Менеджер свяжется в течение рабочего дня.'],
    ['Подключите зарплатный проект', 'От 5 сотрудников. Открытие и обслуживание — бесплатно, перевод зарплаты — без комиссии.'],
    ['Опубликуйте вакансии', 'Через личный кабинет или выгрузкой из вашей ATS. Модерация — до 2 часов.'],
    ['Получайте отклики после VCV', 'Кандидат приходит уже с результатом теста и видеоответами — вы экономите первый этап.'],
  ];

  const faq = [
    ['Что будет, если мы закроем зарплатный проект?', 'Размещение переходит на тариф «Без зарплатного проекта» с 1-го числа следующего месяца. Уже опубликованные вакансии продолжат работать до конца оплаченного периода.'],
    ['Сколько сотрудников нужно для зарплатного проекта?', 'От 5 человек. Для компаний до 5 сотрудников действует тариф «Старт» первые 3 месяца бесплатно.'],
    ['Кто модерирует вакансии?', 'Автоматическая проверка на соответствие ТК РФ и требованиям к рекламе, затем ручная модерация. Вакансии без указания зарплаты не публикуются.'],
    ['Обязательно ли использовать VCV-скрининг?', 'Нет, но с ним конверсия в целевой отклик выше в среднем в 2,3 раза. Вы сами настраиваете тест и вопросы для видеоответов.'],
    ['Есть ли комиссия за найм?', 'Нет. Мы не берём процент с зарплаты и не продаём доступ к базе резюме. Бизнес-модель — рост зарплатных проектов и оборотов по счетам.'],
  ];

  const html = `
${statusBar()}
<div class="navbar" style="position:absolute;top:var(--safe-top);left:0;right:0;z-index:20">
  <button class="navbar__btn" data-go="back" style="background:rgba(255,255,255,.2);border-radius:50%">
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="m15 5-7 7 7 7" stroke-linecap="round"/></svg>
  </button>
</div>
<div class="scroll" style="padding-top:0">
  <div class="ehero" style="padding-top:60px">
    <span class="ehero__tag">Для работодателей</span>
    <div class="ehero__title">Размещайтесь почти бесплатно</div>
    <div class="ehero__sub">Мы не зарабатываем на вакансиях. Мы зарабатываем на том, что ваша компания и её сотрудники обслуживаются в Альфа-Банке.</div>
    <div class="ehero__stats">
      <div class="ehero__stat"><b>0 ₽</b><span>за размещение при зарплатном проекте</span></div>
      <div class="ehero__stat"><b>×2,3</b><span>целевых откликов с VCV</span></div>
      <div class="ehero__stat"><b>2 ч</b><span>модерация вакансии</span></div>
    </div>
  </div>

  <div class="esec">
    <h2>Тарифы</h2>
    <p>Стоимость размещения зависит от того, насколько глубоко вы работаете с банком.</p>
    ${tariffs.map((t) => `
      <div class="tariff ${t.hit ? 'tariff--hit' : ''}">
        ${t.hit ? '<span class="tariff__badge">Выбирают чаще всего</span>' : ''}
        <div class="tariff__name">${t.name}</div>
        <div class="tariff__price">${t.price} <small>${t.unit}</small></div>
        <div class="tariff__cond">${t.cond}</div>
        <ul class="tariff__list">
          ${t.list.map((x) => `<li>${esc(x)}</li>`).join('')}
          ${(t.no || []).map((x) => `<li class="no">${esc(x)}</li>`).join('')}
        </ul>
      </div>`).join('')}
  </div>

  <div class="esec">
    <h2>Что входит в «почти бесплатно»</h2>
    <p>Условия тарифов «Старт» и «Партнёр» действуют, пока выполняется хотя бы одно из требований.</p>
    <div class="tariff">
      <ul class="tariff__list">
        <li>Зарплатный проект в Альфа-Банке: от 5 сотрудников, выплаты не реже 1 раза в месяц</li>
        <li>Или расчётный счёт с оборотом от 500 000 ₽ в месяц</li>
        <li>Ответ на отклик — в течение 3 рабочих дней (иначе вакансия уходит вниз выдачи)</li>
        <li>Указание реальной зарплаты в вакансии — обязательно</li>
        <li>Соблюдение ТК РФ и требований к рекламе вакансий</li>
      </ul>
    </div>
  </div>

  <div class="esec">
    <h2>Как подключиться</h2>
    ${steps.map(([t, s], i) => `
      <div class="step-card">
        <div class="step-card__n">${i + 1}</div>
        <div><div class="step-card__t">${esc(t)}</div><div class="step-card__s">${esc(s)}</div></div>
      </div>`).join('')}
  </div>

  <div class="esec">
    <h2>Сколько вы сэкономите</h2>
    <p>Расчёт для компании, которая нанимает 10 человек в месяц.</p>
    <div class="calc">
      <div class="calc__row"><span>Размещение 10 вакансий на классическом агрегаторе</span><b>~ 89 000 ₽</b></div>
      <div class="calc__row"><span>Первичный скрининг силами HR (40 часов)</span><b>~ 48 000 ₽</b></div>
      <div class="calc__row"><span>Альфа-Работа, тариф «Старт»</span><b>0 ₽</b></div>
      <div class="calc__total"><span>Экономия в месяц</span><b>137 000 ₽</b></div>
      <div class="calc__save">↓ до 1,6 млн ₽ в год на найме</div>
    </div>
  </div>

  <div class="esec">
    <h2>Частые вопросы</h2>
    ${faq.map(([q, a]) => `
      <div class="faq">
        <div class="faq__q"><span>${esc(q)}</span>${ico.chevD}</div>
        <div class="faq__a">${esc(a)}</div>
      </div>`).join('')}
  </div>

  <div class="src-note">Тарифы и условия — предложение прототипа, не публичная оферта.</div>
  <div style="height:8px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="connect">Подключить</button>
  <div class="legal">Заявка ни к чему не обязывает — сначала посчитаем условия для вашей компании</div>
</div>`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('.faq__q').forEach((q) =>
        q.addEventListener('click', () => q.parentElement.classList.toggle('is-open')));
      root.querySelector('#connect').addEventListener('click', () => nav.go('employerDone'));
    },
  };
}

// ── Заглушка после «Подключить» ───────────────────────────────────────────
function employerDone() {
  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.close}</button></div>
<div class="scroll">
  <div class="vcv-hero" style="padding-top:32px">
    <div class="vcv-hero__emoji">${art.handshake}</div>
    <div class="vcv-hero__title">Заявка принята</div>
    <div class="vcv-hero__text">Это заглушка прототипа. В боевой версии здесь открывается форма с ИНН, контактом ответственного и выбором тарифа, а заявка уходит в CRM корпоративного блока.</div>
  </div>
  <div class="vcv-steps">
    <div class="vcv-step"><div class="vcv-step__n">1</div><div>
      <div class="vcv-step__t">Проверим компанию по ИНН</div>
      <div class="vcv-step__s">Автоматически — до 10 минут</div></div></div>
    <div class="vcv-step"><div class="vcv-step__n">2</div><div>
      <div class="vcv-step__t">Менеджер позвонит</div>
      <div class="vcv-step__s">В течение одного рабочего дня</div></div></div>
    <div class="vcv-step"><div class="vcv-step__n">3</div><div>
      <div class="vcv-step__t">Доступ в личный кабинет</div>
      <div class="vcv-step__s">Публикация вакансий в тот же день</div></div></div>
  </div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" data-go="back">Понятно</button>
</div>`;
  return { html, mount() { store.update({ employerLead: true }); } };
}

// ── Настройки соискателя ──────────────────────────────────────────────────
function rabotaProfile() {
  const s = store.get();
  const cities = ['Москва', 'Санкт-Петербург', 'Московская область', 'Екатеринбург', 'Казань'];
  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Настройки поиска</div></div>
<div class="scroll">
  <div class="field" style="padding-top:8px">
    <label>Город поиска</label>
    <select id="city">${cities.map((c) => `<option ${c === s.user.city ? 'selected' : ''}>${c}</option>`).join('')}</select>
  </div>
  <div class="field">
    <label>Желаемая должность</label>
    <input id="role" value="${esc(s.user.role)}" placeholder="Например, продакт-менеджер">
  </div>
  <div class="flt" style="padding-top:0">
    <div class="flt__toggle"><span>Уведомлять о новых вакансиях</span><button class="tgl is-on"></button></div>
    <div class="flt__toggle"><span>Показывать только с зарплатой</span><button class="tgl is-on"></button></div>
    <div class="flt__toggle"><span>Скрыть вакансии, куда откликался</span><button class="tgl"></button></div>
  </div>
  <div class="hint">Город влияет на живой запрос к API «Работа России» — лента партнёров перезагрузится.</div>
</div>
<div class="sticky-foot"><button class="btn-primary" id="save">Сохранить</button></div>`;
  return {
    html,
    mount(root) {
      root.querySelectorAll('.tgl').forEach((t) => t.addEventListener('click', () => t.classList.toggle('is-on')));
      root.querySelector('#save').addEventListener('click', () => {
        const city = root.querySelector('#city').value;
        const role = root.querySelector('#role').value;
        const changed = city !== store.get().user.city;
        store.update((st) => ({ ...st, user: { ...st.user, city, role } }));
        if (changed) partnerFeed = null;
        toast('Сохранили');
        nav.back();
      });
    },
  };
}

export const rabotaScreens = { rabota, filters, vacancy, employer, employerDone, rabotaProfile };
