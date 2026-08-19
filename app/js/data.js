// Слой данных: вакансии Альфа-Банка, партнёров Alfa Group и живая лента
// с opendata.trudvsem.ru («Работа России»). Снапшот лежит рядом — на случай,
// если во время демо API недоступен.

import { expBucket } from './util.js';

// ── Вакансии в Альфа-Банке ────────────────────────────────────────────────
export const ALFA_JOBS = [
  {
    id: 'alfa-1', title: 'Продакт-менеджер, Альфа-Мобайл', company: 'Альфа-Банк',
    salaryMin: 250000, salaryMax: 380000, city: 'Москва', address: 'Москва, ул. Каланчёвская, 27',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 3, level: 'Middle',
    track: 'Продукт и аналитика', team: 'Мобильный банк',
    desc: 'Развиваем главный экран Альфа-Мобайла: гипотезы, A/B-тесты, метрики вовлечения.',
    duties: [
      'Отвечать за метрики продукта: DAU, конверсия в целевые действия, retention',
      'Формировать бэклог и приоритизировать гипотезы вместе с командой разработки',
      'Проводить кастдевы и анализировать пользовательские сценарии',
      'Запускать A/B-тесты и доводить успешные эксперименты до раскатки на 100%',
    ],
    reqs: [
      'Опыт в продуктовой роли от 3 лет, желательно в финтехе или маркетплейсе',
      'Уверенный SQL, умение самостоятельно достать данные и посчитать метрику',
      'Опыт запуска A/B-тестов и работы с продуктовой аналитикой',
    ],
    perks: ['ДМС со стоматологией с первого дня', 'Гибрид: 2 дня из дома', 'Годовой бонус до 4 окладов', 'Обучение за счёт банка'],
  },
  {
    id: 'alfa-2', title: 'Frontend-разработчик (React)', company: 'Альфа-Банк',
    salaryMin: 280000, salaryMax: 400000, city: 'Москва', address: 'Удалённо по России',
    format: 'remote', schedule: '5/2', employment: 'full', experience: 3, level: 'Senior',
    track: 'Разработка', team: 'Веб-платформа',
    desc: 'Пишем интерфейсы Альфа-Онлайн: React, TypeScript, собственная дизайн-система.',
    duties: [
      'Разрабатывать пользовательские интерфейсы на React + TypeScript',
      'Развивать внутреннюю библиотеку компонентов дизайн-системы',
      'Следить за производительностью: Core Web Vitals, размер бандла',
      'Участвовать в код-ревью и наставничестве джунов',
    ],
    reqs: ['React и TypeScript от 3 лет', 'Понимание браузерных API и производительности', 'Опыт с тестами: Jest, Playwright'],
    perks: ['Полная удалёнка по России', 'Своё железо на выбор', 'ДМС для сотрудника и детей', 'Оплата конференций'],
  },
  {
    id: 'alfa-3', title: 'Backend-разработчик (Java / Kotlin)', company: 'Альфа-Банк',
    salaryMin: 300000, salaryMax: 450000, city: 'Москва', address: 'Удалённо по России',
    format: 'remote', schedule: '5/2', employment: 'full', experience: 4, level: 'Senior',
    track: 'Разработка', team: 'Платёжное ядро',
    desc: 'Высоконагруженные сервисы платежей: 3 000 транзакций в секунду в пике.',
    duties: [
      'Проектировать и разрабатывать микросервисы на Kotlin/Java',
      'Обеспечивать отказоустойчивость платёжных сценариев',
      'Работать с Kafka, PostgreSQL, Kubernetes',
      'Участвовать в дежурствах по своим сервисам',
    ],
    reqs: ['Java/Kotlin от 4 лет', 'Опыт с высоконагруженными распределёнными системами', 'Kafka, PostgreSQL, Docker/K8s'],
    perks: ['Удалённо или гибрид', 'Годовой бонус', 'ДМС премиум', 'Спортзал и корпоративный психолог'],
  },
  {
    id: 'alfa-4', title: 'Data Scientist (кредитный скоринг)', company: 'Альфа-Банк',
    salaryMin: 320000, salaryMax: 480000, city: 'Москва', address: 'Москва, гибрид',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 3, level: 'Senior',
    track: 'Данные и ML', team: 'Риски',
    desc: 'Строим модели, которые решают, кому и на каких условиях выдать кредит.',
    duties: [
      'Разрабатывать и валидировать скоринговые модели',
      'Работать с альтернативными источниками данных',
      'Внедрять модели в продакшн вместе с ML-инженерами',
      'Мониторить дрейф моделей и качество прогнозов',
    ],
    reqs: ['Python, scikit-learn, градиентный бустинг', 'Понимание метрик качества: ROC-AUC, Gini, KS', 'Опыт вывода моделей в прод'],
    perks: ['Гибрид 2/3', 'Собственный ML-кластер', 'Публикации и конференции', 'ДМС'],
  },
  {
    id: 'alfa-5', title: 'Специалист контактного центра', company: 'Альфа-Банк',
    salaryMin: 65000, salaryMax: 95000, city: 'Москва', address: 'Работа из дома',
    format: 'remote', schedule: 'free', employment: 'part', experience: 0, level: 'Junior',
    track: 'Работа с клиентами', team: 'Поддержка',
    desc: 'Помогаем клиентам в чате и по телефону. Обучение оплачивается, старт через 5 дней.',
    duties: [
      'Консультировать клиентов по продуктам банка в чате и по телефону',
      'Решать вопросы по картам, переводам и мобильному приложению',
      'Фиксировать обращения в CRM',
    ],
    reqs: ['Грамотная речь и письмо', 'Компьютер и стабильный интернет', 'Готовность работать по графику'],
    perks: ['Без опыта — обучаем с нуля', 'Оплачиваемое обучение 5 дней', 'Гибкий график от 20 часов в неделю', 'Карьерный рост до наставника за 6 месяцев'],
  },
  {
    id: 'alfa-6', title: 'Менеджер по работе с клиентами', company: 'Альфа-Банк',
    salaryMin: 95000, salaryMax: 150000, city: 'Москва', address: 'Москва, отделения по городу',
    format: 'office', schedule: '5/2', employment: 'full', experience: 1, level: 'Junior',
    track: 'Работа с клиентами', team: 'Розничная сеть',
    desc: 'Встречаем клиентов в отделении, подбираем продукты, помогаем с оформлением.',
    duties: ['Консультировать клиентов в отделении', 'Оформлять карты, вклады и кредиты', 'Выполнять план продаж'],
    reqs: ['Опыт в продажах или обслуживании от 1 года', 'Среднее специальное или высшее образование'],
    perks: ['Оклад + прозрачная премия', 'Отделение рядом с домом', 'ДМС', 'Карьерный трек до управляющего'],
  },
  {
    id: 'alfa-7', title: 'Персональный менеджер Alfa Only', company: 'Альфа-Банк',
    salaryMin: 180000, salaryMax: 300000, city: 'Москва', address: 'Москва, Пресненская наб., 10',
    format: 'office', schedule: '5/2', employment: 'full', experience: 3, level: 'Middle',
    track: 'Работа с клиентами', team: 'Премиальный банкинг',
    desc: 'Ведём портфель премиальных клиентов: инвестиции, страхование, консьерж.',
    duties: ['Вести портфель из 120–150 премиальных клиентов', 'Подбирать инвестиционные и страховые решения', 'Развивать долгосрочные отношения с клиентами'],
    reqs: ['Опыт в премиальном обслуживании от 3 лет', 'Аттестат ФСФР 1.0 — преимущество', 'Знание инвестиционных продуктов'],
    perks: ['Высокая переменная часть', 'Премиальный ДМС', 'Обучение и аттестация за счёт банка'],
  },
  {
    id: 'alfa-8', title: 'Аналитик данных (SQL / Python)', company: 'Альфа-Банк',
    salaryMin: 180000, salaryMax: 260000, city: 'Москва', address: 'Москва, гибрид',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 2, level: 'Middle',
    track: 'Продукт и аналитика', team: 'Аналитика розницы',
    desc: 'Считаем, как продукты влияют на бизнес, и делаем это понятным для команды.',
    duties: ['Строить дашборды и регулярную отчётность', 'Проводить ad-hoc исследования по запросу продукта', 'Считать эффект от запусков'],
    reqs: ['Уверенный SQL', 'Python: pandas, визуализация', 'Опыт работы с BI-инструментами'],
    perks: ['Гибрид', 'ДМС', 'Оплата обучения', 'Реальное влияние на продукт'],
  },
  {
    id: 'alfa-9', title: 'Продуктовый дизайнер (UX/UI)', company: 'Альфа-Банк',
    salaryMin: 220000, salaryMax: 330000, city: 'Санкт-Петербург', address: 'Санкт-Петербург, гибрид',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 3, level: 'Middle',
    track: 'Дизайн', team: 'Дизайн-система',
    desc: 'Проектируем интерфейсы, которыми пользуются 10 миллионов человек.',
    duties: ['Проектировать пользовательские сценарии от идеи до макета', 'Развивать дизайн-систему', 'Проводить UX-исследования и юзабилити-тесты'],
    reqs: ['Портфолио с продуктовыми кейсами', 'Figma на профессиональном уровне', 'Опыт работы в связке с разработкой'],
    perks: ['Сильная дизайн-команда', 'Гибрид', 'ДМС', 'Оплата курсов и конференций'],
  },
  {
    id: 'alfa-10', title: 'Стажёр Alfa Campus (продукт, аналитика, IT)', company: 'Альфа-Банк',
    salaryMin: 60000, salaryMax: 90000, city: 'Москва', address: 'Москва, гибрид',
    format: 'hybrid', schedule: 'free', employment: 'part', experience: 0, level: 'Junior',
    track: 'Стажировки', team: 'Alfa Campus',
    desc: 'Оплачиваемая стажировка для студентов 3–4 курса. 20–30 часов в неделю, наставник и реальные задачи.',
    duties: ['Работать над реальными задачами продуктовой команды', 'Учиться у наставника', 'Защитить итоговый проект'],
    reqs: ['Студент 3–4 курса или магистратуры', 'Готовность работать от 20 часов в неделю', 'Аналитический склад ума'],
    perks: ['Оплачиваемая стажировка', 'Совмещение с учёбой', 'Оффер в команду по итогам', 'Наставник'],
  },
  {
    id: 'alfa-11', title: 'Инженер по информационной безопасности', company: 'Альфа-Банк',
    salaryMin: 250000, salaryMax: 360000, city: 'Москва', address: 'Москва, гибрид',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 3, level: 'Senior',
    track: 'Разработка', team: 'Кибербезопасность',
    desc: 'Защищаем деньги и данные клиентов: AppSec, мониторинг, реагирование.',
    duties: ['Проводить анализ защищённости приложений', 'Внедрять практики безопасной разработки', 'Участвовать в разборе инцидентов'],
    reqs: ['Опыт в ИБ от 3 лет', 'Понимание OWASP Top 10', 'Опыт с SIEM/SOC — преимущество'],
    perks: ['Гибрид', 'Своя лаборатория', 'Bug bounty-программа', 'ДМС премиум'],
  },
  {
    id: 'alfa-12', title: 'Специалист по раннему взысканию', company: 'Альфа-Банк',
    salaryMin: 75000, salaryMax: 120000, city: 'Москва', address: 'Работа из дома',
    format: 'remote', schedule: 'free', employment: 'full', experience: 0, level: 'Junior',
    track: 'Работа с клиентами', team: 'Взыскание',
    desc: 'Помогаем клиентам вернуться в график платежей на раннем этапе просрочки.',
    duties: ['Общаться с клиентами по телефону', 'Подбирать удобный вариант погашения', 'Фиксировать договорённости в системе'],
    reqs: ['Стрессоустойчивость', 'Грамотная речь', 'Компьютер и интернет'],
    perks: ['Полностью из дома', 'Без опыта', 'Оклад + премия без потолка', 'Обучение 3 дня'],
  },
  {
    id: 'alfa-13', title: 'QA-инженер (автоматизация)', company: 'Альфа-Банк',
    salaryMin: 200000, salaryMax: 300000, city: 'Екатеринбург', address: 'Екатеринбург, гибрид',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 2, level: 'Middle',
    track: 'Разработка', team: 'Качество',
    desc: 'Автотесты для мобильного и веб-банка. Пишем на Kotlin и Python.',
    duties: ['Разрабатывать и поддерживать автотесты', 'Встраивать тесты в CI/CD', 'Анализировать причины падений'],
    reqs: ['Опыт автоматизации от 2 лет', 'Знание одного из: Kotlin, Java, Python', 'Понимание CI/CD'],
    perks: ['Гибрид', 'ДМС', 'Релокационный пакет', 'Обучение'],
  },
  {
    id: 'alfa-14', title: 'HR бизнес-партнёр', company: 'Альфа-Банк',
    salaryMin: 190000, salaryMax: 270000, city: 'Москва', address: 'Москва, ул. Каланчёвская, 27',
    format: 'office', schedule: '5/2', employment: 'full', experience: 3, level: 'Middle',
    track: 'Поддержка бизнеса', team: 'HR',
    desc: 'Партнёрим с IT-командами: подбор, развитие, удержание.',
    duties: ['Сопровождать команды по всем HR-вопросам', 'Участвовать в подборе ключевых ролей', 'Работать с вовлечённостью и оттоком'],
    reqs: ['Опыт HRBP от 3 лет', 'Опыт работы с IT-командами', 'Аналитический подход к HR-метрикам'],
    perks: ['Сильная команда', 'ДМС', 'Гибкое начало дня', 'Обучение'],
  },
].map((j) => ({ ...j, kind: 'alfa', source: 'alfa' }));

