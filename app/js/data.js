// Слой данных: вакансии Альфа-Банка, партнёров Alfa Group и живая лента
// с opendata.trudvsem.ru («Работа России»). Снапшот лежит рядом — на случай,
// если во время демо API недоступен.

import { expBucket } from './util.js';

// ── Вакансии Альфа-Банка ──────────────────────────────────────────────────
// Реальные вакансии с официального сайта job.alfabank.ru: срез снят скриптом
// tools-alfa.mjs через тот же открытый API, которым пользуется сам сайт.
let ALFA = [];

export const alfaJobs = () => ALFA;

export async function loadAlfaJobs() {
  if (ALFA.length) return ALFA;
  try {
    const r = await fetch('data/alfa-vacancies.json');
    const raw = await r.json();
    ALFA = raw.map((v) => ({ ...v, kind: 'alfa', source: 'job.alfabank.ru' }));
  } catch {
    ALFA = [];
  }
  return ALFA;
}

// ── Вакансии компаний Alfa Group ──────────────────────────────────────────
// Реальные вакансии Пятёрочки, Перекрёстка и АльфаСтрахования: срез снят
// скриптом tools-alfagroup.mjs с opendata.trudvsem.ru по ОГРН компаний.
let GROUP = [];

export const groupJobs = () => GROUP;

export async function loadGroupJobs() {
  if (GROUP.length) return GROUP;
  try {
    const r = await fetch('data/alfagroup-vacancies.json');
    const raw = await r.json();
    GROUP = raw.map((v) => ({ ...v, kind: 'group', source: 'trudvsem' }));
  } catch {
    GROUP = [];
  }
  return GROUP;
}

// ── Живая лента «Работа России» ───────────────────────────────────────────
const API = 'https://opendata.trudvsem.ru/api/v1/vacancies';
const REGION_CODE = {
  'Москва': '7700000000',
  'Санкт-Петербург': '7800000000',
  'Московская область': '5000000000',
  'Екатеринбург': '6600000000',
  'Казань': '1600000000',
};

// Признак удалёнки ищем только по режиму работы и названию: в тексте обязанностей
// «дом» ловится на «домов», «домашний» и т.п.
const REMOTE_RE = /дистанционн|удалённ|удаленн|на дому|из дома|надомн/i;

const sentence = (s) => {
  const t = String(s || '').trim();
  return t ? t.charAt(0).toLocaleUpperCase('ru') + t.slice(1) : '';
};

