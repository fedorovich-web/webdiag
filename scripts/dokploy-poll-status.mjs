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

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('trpc') && (url.includes('deployment') || url.includes('compose'))) {
      try {
        const text = await res.text();
        console.log(`[API] ${url.split('?')[0]}: ${text.slice(0, 300)}`);
      } catch (e) {}
    }
  });

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

  // Click View on deployment
  const viewBtn = await page.$('button:has-text("View")');
  if (viewBtn) {
    await viewBtn.click();
    console.log('Opened deployment log modal, waiting 5s for log stream...');
    await page.waitForTimeout(5000);

    const logScreen = path.join(__dirname, 'dokploy-log-stream-poll.png');
    await page.screenshot({ path: logScreen });
    console.log('Saved log screen to:', logScreen);

    const logText = await page.$$eval('pre, code, [data-slot="dialog-content"]', els =>
      els.map(e => e.innerText?.trim()).filter(Boolean)
    );
    console.log('Log content snippet:\n', logText.join('\n---\n').slice(-1500));
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Check Containers tab
  await page.click('[role="tablist"] button[role="tab"]:has-text("Containers")');
  await page.waitForTimeout(2500);

  const containersScreen = path.join(__dirname, 'dokploy-containers-poll.png');
  await page.screenshot({ path: containersScreen, fullPage: true });
  console.log('Saved containers screenshot to:', containersScreen);

  const containerRows = await page.$$eval('table tr, div[class*="border"]', els =>
    els.map(e => e.innerText?.trim().replace(/\n+/g, ' ')).filter(t => t && t.length > 10 && t.length < 200)
  );
  console.log('Containers on page:', containerRows.slice(0, 10));

  await browser.close();
}

run().catch(console.error);
