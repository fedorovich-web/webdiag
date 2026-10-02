import playwright from '../node_modules/playwright-core/index.js';
const { chromium } = playwright;

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  await page.goto('https://cp.flatero.ru/', { waitUntil: 'networkidle' });

  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, name: e.name })));
  if (inputs.length >= 2) {
    await page.fill(inputs[0].id ? '#' + inputs[0].id : 'input[name="email"]', 'fedorovich.web@yandex.ru');
    await page.fill(inputs[1].id ? '#' + inputs[1].id : 'input[name="password"]', 'nwRL8aK6mnJJ6edYL1');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);
  }

  const duplicateUrl = 'https://cp.flatero.ru/dashboard/project/9djFlwtZhfuug-jt9o0Vt/environment/Ur07yx99KXKMS7S_hlAXl/services/compose/2yI2Yd6ADIg517NIs2T8G';
  await page.goto(duplicateUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const btns = await page.$$eval('button', els => els.map((e, idx) => ({
    idx,
    text: e.innerText?.trim(),
    ariaLabel: e.getAttribute('aria-label'),
    outer: e.outerHTML.slice(0, 200)
  })));
  console.log('Short or icon buttons:', JSON.stringify(btns.filter(b => !b.text || b.text.length < 5), null, 2));

  await browser.close();
}

run().catch(console.error);
