// Резюме, отклик и VCV-скрининг: тест + видеоответы на вопросы работодателя.

import { ico, statusBar, homeIndicator, esc, toast, sleep, seeded, salaryText } from '../util.js';
import { art } from '../art.js';
import { store } from '../store.js';
import { nav } from '../router.js';
import { getJob, matchPct } from './rabota.js';
import { startEmployerReply } from './chat.js';

// ── Банк вопросов ─────────────────────────────────────────────────────────
const COMMON_TEST = [
  {
    q: 'Вы договорились о выходе на работу, но за день до старта получили предложение с зарплатой на 15% выше. Что сделаете?',
    sub: 'Оцениваем надёжность и коммуникацию',
    opts: [
      ['Выйду на новую работу, о договорённости сообщу в день выхода', 0],
      ['Сразу честно скажу первому работодателю и обсужу, готовы ли они пересмотреть условия', 3],
      ['Ничего не скажу и выйду туда, где больше платят', 0],
      ['Выйду к первому работодателю, второй вариант отложу', 2],
    ],
  },
  {
    q: 'Вы поняли, что не успеваете сдать задачу к дедлайну. Ваши действия?',
    sub: 'Проверяем работу с обязательствами',
    opts: [
      ['Предупрежу руководителя заранее и предложу новый срок или сокращённый объём', 3],
      ['Буду работать сверхурочно и молчать до последнего', 1],
      ['Сдам как есть в срок, доделаю потом', 1],
      ['Скажу в день дедлайна', 0],
    ],
  },
  {
    q: 'Что для вас важнее при выборе работы прямо сейчас?',
    sub: 'Помогает подобрать подходящие вакансии',
    opts: [
      ['Стабильность и понятные задачи', 2],
      ['Быстрый рост дохода', 2],
      ['Развитие навыков и сильная команда', 3],
      ['Гибкий график и баланс', 2],
    ],
  },
];

const TRACK_TEST = {
  'Работа с клиентами': {
    q: 'Клиент в чате раздражён: перевод не дошёл третий день. Ваше первое сообщение?',
    sub: 'Проверяем клиентскую коммуникацию',
    opts: [
      ['«Здравствуйте! Понимаю, ситуация неприятная. Уже смотрю ваш перевод, вернусь с ответом в течение 10 минут»', 3],
      ['«Здравствуйте. Уточните, пожалуйста, номер операции»', 2],
      ['«Переводы идут до 5 рабочих дней, ожидайте»', 0],
      ['«Это вопрос не ко мне, переключаю на другой отдел»', 0],
    ],
  },
  'Разработка': {
    q: 'На проде выросло время ответа сервиса с 80 мс до 900 мс. С чего начнёте?',
    sub: 'Проверяем инженерное мышление',
    opts: [
      ['Посмотрю метрики и трейсы, найду, на каком участке выросла задержка', 3],
      ['Сразу откачу последний релиз', 2],
      ['Добавлю реплик и увеличу ресурсы', 1],
      ['Напишу в чат, что всё работает медленно', 0],
    ],
  },
  'Продукт и аналитика': {
    q: 'A/B-тест показал рост конверсии на 1,2% при p-value 0,21. Что делать?',
    sub: 'Проверяем работу с данными',
    opts: [
      ['Результат статистически незначим — продолжить набор или признать неуспех', 3],
      ['Раскатить на 100%: рост есть', 0],
      ['Раскатить на 50% и посмотреть', 1],
      ['Изменить метрику успеха под результат', 0],
    ],
  },
  'Продажи': {
    q: 'Клиент говорит: «Дорого». Что скажете первым?',
    sub: 'Проверяем навык работы с возражениями',
    opts: [
      ['«Понимаю. Подскажите, с чем сравниваете — так я точнее покажу, за что здесь цена»', 3],
      ['«Могу дать скидку 10%»', 1],
      ['«У всех дорого сейчас»', 0],
      ['«Это лучшая цена на рынке»', 1],
    ],
  },
};

const NUMERIC_TEST = {
  q: 'Магазин продал 240 товаров за 8 часов. Сколько продаст за 5 часов при том же темпе?',
  sub: 'Небольшая проверка на счёт в уме',
  opts: [['120', 0], ['150', 3], ['180', 0], ['200', 0]],
};

