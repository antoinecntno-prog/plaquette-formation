// Mesure la taille effective des textes visibles (taille de police x échelle à l'écran), tous les 0,25 s.
// Un texte compte quand il est au repos : sa taille varie de moins de 2 % entre t et t + 0,08 s.
// Usage : node taille-texte.mjs <page.html>
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webm': 'video/webm', '.json': 'application/json' };
const s = http.createServer((q, r) => { const p = path.join(R, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
await new Promise(r => s.on('listening', r));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1440, height: 1800 } });
await pg.goto(`http://127.0.0.1:${s.address().port}/${process.argv[2]}`); await pg.evaluate(() => window.prete);
const mesure = () => pg.evaluate(() => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode; if (!n.textContent.trim()) continue;
    const e = n.parentElement; if (!e || e.closest('svg') || e.closest('.ecran')) continue;
    let op = 1, a = e, cache = false;
    while (a) { const c = getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden') { cache = true; break; } op *= parseFloat(c.opacity); a = a.parentElement; }
    if (cache || op < 0.5) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.right < 0 || r.left > 1440 || r.bottom < 0 || r.top > 1800) continue;
    let coupe = false; a = e.parentElement;
    while (a && a !== document.body) {
      const c = getComputedStyle(a);
      if (c.overflow === 'hidden') { const q = a.getBoundingClientRect(); const ix = Math.max(0, Math.min(q.right, r.right) - Math.max(q.left, r.left)), iy = Math.max(0, Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top)); if (ix * iy < 0.6 * r.width * r.height) { coupe = true; break; } }
      a = a.parentElement;
    }
    if (coupe || !e.offsetHeight) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    out.push({ texte: n.textContent.trim().slice(0, 40), taille: +(fs * r.height / e.offsetHeight).toFixed(1) });
  }
  return out;
});
const res = [];
for (let t = 0; t < 27; t += 0.25) {
  await pg.evaluate(x => window.seek(x), t); const a = await mesure();
  await pg.evaluate(x => window.seek(x), t + 0.08); const bb = await mesure();
  for (const o of a) { const o2 = bb.find(x => x.texte === o.texte); if (o2 && Math.abs(o2.taille - o.taille) / o.taille < 0.02) res.push({ t: +t.toFixed(2), ...o }); }
}
const parTexte = {};
for (const o of res) if (!parTexte[o.texte] || o.taille < parTexte[o.texte].taille) parTexte[o.texte] = o;
const liste = Object.values(parTexte).sort((x, y) => x.taille - y.taille);
console.log(JSON.stringify({ minimum: liste[0], textes: liste }, null, 1));
await b.close(); s.close();
