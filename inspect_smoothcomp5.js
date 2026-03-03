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
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    // Get participant groups
    const groups = Array.from(document.querySelectorAll('.participant-group'));
    const firstGroupHtml = groups[0] ? groups[0].outerHTML.substring(0, 6000) : 'no group found';

    // Get individual participant rows
    const participantRows = Array.from(document.querySelectorAll('[class*="participant"]')).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: el.innerText ? el.innerText.substring(0, 200) : '',
      html: el.outerHTML.substring(0, 500)
    }));

    // Look for any links within participant groups
    const groupLinks = groups[0] ? Array.from(groups[0].querySelectorAll('a')).map(a => ({
      href: a.href,
      text: a.textContent.trim(),
      classes: a.className
    })) : [];

    // Find all elements with IDs or data attributes related to participants
    const dataElements = Array.from(document.querySelectorAll('[data-user-id], [data-participant], [data-id]')).slice(0, 10).map(el => ({
      tag: el.tagName,
      className: el.className,
      dataset: JSON.stringify(el.dataset),
      text: el.innerText ? el.innerText.substring(0, 100) : ''
    }));

    // Get the participants container full HTML
    const participantsContainer = document.querySelector('.participants-container') || 
                                  document.querySelector('[is="participants"]') ||
                                  document.querySelector('.content > div:last-child');
    const containerHtml = participantsContainer ? participantsContainer.outerHTML.substring(0, 8000) : 'not found';

    return {
      groupCount: groups.length,
      firstGroupHtml,
      participantRowCount: participantRows.length,
      participantRows: participantRows.slice(0, 15),
      groupLinks: groupLinks.slice(0, 20),
      dataElements,
      containerHtml
    };
  });

  console.log('=== GROUP COUNT ===', info.groupCount);
  console.log('=== PARTICIPANT ROWS ===');
  info.participantRows.forEach((r, i) => {
    console.log(`\n--- Row ${i} ---`);
    console.log('tag:', r.tag, 'className:', r.className);
    console.log('text:', r.text);
    console.log('html:', r.html);
  });
  console.log('\n=== GROUP LINKS (first 20) ===');
  console.log(JSON.stringify(info.groupLinks, null, 2));
  console.log('\n=== DATA ELEMENTS ===');
  console.log(JSON.stringify(info.dataElements, null, 2));
  console.log('\n=== FIRST GROUP HTML (6000 chars) ===');
  console.log(info.firstGroupHtml);
  console.log('\n=== CONTAINER HTML ===');
  console.log(info.containerHtml);

  await browser.close();
})().catch(console.error);
