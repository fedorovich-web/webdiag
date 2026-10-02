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

  // 1. Domains: check app.webdiag.ru
  console.log('Checking Domains tab for app.webdiag.ru HTTPS...');
  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  // Close modal if open
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const editButtons = await page.$$('button[class*="hover:bg-blue-500"]');
  console.log(`Found ${editButtons.length} edit buttons`);
  if (editButtons.length >= 3) {
    console.log('Clicking edit for app.webdiag.ru...');
    await editButtons[2].click();
    await page.waitForTimeout(1000);

    const switches = await page.$$('[role="dialog"] button[role="switch"]');
    if (switches.length >= 3) {
      const isChecked = await switches[2].getAttribute('aria-checked');
      console.log(`app.webdiag.ru HTTPS switch is: ${isChecked}`);
      if (isChecked !== 'true') {
        console.log('Enabling HTTPS for app.webdiag.ru...');
        await switches[2].click();
        await page.waitForTimeout(500);
        await page.click('[role="dialog"] button[type="submit"]');
        await page.waitForTimeout(2000);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  }

  // 2. Advanced tab: Isolated Deployment
  console.log('Navigating to Advanced tab...');
  await page.click('[role="tab"]:has-text("Advanced")');
  await page.waitForTimeout(1500);

  const isoContainer = await page.$('div:has-text("Enable Isolated Deployment (webdiag-webdiagcore-mlnqpr)")');
  const isoSwitch = await isoContainer?.$('button[role="switch"]');
  if (isoSwitch) {
    const isIsoChecked = await isoSwitch.getAttribute('aria-checked');
    console.log(`Isolated Deployment switch: ${isIsoChecked}`);
    if (isIsoChecked !== 'true') {
      console.log('Enabling Isolated Deployment...');
      await isoSwitch.click();
      await page.waitForTimeout(500);

      // Click Save under that section
      const saveBtn = await isoContainer?.$('button:has-text("Save")') || await page.$('div:has-text("Enable Isolated Deployment") button:has-text("Save")');
      if (saveBtn) {
        console.log('Saving Isolated Deployment...');
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  }

  const advSavedScreen = path.join(__dirname, 'dokploy-adv-saved.png');
  await page.screenshot({ path: advSavedScreen, fullPage: true });
  console.log('Saved Advanced tab screenshot to:', advSavedScreen);

  // 3. General tab: Trigger Deploy!
  console.log('Navigating to General tab to Deploy...');
  await page.click('[role="tab"]:has-text("General")');
  await page.waitForTimeout(1500);

  const deployBtn = await page.$('button:has-text("Deploy")');
  if (deployBtn) {
    console.log('Triggering Deploy button!');
    await deployBtn.click();
    await page.waitForTimeout(4000);
  }

  const deployTriggeredScreen = path.join(__dirname, 'dokploy-deploy-triggered.png');
  await page.screenshot({ path: deployTriggeredScreen, fullPage: true });
  console.log('Saved deploy triggered screenshot to:', deployTriggeredScreen);

  // 4. Switch to Deployments tab to observe
  console.log('Navigating to Deployments tab...');
  await page.click('[role="tab"]:has-text("Deployments")');
  await page.waitForTimeout(2000);

  const deploymentsScreen = path.join(__dirname, 'dokploy-deployments-list.png');
  await page.screenshot({ path: deploymentsScreen, fullPage: true });
  console.log('Saved deployments list screenshot to:', deploymentsScreen);

  await browser.close();
}

run().catch(console.error);
