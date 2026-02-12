/**
 * Simple script to create placeholder icons for the extension.
 * Run: node create-icons.js
 * 
 * Creates simple colored squares with a target symbol.
 * Replace with actual branded icons later.
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';

const sizes = [16, 48, 128];

async function createIcon(size) {
  // Create a simple orange square with rounded corners
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#ff9900"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.3}" fill="none" stroke="white" stroke-width="${size * 0.08}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.1}" fill="white"/>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(`icon${size}.png`);
  
  console.log(`Created icon${size}.png`);
}

async function main() {
  for (const size of sizes) {
    await createIcon(size);
  }
  console.log('Done! Icons created.');
}

main();