const cleanAddress = (s) =>
  String(s || '')
    .replace(/(дом|корпус|строение|офис\/квартира|владение)\s*:\s*/gi, '')
    .replace(/\s*;\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .trim();

/** Приводит запись API к внутреннему формату вакансии. */
function normalize(v, cityName) {
  const title = String(v['job-name'] || '').trim();
  const duty = String(v.duty || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const reqs = String(v.requirements || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    id: 'tv-' + v.id,
    title: title.charAt(0).toLocaleUpperCase('ru') + title.slice(1),
    company: String(v.company?.name || 'Работодатель').replace(/["«»]/g, '').trim(),
    salaryMin: v.salary_min || 0,
    salaryMax: v.salary_max || 0,
    city: cityName,
    address: cleanAddress(v.addresses?.address?.[0]?.location),
    schedule: /гибк|сменн|свободн/i.test(v.schedule || '') ? 'free' : '5/2',
    scheduleRaw: v.schedule || '',
    employment: /частичн|неполн/i.test(v.schedule || '') ? 'part' : 'full',
    format: REMOTE_RE.test(`${v.schedule || ''} ${title}`) ? 'remote' : 'office',
    experience: v.requirement?.experience ?? 0,
    education: v.requirement?.education || '',
    level: '',
    track: v.category?.specialisation || 'Другое',
    desc: sentence((duty || reqs).slice(0, 220)),
    dutyText: duty,
    reqsText: reqs,
    date: v['creation-date'] || '',
    url: v.vac_url || '',
    kind: 'partner',
    source: 'trudvsem',
  };
}

/** Из снапшота (уже нормализованного скриптом) — в тот же внутренний формат. */
function fromSnapshot(v) {
  const title = String(v.title || '');
  return {
    id: 'tv-' + v.id,
    title: title.charAt(0).toLocaleUpperCase('ru') + title.slice(1),
    company: v.company,
    salaryMin: v.salaryMin, salaryMax: v.salaryMax,
    city: v.city, address: v.address,
    schedule: /гибк|сменн|свободн/i.test(v.schedule || '') ? 'free' : '5/2',
    scheduleRaw: v.schedule,
    employment: /частичн|неполн/i.test(v.schedule || '') ? 'part' : 'full',
    format: REMOTE_RE.test(`${v.schedule || ''} ${title}`) ? 'remote' : 'office',
    experience: v.experience, education: v.education, level: '',
    track: v.specialisation || 'Другое',
    desc: sentence((v.duty || v.requirements || '').slice(0, 220)),
    dutyText: v.duty, reqsText: v.requirements,
    date: v.date, url: v.url,
    kind: 'partner', source: 'trudvsem',
  };
}

let snapshotCache = null;
let liveCache = null;

export async function loadSnapshot() {
  if (snapshotCache) return snapshotCache;
  try {
    const r = await fetch('data/trudvsem-snapshot.json');
    const raw = await r.json();
    snapshotCache = raw.map(fromSnapshot);
  } catch {
    snapshotCache = [];
  }
  return snapshotCache;
}

/** Живой запрос к API. Возвращает [] при любой ошибке — фолбэк остаётся видимым. */
export async function loadLive(city = 'Москва', limit = 60) {
  const code = REGION_CODE[city] || REGION_CODE['Москва'];
  const key = code + ':' + limit;
  if (liveCache?.key === key) return liveCache.data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(`${API}/region/${code}?offset=0&limit=${limit}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const list = (j?.results?.vacancies || [])
      .map((x) => x.vacancy)
      .filter((v) => v && v['job-name'])
      .map((v) => normalize(v, city));
    liveCache = { key, data: list };
    return list;
  } catch {
    return [];
  }
}

// ── Фильтры ───────────────────────────────────────────────────────────────
export const FILTER_DEFS = {
  track: {
    label: 'Направление',
    // Названия направлений банка — как они заданы в его же API
    options: [
      'Управление продуктами', 'Аналитика', 'Data', 'IT-инфраструктура', 'Кибербезопасность',
      'Работа с бизнесом', 'Розничные продажи', 'Работа в отделении', 'Поддержка клиентов',
      'Менеджмент в продажах', 'Финансы, казначейство', 'Маркетинг и PR', 'Управление рисками',
      'Доставка', 'Ритейл', 'Логистика', 'Страхование', 'Продажи', 'Инвестиции', 'Производство',
    ],
  },
  exp: {
    label: 'Опыт',
    options: [['no', 'Без опыта'], ['lt1', 'До 1 года'], ['1-5', '1 — 5 лет'], ['gt5', 'Более 5 лет']],
  },
  level: { label: 'Уровень', options: ['Junior', 'Middle', 'Senior', 'Lead'] },
  format: {
    label: 'Формат',
    options: [['office', 'Из офиса'], ['hybrid', 'Гибрид'], ['remote', 'Из дома'], ['field', 'Разъездной']],
  },
  schedule: { label: 'График', options: [['5/2', '5/2'], ['2/2', '2/2'], ['free', 'Свободный']] },
  employment: { label: 'Занятость', options: [['full', 'Полная'], ['part', 'Частичная']] },
};

export const emptyFilters = () => ({
  track: [], exp: [], level: [], format: [], schedule: [], employment: [],
  salaryFrom: 0, noExperience: false, combine: false, fastResponse: false,
});

export function countActive(f) {
  if (!f) return 0;
  let n = 0;
  for (const k of ['track', 'exp', 'level', 'format', 'schedule', 'employment']) n += (f[k] || []).length;
  if (f.salaryFrom > 0) n++;
  if (f.noExperience) n++;
  if (f.combine) n++;
  if (f.fastResponse) n++;
  return n;
}

export function applyFilters(list, f, query = '') {
  if (!f && !query) return list;
  const q = query.trim().toLowerCase();
  return list.filter((v) => {
    if (q && !(`${v.title} ${v.company} ${v.desc}`.toLowerCase().includes(q))) return false;
    if (!f) return true;
    if (f.track.length && !f.track.includes(v.track)) return false;
    if (f.exp.length && !f.exp.includes(expBucket(v.experience))) return false;
    if (f.level.length && !f.level.includes(v.level)) return false;
    if (f.format.length && !f.format.includes(v.format)) return false;
    if (f.schedule.length && !f.schedule.includes(v.schedule)) return false;
    if (f.employment.length && !f.employment.includes(v.employment)) return false;
    if (f.salaryFrom > 0 && (v.salaryMax || v.salaryMin || 0) < f.salaryFrom) return false;
    if (f.noExperience && Number(v.experience) > 0) return false;
    if (f.combine && v.employment !== 'part' && v.schedule !== 'free') return false;
    return true;
  });
}

export const FORMAT_LABEL = { office: 'Из офиса', hybrid: 'Гибрид', remote: 'Из дома', field: 'Разъездной' };
export const EMPLOY_LABEL = { full: 'Полная занятость', part: 'Частичная занятость' };

// ── Карточки работодателей ────────────────────────────────────────────────
// Для банка и компаний Alfa Group описания написаны под демонстрацию.
// Для работодателей из API «Работа России» профиль собирается из их же
// вакансий — выдумывать факты о реальных компаниях мы не станем.
const COMPANY_INFO = {
  'Альфа-Банк': {
    industry: 'Банк · Финансы', size: 'более 30 000 сотрудников', founded: 1990,
    about: 'Крупнейший частный банк России. Обслуживаем 30 миллионов частных клиентов и более миллиона компаний, работаем в 400 городах. Продуктовые команды устроены как в IT-компании: своя дизайн-система, A/B-платформа и релизы каждую неделю.',
    perks: ['ДМС со стоматологией с первого дня', 'Гибрид или удалёнка для части ролей', 'Годовой бонус до 4 окладов', 'Оплата обучения и конференций', 'Корпоративный психолог и спортзал'],
    hiring: 'Отвечаем на отклик в течение 2 рабочих дней. Процесс: созвон с нанимающим менеджером, встреча с командой, оффер.',
  },
  'Пятёрочка': {
    industry: 'Розничная торговля', size: 'более 300 000 сотрудников', founded: 1999,
    about: 'Сеть магазинов у дома, входит в X5 Group. Более 21 000 магазинов в 70 регионах — по числу точек крупнейшая продуктовая розница страны.',
    perks: ['Оформление по ТК с первого дня', 'Магазин рядом с домом', 'Скидка сотрудникам на покупки', 'Карьерный трек до директора магазина', 'Обучение за счёт компании'],
    hiring: 'Массовый подбор: решение по отклику обычно в тот же день.',
  },
  'Перекрёсток': {
    industry: 'Розничная торговля', size: 'более 60 000 сотрудников', founded: 1995,
    about: 'Сеть супермаркетов X5 Group: свежие продукты, готовая еда собственного производства, онлайн-доставка. Около 1 000 супермаркетов в России.',
    perks: ['Оформление по ТК', 'Скидка сотрудникам', 'Бесплатное питание в части магазинов', 'Обучение и наставник'],
    hiring: 'Ответ по отклику — в течение 1–2 дней.',
  },
  'АльфаСтрахование': {
    industry: 'Страхование', size: 'более 20 000 сотрудников', founded: 1992,
    about: 'Одна из крупнейших страховых групп России: ОСАГО, КАСКО, ДМС, страхование имущества и путешествий. Входит в консорциум «Альфа-Групп».',
    perks: ['ДМС для сотрудника и семьи', 'Гибрид после испытательного срока', 'Скидки на страховые продукты', 'Белая зарплата'],
    hiring: 'Первый ответ в течение 3 рабочих дней.',
  },
  'Альфа-Лизинг': {
    industry: 'Лизинг · Финансы', size: 'около 1 500 сотрудников', founded: 1999,
    about: 'Лизинг транспорта, спецтехники и оборудования для бизнеса. Работаем с компаниями от малого бизнеса до промышленных холдингов.',
    perks: ['Комиссия без потолка', 'Автомобиль или компенсация', 'ДМС', 'Зарплатный проект Альфа-Банка'],
    hiring: 'Отклики смотрит нанимающий менеджер, ответ — до 3 дней.',
  },
  'Альфа-Капитал': {
    industry: 'Управление активами', size: 'около 900 сотрудников', founded: 1992,
    about: 'Управляющая компания: паевые фонды, доверительное управление, инвестиционные решения для частных и корпоративных клиентов.',
    perks: ['Высокая переменная часть', 'Обучение и аттестация ФСФР за счёт компании', 'ДМС'],
    hiring: 'Два этапа: интервью с руководителем и кейс-встреча.',
  },
  'Росводоканал': {
    industry: 'ЖКХ · Водоснабжение', size: 'более 9 000 сотрудников', founded: 2003,
    about: 'Оператор систем водоснабжения и водоотведения в семи городах России. Обслуживаем более 6 миллионов жителей.',
    perks: ['Стабильная белая зарплата', 'ДМС', 'Спецодежда и оборудование', 'Обучение за счёт компании'],
    hiring: 'Ответ на отклик — до 5 рабочих дней.',
  },
  'IDS Borjomi Russia': {
    industry: 'Производство напитков', size: 'около 3 000 сотрудников', founded: 1995,
    about: 'Производитель и дистрибьютор минеральной воды и напитков. Портфель включает «Боржоми», «Святой источник» и другие марки.',
    perks: ['Компенсация ГСМ и амортизации', 'Бонус за выполнение плана', 'Корпоративная связь', 'ДМС'],
    hiring: 'Массовый подбор в полях, ответ обычно в течение дня.',
  },
};

/**
 * Собирает профиль работодателя. Известным компаниям — написанное описание,
 * остальным — факты, выведенные из их собственных вакансий.
 */
export function companyProfile(name, jobs) {
  const known = COMPANY_INFO[name];
  const cities = [...new Set(jobs.map((j) => j.city).filter(Boolean))];
  const tracks = [...new Set(jobs.map((j) => j.track).filter(Boolean))];
  const salaries = jobs.map((j) => j.salaryMax || j.salaryMin).filter(Boolean);
  const isAlfa = jobs.some((j) => j.kind === 'alfa');
  const isGroup = jobs.some((j) => j.kind === 'group');
  const holding = jobs.find((j) => j.holding)?.holding || null;

  return {
    name,
    isAlfa,
    isGroup,
    holding,
    legalName: jobs.find((j) => j.legalName)?.legalName || null,
    verified: isAlfa || isGroup,
    fromApi: jobs.every((j) => j.source === 'trudvsem'),
    industry: known?.industry || tracks[0] || 'Работодатель',
    size: known?.size || null,
    founded: known?.founded || null,
    about: known?.about || null,
    perks: known?.perks || null,
    hiring: known?.hiring || null,
    jobs,
    cities,
    tracks,
    salaryMin: salaries.length ? Math.min(...salaries) : 0,
    salaryMax: salaries.length ? Math.max(...salaries) : 0,
  };
}
