# Park Bingo - Pre-Launch Punch List

> **Last Updated:** 2026-02-11

---

## What YOU Need to Provide

These are the items that require your action or decision:

### 1. Domain & Hosting
| Item | Status | Action Required |
|------|--------|-----------------|
| Domain name | ⚠️ Decide | Register `parkbingo.app` or use existing domain |
| Marketing site hosting | ⚠️ Decide | GitHub Pages, Netlify, Vercel, etc. |

### 2. Images & Screenshots
| Item | Location | What's Needed |
|------|----------|---------------|
| App Icon source | `resources/icon.png` | 1024x1024 PNG (already exists, verify it's final) |
| Splash source | `resources/splash.png` | 2732x2732 PNG (already exists, verify it's final) |
| Favicon | `docs/images/` | 32x32 or 64x64 PNG |
| Apple touch icon | `docs/images/` | 180x180 PNG |
| OG social image | `docs/images/` | 1200x630 PNG for social sharing |
| Store screenshots | Manual | Take screenshots on real devices (see sizes below) |
| Feature graphic | Play Store | 1024x500 PNG promotional banner |

#### Screenshot Sizes Needed
| Platform | Size |
|----------|------|
| iPhone 6.7" (15 Pro Max) | 1290x2796 |
| iPhone 6.5" (14 Pro Max) | 1284x2778 |
| iPhone 5.5" (8 Plus/SE) | 1242x2208 |
| iPad Pro 12.9" | 2048x2732 |
| Android Phone | 1080x1920 |
| Android Tablet 7" | 1200x1920 |
| Android Tablet 10" | 1600x2560 |

### 3. Amazon Affiliate Product Images (Optional)
The current affiliate products work but show placeholder icons instead of real images.
To add real images, you need to add `imageUrl` to each product.

**Affiliate Products Configuration (Remote Gist):**
The app fetches product config from a GitHub Gist that can be edited without redeploying:

| Item | URL |
|------|-----|
| **View/Edit Gist** | https://gist.github.com/walkingriver/c2afc9315f3c4456daaa4133b53d1230 |
| **Raw JSON URL** | https://gist.githubusercontent.com/walkingriver/c2afc9315f3c4456daaa4133b53d1230/raw/affiliate-products.json |

**To update products:**
1. Go to the gist URL above
2. Click "Edit" button
3. Modify the JSON (add products, change `imageUrl`, toggle `enabled`, etc.)
4. Click "Update public gist"
5. Changes are live immediately - no app redeploy needed!

**To disable all ads:** Set `"enabled": false` in the gist.

**How to get image URLs:**

*Option 1: Use the scraper tool (recommended)*
```bash
cd tools
npm install
npx playwright install chromium
npm run scrape-images
```
This will output JSON with `imageUrl` added to each product. Copy the URLs to the gist.
See `tools/README.md` for more options.

*Option 2: Manual*
1. Go to the Amazon product page
2. Right-click the main product image
3. Select "Copy image address"
4. Add `imageUrl` to the product in the gist

Example:
```json
{
  "asin": "B0C2SG41BX",
  "name": "Magical Meanderings",
  "imageUrl": "https://m.media-amazon.com/images/I/ACTUAL_IMAGE_ID.jpg"
}
```

**Note:** A local copy of the config also exists at `public/data/affiliate-products.json` 
for reference, but the app uses the remote gist.

### 4. Testing
| Task | Status |
|------|--------|
| Test on real iPhone | ⬜ Pending |
| Test on real Android | ⬜ Pending |
| Test affiliate links open correctly | ⬜ Pending |
| Test offline mode | ⬜ Pending |

---

## What's Already Done (No Action Required)

### Branding & Contact Info ✅
| Item | Value |
|------|-------|
| Developer Name | Michael D. Callaghan |
| Support Email | michael@walkingriver.com |
| Amazon Associates Tag | walkingriver-20 |
| Bundle ID | com.walkingriver.parkbingo |
| Copyright | © 2026 Michael D. Callaghan |

### Features Implemented ✅
| Feature | Description |
|---------|-------------|
| Affiliate products | External JSON config with 12 real ASINs |
| In-card banner | Appears after 5s, rotates every 60s |
| Recommended Products page | Browse all products with category filter |
| Help modal | Comprehensive instructions accessible from play page |
| Statistics page | Tracks games, BINGOs, streaks per park |
| Sound effects | Toggle in settings, Web Audio API |
| First-launch onboarding | Auto-shows help on first open |
| Landscape support | Responsive CSS for all orientations |
| Offline support | PWA service worker caches data |
| External attractions | Loads from GitHub with offline fallback |

### Pages & Routes ✅
| Route | Page |
|-------|------|
| `/` | Home - Park selection |
| `/play` | Bingo card gameplay |
| `/victory` | Win celebration with affiliate products |
| `/settings` | App settings and preferences |
| `/stats` | Game statistics |
| `/products` | Recommended products catalog |

### Files Updated ✅
| File | What Was Updated |
|------|------------------|
| `public/data/affiliate-products.json` | 12 real ASINs, walkingriver-20 tag |
| `docs/*.html` | Michael D. Callaghan, emails |
| `store-assets/*.md` | Developer name |
| `src/app/pages/settings/` | Copyright, email, products link |
| `src/app/pages/victory/` | RouterLink fix for "Back to Parks" |

---

## Current Affiliate Products

These are configured in `public/data/affiliate-products.json`:

| ASIN | Product | Category | Has Image |
|------|---------|----------|-----------|
| 1628091533 | Unofficial Guide to WDW 2025 | Book | ❌ |
| 173426523X | Hidden Mickeys Field Guide | Book | ❌ |
| B0C5G92S2L | Simple Modern Mickey 32oz Bottle | Accessory | ❌ |
| B0BNJYH4BM | Simple Modern Mickey Summit Bottle | Accessory | ❌ |
| B0DZSY6T4K | BreezeBoost Portable Misting Fan | Accessory | ❌ |
| B0DYSQ3K6G | TENDWARE Handheld Misting Fan | Accessory | ❌ |
| B0CCHPYBFC | Reusable Rain Poncho 2-Pack | Accessory | ❌ |
| B07MTSHG46 | Disposable Rain Ponchos Bulk | Accessory | ❌ |
| B0BH5CNQH1 | Disney Mickey Mouse Insulated Bottle | Accessory | ❌ |
| B0DT4VJGVY | Portable Handheld Misting Fan | Accessory | ❌ |
| B0C2SG41BX | Magical Meanderings (MK Scavenger Hunt) | Book | ❌ |
| B0DH8HMDC8 | Wildlife Wanderings (AK Scavenger Hunt) | Book | ❌ |

**Note:** Products display with category placeholder icons (📚 for books, 🎒 for gear).
Add `imageUrl` to each product for real images.

---

## Pre-Launch Checklist

### Before Beta Testing
- [x] Company/developer name updated
- [x] Support email configured
- [x] Amazon Associates tag set
- [x] Help/instructions implemented
- [x] Statistics tracking working
- [x] Sound effects with toggle
- [ ] Test on real devices
- [ ] Verify all affiliate links work

### Before Store Submission
- [ ] Final app icon approved
- [ ] Take store screenshots on real devices
- [ ] Create Play Store feature graphic (1024x500)
- [ ] Register domain (if using custom domain for privacy policy)
- [ ] Deploy marketing site
- [ ] Fill in store listings with final copy

### Before Marketing Launch
- [ ] Create social media OG images
- [ ] Prepare launch announcement
- [ ] Test sharing functionality

---

## Technical Notes

### How Affiliate Products Work
1. Config loads from `public/data/affiliate-products.json` at startup
2. If `enabled: false` or tag is placeholder, all ads are disabled
3. Products rotate in the in-card banner every 60 seconds
4. Victory page shows 4 relevant products based on the park played
5. Products page shows all products with category filtering
6. Clicking any product opens Amazon with your affiliate tag

### How to Disable Ads
In `public/data/affiliate-products.json`:
- Set `"enabled": false` to disable all ads
- Set `"showInCardBanner": false` to disable just the in-game banner
- The victory page and products page will still show if enabled

### PWA Caching
The service worker caches:
- All app assets
- Parks data JSON files
- Works offline after first load

---

## GitHub Repository

**Public Repo:** https://github.com/walkingriver/park-bingo

All code is committed and pushed.
