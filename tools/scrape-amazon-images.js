#!/usr/bin/env node
/**
 * Amazon Product Scraper & Image Downloader
 * 
 * Uses Playwright to scrape product info and download images from Amazon.
 * Images are saved locally so the app doesn't hotlink Amazon's CDN.
 * 
 * Usage Modes:
 * 
 * 1. FROM ASIN LIST (build from scratch):
 *    node scrape-amazon-images.js --asins asins.txt --output affiliate-products.json
 *    
 *    Where asins.txt contains one ASIN per line:
 *      B0C2SG41BX
 *      1628091533
 *      B0DZSY6T4K
 * 
 * 2. FROM EXISTING JSON (add images to existing products):
 *    node scrape-amazon-images.js --input affiliate-products.json
 * 
 * Options:
 *   --asins      Text file with one ASIN per line (builds new JSON from scratch)
 *   --input      Existing JSON file with products (adds imageUrl to existing)
 *   --output     Output JSON file (default: stdout)
 *   --images-dir Directory to save downloaded images (default: ../public/images/products)
 *   --delay      Delay between requests in ms (default: 2000)
 *   --tag        Amazon Associates tag (default: walkingriver-20)
 *   --skip-download  Only scrape URLs, don't download images
 * 
 * Note: This script is for personal use only. Amazon's ToS prohibits scraping.
 * Use responsibly with appropriate delays.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};
const hasFlag = (name) => args.includes(`--${name}`);

const asinsFile = getArg('asins', null);
const inputFile = getArg('input', asinsFile ? null : path.join(__dirname, '../public/data/affiliate-products.json'));
const outputFile = getArg('output', null);
const imagesDir = getArg('images-dir', path.join(__dirname, '../public/images/products'));
const delayMs = parseInt(getArg('delay', '2000'), 10);
const associatesTag = getArg('tag', 'walkingriver-20');
const skipDownload = hasFlag('skip-download');

/**
 * Download an image from a URL and save it locally
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

/**
 * Scrape product details from Amazon page
 */
