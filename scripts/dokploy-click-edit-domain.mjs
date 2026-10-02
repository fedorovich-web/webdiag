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

  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1500);

  // Click the first blue hover edit button
  console.log('Clicking the first edit button (hover:bg-blue-500)...');
  const editButtons = await page.$$('button[class*="hover:bg-blue-500"]');
  console.log(`Found ${editButtons.length} edit buttons`);
  if (editButtons.length > 0) {
    await editButtons[0].click();
    await page.waitForTimeout(1500);

    const editDialogScreen = path.join(__dirname, 'dokploy-domain-actual-edit-dialog.png');
    await page.screenshot({ path: editDialogScreen });
    console.log('Saved actual edit dialog screenshot to:', editDialogScreen);

    // List switches inside dialog
    const switches = await page.$$eval('[role="dialog"] button[role="switch"]', els =>
      els.map((e, idx) => ({
        idx,
        checked: e.getAttribute('aria-checked'),
        parent: e.parentElement?.innerText?.trim().replace(/\n+/g, ' ')
      }))
    );
    console.log('Switches in actual edit dialog:\n', JSON.stringify(switches, null, 2));

    // Also look for certificate options or buttons
    const selects = await page.$$eval('[role="dialog"] select, [role="dialog"] button[role="combobox"], [role="dialog"] button[data-slot="dropdown-menu-trigger"]', els =>
      els.map(e => ({
        text: e.innerText?.trim(),
        role: e.getAttribute('role')
      }))
    );
    console.log('Selects / Comboboxes in edit dialog:\n', JSON.stringify(selects, null, 2));
  }

  await browser.close();
}

run().catch(console.error);
