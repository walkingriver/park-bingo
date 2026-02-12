#!/usr/bin/env node

/**
 * Download all park attraction images from Disney CDN
 * 
 * Reads the processed JSON files and downloads images at 800x600 size.
 * Saves to public/images/parks/{parkId}/{attractionId}.jpg
 * 
 * Usage:
 *   node download-all-park-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 600;
const RAW_DATA_DIR = path.join(__dirname, 'data');
const IMAGES_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'parks');

// Park ID mappings (from Disney API to our folder structure)
const PARK_IDS = {
  // DLR
  '330339;entityType=theme-park': 'dl',
  '336894;entityType=theme-park': 'dca',
  // WDW
  '80007944;entityType=theme-park': 'mk',
  '80007838;entityType=theme-park': 'epcot',
  '80007998;entityType=theme-park': 'hs',
  '80007823;entityType=theme-park': 'ak',
};

// Seasonal patterns to exclude (same as process-attractions.js)
const SEASONAL_PATTERNS = [
  /holiday/i, /christmas/i, /halloween/i, /lunar new year/i,
  /jollywood/i, /flower.*garden festival/i, /food.*wine festival/i,
  /very merry/i, /not-so-scary/i, /candlelight/i, /thanksgiving/i,
  /easter/i, /limited.time/i, /special event/i, /seasonal/i,
  /winter.*fest/i, /new year.*eve/i, /oogie boogie/i, /after hours/i,
];

function shouldExclude(attraction) {
  const name = attraction.name || '';
  const url = attraction.url || '';
  for (const pattern of SEASONAL_PATTERNS) {
    if (pattern.test(name) || pattern.test(url)) return true;
  }
  return false;
}

// Download with retry
function downloadImage(url, destPath, retries = 3) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadImage(response.headers.location, destPath, retries)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        // Check if file has content
        const stats = fs.statSync(destPath);
        if (stats.size < 1000) {
          fs.unlinkSync(destPath);
          reject(new Error('File too small'));
        } else {
          resolve();
        }
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      if (retries > 0) {
        setTimeout(() => {
          downloadImage(url, destPath, retries - 1)
            .then(resolve)
            .catch(reject);
        }, 1000);
      } else {
        reject(err);
      }
    });
  });
}

// Convert CDN URL to request larger size
function getLargerImageUrl(url) {
  // URL format: https://cdn1.parksmedia.wdprapps.disney.com/resize/mwImage/1/{width}/{height}/75/...
  // Replace the width/height in the URL
  return url.replace(
    /\/resize\/mwImage\/1\/\d+\/\d+\//,
    `/resize/mwImage/1/${IMAGE_WIDTH}/${IMAGE_HEIGHT}/`
  );
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Disney Park Image Downloader ===\n');
  console.log(`Downloading images at ${IMAGE_WIDTH}x${IMAGE_HEIGHT}\n`);
  
  let totalDownloaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  // Process raw data files
  const rawFiles = [
    { file: 'dlr-attractions-raw.json', name: 'Disneyland Resort' },
    { file: 'wdw-attractions-raw.json', name: 'Walt Disney World' },
  ];
  
  for (const { file, name } of rawFiles) {
    const jsonPath = path.join(RAW_DATA_DIR, file);
    
    if (!fs.existsSync(jsonPath)) {
      console.log(`Skipping ${name} (no raw data file)`);
      continue;
    }
    
    const fileContent = fs.readFileSync(jsonPath, 'utf8').trim();
    if (!fileContent) {
      console.log(`Skipping ${name} (empty file)`);
      continue;
    }
    
    const data = JSON.parse(fileContent);
    const attractions = data.results || [];
    
    console.log(`\n=== ${name} (${attractions.length} attractions) ===`);
    
    // Group by park
    const byPark = {};
    for (const attraction of attractions) {
      const parkId = attraction.parkIds?.[0];
      const parkFolder = PARK_IDS[parkId];
      
      if (!parkFolder) continue; // Skip non-theme-park items
      if (shouldExclude(attraction)) continue; // Skip seasonal
      
      if (!byPark[parkFolder]) {
        byPark[parkFolder] = [];
      }
      byPark[parkFolder].push(attraction);
    }
    
    // Download images for each park
    for (const [parkFolder, parkAttractions] of Object.entries(byPark)) {
      const outputDir = path.join(IMAGES_OUTPUT_DIR, parkFolder);
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      console.log(`\n--- ${parkFolder} (${parkAttractions.length} attractions) ---`);
      
      for (const attraction of parkAttractions) {
        const media = attraction.media;
        const attractionId = attraction.urlFriendlyId;
        const destPath = path.join(outputDir, `${attractionId}.jpg`);
        
        // Get CDN URL from media
        let imageUrl = null;
        if (media?.finderStandardThumb?.transcodeTemplate) {
          imageUrl = media.finderStandardThumb.transcodeTemplate
            .replace('{width}', String(IMAGE_WIDTH))
            .replace('{height}', String(IMAGE_HEIGHT));
        } else if (media?.finderStandardThumb?.url) {
          imageUrl = getLargerImageUrl(media.finderStandardThumb.url);
        }
        
        if (!imageUrl) {
          console.log(`  ⚠️  ${attractionId}: No image URL`);
          totalFailed++;
          continue;
        }
        
        // Skip if already downloaded
        if (fs.existsSync(destPath)) {
          const stats = fs.statSync(destPath);
          if (stats.size > 10000) { // More than 10KB
            console.log(`  ✓ ${attractionId}: Already exists`);
            totalSkipped++;
            continue;
          }
        }
        
        try {
          process.stdout.write(`  ⬇️  ${attractionId}...`);
          await downloadImage(imageUrl, destPath);
          const stats = fs.statSync(destPath);
          console.log(` ✓ (${Math.round(stats.size / 1024)}KB)`);
          totalDownloaded++;
          
          // Small delay to be nice to the server
          await sleep(100);
        } catch (error) {
          console.log(` ✗ ${error.message}`);
          totalFailed++;
        }
      }
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Downloaded: ${totalDownloaded}`);
  console.log(`Skipped (existing): ${totalSkipped}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Total processed: ${totalDownloaded + totalSkipped + totalFailed}`);
}

main().catch(console.error);
