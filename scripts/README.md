# Image Fetching Scripts

This directory contains scripts for automatically fetching and processing images for Park Bingo.

## Setup

1. Install dependencies:
```bash
cd scripts
npm install
```

Or install globally in the project root:
```bash
npm install sharp fs-extra dotenv chalk
```

Note: The script uses Node.js built-in `fetch` API (available in Node 18+), so no HTTP client library is needed.

2. Get API keys (all free):
   - **Pixabay** (recommended): https://pixabay.com/api/docs/
   - **Unsplash**: https://unsplash.com/developers
   - **Pexels**: https://www.pexels.com/api/
   - **Hugging Face** (for AI generation): https://huggingface.co/settings/tokens

3. Create a `.env` file in the project root:
```env
PIXABAY_API_KEY=your_key_here
UNSPLASH_ACCESS_KEY=your_key_here
PEXELS_API_KEY=your_key_here
HUGGING_FACE_API_KEY=your_key_here
```

## Usage

Run from the project root:
```bash
npm run fetch-images
```

Or directly:
```bash
node scripts/fetch-images.js
```

### Force Refresh

To re-fetch all images (even if they already exist), use the `--force` flag:
```bash
npm run fetch-images -- --force
```

or

```bash
node scripts/fetch-images.js --force
```

This is useful if you've improved the search terms or want to replace existing images with better ones.

## How It Works

The script will:
1. Read all park JSON files from `src/data/parks/` (source files)
2. For each item without an image:
   - Check if a local image already exists in `public/images/parks/{park-id}/`
   - For generic items (food, transportation): fetch from Pixabay → Unsplash → Pexels
   - For Disney-specific attractions: try AI generation → fallback to stock photos
   - Download and optimize images (400×300px, compressed to ~50-80KB)
   - Save images to `public/images/parks/{park-id}/{item-id}.jpg`
   - Update the JSON file in `src/data/parks/` with the `imageUrl` path

**Note**: The script updates source files in `src/data/parks/`. If you also have files in `public/data/parks/`, you may need to sync them manually or update the script to handle both locations.

## Image Sources Priority

1. **Generic items** (food, transportation):
   - Pixabay (unlimited - primary)
   - Pexels (200/hour - first fallback)
   - Unsplash (50/hour - last fallback)

2. **Disney-specific attractions**:
   - Hugging Face AI generation (if API key provided)
   - Pixabay (unlimited - primary)
   - Pexels (200/hour - first fallback)
   - Unsplash (50/hour - last fallback)

## Notes

- The script respects API rate limits with built-in delays
- Images are optimized to ~50-80KB each
- Existing images are skipped (resume capability)
- All images are saved to `public/images/parks/{park-id}/`
- JSON files are automatically updated with `imageUrl` fields
