# Park Bingo Development Tools

Utility scripts for managing the Park Pursuit Bingo app.

## Setup

```bash
cd tools
npm install
npx playwright install chromium
```

## Amazon Product Scraper & Image Downloader

Scrapes product info and **downloads** images from Amazon using Playwright.
Images are saved locally so the app doesn't hotlink Amazon's CDN.

### Two Modes

**Mode 1: Build from ASIN List** (recommended for new products)
```bash
# Create a text file with one ASIN per line
echo "B0C2SG41BX
1628091533
B0DZSY6T4K" > asins.txt

# Run the scraper - it will get names, descriptions, categories, and images
node scrape-amazon-images.js --asins asins.txt --output ../public/data/affiliate-products.json
```

**Mode 2: Update Existing JSON** (add images to existing products)
```bash
npm run scrape-images
```

### Usage Examples

```bash
# Build from ASIN list with custom Associates tag
node scrape-amazon-images.js --asins asins.txt --tag myassociatestag-20 --output products.json

# Update existing JSON with images
npm run scrape-images

# Only scrape URLs without downloading images
node scrape-amazon-images.js --asins asins.txt --skip-download

# Custom image directory
node scrape-amazon-images.js --asins asins.txt --images-dir ./my-images
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--asins` | none | Text file with one ASIN per line (builds new JSON) |
| `--input` | `../public/data/affiliate-products.json` | Existing JSON file to update |
| `--output` | stdout | Output file path |
| `--images-dir` | `../public/images/products` | Directory to save downloaded images |
| `--delay` | 2000 | Delay between requests in milliseconds |
| `--tag` | `walkingriver-20` | Amazon Associates tag |
| `--skip-download` | false | Only scrape, don't download images |

### ASIN List Format

Create a text file with one ASIN per line. Lines starting with `#` are ignored:

```
# Books
1628091533
173426523X

# Water bottles
B0C5G92S2L
B0BNJYH4BM
```

### How it works

**ASIN Mode:**
1. Reads ASINs from the text file
2. Visits each Amazon product page
3. Scrapes: product title, description, category (auto-detected), and image
4. Downloads images to `public/images/products/{asin}.jpg`
5. Outputs complete JSON with all product data
6. Note: `parks` arrays are empty - you'll need to assign products to parks

**Update Mode:**
1. Reads existing product JSON
2. Visits Amazon pages for products missing images
3. Downloads images
4. Updates `imageUrl` paths in the JSON

### Output

Images are saved to `public/images/products/` with the ASIN as the filename:
```
public/images/products/
├── B0C2SG41BX.jpg
├── B0CXNPFRR3.jpg
└── ...
```

The JSON output uses local paths that work in the app:
```json
{
  "asin": "B0C2SG41BX",
  "name": "Magical Meanderings",
  "imageUrl": "/images/products/B0C2SG41BX.jpg"
}
```

### Notes

- Products with already-downloaded images are skipped (checks if file exists)
- The script uses delays between requests to avoid rate limiting
- If Amazon shows a CAPTCHA, that product is skipped
- This is for personal use only - respect Amazon's ToS

### Updating the Live Config

After running the scraper:

1. Commit the downloaded images in `public/images/products/`
2. Deploy the app so images are available
3. Edit the live Gist: https://gist.github.com/walkingriver/c2afc9315f3c4456daaa4133b53d1230
4. Update the `imageUrl` fields to use local paths (e.g., `/images/products/B0C2SG41BX.jpg`)
5. Save the gist - changes are live immediately!

## Data Files

The `data/` folder contains:

- `dlr-attractions-raw.json` - Disneyland Resort raw attraction data
- `wdw-attractions-raw.json` - Walt Disney World raw attraction data
- `affiliate-products-with-images.json` - Output from image scraper (when saved)
