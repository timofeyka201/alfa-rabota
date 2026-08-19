// Одноразовый скрипт: снимает снапшот вакансий с opendata.trudvsem.ru
// для мгновенного первого рендера и офлайн-фолбэка прототипа.
import { writeFileSync } from 'node:fs';

const REGIONS = [
  ['7700000000', 'Москва'],
  ['7800000000', 'Санкт-Петербург'],
  ['5000000000', 'Московская область'],
  ['6600000000', 'Екатеринбург'],
  ['1600000000', 'Казань'],
];

const clean = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const cleanAddress = (s) =>
  clean(s)
    .replace(/(дом|корпус|строение|офис\/квартира|владение)\s*:\s*/gi, '')
    .replace(/\s*;\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .replace(/^г\s+/, 'г. ');

const cleanCompany = (s) =>
  clean(s).replace(/["«»]/g, '').replace(/\s+/g, ' ').trim();

async function grab(code, offset, limit = 100) {
  const url = `https://opendata.trudvsem.ru/api/v1/vacancies/region/${code}?offset=${offset}&limit=${limit}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) return [];
  const j = await r.json();
  return j?.results?.vacancies || [];
}

const out = [];
const perCompany = new Map();

for (const [code, cityName] of REGIONS) {
  let kept = 0;
  for (const offset of [0, 100, 200, 300, 400]) {
    const list = await grab(code, offset);
    for (const item of list) {
      const v = item.vacancy;
      if (!v) continue;
      const company = cleanCompany(v.company?.name);
      if (!company || !v['job-name']) continue;
      // не больше 2 вакансий на компанию — иначе лента получается однообразной
      const n = perCompany.get(company) || 0;
      if (n >= 2) continue;
      const duty = clean(v.duty);
      const req = clean(v.requirements);
      if (duty.length + req.length < 120) continue; // пустышки не берём
      perCompany.set(company, n + 1);
      out.push({
        id: v.id,
        title: clean(v['job-name']).replace(/^\w/, (c) => c.toUpperCase()),
        company,
        salaryMin: v.salary_min || 0,
        salaryMax: v.salary_max || 0,
        city: cityName,
        address: cleanAddress(v.addresses?.address?.[0]?.location),
        schedule: clean(v.schedule),
        experience: v.requirement?.experience ?? 0,
        education: clean(v.requirement?.education),
        requirements: req.slice(0, 900),
        duty: duty.slice(0, 1300),
        specialisation: clean(v.category?.specialisation),
        date: v['creation-date'] || '',
        url: v.vac_url || '',
      });
      kept++;
    }
    if (kept >= 45) break;
  }
  console.error(`${cityName}: ${kept}`);
}

writeFileSync('app/data/trudvsem-snapshot.json', JSON.stringify(out), 'utf8');
console.error('saved', out.length);
