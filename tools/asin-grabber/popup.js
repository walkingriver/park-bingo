// Popup script - handles UI and communication with content script

let extractedData = null;
let selectedImages = new Set();

async function init() {
  const contentDiv = document.getElementById('content');
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('amazon.com')) {
      contentDiv.innerHTML = `
        <div class="error">
          <strong>Not on Amazon</strong><br>
          Navigate to an Amazon product page to extract data.
        </div>
      `;
      return;
    }
    
    // Request data from content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
    
    if (!response || !response.asin) {
      contentDiv.innerHTML = `
        <div class="error">
          <strong>No ASIN found</strong><br>
          Make sure you're on a product page (URL contains /dp/ or /gp/product/).
        </div>
      `;
      return;
    }
    
    extractedData = response;
    renderData(response);
    
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error">
        <strong>Error:</strong> ${error.message}<br>
        Try refreshing the Amazon page and reopening this popup.
      </div>
    `;
  }
}

function renderData(data) {
  const contentDiv = document.getElementById('content');
  
  // Truncate title for display
  const shortTitle = data.title.length > 60 
    ? data.title.substring(0, 60) + '...' 
    : data.title;
  
  contentDiv.innerHTML = `
    <div class="field">
      <label>ASIN</label>
      <input type="text" id="asin" value="${data.asin}" readonly>
    </div>
    
    <div class="field">
      <label>Product Title</label>
      <input type="text" id="title" value="${escapeHtml(shortTitle)}">
    </div>
    
    <div class="field">
      <label>Description (edit as needed)</label>
      <input type="text" id="description" placeholder="Enter a short description">
    </div>
    
    <div class="category-select">
      <label>Category</label>
      <select id="category">
        <option value="book">Book</option>
        <option value="accessory">Accessory / Gear</option>
      </select>
    </div>
    
    <div class="field">
      <label>Select an Image (click to select)</label>
      <div class="images" id="images">
        ${data.images.map((img, i) => `
          <div class="image-item" data-index="${i}" data-url="${img.url}">
            <img src="${img.url}" alt="Product image ${i + 1}" 
                 onerror="this.parentElement.style.display='none'">
            <div class="check">✓</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="field">
      <label>Generated JSON</label>
      <textarea id="json" readonly></textarea>
    </div>
    
    <div class="buttons">
      <button class="secondary" id="copyJson">Copy JSON Only</button>
      <button class="primary" id="downloadImages">Download + Copy JSON</button>
    </div>
  `;
  
  // Add click handlers to images
  document.querySelectorAll('.image-item').forEach(item => {
    item.addEventListener('click', () => {
      // Single select for simplicity
      document.querySelectorAll('.image-item').forEach(i => i.classList.remove('selected'));
      selectedImages.clear();
      
      item.classList.add('selected');
      selectedImages.add(item.dataset.url);
      updateJson();
    });
  });
  
  // Auto-select first image
  const firstImage = document.querySelector('.image-item');
  if (firstImage) {
    firstImage.click();
  }
  
  // Input change handlers
  document.getElementById('title').addEventListener('input', updateJson);
  document.getElementById('description').addEventListener('input', updateJson);
  document.getElementById('category').addEventListener('change', updateJson);
  
  // Button handlers
  document.getElementById('copyJson').addEventListener('click', copyJson);
  document.getElementById('downloadImages').addEventListener('click', downloadImages);
  
  updateJson();
}

function updateJson() {
  const asin = document.getElementById('asin').value;
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const category = document.getElementById('category').value;
  
  // Use local path that will exist after conversion
  const localImageUrl = `images/products/${asin}.webp`;
  
  const json = {
    asin: asin,
    name: title,
    description: description || 'Add description here',
    category: category,
    imageUrl: localImageUrl,
    parks: ['mk', 'epcot', 'hs', 'ak']
  };
  
  document.getElementById('json').value = JSON.stringify(json, null, 2);
}

async function copyJson() {
  const jsonText = document.getElementById('json').value;
  await navigator.clipboard.writeText(jsonText);
  showStatus('JSON copied to clipboard!');
}

async function downloadImages() {
  if (selectedImages.size === 0) {
    showStatus('No images selected', true);
    return;
  }
  
  const asin = extractedData.asin;
  
  for (const url of selectedImages) {
    const filename = `${asin}.jpg`;
    
    try {
      await chrome.downloads.download({
        url: url,
        filename: `park-bingo-images/${filename}`,
        saveAs: false
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  }
  
  // Auto-copy JSON to clipboard
  const jsonText = document.getElementById('json').value;
  await navigator.clipboard.writeText(jsonText);
  
  showStatus(`Downloaded image + copied JSON to clipboard!`);
}

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status show';
  status.style.background = isError ? '#fee' : '#e8f5e9';
  status.style.color = isError ? '#c00' : '#2e7d32';
  
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;');
}

// Initialize on load
init();
