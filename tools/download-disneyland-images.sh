#!/bin/bash

# Disneyland Resort Image Downloader
# Downloads images from Disney's CDN for Disneyland and DCA attractions

IMG_DIR="../public/images/parks"
BASE_URL="https://disneyland.disney.go.com/attractions"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Continue on errors
set +e

# Disneyland Park attractions: "page-url:filename"
DL_ATTRACTIONS=(
    "disneyland/matterhorn-bobsleds:matterhorn"
    "disneyland/space-mountain:space-mountain-dl"
    "disneyland/big-thunder-mountain-railroad:big-thunder-dl"
    "disneyland/indiana-jones-adventure:indiana-jones-dl"
    "disneyland/pirates-of-the-caribbean:pirates-dl"
    "disneyland/haunted-mansion:haunted-mansion-dl"
    "disneyland/peter-pans-flight:peter-pan-dl"
    "disneyland/its-a-small-world:small-world-dl"
    "disneyland/dumbo-the-flying-elephant:dumbo-dl"
    "disneyland/mad-tea-party:tea-cups-dl"
    "disneyland/jungle-cruise:jungle-cruise-dl"
    "disneyland/davy-crocketts-explorer-canoes:canoes"
    "disneyland/storybook-land-canal-boats:storybook-land"
    "disneyland/fantasmic:fantasmic-dl"
    "disneyland/enchanted-tiki-room:tiki-room"
    "disneyland/great-moments-with-mr-lincoln:great-moments"
    "disneyland/sleeping-beauty-castle-walkthrough:sleeping-beauty-castle"
    "disneyland/adventureland-treehouse:tarzan-treehouse"
    "disneyland/mickeys-house:mickey-house"
    "disneyland/minnies-house:minnie-house"
    "disneyland/rise-of-the-resistance:rise-resistance-dl"
    "disneyland/millennium-falcon-smugglers-run:millennium-falcon-dl"
    "disneyland/star-tours-the-adventures-continue:star-tours-dl"
    "disneyland/finding-nemo-submarine-voyage:nemo-submarine"
    "disneyland/buzz-lightyear-astro-blasters:buzz-lightyear-dl"
    "disneyland/roger-rabbit-car-toon-spin:roger-rabbit"
    "disneyland/gadgets-go-coaster:gadget-coaster"
    "disneyland/mr-toads-wild-ride:mr-toad"
    "disneyland/alice-in-wonderland:alice-wonderland"
    "disneyland/snow-whites-enchanted-wish:snow-white"
    "disneyland/pinocchios-daring-journey:pinocchio"
    "disneyland/king-arthur-carrousel:king-arthur-carousel"
    "disneyland/astro-orbitor:astro-orbitor-dl"
    "disneyland/autopia:autopia"
    "disneyland/mark-twain-riverboat:mark-twain"
    "disneyland/sailing-ship-columbia:columbia"
    "disneyland/main-street-vehicles:main-street-dl"
    "disneyland/disneyland-railroad:railroad-dl"
    "disneyland/toontown:toontown"
)

# Disney California Adventure attractions
DCA_ATTRACTIONS=(
    "disney-california-adventure/avengers-campus:avengers-campus"
    "disney-california-adventure/web-slingers-spider-man-adventure:web-slingers"
    "disney-california-adventure/guardians-of-the-galaxy-mission-breakout:mission-breakout"
    "disney-california-adventure/radiator-springs-racers:radiator-springs"
    "disney-california-adventure/incredicoaster:incredicoaster"
    "disney-california-adventure/pixar-pal-a-round:pixar-pal-a-round"
    "disney-california-adventure/toy-story-midway-mania:toy-story-mania-dca"
    "disney-california-adventure/goofy-sky-school:goofy-sky-school"
    "disney-california-adventure/grizzly-river-run:grizzly-river"
    "disney-california-adventure/soarin-around-the-world:soarin-dca"
    "disney-california-adventure/little-mermaid-ariels-undersea-adventure:ariel-undersea"
    "disney-california-adventure/monsters-inc-mike-and-sulley-to-the-rescue:monsters-inc-dca"
    "disney-california-adventure/inside-out-emotional-whirlwind:emotional-whirlwind"
    "disney-california-adventure/jessies-critter-carousel:jessie-carousel"
    "disney-california-adventure/luigi-rollickin-roadsters:luigi-roadsters"
    "disney-california-adventure/maters-junkyard-jamboree:maters-jamboree"
    "disney-california-adventure/golden-zephyr:golden-zephyr"
    "disney-california-adventure/silly-symphony-swings:silly-swings"
    "disney-california-adventure/jumpin-jellyfish:jumpin-jellyfish"
    "disney-california-adventure/redwood-creek-challenge-trail:redwood-trail"
    "disney-california-adventure/animation-academy:animation-academy"
    "disney-california-adventure/world-of-color:world-of-color"
    "disney-california-adventure/san-fransokyo-square:san-fransokyo"
    "disney-california-adventure/lamplight-lounge:lamplight-lounge"
    "disney-california-adventure/cozy-cone-motel:cozy-cone"
    "disney-california-adventure/flos-v8-cafe:flos-v8"
    "disney-california-adventure/award-wieners:award-wieners"
    "disney-california-adventure/pacific-wharf-cafe:sourdough-bread"
    "disney-california-adventure/ghirardelli-soda-fountain:ghirardelli"
    "disney-california-adventure/pym-test-kitchen:pym-test-kitchen"
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

echo "=== Disneyland Resort Image Downloader ==="
echo "This will download official images from Disney's website"
echo ""

# Create directories if needed
mkdir -p "$IMG_DIR/dl" "$IMG_DIR/dca"

echo "--- Disneyland Park (${#DL_ATTRACTIONS[@]} attractions) ---"
for item in "${DL_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "dl"
done

echo ""
echo "--- Disney California Adventure (${#DCA_ATTRACTIONS[@]} attractions) ---"
for item in "${DCA_ATTRACTIONS[@]}"; do
    url_path="${item%%:*}"
    filename="${item##*:}"
    download_image "$url_path" "$filename" "dca"
done

echo ""
echo "=== Complete ==="
echo ""
echo "--- Final Image Counts ---"
for park in dl dca; do
    count=$(ls -1 "$IMG_DIR/$park/"*.jpg 2>/dev/null | wc -l | tr -d ' ')
    echo "$park: $count images"
done
