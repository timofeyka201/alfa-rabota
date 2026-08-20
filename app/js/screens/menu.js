// Бургер-меню сервиса и экраны программы «Альфа-Карьера».

import { ico, statusBar, homeIndicator, esc, toast, num, plural } from '../util.js';
import { art } from '../art.js';
import { store } from '../store.js';
import { nav } from '../router.js';
import {
  levelOf, LEVELS, REWARDS, claimReward, questState, claimQuest,
  achievementState, streakDays, ACTIONS,
} from '../gamify.js';

// ── Выдвижное меню ────────────────────────────────────────────────────────
// Живёт вне роутера: это оверлей поверх текущего экрана, а не отдельный шаг
// навигации — иначе кнопка «назад» вела бы обратно в меню.
export function openDrawer() {
  const app = document.getElementById('app');
  if (app.querySelector('.drawer')) return;

  const s = store.get();
  const lvl = levelOf(s.game.earned);
  const unread = store.unreadTotal();
  const quests = questState().filter((q) => q.done && !q.claimed).length;

  const items = [
    ['resumes', art.doc, 'Резюме', s.resumes.length || ''],
    ['responses', art.heartRed, 'Отклики', s.responses.length || '', unread],
    ['favorites', art.folder, 'Сохранённые', s.favorites.length || ''],
    ['shifts', art.clock, 'Альфа-Подработка', 'новое'],
    ['progress', art.star, 'Мой прогресс', '', quests],
    ['resumeGuide', art.search, 'Как составить резюме', ''],
    ['rabotaProfile', art.gear, 'Настройки поиска', ''],
    ['employer', art.handshake, 'Для работодателей', ''],
  ];

  const el = document.createElement('div');
  el.className = 'drawer';
  el.innerHTML = `
    <div class="drawer__back"></div>
    <aside class="drawer__panel">
      <div class="drawer__head">
        <div class="drawer__row">
          <div class="avatar" style="width:52px;height:52px">${ico.person}</div>
          <div style="flex:1 1 auto;min-width:0">
            <div class="drawer__name">${esc(s.user.name)}</div>
            <div class="drawer__lvl">${lvl.n} уровень · ${esc(lvl.name)}</div>
          </div>
        </div>
        <div class="lvl-bar"><i style="width:${lvl.progress}%"></i></div>
        <div class="drawer__pts">
          <b>${num(s.game.points)}</b> ${plural(s.game.points, 'балл', 'балла', 'баллов')}
          ${lvl.next ? `<span>· до «${esc(lvl.next.name)}» ${num(lvl.toNext)}</span>` : '<span>· максимальный уровень</span>'}
        </div>
      </div>

      <nav class="drawer__nav">
        ${items.map(([go, icon, label, count, badge]) => `
          <button class="drawer__item" data-menu="${go}">
            <span class="drawer__ico">${icon}</span>
            <span class="drawer__label">${esc(label)}</span>
            ${count ? `<span class="drawer__count">${esc(String(count))}</span>` : ''}
            ${badge ? `<span class="drawer__badge">${badge}</span>` : ''}
            ${ico.chevR}
          </button>`).join('')}
      </nav>

      <div class="drawer__foot">
        <button class="drawer__close" data-close>Закрыть</button>
      </div>
    </aside>`;

  app.appendChild(el);
  // Открываем следующим кадром, чтобы сработал переход. Таймер — страховка:
  // в фоновой вкладке rAF не тикает, и панель осталась бы за краем экрана.
  const open = () => el.classList.add('is-open');
  requestAnimationFrame(open);
  setTimeout(open, 30);

  const close = () => {
    el.classList.remove('is-open');
    setTimeout(() => el.remove(), 240);
  };
  el.querySelector('.drawer__back').addEventListener('click', close);
  el.querySelector('[data-close]').addEventListener('click', close);
  el.querySelectorAll('[data-menu]').forEach((b) =>
    b.addEventListener('click', () => { close(); nav.go(b.dataset.menu); }));
}

