# Park Bingo ASIN Grabber

A Chrome extension and Node.js toolset to extract Amazon product images for Park Bingo affiliate products.

## Features

- **Chrome Extension**: Extract ASIN, title, and images from any Amazon product page
- **Image Converter**: Convert downloaded images to mobile-optimized WebP format
- **JSON Generator**: Generate ready-to-paste JSON for `affiliate-products.json`

## Installation

### Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this folder (`tools/asin-grabber`)

**Note**: You'll need to create simple icon files or the extension will work without icons:
- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

### Node.js Tools

```bash
cd tools/asin-grabber
npm install
```

## Complete Workflow

### One-Time Setup
1. Install extension (see Installation above)
2. Run `npm run convert:watch` in a terminal (keeps running in background)

### Per Product (30 seconds each)

1. **Open Amazon product page**
2. **Click extension icon** (orange target in toolbar)
3. **Select best image**, edit title/description, pick category
4. **Click "Download + Copy JSON"** → Image downloads AND JSON is copied to clipboard
5. **Paste JSON** into `public/data/affiliate-products.json`
6. **Done!** The image auto-converts to WebP in the background

### That's it!

The JSON already has the correct local `imageUrl` path:
```json
{
  "asin": "B0C2SG41BX",
  "name": "Magical Meanderings",
  "description": "Magic Kingdom scavenger hunt book",
  "category": "book",
  "imageUrl": "images/products/B0C2SG41BX.webp",
  "parks": ["mk", "epcot", "hs", "ak"]
}
```

### Manual Conversion (if not using watch mode)

```bash
npm run convert
```

## Watch Mode

For batch processing, run the converter in watch mode:

```bash
npm run convert:watch
```

New images dropped into `~/Downloads/park-bingo-images/` will be automatically converted.

## Generated Image Sizes

| Size | Dimensions | Use |
|------|------------|-----|
| Main | 400x400 | Product cards, banners |
| Thumb | 100x100 | Small thumbnails |

Images are:
- Converted to WebP for smaller file size
- Resized with white background padding
- Optimized at 85% quality

## Workflow Summary

```
Amazon Page → Click Extension → Click Download → Paste JSON → Done
```

With watch mode running, the image auto-converts. The JSON is auto-copied with the correct path. Just paste and commit!