// ── Вакансии партнёров Alfa Group ─────────────────────────────────────────
export const PARTNER_JOBS = [
  {
    id: 'p-1', title: 'Директор магазина «Пятёрочка»', company: 'X5 Group',
    partner: true, salaryMin: 110000, salaryMax: 145000, city: 'Москва', address: 'Москва, район по выбору',
    format: 'office', schedule: '5/2', employment: 'full', experience: 1, level: 'Middle',
    track: 'Ритейл',
    desc: 'Управляем магазином у дома: команда 15 человек, выручка, товар, сервис.',
    duties: ['Организовать работу магазина и смены', 'Управлять командой 12–18 человек', 'Отвечать за выручку и списания'],
    reqs: ['Опыт руководства от 1 года в рознице', 'Готовность к работе в графике 5/2'],
    perks: ['Оклад + квартальная премия', 'Магазин рядом с домом', 'ДМС после испытательного', 'Зарплата в Альфа-Банке'],
  },
  {
    id: 'p-2', title: 'Специалист по урегулированию убытков', company: 'АльфаСтрахование',
    partner: true, salaryMin: 90000, salaryMax: 130000, city: 'Москва', address: 'Москва, ул. Шаболовка, 31',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 1, level: 'Junior',
    track: 'Страхование',
    desc: 'Разбираем страховые случаи по КАСКО и ОСАГО, принимаем решения по выплатам.',
    duties: ['Проверять документы по страховым случаям', 'Принимать решение о выплате', 'Общаться с клиентами и СТО'],
    reqs: ['Высшее образование', 'Внимательность к деталям', 'Опыт в страховании — преимущество'],
    perks: ['Гибрид после испытательного', 'ДМС', 'Скидки на страховые продукты'],
  },
  {
    id: 'p-3', title: 'Менеджер по лизингу спецтехники', company: 'Альфа-Лизинг',
    partner: true, salaryMin: 140000, salaryMax: 260000, city: 'Москва', address: 'Москва, гибрид',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 2, level: 'Middle',
    track: 'Продажи',
    desc: 'Продаём лизинг корпоративным клиентам: от переговоров до подписания.',
    duties: ['Искать и вести корпоративных клиентов', 'Структурировать лизинговые сделки', 'Сопровождать сделку до подписания'],
    reqs: ['Опыт B2B-продаж от 2 лет', 'Понимание финансовых продуктов', 'Права категории B'],
    perks: ['Комиссия без потолка', 'Автомобиль или компенсация', 'ДМС', 'Зарплатный проект Альфа-Банка'],
  },
  {
    id: 'p-4', title: 'Инвестиционный консультант', company: 'Альфа-Капитал',
    partner: true, salaryMin: 150000, salaryMax: 280000, city: 'Санкт-Петербург', address: 'Санкт-Петербург, Невский пр., 46',
    format: 'office', schedule: '5/2', employment: 'full', experience: 2, level: 'Middle',
    track: 'Инвестиции',
    desc: 'Консультируем частных инвесторов и подбираем портфельные решения.',
    duties: ['Консультировать клиентов по инвестиционным продуктам', 'Формировать инвестиционные портфели', 'Развивать клиентскую базу'],
    reqs: ['Опыт в инвестициях от 2 лет', 'Аттестат ФСФР 1.0', 'Знание фондового рынка'],
    perks: ['Высокая переменная часть', 'Обучение и аттестация', 'ДМС'],
  },
  {
    id: 'p-5', title: 'Инженер АСУ ТП', company: 'Росводоканал',
    partner: true, salaryMin: 120000, salaryMax: 170000, city: 'Екатеринбург', address: 'Екатеринбург, промзона',
    format: 'office', schedule: '5/2', employment: 'full', experience: 3, level: 'Middle',
    track: 'Производство',
    desc: 'Обслуживаем и модернизируем автоматику водоканала города.',
    duties: ['Обслуживать системы автоматизации', 'Участвовать в модернизации оборудования', 'Вести техническую документацию'],
    reqs: ['Профильное техническое образование', 'Опыт с АСУ ТП от 3 лет', 'Знание SCADA'],
    perks: ['Стабильная белая зарплата', 'ДМС', 'Спецодежда и оборудование', 'Обучение за счёт компании'],
  },
  {
    id: 'p-6', title: 'Торговый представитель', company: 'IDS Borjomi Russia',
    partner: true, salaryMin: 95000, salaryMax: 140000, city: 'Москва', address: 'Москва и область, разъездной',
    format: 'field', schedule: '5/2', employment: 'full', experience: 1, level: 'Junior',
    track: 'Продажи',
    desc: 'Развиваем продажи в своей территории: торговые точки, выкладка, заказы.',
    duties: ['Посещать торговые точки по маршруту', 'Контролировать выкладку и остатки', 'Собирать заказы и вести отчётность'],
    reqs: ['Права категории B и личный автомобиль', 'Опыт в FMCG — преимущество'],
    perks: ['Компенсация ГСМ и амортизации', 'Бонус за выполнение плана', 'Корпоративная связь', 'ДМС'],
  },
  {
    id: 'p-7', title: 'Оператор склада (Перекрёсток Впрок)', company: 'X5 Group',
    partner: true, salaryMin: 70000, salaryMax: 95000, city: 'Московская область', address: 'Московская обл., Домодедово',
    format: 'office', schedule: '2/2', employment: 'full', experience: 0, level: 'Junior',
    track: 'Логистика',
    desc: 'Собираем заказы на складе онлайн-супермаркета. Без опыта, обучаем.',
    duties: ['Комплектовать заказы по терминалу', 'Контролировать сроки годности', 'Соблюдать стандарты склада'],
    reqs: ['Без опыта', 'Готовность к графику 2/2', 'Внимательность'],
    perks: ['Еженедельные выплаты', 'Развозка от метро', 'Питание со скидкой', 'Оформление по ТК с первого дня'],
  },
  {
    id: 'p-8', title: 'Бухгалтер на участок расчётов', company: 'АльфаСтрахование',
    partner: true, salaryMin: 105000, salaryMax: 140000, city: 'Казань', address: 'Казань, ул. Пушкина, 12',
    format: 'hybrid', schedule: '5/2', employment: 'full', experience: 2, level: 'Middle',
    track: 'Финансы',
    desc: 'Ведём участок расчётов с контрагентами в филиале.',
    duties: ['Вести участок расчётов с поставщиками', 'Проводить сверки', 'Готовить отчётность'],
    reqs: ['Опыт бухгалтером от 2 лет', '1С 8.3', 'Знание НК РФ в части расчётов'],
    perks: ['Гибрид 2 дня из дома', 'ДМС', 'Белая зарплата', 'Оплата профобучения'],
  },
].map((j) => ({ ...j, kind: 'partner', source: 'alfa-group' }));

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
    options: ['Работа с клиентами', 'Разработка', 'Продукт и аналитика', 'Дизайн', 'Продажи', 'Ритейл', 'Логистика', 'Финансы', 'Производство', 'Стажировки'],
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
