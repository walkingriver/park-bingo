#!/usr/bin/env node
/**
 * Generate Play Store assets using Playwright
 * 
 * This script captures screenshots of the app and generates a feature graphic
 * for the Google Play Store listing.
 * 
 * Usage: node scripts/generate-store-assets.mjs
 * 
 * Prerequisites:
 * - npm install -D @playwright/test
 * - npx playwright install chromium
 * - App must be running at http://localhost:4200
 */

import { chromium } from '@playwright/test';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'store-assets');
const ANDROID_DIR = join(OUTPUT_DIR, 'android');

// Capture at largest size (10-inch tablet) then scale down
// All sizes use 9:16 aspect ratio
const SCREENSHOT_SIZES = {
  'tablet-10inch': { width: 1600, height: 2560 },  // Capture size (largest)
  'tablet-7inch': { width: 1200, height: 1920 },   // Scaled down
  'phone': { width: 1080, height: 1920 },          // Scaled down
  'docs': { width: 375, height: 667 },             // Smaller phone for website docs
};

// Feature graphic must be exactly 1024x500
const FEATURE_GRAPHIC_SIZE = {
  width: 1024,
  height: 500,
};

// Play Store icon must be exactly 512x512
const ICON_SIZE = 512;

// Parks to capture bingo cards for
const PARKS = [
  { id: 'mk', name: 'Magic Kingdom', shortName: 'mk' },
  { id: 'epcot', name: 'EPCOT', shortName: 'epcot' },
  { id: 'hs', name: 'Hollywood Studios', shortName: 'hs' },
  { id: 'ak', name: 'Animal Kingdom', shortName: 'ak' },
  { id: 'dl', name: 'Disneyland', shortName: 'dl' },
  { id: 'dca', name: 'California Adventure', shortName: 'dca' },
];

async function ensureOutputDir() {
  // Create main output dir and android subdirs
  for (const deviceType of Object.keys(SCREENSHOT_SIZES)) {
    const dir = join(ANDROID_DIR, deviceType);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
  console.log(`📁 Output directory: ${ANDROID_DIR}`);
}

async function dismissOnboarding(page) {
  // Set Capacitor Preferences keys to dismiss onboarding modals
  // Capacitor Preferences uses _cap_ prefix in localStorage on web
  await page.evaluate(() => {
    localStorage.setItem('_cap_park-bingo-onboarding', 'true');
    localStorage.setItem('_cap_park-bingo-last-version', '1.0.0');
  });
}

async function disableAds(page) {
  // Block the remote affiliate config to ensure ads are disabled
  await page.route('**/affiliate-products.json', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        associatesTag: '',
        enabled: false,
        showInCardBanner: false,
        bannerRotationSeconds: 60,
        products: [],
      }),
    });
  });
}

async function closeAnyModals(page) {
  // Try to close any open modals by clicking the Done button
  try {
    const modal = page.locator('ion-modal');
    if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Look for Done button in the modal header
      const doneBtn = page.locator('ion-modal ion-button:has-text("Done")').first();
      if (await doneBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await doneBtn.click();
        await page.waitForTimeout(500);
        return;
      }
      // Try other close buttons
      const closeBtn = page.locator('ion-modal ion-button:has-text("Close"), ion-modal ion-button:has-text("Got it")').first();
      if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        return;
      }
      // Click backdrop as last resort
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  } catch (e) {
    // No modal to close
  }
}