async function scrapeAmazonProduct(page, asin) {
  const url = `https://www.amazon.com/dp/${asin}`;
  console.log(`  Fetching: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a bit for content to load
    await page.waitForTimeout(1500);

    // Check for CAPTCHA
    const captcha = await page.$('#captchacharacters');
    if (captcha) {
      console.log(`  ⚠️  CAPTCHA detected for ${asin} - skipping`);
      return null;
    }

    // Extract product title
    let name = null;
    const titleEl = await page.$('#productTitle');
    if (titleEl) {
      name = await titleEl.textContent();
      name = name.trim();
      // Truncate very long titles
      if (name.length > 80) {
        name = name.substring(0, 77) + '...';
      }
    }

    // Extract description from feature bullets or product description
    let description = null;
    const bulletEl = await page.$('#feature-bullets li span.a-list-item');
    if (bulletEl) {
      description = await bulletEl.textContent();
      description = description.trim();
      // Truncate long descriptions
      if (description.length > 120) {
        description = description.substring(0, 117) + '...';
      }
    }
    
    // Fallback to book description
    if (!description) {
      const bookDescEl = await page.$('#bookDescription_feature_div span');
      if (bookDescEl) {
        description = await bookDescEl.textContent();
        description = description.trim().substring(0, 120);
      }
    }

    // Try to determine category
    let category = 'accessory'; // default
    const breadcrumb = await page.$('#wayfinding-breadcrumbs_feature_div');
    if (breadcrumb) {
      const breadcrumbText = await breadcrumb.textContent();
      const lowerText = breadcrumbText.toLowerCase();
      if (lowerText.includes('book') || lowerText.includes('kindle')) {
        category = 'book';
      } else if (lowerText.includes('clothing') || lowerText.includes('apparel')) {
        category = 'clothing';
      } else if (lowerText.includes('toy') || lowerText.includes('game')) {
        category = 'toy';
      }
    }

    // Extract image
    const imageSelectors = [
      '#landingImage',                          // Main product image
      '#imgBlkFront',                           // Book cover
      '#main-image',                            // Alternative main image
      '#ebooksImgBlkFront',                     // Kindle book
      '.a-dynamic-image',                       // Dynamic loaded image
      '[data-old-hires]',                       // High-res data attribute
      '#imageBlock img',                        // Any image in image block
    ];

    let imageUrl = null;

    for (const selector of imageSelectors) {
      const img = await page.$(selector);
      if (img) {
        // Try to get high-res version first
        imageUrl = await img.getAttribute('data-old-hires');
        if (!imageUrl) {
          imageUrl = await img.getAttribute('src');
        }
        if (imageUrl && imageUrl.startsWith('http')) {
          break;
        }
      }
    }

    // Clean up the URL - get a reasonable size
    if (imageUrl) {
      imageUrl = imageUrl.replace(/\._[^.]+_\./, '._SL500_.');
    }

    return {
      asin,
      name: name || `Product ${asin}`,
      description: description || 'Great for your Disney park visit',
      category,
      imageUrl
    };
  } catch (error) {
    console.log(`  ❌ Error fetching ${asin}: ${error.message}`);
    return null;
  }
}

/**
 * Legacy function for just getting image URL (used when updating existing JSON)
 */
async function scrapeAmazonImage(page, asin) {
  const result = await scrapeAmazonProduct(page, asin);
  return result ? result.imageUrl : null;
}

/**
 * Load ASINs from a text file (one per line)
 */
function loadAsinsFromFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')); // Skip empty lines and comments
}

async function main() {
  console.log('🛒 Amazon Product Scraper & Image Downloader\n');

  let products = [];
  let isAsinMode = false;
  let existingConfig = null;

  // Determine mode: ASIN list or existing JSON
  if (asinsFile) {
    // Mode 1: Build from ASIN list
    if (!fs.existsSync(asinsFile)) {
      console.error(`Error: ASIN file not found: ${asinsFile}`);
      process.exit(1);
    }
    const asins = loadAsinsFromFile(asinsFile);
    products = asins.map(asin => ({ asin }));
    isAsinMode = true;
    console.log(`📋 Mode: Building from ASIN list`);
    console.log(`📦 Found ${products.length} ASINs to process`);
  } else if (inputFile) {
    // Mode 2: Update existing JSON
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file not found: ${inputFile}`);
      process.exit(1);
    }
    existingConfig = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    products = existingConfig.products || [];
    console.log(`📋 Mode: Updating existing JSON`);
    console.log(`📦 Found ${products.length} products to process`);
  } else {
    console.error('Error: Please provide --asins <file> or --input <file>');
    process.exit(1);
  }

  console.log(`⏱️  Delay between requests: ${delayMs}ms`);
  
  if (!skipDownload) {
    console.log(`📁 Images will be saved to: ${imagesDir}`);
    // Create images directory if it doesn't exist
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
  }
  console.log();

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  // Process each product
  const results = [];
  let successCount = 0;
  let skipCount = 0;
  let downloadCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const asin = product.asin;
    
    console.log(`[${i + 1}/${products.length}] ${product.name || asin}`);

    const localImagePath = `/images/products/${asin}.jpg`;
    const localFilePath = path.join(imagesDir, `${asin}.jpg`);

    // Skip if local image already exists (unless we need product info)
    if (!isAsinMode && fs.existsSync(localFilePath)) {
      console.log(`  ✅ Image already downloaded, skipping`);
      results.push({ ...product, imageUrl: localImagePath });
      skipCount++;
      continue;
    }

    if (isAsinMode) {
      // ASIN mode: scrape full product details
      const scrapedProduct = await scrapeAmazonProduct(page, asin);
      
      if (scrapedProduct) {
        console.log(`  📝 Name: ${scrapedProduct.name}`);
        console.log(`  📦 Category: ${scrapedProduct.category}`);
        
        if (scrapedProduct.imageUrl) {
          console.log(`  🖼️  Image: ${scrapedProduct.imageUrl.substring(0, 50)}...`);
          
          if (!skipDownload) {
            try {
              await downloadImage(scrapedProduct.imageUrl, localFilePath);
              console.log(`  📥 Downloaded to: ${localFilePath}`);
              downloadCount++;
            } catch (err) {
              console.log(`  ❌ Download failed: ${err.message}`);
            }
          }
        }
        
        results.push({
          asin,
          name: scrapedProduct.name,
          description: scrapedProduct.description,
          category: scrapedProduct.category,
          parks: [], // User will need to fill this in
          imageUrl: localImagePath
        });
        successCount++;
      } else {
        console.log(`  ⚠️  Could not scrape product`);
      }
    } else {
      // Existing JSON mode: just get the image
      const amazonImageUrl = await scrapeAmazonImage(page, asin);

      if (amazonImageUrl) {
        console.log(`  ✅ Found image: ${amazonImageUrl.substring(0, 60)}...`);
        
        if (!skipDownload) {
          try {
            await downloadImage(amazonImageUrl, localFilePath);
            console.log(`  📥 Downloaded to: ${localFilePath}`);
            results.push({ ...product, imageUrl: localImagePath });
            downloadCount++;
          } catch (err) {
            console.log(`  ❌ Download failed: ${err.message}`);
            results.push({ ...product, imageUrl: amazonImageUrl });
          }
        } else {
          results.push({ ...product, imageUrl: amazonImageUrl });
        }
        successCount++;
      } else {
        console.log(`  ⚠️  No image found`);
        results.push(product);
      }
    }

    // Delay between requests to be polite
    if (i < products.length - 1) {
      await page.waitForTimeout(delayMs);
    }
  }

  await browser.close();

  // Build output config
  let outputConfig;
  if (isAsinMode) {
    // Create new config structure
    outputConfig = {
      associatesTag: associatesTag,
      enabled: true,
      showInCardBanner: true,
      bannerRotationSeconds: 60,
      products: results
    };
  } else {
    // Update existing config
    outputConfig = { ...existingConfig, products: results };
  }

  const outputJson = JSON.stringify(outputConfig, null, 2);

  if (outputFile) {
    fs.writeFileSync(outputFile, outputJson);
    console.log(`\n📄 Output written to: ${outputFile}`);
  } else {
    console.log('\n📄 Output JSON:\n');
    console.log(outputJson);
  }

  console.log(`\n✨ Done!`);
  console.log(`   ${successCount} products processed`);
  if (!skipDownload) {
    console.log(`   ${downloadCount} images downloaded`);
  }
  console.log(`   ${skipCount} skipped (already existed)`);
  
  if (isAsinMode) {
    console.log(`\n⚠️  Note: "parks" arrays are empty - edit the output to assign products to parks.`);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
