const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  const page = await ctx.newPage();

  const eventId = '30490';
  const url = 'https://smoothcomp.com/en/event/' + eventId + '/participants';
  console.log('Visiting:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Final URL:', page.url());

  try {
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('Table found!');
  } catch(e) {
    console.log('No table found within 10s');
  }

  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    const rows = document.querySelectorAll('table tr');
    const allLinks = Array.from(document.querySelectorAll('a[href*="/user/"]')).slice(0, 5).map(a => a.href + ' text=' + a.textContent.trim());
    const firstTableHtml = tables[0] ? tables[0].outerHTML.substring(0, 3000) : 'no table';
    const bodyText = document.body.innerText.substring(0, 1000);
    const rowClasses = Array.from(rows).slice(0, 5).map(r => r.className + ' | cells:' + r.querySelectorAll('td').length);
    return {
      url: window.location.href,
      tableCount: tables.length,
      rowCount: rows.length,
      firstTableHtml,
      bodyText,
      rowClasses,
      allLinks
    };
  });

  console.log('=== PAGE INFO ===');
  console.log('URL:', info.url);
  console.log('Tables:', info.tableCount, 'Rows:', info.rowCount);
  console.log('Row classes:', JSON.stringify(info.rowClasses));
  console.log('User links:', JSON.stringify(info.allLinks));
  console.log('=== FIRST TABLE HTML ===');
  console.log(info.firstTableHtml);
  console.log('=== BODY TEXT ===');
  console.log(info.bodyText);

  await browser.close();
})().catch(console.error);
