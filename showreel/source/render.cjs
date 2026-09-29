// Rendu image par image du showreel.
// node render.cjs stills 0.5,1.2,...   -> stills/t_<t>.png
// node render.cjs frames [debut] [fin] -> frames/00000.png ...
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const RACINE = __dirname;
const DEPOT = path.join(__dirname, '..', '..');
const FPS = 60, DUREE = 15;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };

function serveur() {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      const f = path.join(DEPOT, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(f, (e, d) => {
        if (e) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
        res.end(d);
      });
    }).listen(0, () => ok(s));
  });
}

async function page(browser, port) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('ERREUR PAGE', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await p.goto(`http://127.0.0.1:${port}/showreel/source/index.html`);
  await p.evaluate(() => window.PRET);
  return p;
}

(async () => {
  const [mode, a, b] = process.argv.slice(2);
  const srv = await serveur();
  const port = srv.address().port;
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  if (mode === 'stills') {
    const p = await page(browser, port);
    fs.mkdirSync(path.join(RACINE, 'stills'), { recursive: true });
    for (const t of a.split(',').map(Number)) {
      await p.evaluate(t => window.renderFrame(t), t);
      await p.screenshot({ path: path.join(RACINE, 'stills', `t_${t.toFixed(2)}.png`) });
    }
  } else if (mode === 'events') {
    const p = await page(browser, port);
    const ev = await p.evaluate(() => window.evenementsSon());
    fs.writeFileSync(path.join(RACINE, 'evenements.json'), JSON.stringify(ev, null, 1));
  } else if (mode === 'frames') {
    const debut = Number(a ?? 0), fin = Number(b ?? FPS * DUREE);
    const dir = path.join(RACINE, 'frames');
    fs.mkdirSync(dir, { recursive: true });
    const NB = 4;
    const pages = await Promise.all(Array.from({ length: NB }, () => page(browser, port)));
    const t0 = Date.now();
    let fait = 0;
    await Promise.all(pages.map(async (p, w) => {
      for (let f = debut + w; f < fin; f += NB) {
        await p.evaluate(t => window.renderFrame(t), f / FPS);
        await p.screenshot({ path: path.join(dir, `${String(f).padStart(5, '0')}.png`) });
        fait++;
        if (fait % 60 === 0) console.log(`${fait} images, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      }
    }));
  }
  await browser.close();
  srv.close();
})();
