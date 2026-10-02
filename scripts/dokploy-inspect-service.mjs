import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Launching browser to inspect Compose service...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });

  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, name: e.name })));
  if (inputs.length >= 2) {
    const emailSelector = inputs[0].id ? `#${inputs[0].id}` : 'input[name="email"]';
    const passSelector = inputs[1].id ? `#${inputs[1].id}` : 'input[name="password"]';
    await page.fill(emailSelector, 'fedorovich.web@yandex.ru');
    await page.fill(passSelector, 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  const serviceUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/IIFs-ezxHret2rViaDEek';
  console.log('Navigating to service:', serviceUrl);
  await page.goto(serviceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const screenshotPath = path.join(__dirname, 'dokploy-compose-service-page.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved service page screenshot to:', screenshotPath);

  // Collect tabs, inputs, selects, buttons
  const tabs = await page.$$eval('[role="tab"]', els => els.map(e => e.innerText?.trim()));
  console.log('Tabs:', tabs);

  const buttons = await page.$$eval('button', els => els.map(e => e.innerText?.trim()).filter(Boolean));
  console.log('Buttons:', buttons);

  const inputsOnPage = await page.$$eval('input, textarea, select', els =>
    els.map(e => ({
      tag: e.tagName.toLowerCase(),
      name: e.getAttribute('name'),
      id: e.id,
      placeholder: e.getAttribute('placeholder'),
      type: e.getAttribute('type'),
      value: e.value?.slice(0, 100)
    }))
  );
  console.log('Inputs/Textareas on page:', JSON.stringify(inputsOnPage, null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error('Service inspect error:', err);
  process.exit(1);
});
