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

  const editButtons = await page.$$('button[class*="hover:bg-blue-500"]');
  console.log(`Found ${editButtons.length} edit buttons`);
  if (editButtons.length >= 2) {
    console.log('Clicking editButtons[1] (webdiag.ru domain edit)...');
    await editButtons[1].click();
    await page.waitForTimeout(1500);

    const domainEditScreen = path.join(__dirname, 'dokploy-domain-webdiag-edit-modal.png');
    await page.screenshot({ path: domainEditScreen });
    console.log('Saved domain edit screenshot to:', domainEditScreen);

    // Inspect switches in this dialog
    const switches = await page.$$eval('[role="dialog"] button[role="switch"]', els =>
      els.map((e, idx) => ({
        idx,
        checked: e.getAttribute('aria-checked'),
        parent: e.parentElement?.innerText?.trim().replace(/\n+/g, ' ')
      }))
    );
    console.log('Switches in domain edit dialog:\n', JSON.stringify(switches, null, 2));

    // Look for HTTPS switch and enable it if false
    const httpsSwitch = await page.$('div:has-text("HTTPS") button[role="switch"], [role="dialog"] button[role="switch"]:nth-of-type(3)');
    if (switches.length >= 3) {
      if (switches[2].checked !== 'true') {
        const dialogSwitches = await page.$$('[role="dialog"] button[role="switch"]');
        console.log('Clicking switch index 2 (HTTPS)...');
        await dialogSwitches[2].click();
        await page.waitForTimeout(1000);

        const afterClickScreen = path.join(__dirname, 'dokploy-domain-after-https-click.png');
        await page.screenshot({ path: afterClickScreen });
        console.log('Saved after click screenshot to:', afterClickScreen);

        // Click Save/Update
        await page.click('[role="dialog"] button[type="submit"]:has-text("Save"), [role="dialog"] button[type="submit"]:has-text("Update"), [role="dialog"] button[type="submit"]');
        await page.waitForTimeout(2000);
      }
    }
  }

  // Also do for editButtons[2] (app.webdiag.ru)
  const editButtons2 = await page.$$('button[class*="hover:bg-blue-500"]');
  if (editButtons2.length >= 3) {
    console.log('Clicking editButtons2[2] (app.webdiag.ru domain edit)...');
    await editButtons2[2].click();
    await page.waitForTimeout(1500);

    const dialogSwitches2 = await page.$$('[role="dialog"] button[role="switch"]');
    if (dialogSwitches2.length >= 3) {
      const isChecked = await dialogSwitches2[2].getAttribute('aria-checked');
      if (isChecked !== 'true') {
        console.log('Clicking switch index 2 for app.webdiag.ru...');
        await dialogSwitches2[2].click();
        await page.waitForTimeout(1000);
        await page.click('[role="dialog"] button[type="submit"]');
        await page.waitForTimeout(2000);
      }
    }
  }

  const finalCheckScreen = path.join(__dirname, 'dokploy-domains-final-check.png');
  await page.screenshot({ path: finalCheckScreen, fullPage: true });
  console.log('Saved final check screenshot to:', finalCheckScreen);

  await browser.close();
}

run().catch(console.error);
