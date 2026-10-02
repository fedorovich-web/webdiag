import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;

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
  await page.waitForTimeout(2000);

  await page.click('[role="tab"]:has-text("Domains")');
  await page.waitForTimeout(1000);

  // If a dialog is open, close it or press Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Add Domain")');
  await page.waitForTimeout(1000);

  // Find all switches in dialog and their parent card/row labels
  const switches = await page.$$eval('[role="dialog"] button[role="switch"]', els =>
    els.map((e, idx) => ({
      idx,
      parentText: e.parentElement?.innerText?.trim().replace(/\n+/g, ' '),
      grandParentText: e.parentElement?.parentElement?.innerText?.trim().replace(/\n+/g, ' '),
      checked: e.getAttribute('aria-checked')
    }))
  );
  console.log('Switches inside Add Domain dialog:', JSON.stringify(switches, null, 2));

  await browser.close();
}

run().catch(console.error);