function buildTest(job) {
  const t = [];
  if (TRACK_TEST[job.track]) t.push(TRACK_TEST[job.track]);
  t.push(COMMON_TEST[0], NUMERIC_TEST, COMMON_TEST[1]);
  if (t.length < 4) t.push(COMMON_TEST[2]);
  return t.slice(0, 4);
}

function buildVideoQuestions(job) {
  return [
    {
      q: 'Расскажите о себе за минуту',
      sub: 'Чем занимались последний год и что хотите делать дальше',
      limit: 60,
    },
    {
      q: job.kind === 'alfa'
        ? `Почему вас заинтересовала вакансия «${job.title}» именно в Альфа-Банке?`
        : `Почему вам интересна вакансия «${job.title}» в компании ${job.company}?`,
      sub: 'Работодатель увидит этот ответ вместе с резюме',
      limit: 45,
    },
    {
      q: TRACK_TEST[job.track]
        ? 'Опишите ситуацию, когда вам пришлось решать проблему без готовой инструкции'
        : 'Что для вас самое важное в работе и почему?',
      sub: 'Кейс на 45 секунд — без подготовки, как в жизни',
      limit: 45,
    },
  ];
}

// ── Сессия скрининга ──────────────────────────────────────────────────────
let session = null;

// ── Резюме ────────────────────────────────────────────────────────────────
function resumes() {
  const s = store.get();
  const list = s.resumes.length
    ? s.resumes.map((r) => `
      <div class="res-card pressable" data-res="${r.id}">
        <div class="res-card__ico">${r.type === 'link' ? art.link : art.doc}</div>
        <div class="res-card__body">
          <div class="res-card__name">${esc(r.name)}</div>
          <div class="res-card__meta ${r.status === 'ready' ? 'res-card__meta--ok' : ''}">
            ${r.status === 'ready' ? '✓ Готово к отклику' : 'Проверяем…'}
            ${r.type === 'link' ? ' · ссылка' : ' · PDF'}
          </div>
        </div>
        <button class="navbar__btn" data-del="${r.id}" style="margin:0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B0B3B9" stroke-width="2"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>`).join('')
    : `<div class="empty">
        <div class="empty__emoji">${art.folder}</div>
        <div class="empty__title">Пока нет резюме</div>
        <div class="empty__text">Добавьте ссылку с сайта по поиску работы или прикрепите файл — этого хватит для отклика</div>
      </div>`;

  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Резюме</div></div>
<div class="scroll">
  ${list}
  ${s.resumes.length ? '<div class="hint" style="padding-top:8px">Резюме видит только работодатель, которому вы откликнулись.</div>' : ''}
</div>
<div class="sticky-foot"><button class="btn-primary" data-go="resumeNew">Добавить</button></div>`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-del]').forEach((btn) =>
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          store.removeResume(btn.dataset.del);
          toast('Резюме удалено');
          nav.refresh();
        }));
      root.querySelectorAll('[data-res]').forEach((el) =>
        el.addEventListener('click', () => toast('Просмотр резюме — заглушка прототипа')));
    },
  };
}

function resumeNew() {
  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back" style="width:auto;padding:0 6px">
    <span style="font-size:16px;color:var(--red);font-weight:500">Закрыть</span>
  </button>
  <div style="flex:1 1 auto"><div class="vcv-progress" style="padding:0"><div class="vcv-progress__seg is-done"></div><div class="vcv-progress__seg"></div></div></div>
</div>
<div class="scroll">
  <div style="padding:8px var(--pad) 22px"><div style="font-size:28px;font-weight:800;letter-spacing:-.03em">Новое резюме</div></div>
  <button class="pick-row pressable" data-go="resumeLink">
    <span class="pick-row__ico">${art.link}</span>
    <span><span class="pick-row__title">Ссылка</span><span class="pick-row__sub">С сайта по поиску работы</span></span>
  </button>
  <button class="pick-row pressable" data-go="resumeFile">
    <span class="pick-row__ico">${art.clip}</span>
    <span><span class="pick-row__title">Файл</span><span class="pick-row__sub">В формате PDF не больше 5 МБ</span></span>
  </button>
  <div class="hint" style="padding-top:14px">Данные из резюме используются только для отклика и не передаются третьим лицам.</div>
</div>`;
  return { html };
}

