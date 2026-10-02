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
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('Logging into Dokploy...');
  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });
  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, name: e.name })));
  if (inputs.length >= 2) {
    await page.fill(inputs[0].id ? `#${inputs[0].id}` : 'input[name="email"]', 'fedorovich.web@yandex.ru');
    await page.fill(inputs[1].id ? `#${inputs[1].id}` : 'input[name="password"]', 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  // 1. Delete duplicate service
  const duplicateUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/2yI2Yd6ADIg517NIs2T8G';
  console.log('Navigating to duplicate service to delete it:', duplicateUrl);
  await page.goto(duplicateUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Click the trash dialog trigger button (the second ghost icon button in header)
  const ghostButtons = await page.$$('button[data-slot="dialog-trigger"][data-variant="ghost"]');
  console.log(`Found ${ghostButtons.length} dialog ghost buttons`);
  if (ghostButtons.length >= 2) {
    console.log('Clicking the trash can icon (second button)...');
    await ghostButtons[1].click();
    await page.waitForTimeout(1000);

    const deleteModalScreen = path.join(__dirname, 'dokploy-delete-modal.png');
    await page.screenshot({ path: deleteModalScreen });
    console.log('Saved delete modal screenshot to:', deleteModalScreen);

    // Look for confirm button or delete button in dialog
    const confirmDelete = await page.$('[role="dialog"] button:has-text("Delete"), [role="alertdialog"] button:has-text("Delete"), button:has-text("Confirm")');
    if (confirmDelete) {
      console.log('Clicking confirm delete...');
      await confirmDelete.click();
      await page.waitForTimeout(3000);
      console.log('Duplicate service deleted!');
    }
  }

  // 2. Configure primary service
  const serviceUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/IIFs-ezxHret2rViaDEek';
  console.log('Navigating to primary service:', serviceUrl);
  await page.goto(serviceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Select GitHub Account
  console.log('Selecting GitHub account...');
  await page.click('button:has-text("Select a Github Account")');
  await page.waitForTimeout(1000);
  await page.click('[role="option"]:has-text("Dokploy-2026-09-09-vljj73")');
  await page.waitForTimeout(2000);

  // Select Repository
  console.log('Selecting repository: webdiag...');
  await page.click('button:has-text("Select repository")');
  await page.waitForTimeout(1000);
  await page.click('[role="option"]:has-text("webdiag")');
  await page.waitForTimeout(2000);

  // Select Branch
  console.log('Selecting branch: main...');
  const branchBtn = await page.$('button:has-text("Select branch")');
  if (branchBtn) {
    await branchBtn.click();
    await page.waitForTimeout(1000);
    const branches = await page.$$eval('[role="option"]', els => els.map(e => e.innerText?.trim()));
    console.log('Available branches:', branches);
    await page.click('[role="option"]:has-text("main")');
    await page.waitForTimeout(1000);
  }

  // Set Compose Path to ./docker-compose.dokploy.yml
  console.log('Setting Compose Path to ./docker-compose.dokploy.yml...');
  await page.fill('input[name="composePath"]', './docker-compose.dokploy.yml');
  await page.waitForTimeout(500);

  // Click Save
  console.log('Clicking Save...');
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(3000);

  const savedScreen = path.join(__dirname, 'dokploy-general-saved.png');
  await page.screenshot({ path: savedScreen, fullPage: true });
  console.log('Saved configuration screenshot to:', savedScreen);

  await browser.close();
}

run().catch((err) => {
  console.error('Setup error:', err);
  process.exit(1);
});
