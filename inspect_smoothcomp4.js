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
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    // Get all links with /user/ in them
    const userLinks = Array.from(document.querySelectorAll('a[href*="/user/"]')).slice(0, 10).map(a => ({
      href: a.href,
      text: a.textContent.trim(),
      parentHtml: a.parentElement ? a.parentElement.outerHTML.substring(0, 300) : ''
    }));

    // Look for participant rows by common class patterns
    const divRows = Array.from(document.querySelectorAll('[class*="participant"], [class*="athlete"], [class*="row"], [class*="entry"]')).slice(0, 5).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: el.innerText ? el.innerText.substring(0, 100) : '',
      html: el.outerHTML.substring(0, 300)
    }));

    // Get the main content area HTML
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('.content') || document.querySelector('#content');
    const mainHtml = mainContent ? mainContent.outerHTML.substring(0, 5000) : document.body.outerHTML.substring(0, 5000);

    // Get all unique class names used in the page
    const allElements = document.querySelectorAll('*');
    const classSet = new Set();
    allElements.forEach(el => {
      if (el.className && typeof el.className === 'string') {
        el.className.split(' ').forEach(c => { if(c.trim()) classSet.add(c.trim()); });
      }
    });

    // Get the full page HTML around participants section
    const bodyHtml = document.body.outerHTML.substring(0, 8000);

    return {
      url: window.location.href,
      userLinks,
      divRows,
      mainHtml,
      bodyHtml,
      totalElements: allElements.length
    };
  });

  console.log('=== URL ===');
  console.log(info.url);
  console.log('=== USER LINKS ===');
  console.log(JSON.stringify(info.userLinks, null, 2));
  console.log('=== DIV ROWS (participant/athlete/row classes) ===');
  console.log(JSON.stringify(info.divRows, null, 2));
  console.log('=== MAIN CONTENT HTML (first 5000 chars) ===');
  console.log(info.mainHtml);
  console.log('=== BODY HTML (first 8000 chars) ===');
  console.log(info.bodyHtml);

  await browser.close();
})().catch(console.error);
