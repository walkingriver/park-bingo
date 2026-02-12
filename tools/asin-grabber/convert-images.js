/**
 * Image Converter for Park Bingo
 * 
 * Converts downloaded Amazon product images to mobile-friendly WebP format
 * and copies them to the public/images/products/ folder.
 * 
 * Usage:
 *   npm run convert
 *   npm run convert -- --watch
 * 
 * Input: Downloaded images in ~/Downloads/park-bingo-images/
 * Output: Converted images in ../../public/images/products/
 */

import sharp from 'sharp';
import { readdir, mkdir, copyFile, stat, watch } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { homedir } from 'os';

// Configuration
const config = {
  inputDir: join(homedir(), 'Downloads', 'park-bingo-images'),
  outputDir: join(import.meta.dirname, '..', '..', 'public', 'images', 'products'),
  sizes: {
    // Main product image
    main: { width: 400, height: 400 },
    // Thumbnail for lists
    thumb: { width: 100, height: 100 }
  },
  quality: 85
};

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

async function convertImage(inputPath, outputDir) {
  const filename = basename(inputPath);
  const name = basename(filename, extname(filename));
  
  try {
    // Convert to WebP at main size
    const mainOutput = join(outputDir, `${name}.webp`);
    await sharp(inputPath)
      .resize(config.sizes.main.width, config.sizes.main.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: config.quality })
      .toFile(mainOutput);
    
    console.log(`✅ Converted: ${filename} → ${name}.webp`);
    
    // Also create thumbnail
    const thumbOutput = join(outputDir, `${name}-thumb.webp`);
    await sharp(inputPath)
      .resize(config.sizes.thumb.width, config.sizes.thumb.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: config.quality })
      .toFile(thumbOutput);
    
    console.log(`✅ Created thumbnail: ${name}-thumb.webp`);
    
    return { name, mainOutput, thumbOutput };
  } catch (error) {
    console.error(`❌ Error converting ${filename}:`, error.message);
    return null;
  }
}

async function processAll() {
  console.log('\n🎯 Park Bingo Image Converter\n');
  
  // Check input directory exists
  if (!existsSync(config.inputDir)) {
    console.log(`📂 Input directory not found: ${config.inputDir}`);
    console.log('   Download images using the Chrome extension first.');
    console.log('   Images should be saved to ~/Downloads/park-bingo-images/\n');
    return;
  }
  
  // Ensure output directory exists
  await ensureDir(config.outputDir);
  
  // Get all image files
  const files = await readdir(config.inputDir);
  const imageFiles = files.filter(f => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );
  
  if (imageFiles.length === 0) {
    console.log('No images found in input directory.\n');
    return;
  }
  
  console.log(`Found ${imageFiles.length} image(s) to process...\n`);
  
  const results = [];
  for (const file of imageFiles) {
    const inputPath = join(config.inputDir, file);
    const result = await convertImage(inputPath, config.outputDir);
    if (result) results.push(result);
  }
  
  console.log(`\n✨ Done! Converted ${results.length} image(s).`);
  console.log(`📁 Output: ${config.outputDir}\n`);
  
  // Generate JSON snippet for affiliate-products.json
  if (results.length > 0) {
    console.log('📋 Add to affiliate-products.json:\n');
    results.forEach(r => {
      console.log(`  "imageUrl": "images/products/${r.name}.webp"`);
    });
    console.log('');
  }
}

async function watchMode() {
  console.log('\n👀 Watching for new images...\n');
  console.log(`   Input: ${config.inputDir}`);
  console.log(`   Output: ${config.outputDir}\n`);
  
  await ensureDir(config.inputDir);
  await ensureDir(config.outputDir);
  
  const watcher = watch(config.inputDir);
  
  for await (const event of watcher) {
    if (event.eventType === 'rename' && event.filename) {
      const ext = extname(event.filename).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        // Wait a moment for file to finish writing
        await new Promise(r => setTimeout(r, 500));
        
        const inputPath = join(config.inputDir, event.filename);
        if (existsSync(inputPath)) {
          await convertImage(inputPath, config.outputDir);
        }
      }
    }
  }
}

// Main
const args = process.argv.slice(2);
if (args.includes('--watch')) {
  watchMode();
} else {
  processAll();
}
