// Одноразовый скрипт: снимает реальные вакансии Альфа-Банка с официального
// сайта job.alfabank.ru (тот же открытый API, которым пользуется сам сайт).
// Зарплату банк там публикует не всегда — вытаскиваем её из текста условий,
// а где не нашли, честно оставляем «по договорённости».
import { writeFileSync } from 'node:fs';

const API = 'https://job.alfabank.ru/api/vacancies';
const UA = { 'User-Agent': 'Mozilla/5.0 Chrome/126' };

const JOB_TYPE = {
  1002: ['field', 'Разъездная работа'],
  1003: ['remote', 'Дистанционная работа'],
  1005: ['office', 'Центральный офис'],
  1006: ['hybrid', 'Digital / IT'],
  1007: ['office', 'Клиентский сервис'],
};
const EXP_YEARS = {
  custom_voc_5_entry_1: 0, custom_voc_5_entry_2: 1, custom_voc_5_entry_5: 2,
  custom_voc_5_entry_3: 3, custom_voc_5_entry_6: 4, custom_voc_5_entry_4: 6,
};

const clean = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Разбивает блок «- пункт\n- пункт» в массив. */
const bullets = (s, limit = 8) =>
  String(s || '').split(/\r?\n/).map((x) => clean(x).replace(/^[-–•]\s*/, ''))
    .filter((x) => x.length > 8).slice(0, limit);

/** Зарплата из текста: берём только строки, где рядом есть слово про деньги. */
function extractSalary(text) {
  const nums = [];
  for (const line of String(text || '').split(/\r?\n|;/)) {
    if (!/зарплат|оклад|доход|заработ|платим|руб|₽/i.test(line)) continue;
    for (const m of line.matchAll(/(\d{2,3}[  ]?\d{3})\s*(?:руб|₽|р\.)?/g)) {
      const n = Number(m[1].replace(/[  ]/g, ''));
      if (n >= 25000 && n <= 700000) nums.push(n);
    }
  }
  if (!nums.length) return [0, 0];
  return [Math.min(...nums), Math.max(...nums)];
}

const levelOf = (title) =>
  /ведущ|главн|старш|руководител|директор|начальник|lead|head/i.test(title) ? 'Senior'
  : /младш|стажёр|стажер|ассистент|junior/i.test(title) ? 'Junior'
  : 'Middle';

const CITY_LABEL = {
  moskva: 'Москва', 'sankt-peterburg': 'Санкт-Петербург', ekaterinburg: 'Екатеринбург',
  novosibirsk: 'Новосибирск', krasnodar: 'Краснодар', kazan: 'Казань', samara: 'Самара',
  'nizhnii-novgorod': 'Нижний Новгород', 'rostov-na-donu': 'Ростов-на-Дону', ufa: 'Уфа',
  cheliabinsk: 'Челябинск', krasnoiarsk: 'Красноярск', vladivostok: 'Владивосток',
  'liuboi-gorod': 'Любой город', barnaul: 'Барнаул', voronezh: 'Воронеж', perm: 'Пермь',
};

const res = await fetch(`${API}?take=2500&skip=0`, { headers: UA });
const items = (await res.json()).items || [];
console.error('получено с сайта:', items.length);

// Курируем: разные направления и города, без повторов должностей
const PRIORITY_CITIES = ['moskva', 'sankt-peterburg', 'ekaterinburg', 'novosibirsk', 'kazan', 'krasnodar', 'liuboi-gorod'];
const seenTitle = new Set();
const perLine = new Map();
const picked = [];

const score = (v) => {
  const citySlug = String(v.slug || '').split('/')[1];
  let s = 0;
  if (PRIORITY_CITIES.includes(citySlug)) s += 3;
  if (citySlug === 'moskva') s += 2;
  if (extractSalary(v.conditions + ' ' + v.descriptionText)[0]) s += 3;
  if ((v.duties || '').length > 120) s += 2;
  if ((v.requirements || '').length > 80) s += 1;
  return s;
};

for (const v of [...items].sort((a, b) => score(b) - score(a))) {
  const title = clean(v.name);
  const key = title.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/\s+в?\s*г\.?\s.*$/, '').trim();
  if (seenTitle.has(key)) continue;
  const line = v.businessLineId || 'other';
  const n = perLine.get(line) || 0;
  if (n >= 6) continue;              // не больше 6 вакансий на направление
  if (!v.duties || !v.requirements) continue;
  seenTitle.add(key);
  perLine.set(line, n + 1);
  picked.push(v);
  if (picked.length >= 60) break;
}
console.error('отобрано:', picked.length);

// Добираем резолвленные названия города/направления из карточки вакансии
const out = [];
for (const v of picked) {
  const r = await fetch(`${API}/${v.id}`, { headers: UA });
  if (!r.ok) continue;
  const d = await r.json();
  const [smin, smax] = extractSalary(`${v.conditions}\n${v.descriptionText}`);
  const typeId = (v.jobTypeIds || [])[0];
  const [format] = JOB_TYPE[typeId] || ['office'];
  const citySlug = String(v.slug || '').split('/')[1];
  const duties = bullets(v.duties);
  out.push({
    id: 'ab-' + v.id,
    title: clean(v.name),
    company: 'Альфа-Банк',
    city: d.city || CITY_LABEL[citySlug] || 'Москва',
    address: d.city || CITY_LABEL[citySlug] || 'Москва',
    salaryMin: smin, salaryMax: smax,
    format,
    schedule: format === 'remote' ? 'free' : '5/2',
    employment: 'full',
    experience: EXP_YEARS[v.experienceId] ?? 0,
    level: levelOf(v.name),
    track: d.businessLine || 'Другое',
    team: clean(v.groupName) || '',
    desc: clean(duties[0] || v.descriptionText).slice(0, 180),
    duties,
    reqs: bullets(v.requirements, 7),
    perks: bullets(v.conditions, 6),
    date: (v.createdAt || '').slice(0, 10),
    url: 'https://job.alfabank.ru/vacancies' + v.slug,
  });
}

writeFileSync('app/data/alfa-vacancies.json', JSON.stringify(out), 'utf8');
console.error('сохранено:', out.length);
console.error('с зарплатой:', out.filter((v) => v.salaryMin).length);
console.error('направлений:', new Set(out.map((v) => v.track)).size, '| городов:', new Set(out.map((v) => v.city)).size);
