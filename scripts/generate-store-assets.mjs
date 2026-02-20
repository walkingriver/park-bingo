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

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'store-assets');

// Play Store screenshot requirements: 16:9 or 9:16, min 320px, max 3840px
// Using standard phone dimensions
const PHONE_VIEWPORT = {
  width: 412,   // Pixel 6 width
  height: 915,  // Pixel 6 height
  deviceScaleFactor: 2.625,
};

// Feature graphic is 1024x500
const FEATURE_GRAPHIC_SIZE = {
  width: 1024,
  height: 500,
};

// Screens to capture
const SCREENS = [
  { name: '01-home', path: '/', waitFor: 'ion-content' },
  { name: '02-play', path: '/play', waitFor: 'ion-content' },
  { name: '03-victory', path: '/victory', waitFor: 'ion-content' },
];

async function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

async function captureScreenshots(page) {
  console.log('\n📱 Capturing phone screenshots...\n');
  
  await page.setViewportSize({
    width: PHONE_VIEWPORT.width,
    height: PHONE_VIEWPORT.height,
  });

  for (const screen of SCREENS) {
    console.log(`  Capturing ${screen.name}...`);
    
    await page.goto(`http://localhost:4200${screen.path}`, { 
      waitUntil: 'networkidle' 
    });
    
    // Wait for content to render
    if (screen.waitFor) {
      await page.waitForSelector(screen.waitFor, { timeout: 10000 }).catch(() => {});
    }
    
    // Extra wait for animations
    await page.waitForTimeout(500);
    
    const screenshotPath = join(OUTPUT_DIR, `screenshot-${screen.name}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      type: 'png',
    });
    
    console.log(`  ✓ Saved: screenshot-${screen.name}.png`);
  }
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
  
  const featureGraphicPath = join(OUTPUT_DIR, 'feature-graphic.png');
  await page.screenshot({ 
    path: featureGraphicPath,
    type: 'png',
  });
  
  console.log(`  ✓ Saved: feature-graphic.png (${FEATURE_GRAPHIC_SIZE.width}x${FEATURE_GRAPHIC_SIZE.height})`);
}

async function generatePlayStoreIcon(page) {
  console.log('\n🎯 Generating Play Store icon...\n');
  
  // Create an HTML page for the 512x512 icon
  const iconHTML = `
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
          width: 512px;
          height: 512px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .icon-container {
          text-align: center;
        }
        .icon {
          font-size: 200px;
          filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.3));
        }
        .bingo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 20px;
        }
        .square {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.3);
          border-radius: 8px;
        }
        .square.filled {
          background: rgba(255,255,255,0.8);
        }
      </style>
    </head>
    <body>
      <div class="icon-container">
        <div class="icon">🎯</div>
        <div class="bingo-grid">
          <div class="square filled"></div>
          <div class="square"></div>
          <div class="square filled"></div>
          <div class="square"></div>
          <div class="square filled"></div>
          <div class="square"></div>
          <div class="square filled"></div>
          <div class="square"></div>
          <div class="square filled"></div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(iconHTML);
  await page.waitForTimeout(100);
  
  const iconPath = join(OUTPUT_DIR, 'play-store-icon.png');
  await page.screenshot({ 
    path: iconPath,
    type: 'png',
  });
  
  console.log(`  ✓ Saved: play-store-icon.png (512x512)`);
}

async function main() {
  console.log('🚀 Play Store Asset Generator\n');
  console.log('=' .repeat(50));
  
  await ensureOutputDir();
  
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: PHONE_VIEWPORT.deviceScaleFactor,
  });
  const page = await context.newPage();
  
  try {
    // Check if dev server is running
    console.log('\n🔍 Checking dev server at http://localhost:4200...');
    await page.goto('http://localhost:4200', { timeout: 5000 });
    console.log('  ✓ Dev server is running\n');
  } catch (error) {
    console.error('\n❌ Error: Dev server not running at http://localhost:4200');
    console.error('   Please start the dev server first: npm start\n');
    await browser.close();
    process.exit(1);
  }
  
  await captureScreenshots(page);
  await generateFeatureGraphic(page);
  await generatePlayStoreIcon(page);
  
  await browser.close();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All assets generated successfully!');
  console.log(`\n📁 Output: ${OUTPUT_DIR}`);
  console.log('\nFiles:');
  console.log('  - screenshot-01-home.png');
  console.log('  - screenshot-02-play.png');
  console.log('  - screenshot-03-victory.png');
  console.log('  - feature-graphic.png (1024x500)');
  console.log('  - play-store-icon.png (512x512)');
  console.log('\n📝 Upload these to Play Console > Store listing');
}

main().catch(console.error);
