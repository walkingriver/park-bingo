# Product Requirements Document (PRD)

**Disney Parks BINGO**  
**Product Name:** Park Bingo (preferred over “Disney Bingo” for instant brand recognition and cuteness factor; trademark check required)

**Version:** 1.0 (MVP) + Stretch Goals  
**Date:** November 21, 2025  
**Author:** Grok (on behalf of product owner)

### 1. Product Overview

Park Bingo is a location-agnostic, single-player-first mobile app that turns a day at any Disney theme park into a randomized BINGO scavenger hunt focused on rides, shows, characters, food, details, and hidden gems.

The core loop:

1. User selects a park → receives a unique 5×5 BINGO card (24 random attractions + 1 free center space = park icon).
2. User manually marks squares as they experience them.
3. App detects BINGO (row, column, diagonal, or blackout).
4. User shares a beautiful victory card on social media or with friends.

### 2. Target Users

- Disney adults (25-55) who love games and lists
- Multi-generational families looking for structure in the park
- Annual Passholders and D23 members wanting replayability
- Solo travelers who want an achievement layer

### 3. Supported Parks at Launch (MVP)

1. Magic Kingdom (WDW)
2. EPCOT (WDW)
3. Disney’s Hollywood Studios (WDW)
4. Disney’s Animal Kingdom (WDW)
5. Disneyland Park (DLR)
6. Disney California Adventure (DLR)

(Tokyo, Paris, Hong Kong, Shanghai as v1.5 content updates)

### 4. MVP Core Features

#### 4.1 Card Generation

- User chooses a park → instantly generates a 5×5 card
- Uses a deterministic random seed so the same card can be reproduced with a shareable code/slug
- Center square is ALWAYS the park’s iconic free space:
  - Magic Kingdom → Cinderella Castle
  - EPCOT → Spaceship Earth
  - Hollywood Studios → Chinese Theatre
  - Animal Kingdom → Tree of Life
  - Disneyland → Sleeping Beauty Castle
  - California Adventure → Carthay Circle Restaurant
- Pool size per park: 120-200 items (far more than 24 needed)
- Item categories mixed on every card:
  - Major E-ticket rides
  - Minor rides / classics
  - Live shows & parades (with caveat they are time-specific)
  - Character meet & greets (rotating or fixed)
  - Food & beverage landmarks
  - PhotoPass spots / iconic photo ops
  - Hidden details & Easter eggs (obscure but verifiable)
  - Restrooms with themes (e.g., Tangled toilets)
  - Transportation (Monorail, Skyliner, Railroad, etc.)

#### 4.2 Manual Marking

- Tap a square → choose status:
  - Completed (solid Mickey head)
  - Skipped (grayed with X)
  - In progress / in queue (spinning Mickey ears)
- Long-press any square for rich details: official description, typical wait time range, height requirement, photo thumbnail, Genie+ / Lightning Lane status, best time of day tip.

#### 4.3 Automatic BINGO Detection

- Real-time detection of any valid BINGO (5 in a row horizontally, vertically, or diagonally)
- Celebration animation + confetti + park-specific fireworks sound
- Option to continue playing for multiple BINGOs or full blackout
- Stats screen at end: time played, number of BINGOs, rarest square completed

#### 4.4 Sharing

- One-tap share image with:
  - Completed card (Mickey ears on completed squares)
  - Park icon watermark
  - Date + park
  - Unique game code (e.g., MK-BINGO-7K9P2)
  - Bragging text options (“I got 3 BINGOs before lunch!”)
- Native share sheet (Instagram Stories, TikTok, X, iMessage, etc.)

#### 4.5 Persistence & Reproducibility

- Every card has a short slug/code (e.g., MK-9X2K7)
- Entering the same code on any device recreates the exact same card (deterministic seed)
- Cloud save optional (Apple/Google/Sign-in-with-Disney) for history

### 5. Non-functional Requirements (MVP)

- Offline-first (all card generation and marking works with no signal)
- iOS 16+ and Android 11+
- Dark mode + high-contrast accessibility mode
- Localized: English, Spanish, French (for DLR Paris launch readiness)

### 6. Stretch Goals (Prioritized)

#### 6.1 Team Events / Group Play (v1.1)

- Host creates a “Team Event” → chooses park + optional custom name (“Smith Family Spring Break 2026”)
- Host generates a Team Code (6-8 characters)
- Any number of guests join with the code → each gets their OWN unique card using the same master seed + their player index
- Players can join/leave mid-day; progress saved per device
- Team dashboard (host only):
  - % of team that has completed each square
  - First team member to BINGO
  - Collective BINGO count
  - “Most obscure square completed by anyone” leaderboard

#### 6.2 Custom Card Builder (v1.2)

- Power users can hand-pick or blacklist items
- “Kid Mode” – removes height-restricted rides and scary items
- “Hard Mode” – only obscure / non-ride items

#### 6.3 Challenges & Seasons

- Monthly special cards (e.g., “Festival of the Lion King only” during holidays)
- Badges & achievements (100 BINGOs lifetime, blackout in under 6 hours, etc.)

#### 6.4 Photo Proof Mode (opt-in)

- User can attach a photo as proof for a square
- Private unless shared

#### 6.5 Super Stretch – Real-time Multiplayer (v2.0)

- Firebase or custom backend
- Live team view updates as members mark squares
- In-app chat
- Host can push notifications (“Spaceship Earth is a walk-on right now!”)

### 7. Monetization (Non-Intrusive)

- Completely free core experience (Disney wants goodwill)
- Potential future cosmetic packs:
  - Vintage card borders (1955 Disneyland style, 1971 Magic Kingdom, etc.)
  - Premium icon sets (Fab Five, Villains, Star Wars, Marvel)
  - One-time “Supporter Pack” with all cosmetics + name in credits

### 8. Content Guidelines & Legal Notes

- No real-time wait times or official park data (avoid API reliance and legal issues)
- All attraction names and photos used under fair-use editorial context or licensed via Disney partnership
- Clear disclaimer: “Not affiliated with or endorsed by The Walt Disney Company” (until it is)

### 9. Success Metrics

- DAU during peak weeks (spring break, Christmas)
- % of games shared to social
- Average number of BINGOs per day per user
- Retention: % of users who play in multiple parks

This MVP can ship in 4-5 months with a small team and will instantly become a must-have third-party app for any Disney parks trip — with a clear roadmap to turn it into the “Untapped” or “Geocaching” of Disney parks.
