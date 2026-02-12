// Content script - runs on Amazon product pages
// Extracts ASIN and product images

(() => {
  // Extract ASIN from URL or page
  function getASIN() {
    // Try URL patterns: /dp/ASIN, /gp/product/ASIN, /product/ASIN
    const urlPatterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /\/ASIN\/([A-Z0-9]{10})/i
    ];

    for (const pattern of urlPatterns) {
      const match = window.location.href.match(pattern);
      if (match) return match[1];
    }

    // Fallback: try to find ASIN in page data
    const asinMeta = document.querySelector('[data-asin]');
    if (asinMeta) return asinMeta.getAttribute('data-asin');

    return null;
  }

  // Get product title
  function getProductTitle() {
    const titleEl = document.getElementById('productTitle') ||
                    document.querySelector('h1.a-size-large') ||
                    document.querySelector('h1');
    return titleEl ? titleEl.textContent.trim() : 'Unknown Product';
  }

  // Get all product images
  function getProductImages() {
    const images = new Map(); // Use Map to dedupe by URL

    // Main product image
    const mainImg = document.getElementById('landingImage') ||
                    document.getElementById('imgBlkFront') ||
                    document.querySelector('#main-image-container img');
    
    if (mainImg) {
      const src = getHighResUrl(mainImg.src || mainImg.getAttribute('data-old-hires'));
      if (src) images.set(src, { url: src, type: 'main' });
    }

    // Image thumbnails in gallery
    const thumbs = document.querySelectorAll('#altImages img, .imageThumbnail img');
    thumbs.forEach(thumb => {
      const src = getHighResUrl(thumb.src);
      if (src && !src.includes('play-button') && !src.includes('video')) {
        images.set(src, { url: src, type: 'gallery' });
      }
    });

    // High-res images from image block
    const hiResImages = document.querySelectorAll('[data-old-hires]');
    hiResImages.forEach(img => {
      const src = img.getAttribute('data-old-hires');
      if (src) images.set(src, { url: src, type: 'hires' });
    });

    // Dynamic image data (sometimes in script tags)
    const scripts = document.querySelectorAll('script[type="text/javascript"]');
    scripts.forEach(script => {
      const content = script.textContent;
      if (content && content.includes('ImageBlockATF')) {
        // Extract image URLs from JavaScript data
        const matches = content.matchAll(/"hiRes":"(https:\/\/[^"]+)"/g);
        for (const match of matches) {
          images.set(match[1], { url: match[1], type: 'dynamic' });
        }
      }
    });

    return Array.from(images.values());
  }

  // Convert thumbnail URL to high-res URL
  function getHighResUrl(url) {
    if (!url) return null;
    
    // Amazon image URL patterns
    // Thumbnails often have ._SX50_ or ._SL75_ etc
    // High-res versions remove these or use larger sizes
    return url
      .replace(/\._[A-Z]{2}\d+_\./, '.') // Remove size modifier
      .replace(/\._[A-Z]{2}\d+,\d+_\./, '.') // Remove size modifier with comma
      .replace(/\._(SX|SY|SL|SS|SR|AC_SX|AC_SY|AC_SL)\d+.*?\./, '.') // More patterns
      .replace(/\?.*$/, ''); // Remove query params
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
      const data = {
        asin: getASIN(),
        title: getProductTitle(),
        images: getProductImages(),
        url: window.location.href
      };
      sendResponse(data);
    }
    return true; // Keep channel open for async response
  });
})();