async function captureScreenshots(page) {
  const baseSize = SCREENSHOT_SIZES['tablet-10inch'];
  const baseDir = join(ANDROID_DIR, 'tablet-10inch');
  
  console.log(`\n📱 Capturing screenshots at ${baseSize.width}x${baseSize.height} (10-inch tablet)...\n`);
  
  // Disable ads before any navigation
  await disableAds(page);
  
  await page.setViewportSize({
    width: baseSize.width,
    height: baseSize.height,
  });

  // Navigate and dismiss onboarding
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await dismissOnboarding(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await closeAnyModals(page);

  const screenshots = [];

  // 1. Home page screenshot
  console.log('  Capturing 01-home...');
  await page.waitForSelector('ion-content', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  const homePath = join(baseDir, 'screenshot-01-home.png');
  await page.screenshot({ path: homePath, type: 'png' });
  screenshots.push('screenshot-01-home.png');
  console.log('  ✓ Saved: screenshot-01-home.png');

  // 2-7. Bingo cards for each park
  let screenshotNum = 2;
  for (const park of PARKS) {
    const filename = `screenshot-${String(screenshotNum).padStart(2, '0')}-${park.shortName}-bingo.png`;
    console.log(`  Capturing ${filename}...`);
    
    // Go to home and click on the park
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    await page.waitForSelector('ion-card', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);
    await closeAnyModals(page);
    
    // Click the park card
    const parkCard = await page.locator(`ion-card:has-text("${park.name}")`).first();
    await parkCard.click();
    await page.waitForTimeout(500);
    
    // Wait for bingo card to load on /play
    await page.waitForSelector('.bingo-grid, .bingo-card, ion-content', { timeout: 10000 }).catch(() => {});
    // Wait longer for attraction images and text to fully load
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: join(baseDir, filename), type: 'png' });
    screenshots.push(filename);
    console.log(`  ✓ Saved: ${filename}`);
    screenshotNum++;
  }

  // 8. Victory screen
  const victoryFilename = `screenshot-${String(screenshotNum).padStart(2, '0')}-victory.png`;
  console.log(`  Capturing ${victoryFilename}...`);
  await page.goto('http://localhost:4200/victory', { waitUntil: 'networkidle' });
  await page.waitForSelector('ion-content', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(baseDir, victoryFilename), type: 'png' });
  screenshots.push(victoryFilename);
  console.log(`  ✓ Saved: ${victoryFilename}`);

  // Now resize for other device sizes using sips (macOS)
  console.log('\n📐 Resizing screenshots for other device sizes...\n');
  
  for (const [deviceType, size] of Object.entries(SCREENSHOT_SIZES)) {
    // Skip source size and docs (docs needs native capture, not resize)
    if (deviceType === 'tablet-10inch' || deviceType === 'docs') continue;
    
    const targetDir = join(ANDROID_DIR, deviceType);
    console.log(`  Creating ${deviceType} (${size.width}x${size.height})...`);
    
    for (const filename of screenshots) {
      const sourcePath = join(baseDir, filename);
      const targetPath = join(targetDir, filename);
      
      // Copy and resize using sips
      execSync(`cp "${sourcePath}" "${targetPath}"`);
      execSync(`sips -z ${size.height} ${size.width} "${targetPath}" > /dev/null 2>&1`);
    }
    console.log(`  ✓ Created ${screenshots.length} screenshots for ${deviceType}`);
  }
}

async function captureDocsScreenshots(page) {
  const docsSize = SCREENSHOT_SIZES['docs'];
  const docsDir = join(ANDROID_DIR, 'docs');
  
  // Ensure docs dir exists
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }
  
  console.log(`\n📱 Capturing docs screenshots at ${docsSize.width}x${docsSize.height} (small phone)...\n`);
  
  // Disable ads before any navigation
  await disableAds(page);
  
  await page.setViewportSize({
    width: docsSize.width,
    height: docsSize.height,
  });

  // Navigate and dismiss onboarding
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await dismissOnboarding(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await closeAnyModals(page);

  // 1. Home page screenshot
  console.log('  Capturing home...');
  await page.waitForSelector('ion-content', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(docsDir, 'screenshot-home.png'), type: 'png' });
  console.log('  ✓ Saved: screenshot-home.png');

  // Capture 3 park bingo cards (MK, EPCOT, DL for variety)
  const docsParks = [
    { id: 'mk', name: 'Magic Kingdom' },
    { id: 'epcot', name: 'EPCOT' },
    { id: 'dl', name: 'Disneyland' },
  ];
  
  for (const park of docsParks) {
    const filename = `screenshot-${park.id}.png`;
    console.log(`  Capturing ${filename}...`);
    
    // Go to home and click on the park
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    await page.waitForSelector('ion-card', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);
    await closeAnyModals(page);
    
    // Click the park card
    const parkCard = await page.locator(`ion-card:has-text("${park.name}")`).first();
    await parkCard.click();
    await page.waitForTimeout(500);
    
    // Wait for bingo card to load on /play
    await page.waitForSelector('.bingo-grid, .bingo-card, ion-content', { timeout: 10000 }).catch(() => {});
    // Wait longer for attraction images and text to fully load
    await page.waitForTimeout(2500);
    
    await page.screenshot({ path: join(docsDir, filename), type: 'png' });
    console.log(`  ✓ Saved: ${filename}`);
  }
  
  console.log('\n📁 Docs screenshots saved to:', docsDir);
}

