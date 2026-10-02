import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Launching browser...');
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

  // Go to primary service
  const serviceUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/IIFs-ezxHret2rViaDEek';
  console.log('Navigating to service:', serviceUrl);
  await page.goto(serviceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click on "Select a Github Account"
  console.log('Clicking Select a Github Account...');
  await page.click('button:has-text("Select a Github Account")');
  await page.waitForTimeout(1000);

  // Click Dokploy-2026-09-09-vljj73
  console.log('Selecting Dokploy-2026-09-09-vljj73...');
  await page.click('[role="option"]:has-text("Dokploy-2026-09-09-vljj73")');
  await page.waitForTimeout(3000);

  // Take screenshot
  const selectedAccountScreen = path.join(__dirname, 'dokploy-account-selected.png');
  await page.screenshot({ path: selectedAccountScreen });
  console.log('Saved screenshot to:', selectedAccountScreen);

  // Click "Select repository"
  console.log('Clicking Select repository...');
  const repoBtn = await page.$('button:has-text("Select repository")');
  if (repoBtn) {
    await repoBtn.click();
    await page.waitForTimeout(2000);
    const repos = await page.$$eval('[role="option"], [role="menuitem"], div[cmdk-item]', els => els.map(e => e.innerText?.trim()));
    console.log('Available repositories:', repos);
    await page.keyboard.press('Escape');
  }

  await browser.close();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
