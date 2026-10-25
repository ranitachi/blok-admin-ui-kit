/*
 * BLOK — sapuan responsif semua halaman di browser headless.
 * Per halaman × lebar (320, 375, 768, 1024, 1440): gagal bila ada scroll
 * horizontal, error console/JS, respons HTTP >= 400, chart tanpa SVG,
 * atau sprite ikon tidak termuat.
 *
 * Prasyarat:
 *   - Server statis dari folder neo-brutal-html/:  python3 -m http.server 8000
 *   - npm i puppeteer-core (di folder mana pun yang terjangkau require)
 *   - CHROME_PATH=/path/ke/chrome-atau-chromium
 * Pemakaian:
 *   CHROME_PATH=/usr/bin/chromium node tools/qa/sweep.js [awalan-path]
 *   SHOTS=1 ... menyimpan screenshot 375 & 1440 ke tools/qa/shots/
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..', '..');
const BASE = process.env.BASE_URL || 'http://localhost:8000/';
const ONLY = process.argv[2] || '';
const widths = [320, 375, 768, 1024, 1440];
const dirs = ['', 'components', 'pages', 'auth', 'errors', 'documentation'];
const pages = dirs.flatMap(d => {
  const full = path.join(ROOT, d);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => f.endsWith('.html')).sort().map(f => (d ? d + '/' : '') + f);
}).filter(p => p.startsWith(ONLY));

(async () => {
  if (!process.env.CHROME_PATH) { console.error('Set CHROME_PATH ke binary Chrome/Chromium.'); process.exit(2); }
  const shotDir = path.join(__dirname, 'shots');
  if (process.env.SHOTS) fs.mkdirSync(shotDir, { recursive: true });
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
  let problems = 0;
  for (const p of pages) {
    for (const w of widths) {
      const tab = await b.newPage();
      const errs = [];
      tab.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      tab.on('pageerror', e => errs.push(e.message));
      tab.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
      await tab.setViewport({ width: w, height: 900 });
      await tab.goto(BASE + p, { waitUntil: 'networkidle0' });
      const r = await tab.evaluate(() => {
        const ov = document.documentElement.scrollWidth - window.innerWidth;
        const off = [];
        if (ov > 0) document.querySelectorAll('body *').forEach(el => {
          const rc = el.getBoundingClientRect();
          if (rc.right > window.innerWidth + 1 && !el.closest('.nb-table-wrap,.nb-kanban,.nb-tabs__list,pre,.nb-demo__code')) off.push(el.tagName + '.' + el.className.toString().split(' ')[0] + ' ' + Math.round(rc.right));
        });
        const charts = document.querySelectorAll('[data-chart]').length;
        const svgs = document.querySelectorAll('[data-chart] svg').length;
        return { ov, off: off.slice(0, 5), charts, svgs, sprite: !!document.getElementById('i-home') };
      });
      if (process.env.SHOTS && (w === 375 || w === 1440)) await tab.screenshot({ path: path.join(shotDir, p.replace(/\W/g, '_') + '_' + w + '.png'), fullPage: true });
      if (r.ov > 0 || errs.length || r.charts !== r.svgs || !r.sprite) { problems++; console.log('FAIL', p, w, JSON.stringify(r), errs); }
      await tab.close();
    }
    console.log('ok  ', p);
  }
  console.log('\nhalaman:', pages.length, '| masalah:', problems);
  await b.close();
  process.exit(problems ? 1 : 0);
})();
