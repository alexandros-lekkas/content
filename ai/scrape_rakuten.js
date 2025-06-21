const { chromium } = require("playwright");
const { createObjectCsvWriter } = require("csv-writer");
const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();

async function getExistingBrands(filePath) {
  const existingBrands = new Set();
  if (fs.existsSync(filePath)) {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          if (row.name) {
            existingBrands.add(row.name);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });
  }
  return existingBrands;
}

async function main() {
  const csvPath = "rakuten_brands.csv";
  const header = [
    { id: "created_at", title: "created_at" },
    { id: "name", title: "name" },
    { id: "domain", title: "domain" },
    { id: "network_id", title: "network_id" },
    { id: "is_enabled", title: "is_enabled" },
    { id: "metadata", title: "metadata" },
    { id: "image_url", title: "image_url" },
    { id: "priority", title: "priority" },
  ];

  const fileExists = fs.existsSync(csvPath);
  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header,
    append: fileExists,
  });

  if (!fileExists) {
    await csvWriter.writeRecords([]); // Write header
  }

  const existingBrands = await getExistingBrands(csvPath);
  console.log(`Found ${existingBrands.size} existing brands in ${csvPath}.`);
  const newBrands = new Map();

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("Navigating to login page...");
    await page.goto("https://publisher.rakutenadvertising.com/");

    console.log("Waiting for you to log in manually...");
    await page.waitForSelector('text="Publisher Dashboard"', {
      timeout: 120000,
    });
    console.log("Login successful.");

    console.log("Navigating to advertisers page...");
    const advertisersUrl =
      "https://publisher.rakutenadvertising.com/advertisers/find?index=advertisers&filters=JTdCJTIybmV0d29yayUyMiUzQWZhbHNlJTJDJTIycHVibGljQmFzZWxpbmUlMjIlM0FmYWxzZSUyQyUyMmNvbnRhY3RzJTIyJTNBJTVCJTVEJTJDJTIyY291bnRyaWVzJTIyJTNBJTVCJTVEJTJDJTIydGVybXNmaWx0ZXIlMjIlM0ElMjJmaWVsZCUzQW1pZCUyMHVucGFydG5lcmVkLW9ubHklMjIlMkMlMjJhZHZMb2NhdGlvbiUyMiUzQSUyMmFsbCUyMiU3RA%3D%3D";
    await page.goto(advertisersUrl);

    const advertiserCardSelector = 'div[data-cy="advertiser-card"]';
    await page.waitForSelector(advertiserCardSelector, { timeout: 60000 });

    let processedCards = 0;

    while (true) {
      const advertiserCards = await page.locator(advertiserCardSelector).all();
      const initialCardCount = advertiserCards.length;

      if (processedCards >= initialCardCount) {
        const showMoreButton = page.locator(
          'button[data-cy="advertisers-results-button"]'
        );
        if (
          (await showMoreButton.count()) > 0 &&
          (await showMoreButton.isVisible())
        ) {
          console.log('Clicking "Show more results"...');
          await showMoreButton.click();
          await page.waitForFunction(
            (args) =>
              document.querySelectorAll(args.selector).length >
              args.initialCardCount,
            { selector: advertiserCardSelector, initialCardCount },
            { timeout: 30000 }
          );
          continue; // Restart the loop to re-evaluate cards
        } else {
          console.log('No more "Show more results" button visible.');
          break; // Exit the main loop
        }
      }

      const card = advertiserCards[processedCards];
      processedCards++;

      try {
        const nameElement = await card
          .locator('div[class*="CardBannerText"] > div[class*="Truncated"]')
          .first();
        const name = await nameElement.innerText();

        if (existingBrands.has(name) || newBrands.has(name) || !name) {
          continue;
        }

        const imageElement = await card.locator('img[alt*="logo"]').first();
        const imageUrl = await imageElement.getAttribute("src");

        const viewOfferButton = card.locator('button:has-text("View offer")');

        if (
          (await viewOfferButton.count()) > 0 &&
          (await viewOfferButton.isEnabled())
        ) {
          await viewOfferButton.click();
          await page.waitForSelector('a:has-text("Back to Offers")', {
            timeout: 60000,
          });

          const applyButton = page.locator('button:has-text("Apply")');
          if (await applyButton.isVisible()) {
            console.log(`Applying to ${name}...`);
            await applyButton.click();

            await page.waitForSelector('h2:has-text("Apply Partnership")');
            await page.keyboard.press("End");
            await page.locator("text=Accept Terms and Conditions").click();
            await page.locator('button:has-text("Send Request")').click();
            await page.waitForSelector("text=Partnership request sent", {
              timeout: 15000,
            });
            console.log(`Successfully applied to ${name}.`);
          } else {
            const viewSiteLink = page.locator('a:has-text("View Site")');
            let domain = "N/A";
            if ((await viewSiteLink.count()) > 0) {
              const siteUrl = await viewSiteLink.getAttribute("href");
              domain = new URL(siteUrl).hostname;
            }
            console.log(`Scraped: ${name} - ${domain}`);
            const brandData = { name, domain, image_url: imageUrl };
            newBrands.set(name, brandData);
            await csvWriter.writeRecords([
              {
                created_at: new Date().toISOString(),
                name: brandData.name,
                domain: brandData.domain,
                network_id: 1,
                is_enabled: false,
                metadata: null,
                image_url: brandData.image_url,
                priority: 5,
              },
            ]);
          }

          await page.locator('a:has-text("Back to Offers")').click();
          await page.waitForSelector(advertiserCardSelector, {
            timeout: 60000,
          });
        }
      } catch (e) {
        console.log(`Skipping a card due to error: ${e.message}`);
        if (!page.url().includes("advertisers/find")) {
          await page.goto(advertisersUrl);
          await page.waitForSelector(advertiserCardSelector, {
            timeout: 60000,
          });
        }
      }
    }

    const brandList = Array.from(newBrands.values());
    console.log(`Scraped a total of ${brandList.length} new brands.`);

    const logContent =
      `Scraped ${brandList.length} new brands:\n\n` +
      brandList.map((b) => b.name).join("\n");
    fs.writeFileSync("log.txt", logContent);
    console.log("Log file written successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}

main();
