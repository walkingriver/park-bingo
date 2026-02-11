# Park Images Structure

This directory contains images for each park's attractions. Each park has its own subfolder:

- `mk/` - Magic Kingdom attractions
- `epcot/` - EPCOT attractions
- `hs/` - Hollywood Studios attractions
- `ak/` - Animal Kingdom attractions
- `dl/` - Disneyland attractions
- `dca/` - Disney California Adventure attractions

## Image Naming Convention

Images should be named using the attraction ID from the park data files:

- Example: `space-mountain.jpg` for the Space Mountain attraction
- Example: `pirates.webp` for Pirates of the Caribbean

## Supported Formats

- JPG, JPEG, PNG, WEBP
- Recommended size: 200x150px for optimal display in bingo squares
- Images will be automatically scaled to fit the 70px height in bingo squares

## Adding Images

1. Place images in the appropriate park subfolder
2. Name them using the attraction ID from the JSON data files
3. Update the `imageUrl` field in the park data to use the local path: `/images/parks/{park-id}/{attraction-id}.jpg`

Example:

```json
{
  "id": "space-mountain",
  "name": "Space Mountain",
  "imageUrl": "/images/parks/mk/space-mountain.jpg"
}
```