function resumeLink() {
  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Ссылка на резюме</div></div>
<div class="scroll">
  <div class="field" style="padding-top:8px">
    <label>Ссылка</label>
    <input id="url" placeholder="hh.ru/resume/… или career.habr.com/…" inputmode="url">
  </div>
  <div class="field">
    <label>Название резюме</label>
    <input id="name" placeholder="Например, Продакт-менеджер">
  </div>
  <div class="hint">Мы откроем ссылку, вытащим должность и опыт и покажем работодателю. Поддерживаем hh.ru, «Хабр Карьеру», getmatch, LinkedIn и Яндекс Резюме.</div>
</div>
<div class="sticky-foot"><button class="btn-primary" id="save">Сохранить</button></div>`;
  return {
    html,
    mount(root) {
      root.querySelector('#save').addEventListener('click', () => {
        const url = root.querySelector('#url').value.trim();
        const name = root.querySelector('#name').value.trim();
        if (!url) { toast('Вставьте ссылку на резюме'); return; }
        store.addResume({ type: 'link', url, name: name || 'Резюме по ссылке' });
        toast('Резюме добавлено — проверяем');
        // Назад через resumeNew — на тот экран, откуда начали: «Резюме» или «Отклик»
        nav.back(2);
      });
    },
  };
}

function resumeFile() {
  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Файл резюме</div></div>
<div class="scroll">
  <div class="stub-box" style="margin-top:8px">
    <div class="stub-box__emoji">${art.clip}</div>
    <div class="stub-box__title">Загрузка файлов — заглушка</div>
    <div class="stub-box__text">В прототипе загрузка PDF отключена. В боевой версии здесь открывается выбор файла из памяти телефона, iCloud или Google Drive: PDF, DOC, DOCX до 5 МБ.</div>
  </div>
  <div class="hint">Нажмите «Добавить демо-файл», чтобы продолжить сценарий отклика.</div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="fake">Добавить демо-файл</button>
</div>`;
  return {
    html,
    mount(root) {
      root.querySelector('#fake').addEventListener('click', () => {
        store.addResume({ type: 'file', name: 'Резюме_Тимофей.pdf' });
        toast('Файл прикреплён — проверяем');
        nav.back(2);
      });
    },
  };
}

