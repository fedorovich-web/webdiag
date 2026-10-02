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
  await page.evaluate(() => {
    document.querySelectorAll('[role="tablist"]').forEach(t => { t.scrollLeft = 500; });
  });
  await page.click('[role="tablist"] button[role="tab"]:has-text("Logs")');
  await page.waitForTimeout(2000);

  // Click combobox to select container
  console.log('Opening container combobox...');
  await page.click('button[role="combobox"]');
  await page.waitForTimeout(1000);

  const containerOptions = await page.$$eval('[role="option"]', els => els.map(e => e.innerText?.trim()));
  console.log('Available container options in dropdown:\n', containerOptions);

  // Click on the API container option
  const apiOption = await page.$('[role="option"]:has-text("api")');
  if (apiOption) {
    console.log('Selecting api container...');
    await apiOption.click();
    await page.waitForTimeout(4000);

    const apiLogs = await page.$$eval('pre, code, [data-slot="scroll-area"], div[class*="terminal"], div[class*="font-mono"]', els =>
      els.map(e => e.innerText?.trim()).filter(Boolean)
    );
    console.log('=== API CONTAINER LOGS ===\n', apiLogs.join('\n---\n').slice(-3000));
  }

  // Now select the Web container option
  console.log('Opening container combobox for web...');
  await page.click('button[role="combobox"]');
  await page.waitForTimeout(1000);

  const webOption = await page.$('[role="option"]:has-text("web-1")');
  if (webOption) {
    console.log('Selecting web container...');
    await webOption.click();
    await page.waitForTimeout(4000);

    const webLogs = await page.$$eval('pre, code, [data-slot="scroll-area"], div[class*="terminal"], div[class*="font-mono"]', els =>
      els.map(e => e.innerText?.trim()).filter(Boolean)
    );
    console.log('=== WEB CONTAINER LOGS ===\n', webLogs.join('\n---\n').slice(-3000));
  }

  await browser.close();
}

run().catch(console.error);
