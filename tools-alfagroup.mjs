// Одноразовый скрипт: снимает вакансии компаний Alfa Group с opendata.trudvsem.ru.
// Компании ищутся по ОГРН — текстового поиска в этом API нет.
// Юрлица переименовываем в узнаваемые бренды, оригинал сохраняем отдельно.
import { writeFileSync } from 'node:fs';

const API = 'https://opendata.trudvsem.ru/api/v1/vacancies/company';

const COMPANIES = [
  { ogrn: '1027809237796', brand: 'Пятёрочка',        holding: 'X5 Group',          cap: 40 },
  { ogrn: '1027700034493', brand: 'Перекрёсток',      holding: 'X5 Group',          cap: 10 },
  { ogrn: '1027739431730', brand: 'АльфаСтрахование', holding: 'Альфа-Групп',       cap: 10 },
];

const clean = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sentence = (s) => (s ? s.charAt(0).toLocaleUpperCase('ru') + s.slice(1) : '');
const REMOTE_RE = /дистанционн|удалённ|удаленн|на дому|из дома|надомн/i;

const cleanAddress = (s) =>
  clean(s).replace(/(дом|корпус|строение|офис\/квартира|владение)\s*:\s*/gi, '')
    .replace(/\s*;\s*/g, ', ').replace(/,\s*,/g, ',').replace(/,\s*$/, '');

/** Город из адреса или региона: «г Москва, ул…» → «Москва». */
function cityOf(v) {
  const addr = clean(v.addresses?.address?.[0]?.location);
  const m = addr.match(/г\.?\s*([А-ЯЁ][а-яё-]+(?:[\s-][А-ЯЁ][а-яё-]+)*)/);
  if (m) return m[1];
  return clean(v.region?.name).replace(/^Город\s+/, '').replace(/\s*-\s*Кузбасс/, '');
}

const BIG_CITIES = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань',
  'Нижний Новгород', 'Челябинск', 'Самара', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Пермь',
  'Воронеж', 'Волгоград', 'Краснодар', 'Тюмень', 'Владивосток', 'Хабаровск', 'Киров'];

/** Ключ для отсева повторов: «Продавец-кассир» и «Продавец кассир» — одно и то же. */
const titleKey = (t) => t.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^а-яёa-z]+/gi, ' ').trim();

const out = [];
for (const c of COMPANIES) {
  // API отдаёт не больше 100 записей за раз — идём страницами
  const list = [];
  for (const offset of [0, 100, 200, 300]) {
    const r = await fetch(`${API}/${c.ogrn}?offset=${offset}&limit=100`);
    if (!r.ok) break;
    const j = await r.json();
    const page = (j?.results?.vacancies || []).map((x) => x.vacancy).filter(Boolean);
    list.push(...page);
    if (page.length < 100) break;
  }

  // Сначала крупные города и вакансии с описанием, затем всё остальное
  const scored = list.map((v) => {
    const city = cityOf(v);
    const duty = clean(v.duty) + clean(v.requirements);
    return { v, city, score: (BIG_CITIES.includes(city) ? 5 : 0) + (duty.length > 200 ? 2 : 0) + (v.salary_min ? 1 : 0) };
  }).sort((a, b) => b.score - a.score);

  const seen = new Set();
  let kept = 0;
  for (const { v, city } of scored) {
    if (kept >= c.cap) break;
    const title = clean(v['job-name']);
    const key = titleKey(title) + '|' + city;
    if (seen.has(key)) continue;
    const duty = clean(v.duty);
    const reqs = clean(v.requirements);
    if (duty.length + reqs.length < 60) continue;
    seen.add(key);
    kept++;

    const schedule = clean(v.schedule);
    out.push({
      id: 'ag-' + v.id,
      title: sentence(title),
      company: c.brand,
      legalName: clean(v.company?.name),
      holding: c.holding,
      partner: true,
      salaryMin: v.salary_min || 0,
      salaryMax: v.salary_max || 0,
      city,
      address: cleanAddress(v.addresses?.address?.[0]?.location),
      format: REMOTE_RE.test(`${schedule} ${title}`) ? 'remote' : 'office',
      schedule: /гибк|сменн|свободн/i.test(schedule) ? 'free' : '5/2',
      scheduleRaw: schedule,
      employment: /частичн|неполн/i.test(schedule) ? 'part' : 'full',
      experience: v.requirement?.experience ?? 0,
      education: clean(v.requirement?.education),
      level: '',
      track: clean(v.category?.specialisation) || 'Ритейл',
      desc: sentence(clean(duty || reqs).slice(0, 200)),
      dutyText: duty.slice(0, 1400),
      reqsText: reqs.slice(0, 900),
      date: v['creation-date'] || '',
      url: v.vac_url || '',
    });
  }
  console.error(`${c.brand}: найдено ${list.length}, взято ${kept}`);
}

writeFileSync('app/data/alfagroup-vacancies.json', JSON.stringify(out), 'utf8');
console.error('всего сохранено:', out.length);
console.error('городов:', new Set(out.map((v) => v.city)).size, '| с зарплатой:', out.filter((v) => v.salaryMin).length);