// ── Мой прогресс ──────────────────────────────────────────────────────────
function progress() {
  const s = store.get();
  const lvl = levelOf(s.game.earned);
  const quests = questState();
  const achs = achievementState();
  const got = achs.filter((a) => a.got).length;

  const ring = 2 * Math.PI * 54;

  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="navbar__title">Мой прогресс</div>
</div>
<div class="scroll">
  <div class="lvl-hero">
    <div class="lvl-hero__ring">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="9"/>
        <circle cx="60" cy="60" r="54" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"
          stroke-dasharray="${(ring * lvl.progress / 100).toFixed(1)} ${ring}" transform="rotate(-90 60 60)"/>
      </svg>
      <div class="lvl-hero__num"><b>${lvl.n}</b><span>уровень</span></div>
    </div>
    <div class="lvl-hero__name">${esc(lvl.name)}</div>
    <div class="lvl-hero__sub">${lvl.next
      ? `Ещё ${num(lvl.toNext)} ${plural(lvl.toNext, 'балл', 'балла', 'баллов')} до уровня «${esc(lvl.next.name)}»`
      : 'Максимальный уровень достигнут'}</div>
    <div class="lvl-hero__stats">
      <div><b>${num(s.game.points)}</b><span>баллов сейчас</span></div>
      <div><b>${s.game.streak}</b><span>${plural(s.game.streak, 'день', 'дня', 'дней')} подряд</span></div>
      <div><b>${num(s.game.money)} ₽</b><span>получено</span></div>
    </div>
  </div>

  <div class="sec-head"><h2>Стрик</h2></div>
  <div class="streak">
    ${streakDays().map((d) => `
      <div class="streak__day ${d.done ? 'is-done' : ''} ${d.isToday ? 'is-today' : ''}">
        <span>${d.name}</span><i>${d.done ? '✓' : ''}</i>
      </div>`).join('')}
  </div>
  <div class="hint">Заходите каждый день — стрик добавляет баллы и открывает достижения.</div>

  <div class="sec-head"><h2>Задания на сегодня</h2></div>
  ${quests.map((q) => `
    <div class="quest ${q.claimed ? 'is-claimed' : ''}">
      <div class="quest__body">
        <div class="quest__title">${esc(q.title)}</div>
        <div class="quest__bar"><i style="width:${Math.round(q.have / q.goal * 100)}%"></i></div>
        <div class="quest__meta">${q.have} из ${q.goal} · +${q.reward} ${plural(q.reward, 'балл', 'балла', 'баллов')}</div>
      </div>
      ${q.claimed
        ? '<span class="quest__done">Забрано</span>'
        : q.done
          ? `<button class="quest__btn" data-quest="${q.id}">Забрать</button>`
          : '<span class="quest__wait">В процессе</span>'}
    </div>`).join('')}

  <div class="sec-head"><h2>Обменять баллы</h2></div>
  <div class="hint" style="padding-top:0">Баллы превращаются в реальные деньги банка — кэшбэк, бонусы и подписки.</div>
  ${REWARDS.map((r) => {
    const taken = s.game.rewards.includes(r.id);
    const can = s.game.points >= r.cost && !taken;
    return `<div class="reward ${taken ? 'is-taken' : ''}">
      <span class="reward__art">${art[r.art] || art.gift}</span>
      <div class="reward__body">
        <div class="reward__title">${esc(r.title)}</div>
        <div class="reward__sub">${esc(r.sub)}</div>
      </div>
      ${taken
        ? '<span class="reward__done">Получено</span>'
        : `<button class="reward__btn" data-reward="${r.id}" ${can ? '' : 'disabled'}>${num(r.cost)}</button>`}
    </div>`;
  }).join('')}

  <div class="sec-head"><h2>Достижения <span style="color:var(--ink-2);font-weight:500">${got} из ${achs.length}</span></h2></div>
  <div class="achs">
    ${achs.map((a) => `
      <div class="ach ${a.got ? 'is-got' : ''}" title="${esc(a.hint)}">
        <span class="ach__art">${art[a.art] || art.star}</span>
        <span class="ach__title">${esc(a.title)}</span>
        <span class="ach__hint">${a.got ? 'Получено' : esc(a.hint)}</span>
      </div>`).join('')}
  </div>

  <div class="sec-head"><h2>Уровни и что они дают</h2></div>
  ${LEVELS.map((l) => `
    <div class="lvl-row ${s.game.earned >= l.from ? 'is-open' : ''}">
      <span class="lvl-row__n">${l.n}</span>
      <div>
        <div class="lvl-row__name">${esc(l.name)} <span>от ${num(l.from)} баллов</span></div>
        <div class="lvl-row__perk">${esc(l.perk)}</div>
      </div>
    </div>`).join('')}

  <div class="src-note">Баллы и награды — механика прототипа. Реальная программа считалась бы на стороне банка.</div>
</div>
${homeIndicator()}`;

  return {
    html,
    mount(root) {
      root.querySelectorAll('[data-quest]').forEach((b) =>
        b.addEventListener('click', () => {
          const got = claimQuest(b.dataset.quest);
          if (got) { toast(`+${got} баллов за задание`); nav.refresh(); }
        }));
      root.querySelectorAll('[data-reward]').forEach((b) =>
        b.addEventListener('click', () => {
          const r = claimReward(b.dataset.reward);
          if (r) { toast(`Награда «${r.title}» получена`); nav.refresh(); }
          else toast('Не хватает баллов');
        }));
    },
  };
}

// ── Сохранённые вакансии ──────────────────────────────────────────────────
function favorites() {
  const s = store.get();
  const html = `
${statusBar()}
<div class="navbar">
  <button class="navbar__btn" data-go="back">${ico.chevL}</button>
  <div class="navbar__title">Сохранённые</div>
</div>
<div class="scroll" id="favFeed">
  ${s.favorites.length ? '' : `
    <div class="empty">
      <div class="empty__emoji">${art.folder}</div>
      <div class="empty__title">Пока пусто</div>
      <div class="empty__text">Нажимайте на сердечко в карточке вакансии — она сохранится здесь</div>
    </div>`}
</div>
${homeIndicator()}`;

  return {
    html,
    async mount(root) {
      if (!s.favorites.length) return;
      // Карточки рисуем через общий рендер ленты, чтобы вид был одинаковым
      const { allJobs, vacancyCard } = await import('./rabota.js');
      const list = allJobs().filter((j) => s.favorites.includes(j.id));
      const feed = root.querySelector('#favFeed');
      feed.innerHTML = list.length
        ? list.map((v) => vacancyCard(v)).join('')
        : `<div class="empty"><div class="empty__title">Вакансии не загружены</div>
           <div class="empty__text">Откройте ленту вакансий, чтобы подтянуть данные</div></div>`;
      feed.querySelectorAll('[data-apply]').forEach((b) =>
        b.addEventListener('click', (e) => { e.stopPropagation(); nav.go('apply', { id: b.dataset.apply }); }));
      feed.querySelectorAll('[data-fav]').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          store.toggleFavorite(b.dataset.fav);
          nav.refresh();
        }));
    },
  };
}

export const menuScreens = { progress, favorites };