async function generateFeatureGraphic(page) {
  console.log('\n🎨 Generating feature graphic...\n');
  
  // Create an HTML page for the feature graphic
  const featureGraphicHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 1024px;
          height: 500px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          overflow: hidden;
        }
        .container {
          text-align: center;
          padding: 40px;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 64px;
          font-weight: 700;
          margin-bottom: 16px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .tagline {
          font-size: 28px;
          font-weight: 400;
          opacity: 0.95;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        .bingo-squares {
          position: absolute;
          opacity: 0.1;
          font-size: 200px;
          transform: rotate(-15deg);
        }
        .squares-left {
          left: -50px;
          top: 50px;
        }
        .squares-right {
          right: -50px;
          bottom: 50px;
        }
      </style>
    </head>
    <body>
      <div class="bingo-squares squares-left">▢▣▢<br>▣▢▣<br>▢▣▢</div>
      <div class="bingo-squares squares-right">▣▢▣<br>▢▣▢<br>▣▢▣</div>
      <div class="container">
        <div class="icon">🎯</div>
        <h1 class="title">Park Pursuit Bingo</h1>
        <p class="tagline">Turn your theme park visit into an adventure</p>
      </div>
    </body>
    </html>
  `;
  
  await page.setViewportSize(FEATURE_GRAPHIC_SIZE);
  await page.setContent(featureGraphicHTML);
  await page.waitForTimeout(100);
  
  const featureGraphicPath = join(ANDROID_DIR, 'feature-graphic.png');
  await page.screenshot({ 
    path: featureGraphicPath,
    type: 'png',
  });
  
  console.log(`  ✓ Saved: feature-graphic.png (${FEATURE_GRAPHIC_SIZE.width}x${FEATURE_GRAPHIC_SIZE.height})`);
}

async function generatePlayStoreIcon(page) {
  console.log('\n🎯 Generating Play Store icon...\n');
  
  // Use the actual app icon SVG from resources/icon.svg
  const iconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea"/>
          <stop offset="100%" style="stop-color:#764ba2"/>
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f5af19"/>
          <stop offset="100%" style="stop-color:#f12711"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="512" height="512" rx="90" ry="90" fill="url(#bgGradient)"/>
      <rect x="56" y="56" width="400" height="400" rx="20" ry="20" fill="white" opacity="0.95"/>
      <g stroke="#667eea" stroke-width="3" fill="none" opacity="0.3">
        <line x1="136" y1="56" x2="136" y2="456"/>
        <line x1="216" y1="56" x2="216" y2="456"/>
        <line x1="296" y1="56" x2="296" y2="456"/>
        <line x1="376" y1="56" x2="376" y2="456"/>
        <line x1="56" y1="136" x2="456" y2="136"/>
        <line x1="56" y1="216" x2="456" y2="216"/>
        <line x1="56" y1="296" x2="456" y2="296"/>
        <line x1="56" y1="376" x2="456" y2="376"/>
      </g>
      <g fill="url(#goldGradient)" opacity="0.85">
        <circle cx="96" cy="96" r="30"/>
        <circle cx="256" cy="176" r="30"/>
        <circle cx="176" cy="336" r="30"/>
        <circle cx="416" cy="416" r="30"/>
        <circle cx="96" cy="256" r="30"/>
      </g>
      <g fill="#667eea">
        <rect x="226" y="280" width="60" height="40" rx="2"/>
        <path d="M248 320 L248 295 Q256 285 264 295 L264 320 Z" fill="white"/>
        <rect x="220" y="250" width="16" height="35"/>
        <rect x="276" y="250" width="16" height="35"/>
        <rect x="244" y="230" width="24" height="55"/>
        <polygon points="228,250 220,235 236,235"/>
        <polygon points="284,250 276,235 292,235"/>
        <polygon points="256,230 240,215 272,215"/>
        <line x1="228" y1="235" x2="228" y2="220" stroke="#f5af19" stroke-width="2"/>
        <polygon points="228,220 228,228 238,224" fill="#f5af19"/>
        <line x1="284" y1="235" x2="284" y2="220" stroke="#f5af19" stroke-width="2"/>
        <polygon points="284,220 284,228 294,224" fill="#f5af19"/>
        <line x1="256" y1="215" x2="256" y2="195" stroke="#f5af19" stroke-width="3"/>
        <polygon points="256,195 256,208 270,201" fill="#f5af19"/>
      </g>
    </svg>
  `;

  const iconHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 512px;
          height: 512px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }
        svg { width: 512px; height: 512px; }
      </style>
    </head>
    <body>${iconSVG}</body>
    </html>
  `;
  
  await page.setViewportSize({ width: ICON_SIZE, height: ICON_SIZE });
  await page.setContent(iconHTML);
  await page.waitForTimeout(100);
  
  const iconPath = join(ANDROID_DIR, 'play-store-icon.png');
  await page.screenshot({ 
    path: iconPath,
    type: 'png',
  });
  
  console.log(`  ✓ Saved: play-store-icon.png (${ICON_SIZE}x${ICON_SIZE})`);
}

async function main() {
  console.log('🚀 Play Store Asset Generator\n');
  console.log('=' .repeat(50));
  
  await ensureOutputDir();
  
  const browser = await chromium.launch();
  
  // Context for screenshots - deviceScaleFactor=1 for exact pixel dimensions
  const screenshotContext = await browser.newContext({
    deviceScaleFactor: 1,
  });
  const screenshotPage = await screenshotContext.newPage();
  
  // Context for generated graphics - deviceScaleFactor=1 for exact dimensions
  const graphicsContext = await browser.newContext({
    deviceScaleFactor: 1,
  });
  const graphicsPage = await graphicsContext.newPage();
  
  try {
    // Check if dev server is running
    console.log('\n🔍 Checking dev server at http://localhost:4200...');
    await screenshotPage.goto('http://localhost:4200', { timeout: 5000 });
    console.log('  ✓ Dev server is running\n');
  } catch (error) {
    console.error('\n❌ Error: Dev server not running at http://localhost:4200');
    console.error('   Please start the dev server first: npm start\n');
    await browser.close();
    process.exit(1);
  }
  
  await captureScreenshots(screenshotPage);
  await captureDocsScreenshots(screenshotPage);
  await generateFeatureGraphic(graphicsPage);
  await generatePlayStoreIcon(graphicsPage);
  
  await browser.close();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All assets generated successfully!');
  console.log(`\n📁 Output: ${ANDROID_DIR}`);
  console.log('\nFolders:');
  console.log('  android/tablet-10inch/ - 8 screenshots (1600x2560)');
  console.log('  android/tablet-7inch/  - 8 screenshots (1200x1920)');
  console.log('  android/phone/         - 8 screenshots (1080x1920)');
  console.log('  android/docs/          - 4 screenshots (375x667) for website');
  console.log('\nGraphics:');
  console.log('  android/feature-graphic.png (1024x500)');
  console.log('  android/play-store-icon.png (512x512)');
  console.log('\n📝 Upload store assets to Play Console > Store listing');
  console.log('📝 Copy docs screenshots to docs/images/ for website');
}

main().catch(console.error);
