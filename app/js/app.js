// Точка входа: регистрируем экраны и запускаем прототип.

import { init, register, nav } from './router.js';
import { store } from './store.js';
import { mountArtDefs } from './art.js';
import { bankScreens } from './screens/bank.js';
import { rabotaScreens } from './screens/rabota.js';
import { applyScreens } from './screens/apply.js';
import { chatScreens } from './screens/chat.js';

for (const [name, factory] of Object.entries({
  ...bankScreens,
  ...rabotaScreens,
  ...applyScreens,
  ...chatScreens,
})) {
  register(name, factory);
}

mountArtDefs();
init(document.getElementById('app'));
nav.tab('home');

document.getElementById('resetDemo')?.addEventListener('click', () => {
  store.reset();
  nav.tab('home');
});

// Кнопка «назад» браузера ведёт назад по стеку экранов
history.replaceState({ depth: 1 }, '');
window.addEventListener('popstate', () => {
  if (nav.depth() > 1) { nav.back(); history.pushState({}, ''); }
});
