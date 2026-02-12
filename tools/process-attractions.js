#!/usr/bin/env node

/**
 * Process raw Disney attraction data into app format
 * 
 * Usage:
 *   node process-attractions.js
 * 
 * Reads:
 *   - tools/data/dlr-attractions-raw.json (Disneyland Resort)
 *   - tools/data/wdw-attractions-raw.json (Walt Disney World)
 * 
 * Outputs:
 *   - src/data/parks/disneyland.json
 *   - src/data/parks/disney-california-adventure.json
 *   - src/data/parks/magic-kingdom.json
 *   - src/data/parks/epcot.json
 *   - src/data/parks/hollywood-studios.json
 *   - src/data/parks/animal-kingdom.json
 */

const fs = require('fs');
const path = require('path');

// Park ID mappings
const PARK_IDS = {
  // DLR
  '330339;entityType=theme-park': { slug: 'dl', name: 'Disneyland', file: 'disneyland.json' },
  '336894;entityType=theme-park': { slug: 'dca', name: 'Disney California Adventure', file: 'disney-california-adventure.json' },
  // WDW
  '80007944;entityType=theme-park': { slug: 'mk', name: 'Magic Kingdom', file: 'magic-kingdom.json' },
  '80007838;entityType=theme-park': { slug: 'epcot', name: 'EPCOT', file: 'epcot.json' },
  '80007998;entityType=theme-park': { slug: 'hs', name: 'Hollywood Studios', file: 'hollywood-studios.json' },
  '80007823;entityType=theme-park': { slug: 'ak', name: 'Animal Kingdom', file: 'animal-kingdom.json' },
};

// Map thrill factors and interests to our category system
function mapCategories(facets) {
  const categories = new Set();
  
  // Thrill factors
  const thrillMap = {
    'thrill-rides': 'thrill',
    'slow-rides': 'family',
    'dark': 'dark',
    'scary': 'scary',
    'spinning': 'spin',
    'water-rides': 'water',
    'big-drops': 'thrill',
    'small-drops': 'family',
    'loud': 'loud',
  };
  
  (facets.thrillFactor || []).forEach(t => {
    if (thrillMap[t]) categories.add(thrillMap[t]);
  });
  
  // Interests
  const interestMap = {
    'indoor': 'indoor',
    'outdoor': 'outdoor',
    'character-experience': 'character',
    'rider-switch': 'family',
    'shows': 'show',
    'live-entertainment': 'show',
  };
  
  (facets.interests || []).forEach(i => {
    if (interestMap[i]) categories.add(interestMap[i]);
  });
  
  // Age groups
  if ((facets.age || []).includes('preschoolers')) {
    categories.add('kids');
  }
  
  // Park interests (classic, etc)
  (facets.parkInterests || []).forEach(p => {
    if (p.includes('classic')) categories.add('classic');
  });
  
  return Array.from(categories);
}

// Determine attraction type from facets and name
function determineType(attraction) {
  const facets = attraction.facets || {};
  const interests = facets.interests || [];
  const name = attraction.name.toLowerCase();
  const url = (attraction.url || '').toLowerCase();
  
  // Shows, parades, fireworks
  if (interests.includes('shows') || interests.includes('live-entertainment')) {
    return 'show';
  }
  if (name.includes('firework') || name.includes('parade') || name.includes('cavalcade') ||
      name.includes('ceremony') || name.includes('lighting') || name.includes('world of color') ||
      name.includes('fantasmic') || name.includes('harmonious') || name.includes('luminous')) {
    return 'show';
  }
  if (url.includes('/entertainment/')) {
    return 'show';
  }
  
  // Characters
  if (interests.includes('character-experience') || name.includes('meet ') || 
      name.includes('character ') || url.includes('character')) {
    return 'character';
  }
  
  // Food/dining
  if (url.includes('/dining/') || url.includes('/restaurants/')) {
    return 'food';
  }
  
  // Default to ride
  return 'ride';
}

// Get image URL from media object
function getImageUrl(media, parkSlug, urlFriendlyId) {
  // Use finderStandardThumb for good quality
  if (media?.finderStandardThumb?.transcodeTemplate) {
    // Use 400x300 size
    return media.finderStandardThumb.transcodeTemplate
      .replace('{width}', '400')
      .replace('{height}', '300');
  }
  if (media?.finderStandardThumb?.url) {
    return media.finderStandardThumb.url;
  }
  // Fallback to local image if exists
  return `/images/parks/${parkSlug}/${urlFriendlyId}.jpg`;
}

// Get height requirement from facets
function getHeightRequirement(facets) {
  const height = facets?.height || [];
  
  const heightMap = {
    'any-height': null,
    '32-in': '32" (81cm)',
    '35-in': '35" (89cm)',
    '38-in': '38" (97cm)',
    '40-in': '40" (102cm)',
    '42-in': '42" (107cm)',
    '44-in': '44" (112cm)',
    '46-in': '46" (117cm)',
    '48-in': '48" (122cm)',
  };
  
  for (const h of height) {
    if (heightMap[h]) return heightMap[h];
  }
  
  return null;
}

