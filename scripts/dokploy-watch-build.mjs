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

  console.log('Logging in...');
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

  // Switch to Deployments tab
  console.log('Opening Deployments tab...');
  await page.evaluate(() => {
    document.querySelectorAll('[role="tablist"]').forEach(t => { t.scrollLeft = 0; });
  });
  await page.click('[role="tablist"] button[role="tab"]:has-text("Deployments")');
  await page.waitForTimeout(2000);

  // Click "View" button
  console.log('Clicking View button on deployment...');
  const viewBtn = await page.$('button:has-text("View")');
  if (viewBtn) {
    await viewBtn.click();
    await page.waitForTimeout(2000);
  }

  const logScreen = path.join(__dirname, 'dokploy-build-log-view.png');
  await page.screenshot({ path: logScreen, fullPage: true });
  console.log('Saved log screen to:', logScreen);

  // Extract log text
  const logLines = await page.$$eval('pre, code, .terminal, [data-slot="dialog-content"]', els =>
    els.map(e => e.innerText?.trim()).filter(Boolean)
  );
  console.log('=== BUILD LOG CONTENT ===\n', logLines.join('\n---\n'));

  // Also check Containers tab to see if docker containers are already starting/up
  console.log('Checking Containers tab...');
  await page.keyboard.press('Escape'); // close modal if in modal
  await page.waitForTimeout(500);
  await page.click('[role="tablist"] button[role="tab"]:has-text("Containers")');
  await page.waitForTimeout(2000);

  const containersScreen = path.join(__dirname, 'dokploy-containers-status.png');
  await page.screenshot({ path: containersScreen, fullPage: true });
  console.log('Saved containers screen to:', containersScreen);

  const containerList = await page.$$eval('tr, div[class*="border"]', els =>
    els.map(e => e.innerText?.trim().replace(/\n+/g, ' ')).filter(t => t && (t.includes('web') || t.includes('api') || t.includes('healthy') || t.includes('running') || t.includes('scheduler')))
  );
  console.log('Containers found:\n', containerList);

  await browser.close();
}

run().catch(console.error);
