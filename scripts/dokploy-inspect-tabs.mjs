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

  // 1. Environment tab
  console.log('Navigating to Environment tab...');
  await page.click('[role="tab"]:has-text("Environment")');
  await page.waitForTimeout(1500);

  const envScreen = path.join(__dirname, 'dokploy-env-tab.png');
  await page.screenshot({ path: envScreen, fullPage: true });
  console.log('Saved Environment tab screenshot to:', envScreen);

  // 2. Advanced tab
  console.log('Navigating to Advanced tab...');
  await page.click('[role="tab"]:has-text("Advanced")');
  await page.waitForTimeout(1500);

  const advScreen = path.join(__dirname, 'dokploy-adv-tab.png');
  await page.screenshot({ path: advScreen, fullPage: true });
  console.log('Saved Advanced tab screenshot to:', advScreen);

  // 3. Domains tab
  console.log('Navigating to Domains tab...');
  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  const domScreen = path.join(__dirname, 'dokploy-domains-tab.png');
  await page.screenshot({ path: domScreen, fullPage: true });
  console.log('Saved Domains tab screenshot to:', domScreen);

  await browser.close();
}

run().catch(console.error);
