#!/usr/bin/env node

/**
 * Image Fetching Script for Park Bingo
 *
 * This script automatically fetches images for all park items from free APIs:
 * - Pixabay (primary) for generic items
 * - Unsplash/Pexels (fallbacks) for generic items
 * - Hugging Face AI (for Disney-specific attractions)
 *
 * Usage: node scripts/fetch-images.js
 */

const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const chalk = require('chalk');
require('dotenv').config();

// Configuration
const PARKS_DATA_DIR = path.join(__dirname, '../src/data/parks');
const IMAGES_BASE_DIR = path.join(__dirname, '../public/images/parks');
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 300;
const IMAGE_QUALITY = 80;

// API Keys (from environment or defaults to demo keys - users should set their own)
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || '';

// Park ID mapping
const PARK_ID_MAP = {
  'magic-kingdom.json': 'mk',
  'epcot.json': 'epcot',
  'hollywood-studios.json': 'hs',
  'animal-kingdom.json': 'ak',
  'disneyland.json': 'dl',
  'disney-california-adventure.json': 'dca',
};

// Park name mapping
const PARK_NAME_MAP = {
  'mk': 'Magic Kingdom',
  'epcot': 'EPCOT',
  'hs': 'Hollywood Studios',
  'ak': 'Animal Kingdom',
  'dl': 'Disneyland',
  'dca': 'Disney California Adventure',
};

// Rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch with timeout helper
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Sanitize filename
function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Check if image exists locally
async function imageExists(parkId, itemId) {
  const imagePath = path.join(IMAGES_BASE_DIR, parkId, `${itemId}.jpg`);
  return await fs.pathExists(imagePath);
}

// Fetch image from Pixabay (tries multiple search terms)
async function fetchFromPixabay(searchTerms) {
  if (!PIXABAY_API_KEY) {
    console.log('  ⚠️  Pixabay API key not set, skipping...');
    return null;
  }

  // Try each search term until we find a good match
  for (const searchTerm of searchTerms) {
    try {
      const params = new URLSearchParams({
        key: PIXABAY_API_KEY,
        q: searchTerm,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        per_page: '5', // Get more results to find better matches
      });

      const response = await fetchWithTimeout(
        `https://pixabay.com/api/?${params.toString()}`,
        {},
        10000
      );

      if (!response.ok) {
        continue; // Try next search term
      }

      const data = await response.json();

      if (data.hits && data.hits.length > 0) {
        // Return the first result (Pixabay orders by relevance)
        return data.hits[0].webformatURL || data.hits[0].largeImageURL;
      }
    } catch (error) {
      // Continue to next search term
      continue;
    }
  }

  return null;
}

