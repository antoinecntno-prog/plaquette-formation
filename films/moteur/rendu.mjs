// Rendu image par image d'un film HTML avec Playwright.
// Usage :
//   node rendu.mjs fixes <page.html> <dossier> <t1,t2,...>        images fixes PNG
//   node rendu.mjs video <page.html> <sortie.mp4> [t0] [t1]        4 sous-images par image, fusion tmix, 60 i/s
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.json': 'application/json', '.svg': 'image/svg+xml' };

function serveur() {
  return new Promise(res => {
    const s = http.createServer((req, rep) => {
      const p = path.join(RACINE, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(RACINE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rep.writeHead(404); rep.end(); return; }
      rep.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(p).pipe(rep);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

async function ouvrir(page) {
  const s = await serveur();
  const nav = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 1800 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  p.on('pageerror', e => console.error('[page erreur]', e.message));
  await p.goto(`http://127.0.0.1:${s.address().port}/${page}`);
  await p.evaluate(() => window.prete);
  const cdp = await ctx.newCDPSession(p);
  const capture = async () => {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false, clip: { x: 0, y: 0, width: 1440, height: 1800, scale: 1 } });
    return Buffer.from(r.data, 'base64');
  };
  return { s, nav, p, capture };
}

const [mode, page, sortie, a3, a4] = process.argv.slice(2);
const { s, nav, p, capture } = await ouvrir(page);
const duree = await p.evaluate(() => window.duree);

if (mode === 'fixes') {
  fs.mkdirSync(sortie, { recursive: true });
  for (const tt of a3.split(',').map(Number)) {
    await p.evaluate(t => window.seek(t), tt);
    fs.writeFileSync(path.join(sortie, `t${tt.toFixed(3).padStart(7, '0')}.png`), await capture());
    console.log('image', tt);
  }
} else if (mode === 'video') {
  const t0 = a3 ? Number(a3) : 0, t1 = a4 ? Number(a4) : duree;
  const SOUS = 4, IPS = 60;
  const n = Math.round((t1 - t0) * IPS);
  // Chaque image i fond 4 sous-images prises à i/60 - 3/240 ... i/60.
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(IPS * SOUS), '-c:v', 'png', '-i', '-',
    '-vf', `tmix=frames=${SOUS}:weights='1 1 1 1',select='eq(mod(n\\,${SOUS})\\,${SOUS - 1})',setpts=N/(${IPS}*TB)`,
    '-r', String(IPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-g', '60', '-movflags', '+faststart', sortie], { stdio: ['pipe', 'inherit', 'inherit'] });
  const debut = Date.now();
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < SOUS; k++) {
      const t = t0 + i / IPS - (SOUS - 1 - k) / (IPS * SOUS);
      await p.evaluate(x => window.seek(x), t);
      const png = await capture();
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    }
    if (i % 60 === 0) console.log(`image ${i}/${n}  ${((Date.now() - debut) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await nav.close();
s.close();
