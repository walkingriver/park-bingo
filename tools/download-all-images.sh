#!/bin/bash

# Disney World Official Image Downloader
# Downloads ALL attraction images from Disney's CDN and creates thumbnails

IMG_DIR="../public/images/parks"
BASE_URL="https://disneyworld.disney.go.com/attractions"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Continue on errors
set +e

# Magic Kingdom - ALL attractions
MK_ATTRACTIONS=(
    "magic-kingdom/tron-lightcycle-run:tron-lightcycle"
    "magic-kingdom/space-mountain:space-mountain"
    "magic-kingdom/big-thunder-mountain-railroad:big-thunder"
    "magic-kingdom/seven-dwarfs-mine-train:seven-dwarfs"
    "magic-kingdom/tianas-bayou-adventure:tianas-bayou"
    "magic-kingdom/pirates-of-the-caribbean:pirates"
    "magic-kingdom/haunted-mansion:haunted-mansion"
    "magic-kingdom/jungle-cruise:jungle-cruise"
    "magic-kingdom/peter-pans-flight:peter-pan"
    "magic-kingdom/its-a-small-world:its-a-small-world"
    "magic-kingdom/buzz-lightyear-space-ranger-spin:buzz-lightyear"
    "magic-kingdom/under-the-sea-journey-of-the-little-mermaid:little-mermaid"
    "magic-kingdom/many-adventures-of-winnie-the-pooh:winnie-the-pooh"
    "magic-kingdom/dumbo-the-flying-elephant:dumbo"
    "magic-kingdom/mad-tea-party:mad-tea-party"
    "magic-kingdom/magic-carpets-of-aladdin:magic-carpets"
    "magic-kingdom/astro-orbiter:astro-orbiter"
    "magic-kingdom/the-barnstormer:barnstormer"
    "magic-kingdom/tomorrowland-speedway:tomorrowland-speedway"
    "magic-kingdom/prince-charming-regal-carrousel:prince-charming-carrousel"
    "magic-kingdom/mickeys-philharmagic:philharmagic"
    "magic-kingdom/walt-disney-carousel-of-progress:carousel-of-progress"
    "magic-kingdom/monsters-inc-laugh-floor:monsters-laugh-floor"
    "magic-kingdom/country-bear-jamboree:country-bears"
    "magic-kingdom/hall-of-presidents:hall-of-presidents"
    "magic-kingdom/enchanted-tiki-room:tiki-room"
    "magic-kingdom/enchanted-tales-with-belle:enchanted-tales-belle"
    "magic-kingdom/happily-ever-after:happily-ever-after"
    "magic-kingdom/festival-of-fantasy-parade:festival-fantasy"
    "magic-kingdom/tomorrowland-transit-authority-peoplemover:tomorrowland-transit"
    "magic-kingdom/walt-disney-world-railroad:railroad"
    "magic-kingdom/main-street-vehicles:main-street-vehicles"
    "magic-kingdom/swiss-family-treehouse:swiss-family-treehouse"
    "magic-kingdom/casey-jr-splash-n-soak-station:casey-jr-splash"
    "magic-kingdom/meet-mickey-mouse-at-town-square-theater:mickey-main-street"
    "magic-kingdom/meet-tinker-bell-at-town-square-theater:tinker-bell"
    "magic-kingdom/cinderella-castle:cinderella-castle"
)