// Fetch image from Unsplash (tries multiple search terms)
async function fetchFromUnsplash(searchTerms) {
  if (!UNSPLASH_ACCESS_KEY) {
    return null;
  }

  for (const searchTerm of searchTerms) {
    try {
      const params = new URLSearchParams({
        query: searchTerm,
        per_page: '3',
        orientation: 'landscape',
      });

      const response = await fetchWithTimeout(
        `https://api.unsplash.com/search/photos?${params.toString()}`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        },
        10000
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

// Fetch image from Pexels (tries multiple search terms)
async function fetchFromPexels(searchTerms) {
  if (!PEXELS_API_KEY) {
    return null;
  }

  for (const searchTerm of searchTerms) {
    try {
      const params = new URLSearchParams({
        query: searchTerm,
        per_page: '3',
        orientation: 'landscape',
      });

      const response = await fetchWithTimeout(
        `https://api.pexels.com/v1/search?${params.toString()}`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        },
        10000
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        return data.photos[0].src.large;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

// Generate image using Hugging Face (Stable Diffusion)
async function generateWithAI(prompt) {
  if (!HUGGING_FACE_API_KEY) {
    return null;
  }

  try {
    // Use a generic Stable Diffusion model
    const model = 'stabilityai/stable-diffusion-2-1';
    const response = await fetchWithTimeout(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
          },
        }),
      },
      30000
    );

    if (!response.ok) {
      // Silently skip if API is unavailable (410 Gone, 503 Service Unavailable, etc.)
      if (response.status === 410 || response.status === 503) {
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    // Convert arraybuffer to buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    // Only log if it's not a known "service unavailable" type error
    if (!error.message.includes('410') && !error.message.includes('503')) {
      console.log(`  ⚠️  AI generation error: ${error.message}`);
    }
    return null;
  }
}

// Download and optimize image
async function downloadAndOptimize(imageUrl, outputPath) {
  try {
    const response = await fetchWithTimeout(imageUrl, {}, 15000);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Optimize with sharp
    await sharp(imageBuffer)
      .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: IMAGE_QUALITY })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.log(`  ⚠️  Download error: ${error.message}`);
    return false;
  }
}

// Save AI-generated image
async function saveAIImage(imageBuffer, outputPath) {
  try {
    await sharp(imageBuffer)
      .resize(IMAGE_WIDTH, IMAGE_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: IMAGE_QUALITY })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.log(`  ⚠️  Save error: ${error.message}`);
    return false;
  }
}

// Get search terms for item (returns array of search terms to try)
function getSearchTerms(item, parkName = '') {
  const { name, type, description, categories } = item;
  const terms = [];

  // Build Disney + park context for better results
  const disneyContext = parkName ? `Disney ${parkName}` : 'Disney';

  // For generic items, use name + type context
  if (type === 'food') {
    terms.push(`${name} food`);
    terms.push(name);
    if (description) {
      // Extract key food words from description
      const foodWords = description.toLowerCase().match(/\b(ice cream|churro|turkey|dole|whip|bar|snack|treat)\b/g);
      if (foodWords) {
        terms.push(foodWords.join(' '));
      }
    }
    return terms;
  }

  if (type === 'transportation') {
    terms.push(`${name} train`);
    terms.push(`${name} transportation`);
    terms.push(name);
    return terms;
  }

  if (type === 'detail') {
    terms.push(name.toLowerCase());
    // Try without "make a wish" or similar phrases
    const cleanName = name.replace(/^(make a |ring the |find the )/i, '');
    if (cleanName !== name.toLowerCase()) {
      terms.push(cleanName.toLowerCase());
    }
    return terms;
  }

  // For Disney-specific attractions, try multiple strategies
  if (type === 'ride' || type === 'show' || type === 'character') {
    // Strategy 1: Use specific keywords from name and description with Disney context
    const keyWords = [];

    // Extract meaningful words from name (skip common words)
    const nameWords = name
      .split(/\s+/)
      .filter(word =>
        word.length > 3 &&
        !['the', 'and', 'of', 'for', 'with', 'from'].includes(word.toLowerCase())
      )
      .slice(0, 3); // Take up to 3 key words

    if (nameWords.length > 0) {
      keyWords.push(...nameWords);
    }

    // Add category keywords if available
    if (categories && categories.length > 0) {
      const meaningfulCategories = categories.filter(cat =>
        !['thrill', 'family', 'indoor', 'outdoor', 'classic'].includes(cat)
      );
      if (meaningfulCategories.length > 0) {
        keyWords.push(...meaningfulCategories.slice(0, 2));
      }
    }

    // Build search terms with Disney + park context (most specific first)
    if (keyWords.length > 0) {
      const keyPhrase = keyWords.join(' ');

      // Most specific: Disney + Park + Key words
      if (parkName) {
        terms.push(`${keyPhrase} ${disneyContext}`);
        terms.push(`${disneyContext} ${keyPhrase}`);
      }

      // Disney + Key words
      terms.push(`${keyPhrase} Disney`);
      terms.push(`Disney ${keyPhrase}`);

      // Key words with attraction context
      terms.push(`${keyPhrase} attraction`);
      terms.push(keyPhrase);

      // Try with description keywords
      if (description) {
        const descWords = description
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 4)
          .slice(0, 2);
        if (descWords.length > 0) {
          if (parkName) {
            terms.push(`${keyPhrase} ${descWords.join(' ')} ${disneyContext}`);
          }
          terms.push(`${keyPhrase} ${descWords.join(' ')} Disney`);
        }
      }
    }

    // Fallback to name-based searches with Disney context
    if (parkName) {
      terms.push(`${name} ${disneyContext}`);
      terms.push(`${disneyContext} ${name}`);
    }
    terms.push(`${name} Disney`);
    terms.push(`Disney ${name}`);
    terms.push(name);
    terms.push(`${name} ride`);
    terms.push(`${name} attraction`);

    return terms;
  }

  return [name];
}

