// Собирает статичную страницу со всеми иллюстрациями — для быстрой визуальной проверки.
import { writeFileSync } from 'node:fs';
import { art, starMark, bigNumber } from './app/js/art.js';

const GRADS = [
  ['red','#FF7A63','#EF3124'],['redDeep','#EF3124','#A5170E'],['orange','#FFC46B','#F5820B'],
  ['yellow','#FFE070','#F5B31E'],['blue','#79B0FF','#1F68EB'],['blueDeep','#2E7BF0','#0C3C9E'],
  ['purple','#C0A9FF','#6D3BF0'],['violet','#E3D7FF','#B39BFF'],['green','#86EFA4','#12A05C'],
  ['lime','#D3FA63','#8FD41C'],['cyan','#9BF3E8','#12B3A4'],['pink','#FFB3D0','#EE4E8B'],
  ['gray','#FBFCFD','#D2D6DE'],['steel','#C9CFDA','#8A93A3'],['dark','#565B66','#22252B'],
  ['brown','#D9A066','#9C5F28'],['skin','#FFD9A8','#E8A860'],
];

const defs = `<svg style="position:absolute;width:0;height:0"><defs>
${GRADS.map(([n,a,b])=>`<linearGradient id="g-${n}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('')}
<linearGradient id="g-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="g-glossR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="g-rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5B8D"/><stop offset=".35" stop-color="#FFC44D"/><stop offset=".7" stop-color="#4ED8C0"/><stop offset="1" stop-color="#6C8BFF"/></linearGradient>
<radialGradient id="g-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1B1B1B" stop-opacity=".26"/><stop offset="1" stop-color="#1B1B1B" stop-opacity="0"/></radialGradient>
<radialGradient id="g-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs></svg>`;

const items = { ...art, 'bigNumber(«30»)': bigNumber('30', 'blueDeep'), starMark };

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Альфа-Работа — иллюстрации</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>
 body{margin:0;padding:40px;background:#0E1013;color:#fff;font:400 15px Inter,system-ui,sans-serif}
 h1{font-size:26px;font-weight:800;letter-spacing:-.03em;margin:0 0 6px}
 p{color:rgba(255,255,255,.55);margin:0 0 32px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:14px;max-width:1200px}
 .cell{background:#F2F3F5;border-radius:18px;padding:16px 10px 12px;text-align:center}
 .cell svg{width:64px;height:64px;overflow:visible}
 .cell b{display:block;margin-top:10px;font-size:11.5px;font-weight:600;color:#5A5F6A;word-break:break-all}
 .dark .cell{background:#1B1B1B}.dark .cell b{color:#9AA0AC}
 .row{display:flex;gap:10px;margin:0 0 20px}
 .row button{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#fff;
   font:inherit;font-size:13px;padding:8px 15px;border-radius:100px;cursor:pointer}
</style></head><body>
${defs}
<h1>Иллюстрации «Альфа-Работы»</h1>
<p>${Object.keys(items).length} штук — нарисованы вручную, без сторонних наборов. Тот же файл питает прототип.</p>
<div class="row"><button onclick="document.querySelector('.grid').classList.toggle('dark')">Светлый / тёмный фон</button></div>
<div class="grid">
${Object.entries(items).map(([n,s])=>`<div class="cell">${s}<b>${n}</b></div>`).join('\n')}
</div></body></html>`;

writeFileSync('app/gallery.html', html, 'utf8');
console.error('иконок:', Object.keys(items).length);
