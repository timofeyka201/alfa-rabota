import { art } from './art.js';

// Простейший стековый роутер: экран = функция, возвращающая разметку и mount().

const registry = new Map();
const stack = [];
let rootEl = null;

export function register(name, factory) {
  registry.set(name, factory);
}

export function init(el) {
  rootEl = el;
  // Глобальная делегация: переход по data-go и переключение вкладок по data-tab
  rootEl.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { nav.tab(tab.dataset.tab); return; }
    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      let params = {};
      if (go.dataset.params) { try { params = JSON.parse(go.dataset.params); } catch { /* пусто */ } }
      if (go.dataset.go === 'back') nav.back();
      else nav.go(go.dataset.go, params);
    }
  });
}

let currentUnmount = null;

function paint(anim) {
  // Даём предыдущему экрану освободить ресурсы (например, камеру)
  if (currentUnmount) { try { currentUnmount(); } catch { /* не мешаем переходу */ } }
  currentUnmount = null;

  const entry = stack[stack.length - 1];
  const factory = registry.get(entry.name);
  if (!factory) {
    rootEl.innerHTML = `<div class="view"><div class="empty"><div class="empty__emoji">${art.gear}</div>
      <div class="empty__title">Экран «${entry.name}» ещё в работе</div></div></div>`;
    return;
  }
  const screen = factory(entry.params || {}) || {};
  rootEl.innerHTML = `<div class="view ${screen.white ? 'view--white' : ''} ${anim || ''}">${screen.html || ''}</div>`;
  const view = rootEl.firstElementChild;
  entry.el = view;
  // Снимаем класс анимации: если вкладка неактивна, анимация не проигрывается
  // и экран иначе остался бы застывшим на первом кадре (сдвинутым вбок).
  if (anim) setTimeout(() => view.classList.remove('anim-in', 'sheet-in'), 400);
  if (typeof screen.unmount === 'function') currentUnmount = screen.unmount;
  if (typeof screen.mount === 'function') screen.mount(view);
  // Восстанавливаем позицию прокрутки при возврате назад
  const sc = view.querySelector('.scroll');
  if (sc && entry.scrollTop) {
    sc.scrollTop = entry.scrollTop;
    // Событие рассылаем сами: экраны, у которых шапка зависит от прокрутки,
    // иначе останутся в состоянии «лента в самом верху».
    sc.dispatchEvent(new Event('scroll'));
  }
  if (sc) sc.addEventListener('scroll', () => { entry.scrollTop = sc.scrollTop; }, { passive: true });
}

export const nav = {
  go(name, params = {}, opts = {}) {
    stack.push({ name, params });
    paint(opts.sheet ? 'sheet-in' : 'anim-in');
  },

  replace(name, params = {}) {
    stack[stack.length - 1] = { name, params };
    paint('anim-in');
  },

  back(steps = 1) {
    for (let i = 0; i < steps && stack.length > 1; i++) stack.pop();
    paint('');
  },

  /**
   * Возврат к ближайшему экрану с данным именем.
   * Если такого в стеке нет — ничего не трогаем и отвечаем false: иначе
   * цикл снял бы весь стек и выбросил пользователя на первый экран.
   */
  backTo(name) {
    if (!stack.some((e) => e.name === name)) return false;
    while (stack.length > 1 && stack[stack.length - 1].name !== name) stack.pop();
    paint('');
    return true;
  },

  tab(name) {
    stack.length = 0;
    stack.push({ name, params: {} });
    paint('');
  },

  /** Перерисовать текущий экран (после изменения состояния). */
  refresh() {
    paint('');
  },

  current: () => stack[stack.length - 1]?.name,
  depth: () => stack.length,
};
