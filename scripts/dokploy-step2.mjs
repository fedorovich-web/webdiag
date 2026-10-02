import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Launching browser to inspect WebDiag project services...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });

  const inputs = await page.$$eval('input', els => els.map(e => ({
    id: e.id,
    name: e.name
  })));

  if (inputs.length >= 2) {
    const emailSelector = inputs[0].id ? `#${inputs[0].id}` : 'input[name="email"]';
    const passSelector = inputs[1].id ? `#${inputs[1].id}` : 'input[name="password"]';
    await page.fill(emailSelector, 'fedorovich.web@yandex.ru');
    await page.fill(passSelector, 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  const webdiagUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl';
  console.log('Navigating to WebDiag environment:', webdiagUrl);
  await page.goto(webdiagUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Find all cards or links for webdiag-core
  const cards = await page.$$eval('div, a', els =>
    els.filter(e => e.innerText && e.innerText.includes('webdiag-core') && (e.tagName.toLowerCase() === 'a' || e.getAttribute('role') === 'button' || e.classList.contains('cursor-pointer') || e.getAttribute('href')))
       .map(e => ({
         tag: e.tagName.toLowerCase(),
         text: e.innerText.replace(/\n+/g, ' '),
         href: e.getAttribute('href'),
         className: e.className
       }))
  );
  console.log('Found service elements:', JSON.stringify(cards, null, 2));

  // Also inspect all links on page matching dashboard/project/.../services/ or similar
  const allLinks = await page.$$eval('a', els =>
    els.map(e => ({
      text: e.innerText?.trim().replace(/\n+/g, ' '),
      href: e.getAttribute('href')
    })).filter(e => e.href && (e.href.includes('compose') || e.href.includes('service') || e.href.includes('Ur07yx99KXKMS7S_hlAXl')))
  );
  console.log('All relevant links:', JSON.stringify(allLinks, null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error('Inspect error:', err);
  process.exit(1);
});
