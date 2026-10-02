import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });
  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, name: e.name })));
  if (inputs.length >= 2) {
    await page.fill(inputs[0].id ? `#${inputs[0].id}` : 'input[name="email"]', 'fedorovich.web@yandex.ru');
    await page.fill(inputs[1].id ? `#${inputs[1].id}` : 'input[name="password"]', 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  const serviceUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/IIFs-ezxHret2rViaDEek';
  await page.goto(serviceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Switch to Logs tab
  console.log('Opening Logs tab...');
  await page.evaluate(() => {
    document.querySelectorAll('[role="tablist"]').forEach(t => { t.scrollLeft = 500; });
  });
  await page.click('[role="tablist"] button[role="tab"]:has-text("Logs")');
  await page.waitForTimeout(2000);

  const logsScreen = path.join(__dirname, 'dokploy-logs-tab-inspect.png');
  await page.screenshot({ path: logsScreen, fullPage: true });
  console.log('Saved logs screen to:', logsScreen);

  // Inspect selects or dropdowns on Logs tab
  const dropdowns = await page.$$eval('button, select', els =>
    els.map(e => ({
      text: e.innerText?.trim(),
      role: e.getAttribute('role'),
      outer: e.outerHTML.slice(0, 100)
    })).filter(b => b.text && (b.text.includes('api') || b.text.includes('web') || b.text.includes('Select') || b.text.includes('All') || b.text.includes('service') || b.text.includes('container')))
  );
  console.log('Dropdowns/buttons on logs tab:\n', JSON.stringify(dropdowns, null, 2));

  await browser.close();
}

run().catch(console.error);