# EPCOT - ALL attractions
EPCOT_ATTRACTIONS=(
    "epcot/guardians-of-the-galaxy-cosmic-rewind:guardians"
    "epcot/test-track:test-track"
    "epcot/mission-space:mission-space"
    "epcot/soarin-around-the-world:soarin"
    "epcot/frozen-ever-after:frozen-ever-after"
    "epcot/remys-ratatouille-adventure:ratatouille"
    "epcot/spaceship-earth:spaceship-earth"
    "epcot/living-with-the-land:living-land-boat"
    "epcot/journey-into-imagination-with-figment:imagination"
    "epcot/the-seas-with-nemo-and-friends:nemo"
    "epcot/gran-fiesta-tour-starring-the-three-caballeros:gran-fiesta"
    "epcot/turtle-talk-with-crush:turtle-talk-crush"
    "epcot/american-adventure:american-adventure"
    "epcot/impressions-de-france:impressions-de-france"
    "epcot/beauty-and-the-beast-sing-along:beauty-beast-singalong"
    "epcot/canada-far-and-wide:canada-far-wide"
    "epcot/reflections-of-china:reflections-china"
    "epcot/disney-pixar-short-film-festival:pixar-short-film"
    "epcot/club-cool:club-cool"
    "epcot/les-halles-boulangerie-patisserie:school-bakery"
    "epcot/karamell-kuche:karamell-kuche"
    "epcot/world-showcase:world-showcase"
    "epcot/kidcot-fun-stops:kidcot-fun-stops"
    "epcot/anna-and-elsa-royal-sommerhus:anna-elsa-norway"
    "epcot/meet-disney-friends-world-showcase:character-spotting"
)

# Hollywood Studios - ALL attractions
HS_ATTRACTIONS=(
    "hollywood-studios/star-wars-rise-of-the-resistance:rise-resistance"
    "hollywood-studios/twilight-zone-tower-of-terror:tower-terror"
    "hollywood-studios/rock-n-roller-coaster-starring-aerosmith:rock-n-roller"
    "hollywood-studios/slinky-dog-dash:slinky-dash"
    "hollywood-studios/millennium-falcon-smugglers-run:millennium-falcon"
    "hollywood-studios/mickey-and-minnies-runaway-railway:mickey-minnie"
    "hollywood-studios/toy-story-mania:toy-story-mania"
    "hollywood-studios/star-tours-the-adventures-continue:star-tours"
    "hollywood-studios/alien-swirling-saucers:alien-swirling-saucers"
    "hollywood-studios/fantasmic:fantasmic"
    "hollywood-studios/beauty-and-the-beast-live-on-stage:beauty-beast"
    "hollywood-studios/indiana-jones-epic-stunt-spectacular:indiana-jones"
    "hollywood-studios/frozen-sing-along-celebration:frozen-singalong"
    "hollywood-studios/voyage-of-the-little-mermaid:little-mermaid-adventure"
    "hollywood-studios/muppet-vision-3d:muppet-vision"
    "hollywood-studios/walt-disney-presents:walt-disney-presents"
    "hollywood-studios/star-wars-galaxys-edge:galaxys-edge"
    "hollywood-studios/ogas-cantina:oga-cantina"
    "hollywood-studios/droid-depot:build-droid"
    "hollywood-studios/meet-kylo-ren-star-wars-launch-bay:star-wars-characters"
    "hollywood-studios/meet-woody-and-friends-toy-story-land:toy-story-characters"
    "hollywood-studios/woodys-lunch-box:woody-lunchbox"
    "hollywood-studios/docking-bay-7-food-and-cargo:docking-bay"
    "hollywood-studios/milk-stand:blue-milk"
    "hollywood-studios/ronto-roasters:ronto-roasters"
    "hollywood-studios/hollywood-and-vine:hollywood-vine"
    "hollywood-studios/50s-prime-time-cafe:50s-prime-time"
)

