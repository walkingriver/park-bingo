#!/bin/bash

# Disney World Attraction Image Downloader
# Downloads images from Disney's CDN by scraping attraction pages

# Continue on errors
set +e

IMG_DIR="../public/images/parks"
BASE_URL="https://disneyworld.disney.go.com/attractions"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Magic Kingdom attractions: "page-url:filename"
MK_ATTRACTIONS=(
    "magic-kingdom/tron-lightcycle-run:tron-lightcycle"
    "magic-kingdom/buzz-lightyear-space-ranger-spin:buzz-lightyear"
    "magic-kingdom/under-the-sea-journey-of-the-little-mermaid:little-mermaid"
    "magic-kingdom/many-adventures-of-winnie-the-pooh:winnie-the-pooh"
    "magic-kingdom/magic-carpets-of-aladdin:magic-carpets"
    "magic-kingdom/astro-orbiter:astro-orbiter"
    "magic-kingdom/barnstormer:barnstormer"
    "magic-kingdom/tomorrowland-speedway:tomorrowland-speedway"
    "magic-kingdom/prince-charming-regal-carrousel:prince-charming-carrousel"
    "magic-kingdom/mickeys-philharmagic:philharmagic"
    "magic-kingdom/walt-disney-carousel-of-progress:carousel-of-progress"
    "magic-kingdom/monsters-inc-laugh-floor:monsters-laugh-floor"
    "magic-kingdom/enchanted-tiki-room:tiki-room"
    "magic-kingdom/enchanted-tales-with-belle:enchanted-tales-belle"
    "magic-kingdom/liberty-square-riverboat:liberty-square-riverboat"
    "magic-kingdom/pirates-adventure:pirates-adventure"
    "magic-kingdom/casey-jr-splash-n-soak-station:casey-jr-splash"
    "magic-kingdom/princess-fairytale-hall:princess-fairytale-hall"
    "magic-kingdom/tianas-bayou-adventure:tianas-bayou"
    "magic-kingdom/mickeys-royal-friendship-faire:royal-friendship-faire"
)

# EPCOT attractions
EPCOT_ATTRACTIONS=(
    "epcot/journey-of-water-inspired-by-moana:journey-of-water"
    "epcot/turtle-talk-with-crush:turtle-talk-crush"
    "epcot/beauty-and-the-beast-sing-along:beauty-beast-singalong"
    "epcot/canada-far-and-wide:canada-far-wide"
    "epcot/reflections-of-china:reflections-china"
    "epcot/awesome-planet:awesome-planet"
    "epcot/disney-pixar-short-film-festival:pixar-short-film"
    "epcot/anna-and-elsa-royal-sommerhus:anna-elsa-norway"
    "epcot/seabase:sea-base"
    "epcot/luminous-the-symphony-of-us:luminous"
)

# Hollywood Studios attractions  
HS_ATTRACTIONS=(
    "hollywood-studios/alien-swirling-saucers:alien-swirling-saucers"
    "hollywood-studios/frozen-sing-along-celebration:frozen-singalong"
    "hollywood-studios/disney-junior-dance-party:disney-junior"
    "hollywood-studios/voyage-of-the-little-mermaid:little-mermaid-adventure"
    "hollywood-studios/star-wars-launch-bay:star-wars-launch-bay"
    "hollywood-studios/walt-disney-presents:walt-disney-presents"
    "hollywood-studios/ogas-cantina:oga-cantina"
    "hollywood-studios/ronto-roasters:ronto-roasters"
    "hollywood-studios/50s-prime-time-cafe:50s-prime-time"
    "hollywood-studios/meet-incredibles-edna-mode:incredibles-characters"
    "hollywood-studios/star-wars-galaxys-edge:galaxys-edge"
    "hollywood-studios/savis-workshop:build-lightsaber"
    "hollywood-studios/droid-depot:build-droid"
)

# Animal Kingdom attractions
AK_ATTRACTIONS=(
    "animal-kingdom/wildlife-express-train:wildlife-express"
    "animal-kingdom/finding-nemo-the-big-blue-and-beyond:nemo-big-blue"
    "animal-kingdom/feathered-friends-in-flight:feathered-friends"
    "animal-kingdom/rafiki-planet-watch:conservation-station"
    "animal-kingdom/adventurers-outpost:character-safari"
    "animal-kingdom/meet-favorite-disney-pals:russell-dug"
    "animal-kingdom/rainforest-cafe-animal-kingdom:rainforest-cafe"
    "animal-kingdom/oasis-exhibits:oasis-exhibits"
    "animal-kingdom/pandora-world-of-avatar:pandora-explore"
    "animal-kingdom/tree-of-life:tree-awakening"
)

download_image() {
    local url_path=$1
    local filename=$2
    local park=$3
    local target_dir="$IMG_DIR/$park"
    
    if [ -f "$target_dir/$filename.jpg" ]; then
        echo "  ✓ $filename.jpg already exists"
        return 0
    fi
    
    echo "  Downloading $filename..."
    
    # Fetch the page and extract the first large image URL from CDN
    local page_url="$BASE_URL/$url_path/"
    local img_url=$(curl -sk -A "$USER_AGENT" "$page_url" 2>/dev/null | \
        grep -o 'cdn1\.parksmedia\.wdprapps\.disney\.com/resize/mwImage/1/[0-9]*/[0-9]*/[0-9]*/[^"]*\.jpg[^"]*' | \
        head -1)
    
    if [ -n "$img_url" ]; then
        # Download the image
        curl -sk -A "$USER_AGENT" -o "$target_dir/$filename.jpg" "https://$img_url"
        if [ -f "$target_dir/$filename.jpg" ] && [ -s "$target_dir/$filename.jpg" ]; then
            echo "    ✓ Downloaded $filename.jpg"
            return 0
        else
            echo "    ✗ Failed to download $filename.jpg"
            rm -f "$target_dir/$filename.jpg"
            return 1
        fi
    else
        echo "    ✗ Could not find image URL for $filename"
        return 1
    fi
}

echo "=== Disney World Attraction Image Downloader ==="
echo ""

# Create directories if needed
mkdir -p "$IMG_DIR/mk" "$IMG_DIR/epcot" "$IMG_DIR/hs" "$IMG_DIR/ak"

echo "--- Magic Kingdom ---"
for item in "${MK_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "mk"
done

echo ""
echo "--- EPCOT ---"
for item in "${EPCOT_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "epcot"
done

echo ""
echo "--- Hollywood Studios ---"
for item in "${HS_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "hs"
done

echo ""
echo "--- Animal Kingdom ---"
for item in "${AK_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "ak"
done

echo ""
echo "=== Done ==="

# Summary
echo ""
echo "--- Summary ---"
for park in mk epcot hs ak; do
    count=$(ls -1 "$IMG_DIR/$park/"*.jpg 2>/dev/null | wc -l | tr -d ' ')
    echo "$park: $count images"
done