// Get AI prompt for item
function getAIPrompt(item) {
  const { name, description, type } = item;
  return `A theme park attraction: ${name}. ${description}. Colorful, family-friendly, professional photography style.`;
}

// Determine if item is generic (can use stock photos)
function isGenericItem(item) {
  return ['food', 'transportation'].includes(item.type) ||
         item.categories?.some(cat => ['snack', 'sweet', 'savory'].includes(cat));
}

// Fetch image for an item
async function fetchImageForItem(item, parkId, forceRefresh = false) {
  const itemId = sanitizeFilename(item.id);
  const imagePath = path.join(IMAGES_BASE_DIR, parkId, `${itemId}.jpg`);

      // Check if image already exists (unless force refresh)
      if (!forceRefresh && await imageExists(parkId, itemId)) {
        console.log(chalk.green(`  ✓ Image already exists: ${item.name}`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }

  // Ensure directory exists
  await fs.ensureDir(path.dirname(imagePath));

  // Get park name for context
  const parkName = PARK_NAME_MAP[parkId] || '';
  const searchTerms = getSearchTerms(item, parkName);
  const isGeneric = isGenericItem(item);

  console.log(chalk.cyan(`  🔍 Fetching image for: ${item.name} (${item.type})`));
  if (searchTerms.length > 1) {
    console.log(`  🔎 Trying search terms: ${searchTerms.slice(0, 3).join(', ')}...`);
  }

  // Strategy 1: For generic items, try stock photo APIs
  // Order: Pixabay (unlimited) → Pexels (200/hr) → Unsplash (50/hr)
  if (isGeneric) {
    // Try Pixabay first (unlimited requests)
    let imageUrl = await fetchFromPixabay(searchTerms);
    if (imageUrl) {
      console.log(chalk.blue(`  📥 Downloading from Pixabay...`));
      if (await downloadAndOptimize(imageUrl, imagePath)) {
        console.log(chalk.green(`  ✓ Success!`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }
    }

    // Fallback to Pexels (200 requests/hour)
    imageUrl = await fetchFromPexels(searchTerms);
    if (imageUrl) {
      console.log(chalk.blue(`  📥 Downloading from Pexels...`));
      if (await downloadAndOptimize(imageUrl, imagePath)) {
        console.log(chalk.green(`  ✓ Success!`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }
    }

    // Fallback to Unsplash last (50 requests/hour - most limited)
    imageUrl = await fetchFromUnsplash(searchTerms);
    if (imageUrl) {
      console.log(chalk.blue(`  📥 Downloading from Unsplash...`));
      if (await downloadAndOptimize(imageUrl, imagePath)) {
        console.log(chalk.green(`  ✓ Success!`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }
    }
  }

  // Strategy 2: For Disney-specific attractions, try AI generation first (if API key is set)
  if (!isGeneric && HUGGING_FACE_API_KEY) {
    const prompt = getAIPrompt(item);
    const aiImageBuffer = await generateWithAI(prompt);
    if (aiImageBuffer) {
      console.log(chalk.magenta(`  🎨 Generated with AI, saving...`));
      if (await saveAIImage(aiImageBuffer, imagePath)) {
        console.log(chalk.green(`  ✓ AI generation success!`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }
    }
    // If AI generation fails silently, continue to stock photo fallback
  }

  // Strategy 3: Fallback to stock photos for Disney attractions
  // Order: Pixabay (unlimited) → Pexels (200/hr) → Unsplash (50/hr)
  if (!isGeneric) {
    // Add theme park context to search terms as last resort
    const themeParkTerms = searchTerms.map(term => `${term} theme park`);
    const allTerms = [...searchTerms, ...themeParkTerms];

    let imageUrl = await fetchFromPixabay(allTerms);
    if (imageUrl) {
      console.log(chalk.blue(`  📥 Downloading from Pixabay...`));
      if (await downloadAndOptimize(imageUrl, imagePath)) {
        console.log(chalk.green(`  ✓ Success!`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }
    }

    // Try Pexels before Unsplash (higher rate limit)
    imageUrl = await fetchFromPexels(allTerms);
    if (imageUrl) {
      console.log(chalk.blue(`  📥 Downloading from Pexels...`));
      if (await downloadAndOptimize(imageUrl, imagePath)) {
        console.log(chalk.green(`  ✓ Success!`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }
    }

    // Try Unsplash last (lowest rate limit - 50/hour)
    imageUrl = await fetchFromUnsplash(allTerms);
    if (imageUrl) {
      console.log(chalk.blue(`  📥 Downloading from Unsplash...`));
      if (await downloadAndOptimize(imageUrl, imagePath)) {
        console.log(chalk.green(`  ✓ Success!`));
        return `/images/parks/${parkId}/${itemId}.jpg`;
      }
    }
  }

  console.log(chalk.red(`  ❌ Could not find image for: ${item.name}`));
  return null;
}

// Process a single park file
async function processParkFile(filename, forceRefresh = false) {
  const filePath = path.join(PARKS_DATA_DIR, filename);
  const parkId = PARK_ID_MAP[filename];

  if (!parkId) {
    console.log(`⚠️  Unknown park file: ${filename}`);
    return;
  }

  console.log(chalk.blue.bold(`\n📦 Processing park: ${parkId.toUpperCase()} (${filename})`));

  try {
    const items = await fs.readJson(filePath);

    let updated = false;
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n[${i + 1}/${items.length}] ${item.name}`);

      // Rate limiting - be nice to APIs
      if (i > 0 && i % 10 === 0) {
        console.log('  ⏳ Rate limiting pause...');
        await delay(2000);
      }

      const imageUrl = await fetchImageForItem(item, parkId, forceRefresh);

      if (imageUrl) {
        if (!item.imageUrl || item.imageUrl !== imageUrl) {
          item.imageUrl = imageUrl;
          updated = true;
        }
        successCount++;
      } else {
        skipCount++;
      }

      // Small delay between items
      await delay(500);
    }

    // Save updated JSON if changes were made
    if (updated) {
      await fs.writeJson(filePath, items, { spaces: 2 });
      console.log(chalk.green.bold(`\n✅ Updated ${filename} with ${successCount} images`));
    } else {
      console.log(chalk.green(`\n✓ ${filename} - ${successCount} images, ${skipCount} skipped`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error processing ${filename}:`), error.message);
  }
}

// Main function
async function main() {
  // Check for --force flag
  const forceRefresh = process.argv.includes('--force') || process.argv.includes('-f');

  console.log(chalk.cyan.bold('🎨 Park Bingo Image Fetcher\n'));
  console.log('This script will fetch images for all park items.');
  if (forceRefresh) {
    console.log(chalk.yellow('⚠️  Force mode: Will re-fetch all images, even if they already exist.\n'));
  }
  console.log('API keys can be set via environment variables or .env file.\n');

  // Check if API keys are set
  const hasAnyKey = PIXABAY_API_KEY || UNSPLASH_ACCESS_KEY || PEXELS_API_KEY || HUGGING_FACE_API_KEY;
  if (!hasAnyKey) {
    console.log(chalk.yellow('⚠️  WARNING: No API keys found!'));
    console.log(chalk.yellow('   Set at least one of: PIXABAY_API_KEY, UNSPLASH_ACCESS_KEY, PEXELS_API_KEY'));
    console.log(chalk.yellow('   Create a .env file or set environment variables.\n'));
  }

  try {
    // Get all park JSON files
    const files = await fs.readdir(PARKS_DATA_DIR);
    const parkFiles = files.filter((f) => f.endsWith('.json'));

    console.log(`Found ${parkFiles.length} park files to process.\n`);

    // Process each park
    for (const filename of parkFiles) {
      await processParkFile(filename, forceRefresh);
    }

    console.log(chalk.green.bold('\n✨ Done! All parks processed.'));
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fetchImageForItem, processParkFile };
