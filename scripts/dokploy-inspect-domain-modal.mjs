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

  console.log('Navigating to Domains tab...');
  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  console.log('Clicking Add Domain...');
  await page.click('button:has-text("Add Domain")');
  await page.waitForTimeout(1500);

  // Click Manual button
  console.log('Clicking Manual button...');
  await page.click('button:has-text("Manual")');
  await page.waitForTimeout(1000);

  const manualScreen = path.join(__dirname, 'dokploy-domain-manual-expanded.png');
  await page.screenshot({ path: manualScreen });
  console.log('Saved modal screenshot to:', manualScreen);

  // Print all inputs, labels, switches in dialog
  const dialogInfo = await page.$$eval('[role="dialog"] *', els =>
    els.filter(e => e.tagName === 'INPUT' || e.tagName === 'BUTTON' || e.tagName === 'LABEL' || e.getAttribute('role') === 'switch')
       .map(e => ({
         tag: e.tagName.toLowerCase(),
         name: e.getAttribute('name'),
         type: e.getAttribute('type'),
         role: e.getAttribute('role'),
         text: e.innerText?.trim(),
         placeholder: e.getAttribute('placeholder')
       }))
  );
  console.log('Dialog controls:', JSON.stringify(dialogInfo, null, 2));

  await browser.close();
}

run().catch(console.error);
