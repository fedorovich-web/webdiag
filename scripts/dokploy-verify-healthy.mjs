import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Waiting 20 seconds for healthcheck and dependent containers...');
  await new Promise(r => setTimeout(r, 20000));

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('Logging into Dokploy to check container statuses...');
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

  // Switch to Containers tab
  console.log('Opening Containers tab...');
  await page.click('[role="tab"]:has-text("Containers")');
  await page.waitForTimeout(2500);

  const containersScreen = path.join(__dirname, 'dokploy-containers-healthy.png');
  await page.screenshot({ path: containersScreen, fullPage: true });
  console.log('Saved containers screenshot to:', containersScreen);

  const containerRows = await page.$$eval('table tr, div[class*="border"]', els =>
    els.map(e => e.innerText?.trim().replace(/\n+/g, ' ')).filter(t => t && (t.includes('web') || t.includes('api') || t.includes('healthy') || t.includes('running') || t.includes('scheduler') || t.includes('Up')))
  );
  console.log('Containers status:\n', JSON.stringify(containerRows, null, 2));

  // Check Deployments status
  console.log('Opening Deployments tab...');
  await page.click('[role="tab"]:has-text("Deployments")');
  await page.waitForTimeout(2000);

  const deployRows = await page.$$eval('table tr, div[class*="border"]', els =>
    els.map(e => e.innerText?.trim().replace(/\n+/g, ' ')).filter(t => t && (t.includes('Manual deployment') || t.includes('Done') || t.includes('Running') || t.includes('Error')))
  );
  console.log('Deployments status:\n', JSON.stringify(deployRows, null, 2));

  // Now test navigating directly to the live domain webdiag.ru
  console.log('Navigating to https://webdiag.ru/ ...');
  try {
    const livePage = await browser.newPage();
    const liveRes = await livePage.goto('https://webdiag.ru/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`webdiag.ru HTTP status: ${liveRes.status()}`);
    console.log(`webdiag.ru title: ${await livePage.title()}`);

    const liveScreen = path.join(__dirname, 'webdiag-production-live.png');
    await livePage.screenshot({ path: liveScreen, fullPage: true });
    console.log('Saved live site screenshot to:', liveScreen);
  } catch (err) {
    console.log('Error opening https://webdiag.ru/ directly (DNS might still be propagating):', err.message);
  }

  await browser.close();
}

run().catch(console.error);
