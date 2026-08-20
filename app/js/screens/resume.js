// Шаблон резюме: пошаговое заполнение с подсказками, предпросмотр и
// инструкция «как составить резюме».

import { ico, statusBar, homeIndicator, esc, toast, num } from '../util.js';
import { art } from '../art.js';
import { store } from '../store.js';
import { nav } from '../router.js';
import { award } from '../gamify.js';

// Черновик живёт в модуле: между шагами экран перерисовывается целиком
let draft = null;

const emptyDraft = () => ({
  name: 'Тимофей Морозов',
  role: '', city: 'Москва', exp: '', salary: '',
  jobs: [{ company: '', post: '', period: '', what: '' }],
  skills: [], about: '', phone: '', email: '',
});

const SKILL_BANK = [
  'Работа с клиентами', 'Продажи', 'Excel', 'SQL', 'Английский язык',
  'Кассовая дисциплина', '1С', 'Переговоры', 'Аналитика', 'Python',
  'Управление командой', 'CRM', 'Документооборот', 'Водительские права B',
];

const STEPS = ['Кто вы', 'Опыт', 'Навыки', 'О себе'];

// ── Инструкция ────────────────────────────────────────────────────────────
function resumeGuide() {
  const rules = [
    ['Одна должность — одно резюме', 'Работодатель ищет конкретную роль. «Менеджер / водитель / дизайнер» в заголовке читается как «согласен на всё» и снижает шанс ответа.'],
    ['Начинайте с последнего места', 'Опыт пишут от свежего к старому: рекрутер смотрит первые две строки и решает, читать ли дальше.'],
    ['Пишите результат, а не обязанности', '«Отвечал за продажи» — ни о чём. «Поднял выручку отдела на 18% за полгода» — уже разговор. Цифры важнее прилагательных.'],
    ['4–6 навыков, а не двадцать', 'Список из тридцати навыков обесценивает каждый. Оставьте те, которые сможете подтвердить на встрече.'],
    ['О себе — три строки', 'Кто вы профессионально, что умеете лучше всего, что ищете сейчас. Без «коммуникабельный и стрессоустойчивый».'],
    ['Проверьте контакты', 'Самая обидная причина остаться без ответа — опечатка в телефоне или почте.'],
  ];

  const mistakes = [
    'Фото с отдыха или в компании друзей',
    'Почта вроде kotik-2005@',
    'Пробелы в опыте без объяснения',
    'Ошибки в названии компании работодателя',
    'Резюме на пять страниц',
  ];

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="navbar__title">Как составить резюме</div>
</div>
<div class="scroll">
  <div class="guide-hero">
    <span class="guide-hero__art">${art.doc}</span>
    <div class="guide-hero__title">Шесть правил, которые<br>решают почти всё</div>
    <div class="guide-hero__sub">Рекрутер тратит на первый просмотр 15–20 секунд. Задача резюме — за это время объяснить, почему вас стоит позвать.</div>
  </div>

  ${rules.map(([t, s], i) => `
    <div class="step-card" style="margin:0 var(--pad) 9px">
      <div class="step-card__n">${i + 1}</div>
      <div><div class="step-card__t">${esc(t)}</div><div class="step-card__s">${esc(s)}</div></div>
    </div>`).join('')}

  <div class="sec-head"><h2>Чего избегать</h2></div>
  <div class="tariff" style="margin:0 var(--pad)">
    <ul class="tariff__list">
      ${mistakes.map((m) => `<li class="no">${esc(m)}</li>`).join('')}
    </ul>
  </div>

  <div class="sec-head"><h2>Пример строки опыта</h2></div>
  <div class="guide-sample">
    <div class="guide-sample__bad">
      <span>Так не надо</span>
      Продавец-кассир. Обслуживал покупателей, работал на кассе, выкладывал товар.
    </div>
    <div class="guide-sample__good">
      <span>Так лучше</span>
      Продавец-кассир, «Пятёрочка», 2023–2025. Обслуживал до 300 чеков в смену, за год вырос до старшего смены, обучил четырёх новых сотрудников.
    </div>
  </div>

  <div class="info-card" style="margin-top:16px">
    <span>${art.clock}</span>
    <span>По шаблону в приложении резюме собирается за 5 минут — подсказки есть в каждом поле.</span>
  </div>
  <div style="height:12px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" data-go="resumeBuilder">Заполнить по шаблону</button>
</div>`;

  return {
    html,
    mount() {
      const g = store.get().game;
      if (!g.counters.guideRead) {
        const r = award('guideRead');
        if (r.points) toast(`+${r.points} баллов за изучение инструкции`);
      }
    },
  };
}

// ── Пошаговое заполнение ──────────────────────────────────────────────────
function resumeBuilder(params = {}) {
  const step = params.step || 0;
  if (step === 0 && !params.keep) draft = draft || emptyDraft();
  if (!draft) draft = emptyDraft();

  const field = (id, label, hint, value, placeholder, type = 'input') => `
    <div class="field">
      <label>${esc(label)}</label>
      ${type === 'textarea'
        ? `<textarea id="${id}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
        : `<input id="${id}" value="${esc(value)}" placeholder="${esc(placeholder)}">`}
      <div class="field__hint">${hint}</div>
    </div>`;

  let body = '';
  if (step === 0) {
    body = `
      ${field('f-role', 'Желаемая должность', 'Одна конкретная роль — так резюме попадёт в нужную выдачу', draft.role, 'Продавец-кассир')}
      ${field('f-city', 'Город', 'Где готовы работать', draft.city, 'Москва')}
      ${field('f-exp', 'Опыт работы', 'Суммарно по профессии: «без опыта», «1 год», «3 года»', draft.exp, 'Без опыта')}
      ${field('f-salary', 'Желаемый доход, ₽', 'Можно оставить пустым — тогда обсудите на встрече', draft.salary, '60 000')}`;
  } else if (step === 1) {
    body = draft.jobs.map((j, i) => `
      <div class="job-block">
        <div class="job-block__head">Место работы ${i + 1}
          ${draft.jobs.length > 1 ? `<button class="job-block__del" data-deljob="${i}">Удалить</button>` : ''}
        </div>
        ${field('j-post-' + i, 'Должность', 'Как называлась ваша позиция', j.post, 'Продавец-кассир')}
        ${field('j-company-' + i, 'Компания', 'Название работодателя', j.company, 'Пятёрочка')}
        ${field('j-period-' + i, 'Период', 'Месяц и год начала и окончания', j.period, 'март 2023 — май 2025')}
        ${field('j-what-' + i, 'Что делали и чего добились', 'Одно-два предложения с цифрой: сколько клиентов, на сколько выросли показатели', j.what, 'Обслуживал до 300 чеков в смену, за год вырос до старшего смены', 'textarea')}
      </div>`).join('') + `
      <button class="btn-ghost" id="addJob" style="margin:0 var(--pad) 8px;width:calc(100% - 32px)">Добавить ещё место</button>
      <div class="hint">Если опыта пока нет — оставьте поля пустыми и переходите дальше. Для стартовых позиций это нормально.</div>`;
  } else if (step === 2) {
    body = `
      <div class="hint" style="padding-top:0">Выберите 4–6 навыков, которые сможете подтвердить на встрече. Лишнее только размывает картину.</div>
      <div class="flt__wrap" style="padding:0 var(--pad) 14px">
        ${SKILL_BANK.map((sk) => `
          <button class="fchip ${draft.skills.includes(sk) ? 'is-on' : ''}" data-skill="${esc(sk)}">${esc(sk)}</button>`).join('')}
      </div>
      ${field('f-skill-own', 'Свой навык', 'Нажмите «Далее» — навык добавится к выбранным', '', 'Например, кассовая дисциплина')}
      <div class="hint">Выбрано: <b id="skillCount">${draft.skills.length}</b></div>`;
  } else {
    body = `
      ${field('f-about', 'О себе', 'Три строки: кто вы профессионально, что умеете лучше всего, что ищете сейчас', draft.about, 'Работаю в рознице третий год. Лучше всего даётся работа с потоком клиентов и обучение новичков. Ищу позицию старшего смены рядом с домом.', 'textarea')}
      ${field('f-phone', 'Телефон', 'Проверьте цифры — самая обидная причина остаться без ответа', draft.phone, '+7 999 123-45-67')}
      ${field('f-email', 'Почта', 'Лучше нейтральная: имя и фамилия', draft.email, 'timofey.morozov@mail.ru')}`;
  }

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="navbar__title">Шаблон резюме<small style="color:var(--ink-2)">Шаг ${step + 1} из 4 · ${esc(STEPS[step])}</small></div>
</div>
<div class="vcv-progress">
  ${STEPS.map((_, k) => `<div class="vcv-progress__seg ${k <= step ? 'is-done' : ''}"></div>`).join('')}
</div>
<div class="scroll">
  <div class="q-title" style="padding-top:4px">${esc(STEPS[step])}</div>
  ${body}
  <div style="height:10px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="next">${step === 3 ? 'Посмотреть резюме' : 'Далее'}</button>
</div>`;

  return {
    html,
    mount(root) {
      const val = (id) => root.querySelector('#' + id)?.value.trim() ?? '';

      root.querySelectorAll('[data-skill]').forEach((b) =>
        b.addEventListener('click', () => {
          const sk = b.dataset.skill;
          const i = draft.skills.indexOf(sk);
          if (i >= 0) draft.skills.splice(i, 1); else draft.skills.push(sk);
          b.classList.toggle('is-on', i < 0);
          root.querySelector('#skillCount').textContent = draft.skills.length;
        }));

      root.querySelector('#addJob')?.addEventListener('click', () => {
        save();
        draft.jobs.push({ company: '', post: '', period: '', what: '' });
        nav.replace('resumeBuilder', { step: 1, keep: true });
      });
      root.querySelectorAll('[data-deljob]').forEach((b) =>
        b.addEventListener('click', () => {
          save();
          draft.jobs.splice(Number(b.dataset.deljob), 1);
          nav.replace('resumeBuilder', { step: 1, keep: true });
        }));

      function save() {
        if (step === 0) {
          draft.role = val('f-role'); draft.city = val('f-city');
          draft.exp = val('f-exp'); draft.salary = val('f-salary');
        } else if (step === 1) {
          draft.jobs = draft.jobs.map((_, i) => ({
            post: val('j-post-' + i), company: val('j-company-' + i),
            period: val('j-period-' + i), what: val('j-what-' + i),
          }));
        } else if (step === 2) {
          const own = val('f-skill-own');
          if (own && !draft.skills.includes(own)) draft.skills.push(own);
        } else {
          draft.about = val('f-about'); draft.phone = val('f-phone'); draft.email = val('f-email');
        }
      }

      root.querySelector('#next').addEventListener('click', () => {
        save();
        if (step === 0 && !draft.role) { toast('Укажите желаемую должность'); return; }
        if (step === 3) nav.replace('resumePreview');
        else nav.replace('resumeBuilder', { step: step + 1, keep: true });
      });
    },
  };
}

// ── Предпросмотр и сохранение ─────────────────────────────────────────────
function resumePreview() {
  if (!draft) return { html: `${statusBar()}<div class="empty"><div class="empty__title">Черновик не найден</div></div>` };
  const d = draft;
  const filled = [d.role, d.city, d.about, d.phone, d.skills.length, d.jobs.some((j) => j.post)].filter(Boolean).length;
  const quality = Math.round((filled / 6) * 100);

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="navbar__title">Ваше резюме</div>
</div>
<div class="scroll">
  <div class="cv">
    <div class="cv__head">
      <div class="cv__name">${esc(d.name)}</div>
      <div class="cv__role">${esc(d.role || 'Должность не указана')}</div>
      <div class="cv__meta">${esc(d.city)}${d.exp ? ' · опыт: ' + esc(d.exp) : ''}${d.salary ? ' · от ' + esc(d.salary) + ' ₽' : ''}</div>
    </div>

    ${d.jobs.some((j) => j.post || j.company) ? `
      <div class="cv__sec">Опыт работы</div>
      ${d.jobs.filter((j) => j.post || j.company).map((j) => `
        <div class="cv__job">
          <div class="cv__jobpost">${esc(j.post || '—')}</div>
          <div class="cv__jobmeta">${esc(j.company)}${j.period ? ' · ' + esc(j.period) : ''}</div>
          ${j.what ? `<div class="cv__jobwhat">${esc(j.what)}</div>` : ''}
        </div>`).join('')}` : ''}

    ${d.skills.length ? `
      <div class="cv__sec">Навыки</div>
      <div class="cv__skills">${d.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}

    ${d.about ? `<div class="cv__sec">О себе</div><div class="cv__about">${esc(d.about)}</div>` : ''}

    ${(d.phone || d.email) ? `
      <div class="cv__sec">Контакты</div>
      <div class="cv__about">${esc([d.phone, d.email].filter(Boolean).join(' · '))}</div>` : ''}
  </div>

  <div class="quality">
    <div class="quality__row">
      <span>Заполненность резюме</span><b>${quality}%</b>
    </div>
    <div class="quality__bar"><i style="width:${quality}%;background:${quality >= 80 ? 'var(--ok)' : '#E8890C'}"></i></div>
    <div class="quality__hint">${quality >= 80
      ? 'Хорошее резюме — работодатель увидит всё, что нужно для решения.'
      : 'Вернитесь на шаг назад и заполните пустые блоки: чем полнее резюме, тем чаще на него отвечают.'}</div>
  </div>
  <div style="height:10px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="save">Сохранить резюме</button>
  <div class="legal"><u data-go="resumeBuilder" data-params='{"step":0,"keep":true}'>Вернуться к редактированию</u></div>
</div>`;

  return {
    html,
    mount(root) {
      root.querySelector('#save').addEventListener('click', () => {
        store.addResume({ type: 'built', name: draft.role || 'Резюме', data: { ...draft } });
        const r = award('resumeBuilt');
        draft = null;
        toast(`Резюме сохранено · +${r.points} баллов`);
        // К шаблону приходят двумя путями разной глубины — из списка резюме
        // и из инструкции в меню. Поэтому возвращаемся к именованному экрану,
        // а не на фиксированное число шагов назад.
        if (!nav.backTo('resumes') && !nav.backTo('apply')) {
          nav.backTo('rabota');
          nav.go('resumes');
        } else {
          nav.refresh();
        }
      });
    },
  };
}

export const resumeScreens = { resumeGuide, resumeBuilder, resumePreview };