// Check if Lightning Lane eligible
function hasLightningLane(facets) {
  const ea = facets?.eA || [];
  return ea.some(e => 
    e.includes('expedited-access') || 
    e.includes('lightning-lane') ||
    e.includes('individual-lightning-lane')
  );
}

// Check if attraction should be excluded (seasonal, table service, etc.)
function shouldExclude(attraction) {
  const name = attraction.name.toLowerCase();
  const url = (attraction.url || '').toLowerCase();
  
  // Seasonal patterns to exclude
  const seasonalPatterns = [
    /holiday/i,
    /christmas/i,
    /halloween/i,
    /lunar new year/i,
    /jollywood/i,
    /flower.*garden festival/i,
    /food.*wine festival/i,
    /very merry/i,
    /not-so-scary/i,
    /candlelight/i,
    /thanksgiving/i,
    /easter/i,
    /limited.time/i,
    /special event/i,
    /seasonal/i,
    /winter.*fest/i,
    /new year.*eve/i,
    /oogie boogie/i,
    /after hours/i,
  ];
  
  for (const pattern of seasonalPatterns) {
    if (pattern.test(name) || pattern.test(url)) {
      return true;
    }
  }
  
  // Exclude table service restaurants (if any slip through)
  if (url.includes('/dining/') && !url.includes('quick-service')) {
    return true;
  }
  
  return false;
}

// Transform a single attraction
function transformAttraction(attraction, parkSlug) {
  const facets = attraction.facets || {};
  
  const transformed = {
    id: attraction.urlFriendlyId,
    name: attraction.name,
    type: determineType(attraction),
    description: attraction.media?.finderStandardThumb?.title || 
                 attraction.media?.finderStandardThumb?.alt || 
                 `Experience ${attraction.name}`,
    categories: mapCategories(facets),
    imageUrl: getImageUrl(attraction.media, parkSlug, attraction.urlFriendlyId),
  };
  
  // Add optional fields
  const heightReq = getHeightRequirement(facets);
  if (heightReq) {
    transformed.heightRequirement = heightReq;
  }
  
  if (hasLightningLane(facets)) {
    transformed.lightningLane = true;
  }
  
  return transformed;
}

// Process a raw data file
function processFile(inputPath, resort) {
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${inputPath} (file not found)`);
    return {};
  }
  
  const fileContent = fs.readFileSync(inputPath, 'utf8').trim();
  if (!fileContent) {
    console.log(`Skipping ${inputPath} (empty file)`);
    return {};
  }
  
  const data = JSON.parse(fileContent);
  const results = data.results || [];
  
  console.log(`Processing ${results.length} attractions from ${resort}...`);
  
  // Group by park
  const byPark = {};
  
  let excluded = 0;
  
  results.forEach(attraction => {
    const parkId = attraction.parkIds?.[0];
    const parkInfo = PARK_IDS[parkId];
    
    if (!parkInfo) {
      // Skip non-theme-park attractions (Downtown Disney, hotels, etc.)
      return;
    }
    
    // Skip seasonal and excluded items
    if (shouldExclude(attraction)) {
      excluded++;
      return;
    }
    
    if (!byPark[parkInfo.file]) {
      byPark[parkInfo.file] = {
        slug: parkInfo.slug,
        name: parkInfo.name,
        attractions: []
      };
    }
    
    byPark[parkInfo.file].attractions.push(
      transformAttraction(attraction, parkInfo.slug)
    );
  });
  
  if (excluded > 0) {
    console.log(`  (excluded ${excluded} seasonal/restricted items)`)
  }
  
  return byPark;
}

// Main
function main() {
  const toolsDir = path.dirname(__filename);
  const dataDir = path.join(toolsDir, 'data');
  const outputDir = path.join(toolsDir, '..', 'public', 'data', 'parks');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Process DLR
  const dlrData = processFile(
    path.join(dataDir, 'dlr-attractions-raw.json'),
    'Disneyland Resort'
  );
  
  // Process WDW
  const wdwData = processFile(
    path.join(dataDir, 'wdw-attractions-raw.json'),
    'Walt Disney World'
  );
  
  // Merge and write output files
  const allParks = { ...dlrData, ...wdwData };
  
  Object.entries(allParks).forEach(([filename, parkData]) => {
    const outputPath = path.join(outputDir, filename);
    
    // Sort attractions by name
    parkData.attractions.sort((a, b) => a.name.localeCompare(b.name));
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(parkData.attractions, null, 2)
    );
    
    console.log(`  ✓ ${filename}: ${parkData.attractions.length} attractions`);
  });
  
  console.log('\nDone!');
}

main();
