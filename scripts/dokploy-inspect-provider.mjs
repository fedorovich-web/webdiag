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

  // Delete the second duplicate service: 2yI2Yd6ADIg517NIs2T8G
  const duplicateUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/2yI2Yd6ADIg517NIs2T8G';
  console.log('Visiting duplicate service to delete it:', duplicateUrl);
  await page.goto(duplicateUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Find trash button or delete option
  const deleteBtn = await page.$('button svg.lucide-trash, button:has(svg.lucide-trash-2), button:has(svg.lucide-trash)');
  if (deleteBtn) {
    console.log('Clicking trash icon on duplicate service...');
    await deleteBtn.click();
    await page.waitForTimeout(1000);
    // Look for confirm button in dialog
    const confirmBtn = await page.$('button:has-text("Delete"), button:has-text("Confirm")');
    if (confirmBtn) {
      console.log('Confirming deletion...');
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      console.log('Duplicate service deleted successfully.');
    }
  } else {
    console.log('No trash button found directly on duplicate page.');
  }

  // Now go to primary service: IIFs-ezxHret2rViaDEek
  const serviceUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/IIFs-ezxHret2rViaDEek';
  console.log('Navigating to primary service:', serviceUrl);
  await page.goto(serviceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click on "Select a Github Account" to see options
  console.log('Checking GitHub Account options...');
  const githubAccountBtn = await page.$('button:has-text("Select a Github Account")');
  if (githubAccountBtn) {
    await githubAccountBtn.click();
    await page.waitForTimeout(1000);
    const options = await page.$$eval('[role="option"], [role="menuitem"]', els => els.map(e => e.innerText?.trim()));
    console.log('GitHub Account dropdown options:', options);
    // Click outside or press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Click on Git tab
  console.log('Clicking Git provider tab...');
  await page.click('button:has-text("Git")');
  await page.waitForTimeout(1500);

  const gitTabScreen = path.join(__dirname, 'dokploy-git-tab.png');
  await page.screenshot({ path: gitTabScreen });
  console.log('Saved Git tab screenshot to:', gitTabScreen);

  // Inspect inputs in Git tab
  const gitInputs = await page.$$eval('input, textarea, select', els =>
    els.map(e => ({
      tag: e.tagName.toLowerCase(),
      name: e.getAttribute('name'),
      id: e.id,
      placeholder: e.getAttribute('placeholder'),
      value: e.value?.slice(0, 100)
    }))
  );
  console.log('Git tab inputs:', JSON.stringify(gitInputs, null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error('Inspection error:', err);
  process.exit(1);
});
