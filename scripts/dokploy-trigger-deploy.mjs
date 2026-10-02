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

  // Scroll tablist to the left
  await page.evaluate(() => {
    const tablists = document.querySelectorAll('[role="tablist"], [data-slot="tabs-list"]');
    tablists.forEach(t => { t.scrollLeft = 0; });
  });
  await page.waitForTimeout(500);

  console.log('Clicking General tab...');
  const generalTab = await page.$('[role="tablist"] button[role="tab"]:has-text("General"), button[role="tab"]:has-text("General")');
  if (generalTab) {
    await generalTab.click();
    await page.waitForTimeout(1500);
  }

  const generalScreen = path.join(__dirname, 'dokploy-general-tab-active.png');
  await page.screenshot({ path: generalScreen, fullPage: true });
  console.log('Saved General tab active screenshot to:', generalScreen);

  // Find the Deploy button inside the General tab
  console.log('Clicking Deploy button...');
  const deployBtn = await page.$('button:has-text("Deploy")');
  if (deployBtn) {
    await deployBtn.click();
    console.log('Clicked Deploy button!');
    await page.waitForTimeout(5000);
  }

  const deployActiveScreen = path.join(__dirname, 'dokploy-deploy-running.png');
  await page.screenshot({ path: deployActiveScreen, fullPage: true });
  console.log('Saved deploy running screenshot to:', deployActiveScreen);

  // Check toast notifications or logs on page
  const toasts = await page.$$eval('[data-slot="toast"], [role="status"], [role="alert"]', els =>
    els.map(e => e.innerText?.trim())
  );
  console.log('Toasts/alerts:', toasts);

  // Switch to Deployments tab to see the build entry
  console.log('Switching to Deployments tab in tablist...');
  const deploymentsTab = await page.$('[role="tablist"] button[role="tab"]:has-text("Deployments")');
  if (deploymentsTab) {
    await deploymentsTab.click();
    await page.waitForTimeout(3000);

    const deployListScreen = path.join(__dirname, 'dokploy-deployments-after-click.png');
    await page.screenshot({ path: deployListScreen, fullPage: true });
    console.log('Saved deployments after click screenshot to:', deployListScreen);

    // List deployment entries
    const entries = await page.$$eval('[role="table"] tr, div.border.rounded-lg, div:has-text("Deployment")', els =>
      els.map(e => e.innerText?.trim().replace(/\n+/g, ' ')).filter(t => t && t.length > 5 && t.length < 200)
    );
    console.log('Deployments entries:', entries.slice(0, 10));
  }

  await browser.close();
}

run().catch(console.error);