// ── Отклик: выбор резюме ──────────────────────────────────────────────────
function apply(params) {
  const job = getJob(params.id);
  if (!job) return { html: '<div class="empty"><div class="empty__title">Вакансия не найдена</div></div>' };
  const s = store.get();

  const list = s.resumes.length
    ? s.resumes.map((r, i) => `
      <label class="res-card ${i === 0 ? 'is-sel' : ''}" data-pick="${r.id}">
        <div class="res-card__ico">${r.type === 'link' ? art.link : art.doc}</div>
        <div class="res-card__body">
          <div class="res-card__name">${esc(r.name)}</div>
          <div class="res-card__meta">${r.type === 'link' ? 'Ссылка' : 'PDF'} · ${r.status === 'ready' ? 'проверено' : 'проверяем'}</div>
        </div>
        <span class="opt__mark"></span>
      </label>`).join('')
    : `<div class="stub-box">
        <div class="stub-box__emoji">${art.folder}</div>
        <div class="stub-box__title">Нужно резюме</div>
        <div class="stub-box__text">Прикрепите файл или вставьте ссылку с сайта по поиску работы — это займёт минуту</div>
      </div>`;

  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Отклик</div></div>
<div class="scroll">
  <div class="chat-pin" style="margin-top:0">
    <div style="flex:1 1 auto">
      <div class="chat-pin__lbl">Вакансия</div>
      <div class="chat-pin__title">${esc(job.title)}</div>
      <div style="font-size:13.5px;color:var(--ink-2);margin-top:3px">${esc(job.company)} · ${salaryText(job.salaryMin, job.salaryMax)}</div>
    </div>
  </div>

  <div class="sec-head" style="padding-bottom:8px"><h2 style="font-size:19px">Резюме</h2>
    <span style="font-size:15px;color:var(--red);font-weight:500" data-go="resumeNew">Добавить</span></div>
  ${list}

  <div class="sec-head" style="padding-bottom:8px"><h2 style="font-size:19px">Сопроводительное</h2></div>
  <div class="field">
    <textarea id="cover" placeholder="Необязательно. Пара предложений о том, почему вам интересна эта вакансия"></textarea>
  </div>

  <div class="info-card" style="background:#FDE9E7">
    <span style="font-size:26px">${art.camera}</span>
    <span>После отклика — короткий VCV-скрининг: 4 вопроса теста и 3 видеоответа. Занимает 5–7 минут и повышает шанс ответа.</span>
  </div>
  <div style="height:16px"></div>
</div>
<div class="sticky-foot">
  ${s.resumes.length
    ? '<button class="btn-primary" id="next">Продолжить</button>'
    : '<button class="btn-primary" data-go="resumeNew">Добавить резюме</button>'}
  <div class="legal">Нажимая «Продолжить», вы соглашаетесь<br><u>с условиями и документами сервиса</u></div>
</div>`;

  return {
    html,
    mount(root) {
      let picked = s.resumes[0]?.id;
      root.querySelectorAll('[data-pick]').forEach((el) =>
        el.addEventListener('click', () => {
          root.querySelectorAll('[data-pick]').forEach((x) => x.classList.remove('is-sel'));
          el.classList.add('is-sel');
          picked = el.dataset.pick;
        }));
      root.querySelector('#next')?.addEventListener('click', () => {
        session = {
          jobId: job.id,
          resumeId: picked,
          cover: root.querySelector('#cover').value.trim(),
          test: buildTest(job),
          videoQs: buildVideoQuestions(job),
          answers: [],
          videos: [],
        };
        nav.go('vcvIntro');
      });
      root.querySelector('.legal u')?.addEventListener('click', () => toast('Документы сервиса — заглушка'));
    },
  };
}

// ── VCV: вступление ───────────────────────────────────────────────────────
function vcvIntro() {
  if (!session) return { html: '<div class="empty"><div class="empty__title">Сессия истекла</div></div>' };
  const job = getJob(session.jobId);
  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.close}</button><div class="navbar__title">VCV-скрининг</div></div>
<div class="scroll">
  <div class="vcv-hero">
    <div class="vcv-hero__emoji">${art.clapper}</div>
    <div class="vcv-hero__title">Пройдите скрининг —<br>отклик увидят первым</div>
    <div class="vcv-hero__text">Работодатель ${esc(job.company)} смотрит такие отклики в первую очередь: он сразу видит ответы и видео, а не только резюме.</div>
  </div>
  <div class="vcv-steps">
    <div class="vcv-step"><div class="vcv-step__n">1</div><div>
      <div class="vcv-step__t">Тест — 4 вопроса</div>
      <div class="vcv-step__s">Ситуации из реальной работы, правильных ответов «наизусть» нет</div></div></div>
    <div class="vcv-step"><div class="vcv-step__n">2</div><div>
      <div class="vcv-step__t">Видеоответы — 3 вопроса</div>
      <div class="vcv-step__s">До 60 секунд на ответ, записываются прямо в приложении</div></div></div>
    <div class="vcv-step"><div class="vcv-step__n">3</div><div>
      <div class="vcv-step__t">Результат и отправка</div>
      <div class="vcv-step__s">Вы увидите оценку до отправки и решите, отправлять ли отклик</div></div></div>
  </div>
  <div class="info-card">
    <span style="font-size:24px">${art.clock}</span><span>Займёт 5–7 минут. Прервать можно в любой момент — прогресс сохранится.</span>
  </div>
  <div class="hint" style="padding-top:14px">Для видеоответов понадобится доступ к камере и микрофону. Если доступа нет, скрининг пройдёт в демо-режиме.</div>
  <div style="height:12px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" data-go="vcvTest" data-params='{"i":0}'>Начать скрининг</button>
  <div class="legal"><u id="skip">Отправить отклик без скрининга</u></div>
</div>`;
  return {
    html,
    mount(root) {
      root.querySelector('#skip').addEventListener('click', () => finishResponse(null));
    },
  };
}