# Animal Kingdom - ALL attractions
AK_ATTRACTIONS=(
    "animal-kingdom/avatar-flight-of-passage:flight-passage"
    "animal-kingdom/expedition-everest:everest"
    "animal-kingdom/kilimanjaro-safaris:kilimanjaro-safaris"
    "animal-kingdom/navi-river-journey:navi-river"
    "animal-kingdom/dinosaur:dinosaur"
    "animal-kingdom/kali-river-rapids:kali-river"
    "animal-kingdom/triceratop-spin:tricera-top-spin"
    "animal-kingdom/wildlife-express-train:wildlife-express"
    "animal-kingdom/festival-of-the-lion-king:festival-lion-king"
    "animal-kingdom/finding-nemo-the-big-blue-and-beyond:nemo-big-blue"
    "animal-kingdom/feathered-friends-in-flight:feathered-friends"
    "animal-kingdom/its-tough-to-be-a-bug:its-tough-to-be-bug"
    "animal-kingdom/animation-experience-conservation-station:animation-experience"
    "animal-kingdom/gorilla-falls-exploration-trail:gorilla-falls"
    "animal-kingdom/maharajah-jungle-trek:maharajah-jungle"
    "animal-kingdom/discovery-island-trails:discovery-trails"
    "animal-kingdom/tree-of-life:tree-of-life"
    "animal-kingdom/pandora-world-of-avatar:pandora-explore"
    "animal-kingdom/conservation-station:conservation-station"
    "animal-kingdom/affection-section:affection-section"
    "animal-kingdom/the-boneyard:boneyard"
    "animal-kingdom/wilderness-explorers:wilderness-explorer"
    "animal-kingdom/adventurers-outpost:character-safari"
    "animal-kingdom/satuli-canteen:satu-li"
    "animal-kingdom/flame-tree-barbecue:flame-tree"
    "animal-kingdom/yak-and-yeti:yak-yeti"
    "animal-kingdom/tusker-house:tusker-house"
    "animal-kingdom/nomad-lounge:nomad-lounge"
    "animal-kingdom/rainforest-cafe-animal-kingdom:rainforest-cafe"
    "animal-kingdom/tamu-tamu-refreshments:dole-whip-ak"
    "animal-kingdom/pongu-pongu:pongu-lumpia"
    "animal-kingdom/pongu-pongu:night-blossom"
    "animal-kingdom/pizzafari:pizzafari"
)

download_image() {
    local url_path=$1
    local filename=$2
    local park=$3
    local target_dir="$IMG_DIR/$park"
    
    echo "  Fetching $filename..."
    
    # Fetch the page and extract image URL from CDN
    local page_url="$BASE_URL/$url_path/"
    local img_url=$(curl -sk -A "$USER_AGENT" "$page_url" 2>/dev/null | \
        grep -o 'cdn1\.parksmedia\.wdprapps\.disney\.com/resize/mwImage/1/[0-9]*/[0-9]*/[0-9]*/[^"]*\.jpg[^"]*' | \
        head -1)
    
    if [ -n "$img_url" ]; then
        # Download to temp file first
        local temp_file=$(mktemp)
        curl -sk -A "$USER_AGENT" -o "$temp_file" "https://$img_url"
        
        if [ -f "$temp_file" ] && [ -s "$temp_file" ]; then
            # Check if we have sips (macOS) for resizing
            if command -v sips &> /dev/null; then
                # Resize to 400x300 for good quality thumbnails
                sips -z 300 400 "$temp_file" --out "$target_dir/$filename.jpg" > /dev/null 2>&1
                if [ $? -eq 0 ]; then
                    echo "    ✓ $filename.jpg (resized)"
                    rm -f "$temp_file"
                    return 0
                fi
            fi
            # Fallback: just copy the file
            mv "$temp_file" "$target_dir/$filename.jpg"
            echo "    ✓ $filename.jpg"
            return 0
        else
            echo "    ✗ Download failed"
            rm -f "$temp_file"
            return 1
        fi
    else
        echo "    ✗ No image found"
        return 1
    fi
}

echo "=== Disney World Official Image Downloader ==="
echo "This will download official images from Disney's website"
echo ""

# Create directories if needed
mkdir -p "$IMG_DIR/mk" "$IMG_DIR/epcot" "$IMG_DIR/hs" "$IMG_DIR/ak"

echo "--- Magic Kingdom (${#MK_ATTRACTIONS[@]} attractions) ---"
for item in "${MK_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "mk"
done

echo ""
echo "--- EPCOT (${#EPCOT_ATTRACTIONS[@]} attractions) ---"
for item in "${EPCOT_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "epcot"
done

echo ""
echo "--- Hollywood Studios (${#HS_ATTRACTIONS[@]} attractions) ---"
for item in "${HS_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "hs"
done

echo ""
echo "--- Animal Kingdom (${#AK_ATTRACTIONS[@]} attractions) ---"
for item in "${AK_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "ak"
done

echo ""
echo "=== Complete ==="
echo ""
echo "--- Final Image Counts ---"
for park in mk epcot hs ak; do
    count=$(ls -1 "$IMG_DIR/$park/"*.jpg 2>/dev/null | wc -l | tr -d ' ')
    echo "$park: $count images"
done
