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

// Determine attraction type from entityType, facets, and name
function determineType(attraction) {
  const entityType = attraction.entityType;
  const facets = attraction.facets || {};
  const interests = facets.interests || [];
  const entertainmentType = facets.entertainmentType || [];
  const thrillFactor = facets.thrillFactor || [];
  const name = attraction.name.toLowerCase();
  const url = (attraction.url || '').toLowerCase();
  
  // Entertainment entity types
  if (entityType === 'Entertainment') {
    // Character meet and greets - prioritize this even if also tagged as parade/show
    if (entertainmentType.includes('character-experiences') ||
        name.includes('meet ') || name.includes('character ')) {
      return 'character';
    }
    // Parades and cavalcades
    if (entertainmentType.includes('parades') || 
        name.includes('parade') || name.includes('cavalcade')) {
      return 'show';
    }
    // Everything else is a show
    return 'show';
  }
  
  // Attraction entity types
  if (entityType === 'Attraction') {
    // Some Attractions are actually character experiences (e.g., Enchanted Tales with Belle)
    if (entertainmentType.includes('character-experiences') ||
        name.includes('meet ') || name.includes('character ')) {
      return 'character';
    }
    
    // Check if it's actually a ride (has thrillFactor with ride indicators)
    const rideIndicators = ['slow-rides', 'thrill-rides', 'water-rides', 'spinning', 
                           'big-drops', 'small-drops', 'dark', 'loud', 'scary'];
    const isRide = thrillFactor.some(t => rideIndicators.includes(t));
    
    // Transportation (monorails, trains, boats that take you places)
    // Be specific to avoid catching "Big Thunder Mountain Railroad"
    const transportationNames = [
      'disneyland railroad', 'disneyland monorail',
      'walt disney world railroad', 'disney skyliner',
      'tomorrowland transit authority peoplemover',
      'wildlife express train', 'main street vehicles'
    ];
    if (transportationNames.some(t => name.includes(t))) {
      return 'transportation';
    }
    
    // Animal exhibits and galleries
    if (interests.includes('animal-encounters-attractions') ||
        interests.includes('animal-encounters-events') ||
        name.includes('disney animals') || name.includes('exhibit') ||
        name.includes('gallery') || name.includes('trail') ||
        name.includes('trek') || name.includes('aquarium')) {
      return 'exhibit';
    }
    
    // Shows within attractions (sing-alongs, films, theaters)
    if (name.includes('sing-along') || name.includes('sing along') ||
        name.includes('film festival') || name.includes('philharmagic') ||
        name.includes('circle-vision') || name.includes('theater') ||
        name.includes('theatre') || name.includes('awesome planet') ||
        interests.includes('stage-shows')) {
      return 'show';
    }
    
    // Interactive experiences and play areas
    if (interests.includes('play-areas') || 
        name.includes('playground') || name.includes('play yard') ||
        name.includes('play area') || name.includes('splash pad') ||
        name.includes('splash n soak') || name.includes('training lab') ||
        name.includes('workshop')) {
      return 'experience';
    }
    
    // Walkthroughs and exploration (but not ride names with similar words)
    if (name.includes('walkthrough') || name.includes('walk-through') ||
        name.includes('treehouse') || name.includes('exploration trail') ||
        name.includes('discovery trail')) {
      return 'experience';
    }
    
    // If it has ride indicators, it's a ride
    if (isRide) {
      return 'ride';
    }
    
    // URL-based fallback
    if (url.includes('/attractions/')) {
      // Default non-ride attractions to experience
      return 'experience';
    }
  }
  
  // Food/dining (shouldn't appear in attractions but just in case)
  if (url.includes('/dining/') || url.includes('/restaurants/')) {
    return 'food';
  }
  
  // Default to experience for unknown items
  return 'experience';
}

// Get image URL - use local bundled images
function getImageUrl(media, parkSlug, urlFriendlyId) {
  // Always use local bundled images
  return `/images/parks/${parkSlug}/${urlFriendlyId}.jpg`;
}

// Get CDN URL for downloading (used by download script)
function getCdnUrl(media) {
  if (media?.finderStandardThumb?.transcodeTemplate) {
    // Use 800x600 for higher quality
    return media.finderStandardThumb.transcodeTemplate
      .replace('{width}', '800')
      .replace('{height}', '600');
  }
  if (media?.finderStandardThumb?.url) {
    return media.finderStandardThumb.url;
  }
  return null;
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

// Convert kebab-case to Title Case
function toTitleCase(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Get a human-readable description from the attraction data
function getDescription(attraction) {
  const facets = attraction.facets || {};
  const media = attraction.media || {};
  
  // Best source: media title often has great descriptions
  // e.g., "Prepare to face the might of the Galactic Empire when you find Darth Vader..."
  const mediaTitle = media.finderStandardThumb?.title;
  if (mediaTitle && mediaTitle.length > 10 && mediaTitle.length < 200) {
    return mediaTitle;
  }
  
  // Second best: type.facets has human-readable labels like "Thrill Rides, Big Drops"
  if (attraction.type?.facets) {
    return attraction.type.facets;
  }
  
  // For entertainment, build from entertainmentType
  const entertainmentType = facets.entertainmentType || [];
  if (entertainmentType.length > 0) {
    return entertainmentType.map(toTitleCase).join(', ');
  }
  
  // Build description from interests (filter out generic ones)
  const interests = facets.interests || [];
  const meaningfulInterests = interests.filter(i => 
    !i.includes('-rec') && 
    !i.includes('wdw-') && 
    !i.includes('dlr-') &&
    i !== 'indoor-attractions' &&
    i !== 'indoor'
  );
  if (meaningfulInterests.length > 0) {
    return meaningfulInterests.map(toTitleCase).join(', ');
  }
  
  // Build from thrillFactor for rides
  const thrillFactor = facets.thrillFactor || [];
  if (thrillFactor.length > 0) {
    return thrillFactor.map(toTitleCase).join(', ');
  }
  
  // For animal exhibits
  if (interests.includes('animal-encounters-attractions') || 
      interests.includes('animal-encounters-events')) {
    return 'Animal Exhibit';
  }
  
  // Type-based defaults
  const entityType = attraction.entityType;
  if (entityType === 'Entertainment') {
    return 'Live Entertainment';
  }
  
  // Check URL for hints
  const url = (attraction.url || '').toLowerCase();
  if (url.includes('/attractions/')) {
    return 'Attraction';
  }
  if (url.includes('/entertainment/')) {
    return 'Entertainment';
  }
  
  return 'Experience';
}

// Transform a single attraction
function transformAttraction(attraction, parkSlug) {
  const facets = attraction.facets || {};
  
  const transformed = {
    id: attraction.urlFriendlyId,
    name: attraction.name,
    type: determineType(attraction),
    description: getDescription(attraction),
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