// ── VCV: тест ─────────────────────────────────────────────────────────────
function vcvTest(params) {
  if (!session) return { html: '<div class="empty"><div class="empty__title">Сессия истекла</div></div>' };
  const i = params.i || 0;
  const total = session.test.length;
  const item = session.test[i];

  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Тест</div></div>
<div class="vcv-progress">
  ${Array.from({ length: total + 3 }, (_, k) =>
    `<div class="vcv-progress__seg ${k < i ? 'is-done' : k === i ? 'is-now' : ''}"></div>`).join('')}
</div>
<div class="scroll">
  <div class="q-num">Вопрос ${i + 1} из ${total}</div>
  <div class="q-title">${esc(item.q)}</div>
  <div class="q-sub">${esc(item.sub)}</div>
  ${item.opts.map(([text], k) => `
    <button class="opt" data-opt="${k}"><span class="opt__mark"></span><span>${esc(text)}</span></button>`).join('')}
  <div style="height:12px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="next" disabled>Далее</button>
</div>`;

  return {
    html,
    mount(root) {
      let chosen = null;
      const next = root.querySelector('#next');
      root.querySelectorAll('[data-opt]').forEach((btn) =>
        btn.addEventListener('click', () => {
          root.querySelectorAll('[data-opt]').forEach((x) => x.classList.remove('is-sel'));
          btn.classList.add('is-sel');
          chosen = Number(btn.dataset.opt);
          next.disabled = false;
        }));
      next.addEventListener('click', () => {
        session.answers[i] = item.opts[chosen][1];
        if (i + 1 < total) nav.replace('vcvTest', { i: i + 1 });
        else nav.replace('vcvVideo', { i: 0 });
      });
    },
  };
}

// ── VCV: видеоответы ──────────────────────────────────────────────────────
let activeStream = null;

function releaseCamera() {
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }
}

function vcvVideo(params) {
  if (!session) return { html: '<div class="empty"><div class="empty__title">Сессия истекла</div></div>' };
  const i = params.i || 0;
  const item = session.videoQs[i];
  const total = session.videoQs.length;
  const testTotal = session.test.length;

  const html = `
${statusBar()}
<div class="navbar"><button class="navbar__btn" data-go="back">${ico.chevL}</button><div class="navbar__title">Видеоответ</div></div>
<div class="vcv-progress">
  ${Array.from({ length: testTotal + 3 }, (_, k) => {
    const pos = testTotal + i;
    return `<div class="vcv-progress__seg ${k < pos ? 'is-done' : k === pos ? 'is-now' : ''}"></div>`;
  }).join('')}
</div>
<div class="scroll">
  <div class="q-num">Видеовопрос ${i + 1} из ${total} · до ${item.limit} секунд</div>
  <div class="q-title">${esc(item.q)}</div>
  <div class="q-sub">${esc(item.sub)}</div>

  <div class="recorder" id="rec">
    <div class="recorder__ph" id="ph"><b>${art.camera}</b>Запрашиваем доступ к камере…</div>
    <video id="cam" playsinline muted autoplay style="display:none"></video>
    <div class="recorder__rec" id="recBadge" style="display:none"><i></i>ЗАПИСЬ</div>
    <div class="recorder__timer" id="timer" style="display:none">0:00</div>
    <div class="recorder__done" id="done" style="display:none"></div>
  </div>

  <div class="rec-controls">
    <button class="btn-primary" id="recBtn">Начать запись</button>
  </div>
  <div class="hint">Смотрите в камеру и говорите свободно — оценивается содержание, а не дикция.</div>
  <div style="height:8px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="next" disabled>${i + 1 < total ? 'Следующий вопрос' : 'Завершить скрининг'}</button>
  <div class="legal"><u id="skip">Пропустить вопрос</u></div>
</div>`;

  return {
    html,
    unmount: releaseCamera,
    mount(root) {
      const ph = root.querySelector('#ph');
      const cam = root.querySelector('#cam');
      const badge = root.querySelector('#recBadge');
      const timerEl = root.querySelector('#timer');
      const doneEl = root.querySelector('#done');
      const recBtn = root.querySelector('#recBtn');
      const next = root.querySelector('#next');

      let live = false;
      let recording = false;
      let seconds = 0;
      let tick = null;

      // Пытаемся получить настоящую камеру; если нельзя — демо-режим
      (async () => {
        try {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error('no api');
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 720 } },
            audio: true,
          });
          cam.srcObject = activeStream;
          cam.style.display = '';
          ph.style.display = 'none';
          live = true;
        } catch {
          live = false;
          ph.innerHTML = '<b>${art.camera}</b>Камера недоступна.<br>Запишем ответ в демо-режиме — сценарий не прервётся.';
        }
      })();

      const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

      function stop() {
        recording = false;
        clearInterval(tick);
        badge.style.display = 'none';
        recBtn.textContent = 'Перезаписать';
        next.disabled = false;
        doneEl.style.display = '';
        doneEl.innerHTML = `<div><div style="font-size:38px">✓</div>
          <div style="margin-top:10px">Ответ записан · ${fmt(seconds)}</div>
          <div style="opacity:.6;font-size:13px;margin-top:6px">${live ? 'Видео не покидает устройство в прототипе' : 'Демо-режим без камеры'}</div></div>`;
        session.videos[i] = { seconds, live };
      }

      recBtn.addEventListener('click', () => {
        if (recording) { stop(); return; }
        recording = true;
        seconds = 0;
        doneEl.style.display = 'none';
        badge.style.display = '';
        timerEl.style.display = '';
        timerEl.textContent = `0:00 / ${fmt(item.limit)}`;
        recBtn.textContent = 'Остановить запись';
        tick = setInterval(() => {
          seconds++;
          timerEl.textContent = `${fmt(seconds)} / ${fmt(item.limit)}`;
          if (seconds >= item.limit) stop();
        }, 1000);
      });

      next.addEventListener('click', () => {
        releaseCamera();
        if (i + 1 < total) nav.replace('vcvVideo', { i: i + 1 });
        else nav.replace('vcvProcessing');
      });

      root.querySelector('#skip').addEventListener('click', () => {
        session.videos[i] = { seconds: 0, live: false, skipped: true };
        releaseCamera();
        if (i + 1 < total) nav.replace('vcvVideo', { i: i + 1 });
        else nav.replace('vcvProcessing');
      });
    },
  };
}

// ── VCV: «обработка» ──────────────────────────────────────────────────────
function vcvProcessing() {
  const stages = [
    'Загружаем видеоответы…',
    'Распознаём речь…',
    'Сверяем ответы с профилем вакансии…',
    'Считаем итоговую оценку…',
  ];
  const html = `
${statusBar()}
<div class="scroll" style="display:grid;place-items:center">
  <div style="text-align:center;padding:40px 30px">
    <div class="spinner" style="width:44px;height:44px;border-width:4px"></div>
    <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;margin-bottom:8px" id="stage">${stages[0]}</div>
    <div style="font-size:14.5px;color:var(--ink-2);line-height:1.45">Это займёт несколько секунд.<br>В прототипе оценка считается по вашим ответам без нейросетей.</div>
  </div>
</div>`;
  return {
    html,
    mount(root) {
      const el = root.querySelector('#stage');
      (async () => {
        for (let k = 1; k < stages.length; k++) {
          await sleep(900);
          if (!el.isConnected) return;
          el.textContent = stages[k];
        }
        await sleep(900);
        if (el.isConnected) nav.replace('vcvResult');
      })();
    },
  };
}

// ── VCV: результат ────────────────────────────────────────────────────────
function computeScore() {
  const maxTest = session.test.length * 3;
  const gotTest = session.answers.reduce((a, b) => a + (b || 0), 0);
  const testPct = Math.round((gotTest / maxTest) * 100);

  const answered = session.videos.filter((v) => v && !v.skipped && v.seconds >= 5).length;
  const videoPct = Math.round((answered / session.videoQs.length) * 100);

  const job = getJob(session.jobId);
  const profilePct = matchPct(job.id);

  const total = Math.round(testPct * 0.4 + videoPct * 0.25 + profilePct * 0.35);
  return { testPct, videoPct, profilePct, total };
}

function vcvResult() {
  if (!session) return { html: '<div class="empty"><div class="empty__title">Сессия истекла</div></div>' };
  const job = getJob(session.jobId);
  const sc = computeScore();
  const verdict = sc.total >= 75
    ? ['Отличный результат', 'Ваш отклик попадёт в приоритетную выборку работодателя.', '#12A05C']
    : sc.total >= 55
      ? ['Хороший результат', 'Отклик уйдёт в общую воронку — работодатель посмотрит его в течение 3 дней.', '#E8890C']
      : ['Есть над чем поработать', 'Отклик отправим, но шанс ответа ниже. Можно перепройти скрининг.', '#8D9199'];

  const circle = 2 * Math.PI * 70;
  const dash = circle * (sc.total / 100);

  const crit = (label, pct, cls) => `
    <div class="crit">
      <div class="crit__ico crit__ico--${cls}">${cls === 'ok' ? '✓' : '~'}</div>
      <div class="crit__body">
        <div class="crit__t">${label}</div>
        <div class="crit__bar"><i style="width:${pct}%;background:${pct >= 70 ? '#12A05C' : '#E8890C'}"></i></div>
      </div>
      <div class="crit__pct">${pct}%</div>
    </div>`;

  const html = `
${statusBar()}
<div class="navbar"><div class="navbar__title">Результат скрининга</div></div>
<div class="scroll">
  <div class="score-ring">
    <div class="score-ring__wrap">
      <svg viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" fill="none" stroke="#EDEEF1" stroke-width="14"/>
        <circle cx="80" cy="80" r="70" fill="none" stroke="${verdict[2]}" stroke-width="14" stroke-linecap="round"
          stroke-dasharray="${dash} ${circle}"/>
      </svg>
      <div class="score-ring__val">
        <div class="score-ring__num">${sc.total}</div>
        <div class="score-ring__cap">из 100</div>
      </div>
    </div>
  </div>
  <div style="text-align:center;padding:6px var(--pad) 18px">
    <div style="font-size:21px;font-weight:700;letter-spacing:-.02em;color:${verdict[2]}">${verdict[0]}</div>
    <div style="font-size:15px;color:var(--ink-2);margin-top:7px;line-height:1.45">${verdict[1]}</div>
  </div>

  ${crit('Тест: ситуации и логика', sc.testPct, sc.testPct >= 70 ? 'ok' : 'mid')}
  ${crit('Видеоответы: полнота', sc.videoPct, sc.videoPct >= 70 ? 'ok' : 'mid')}
  ${crit('Соответствие профилю вакансии', sc.profilePct, sc.profilePct >= 70 ? 'ok' : 'mid')}

  <div class="info-card" style="margin-top:16px">
    <span style="font-size:24px">${art.lock}</span>
    <span>Работодатель ${esc(job.company)} увидит оценку, ответы теста и видео. Другим компаниям результат не показывается.</span>
  </div>
  <div class="hint" style="padding-top:14px">Оценка в прототипе считается арифметически по вашим ответам. В боевой версии — модель, обученная на успешных наймах, с обязательной проверкой человеком.</div>
  <div style="height:10px"></div>
</div>
<div class="sticky-foot">
  <button class="btn-primary" id="send">Отправить отклик</button>
  <div class="legal"><u id="again">Перепройти скрининг</u></div>
</div>`;

  return {
    html,
    mount(root) {
      root.querySelector('#send').addEventListener('click', () => finishResponse(sc));
      root.querySelector('#again').addEventListener('click', () => {
        session.answers = [];
        session.videos = [];
        nav.replace('vcvTest', { i: 0 });
      });
    },
  };
}

// ── Завершение отклика ────────────────────────────────────────────────────
function finishResponse(score) {
  const job = getJob(session.jobId);
  const resume = store.get().resumes.find((r) => r.id === session.resumeId);

  const resp = store.addResponse({
    vacancyId: job.id,
    vacancy: {
      id: job.id, title: job.title, company: job.company,
      salaryMin: job.salaryMin, salaryMax: job.salaryMax, kind: job.kind,
    },
    vcv: score,
    resumeName: resume?.name || 'Без резюме',
    cover: session.cover,
  });

  store.pushMessage(resp.id, {
    from: 'sys',
    text: score
      ? `Отклик отправлен с результатом VCV-скрининга: ${score.total} из 100`
      : 'Отклик отправлен без VCV-скрининга',
  });
  store.pushMessage(resp.id, {
    from: 'me',
    text: session.cover || 'Отклик на вакансию',
  });

  session = null;
  startEmployerReply(resp.id);
  nav.tab('home');
  nav.go('rabota');
  nav.go('chat', { id: resp.id });
  toast('Отклик отправлен');
}

export const applyScreens = {
  resumes, resumeNew, resumeLink, resumeFile,
  apply, vcvIntro, vcvTest, vcvVideo, vcvProcessing, vcvResult,
};
