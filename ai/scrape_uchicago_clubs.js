const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://blueprint.uchicago.edu/organizations';
const OUTPUT_CSV = 'uchicago_clubs.csv';

function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  console.log('Navigating to organizations page...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Load all organizations
  let loadMoreVisible = true;
  let orgCount = 0;
  while (loadMoreVisible) {
    try {
      await page.waitForSelector('button:has-text("Load More")', { timeout: 3000 });
      await page.click('button:has-text("Load More")');
      await page.waitForTimeout(1000); // Wait for new content
      orgCount = await page.locator('a[href^="/organization/"]').count();
      console.log(`Loaded organizations: ${orgCount}`);
    } catch (e) {
      loadMoreVisible = false;
    }
  }

  // Collect organization links
  const orgLinks = await page.$$eval('a[href^="/organization/"]', anchors =>
    anchors.map(a => ({
      href: a.href,
      text: a.textContent.trim()
    }))
  );
  console.log(`Found ${orgLinks.length} organizations.`);

  // Visit each organization page and extract info
  const results = [];
  let processed = 0;
  for (const org of orgLinks) {
    try {
      await page.goto(org.href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500); // Let content load
      const clubName = await page.locator('h1, h2, h3').first().textContent();
      const pageText = await page.content();
      const email = extractEmail(pageText);
      results.push({
        name: clubName ? clubName.trim() : org.text,
        email
      });
      processed++;
      if (processed % 10 === 0 || processed === orgLinks.length) {
        console.log(`Processed ${processed}/${orgLinks.length} organizations...`);
      }
    } catch (err) {
      console.log(`Error processing ${org.href}: ${err}`);
      results.push({ name: org.text, email: '' });
    }
  }

  // Write to CSV
  const csv = [
    'Club Name,Email',
    ...results.map(r => `"${r.name.replace(/"/g, '""')}","${r.email}"`)
  ].join('\n');
  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log(`Saved results to ${OUTPUT_CSV}`);

  await browser.close();
})(); 