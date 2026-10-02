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
    if (url.includes('trpc') && (url.includes('deploy') || url.includes('compose'))) {
      try {
        const text = await res.text();
        console.log(`[API RESPONSE] ${res.status()} ${url.split('?')[0]}: ${text.slice(0, 300)}`);
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

  // Scroll tab list to left and ensure General tab
  await page.evaluate(() => {
    document.querySelectorAll('[role="tablist"]').forEach(t => { t.scrollLeft = 0; });
  });
  await page.click('[role="tablist"] button[role="tab"]:has-text("General")');
  await page.waitForTimeout(1000);

  // Click Deploy button (alert-dialog-trigger)
  console.log('Clicking Deploy (alert-dialog-trigger)...');
  await page.click('button[data-slot="alert-dialog-trigger"]:has-text("Deploy")');
  await page.waitForTimeout(1000);

  const confirmModalScreen = path.join(__dirname, 'dokploy-deploy-confirm-modal.png');
  await page.screenshot({ path: confirmModalScreen });
  console.log('Saved confirm modal screenshot to:', confirmModalScreen);

  // Inspect buttons inside [role="alertdialog"]
  const alertButtons = await page.$$eval('[role="alertdialog"] button, [data-slot="alert-dialog-content"] button', els =>
    els.map(e => ({
      text: e.innerText?.trim(),
      className: e.className
    }))
  );
  console.log('Confirm dialog buttons:', JSON.stringify(alertButtons, null, 2));

  // Click Confirm / Deploy in alert dialog
  console.log('Clicking confirmation button...');
  const confirmBtn = await page.$('[role="alertdialog"] button:has-text("Deploy"), [role="alertdialog"] button:has-text("Confirm"), [data-slot="alert-dialog-content"] button:has-text("Deploy"), [data-slot="alert-dialog-action"]');
  if (confirmBtn) {
    await confirmBtn.click();
    console.log('Confirmed deploy! Waiting for deployment to trigger...');
    await page.waitForTimeout(5000);
  }

  const afterConfirmScreen = path.join(__dirname, 'dokploy-after-deploy-confirm.png');
  await page.screenshot({ path: afterConfirmScreen, fullPage: true });
  console.log('Saved after confirm screenshot to:', afterConfirmScreen);

  // Switch to Deployments tab to see the live build!
  console.log('Switching to Deployments tab...');
  await page.click('[role="tablist"] button[role="tab"]:has-text("Deployments")');
  await page.waitForTimeout(3000);

  const liveDeploymentsScreen = path.join(__dirname, 'dokploy-live-deployments.png');
  await page.screenshot({ path: liveDeploymentsScreen, fullPage: true });
  console.log('Saved live deployments screenshot to:', liveDeploymentsScreen);

  // Print all deployment entries
  const entries = await page.$$eval('[role="table"] tr, div.border.rounded-lg, [data-slot="card"]', els =>
    els.map(e => e.innerText?.trim().replace(/\n+/g, ' ')).filter(t => t && t.length > 5 && t.length < 300)
  );
  console.log('Deployment list entries:\n', entries);

  await browser.close();
}

run().catch(console.error);
