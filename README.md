# Islamabad Sector Dice · Explorer

An interactive cartographic dice roller and complete field guide covering **all 71 Islamabad CDA / Zone I & Zone II sectors (`B-17` through `I-17`)**, defaulting to **`H-11` → `H-11/4 · FAST-NUCES`** as your Home Base while letting you switch to any sector and sub-location anytime.

## Features
- **Two-Step Sector Dice Roller:**
  1. **Roll Letter (`B`–`I`)**: Animated tactile die locks in a letter row and illuminates that entire corridor across the map.
  2. **Roll Number**: Dynamically adapts to only the valid sector numbers within the rolled letter, then lights up the chosen sector like a radar beacon!
  - Also includes **Roll Letter → Number** one-click sequence, pool filters (`All (71)`, `Active Only`, `Top Hangouts`, `Unexplored`), click-to-inspect on any sector, and synthesized dice audio.
- **Two-Step Precision Home Base Selector:**
  - Pick **any of the 71 Islamabad sectors (`B–I`)** uniformly from the **Home:** dropdown, then pick **precisely where inside that sector** you're starting from (sub-sectors `/1` SW, `/2` NW, `/3` NE, `/4` SE, Markaz/Center, and key landmarks like **`H-11/4 · FAST-NUCES`**), or use **GPS** / **`⌂ Set as Home`**.
- **Geographically Calibrated Islamabad Map:**
  - True North-Up ~30° rotated Constantinos Doxiadis sector grid (`~1.83 km` module), Margalla Hills contours, Rawal Lake, Shakarparian, Blue Area / Jinnah Ave, Srinagar Highway + Orange Line Metro stations, IJP Road, Margalla Avenue, and key landmarks.
  - Live route trajectory from your exact chosen **Home Base** pin inside the sector.
- **Rich Field Guide & Full Persistent State:**
  - Straight-line distance, compass bearing, sub-location-aware road distance, estimated drive time, and tailored corridor + Metrobus directions.
  - Honest local expectations ("What to Expect"), highlights ("Nice Things to Look Out For"), food & chai spots, practical local tips, adjacent sector hops, and direct Google Maps / Directions links.
  - Complete state (`localStorage`): saves Home Base sector & sub-location, GPS coordinates, dice pool filter, rolled/selected sector, map toggles & zoom, Atlas filters, roll history, and explored checklist across reloads.

## Project Structure
- `index.html` — Application shell, SVG map canvas, Dice Roller Studio, and Atlas modal
- `styles.css` — Dark emerald/amber cartographic styling and 3D dice animations
- `sectors-data.js` — All 71 researched sectors (`B-17`–`I-17`), sub-sector precision spots, calibrated Doxiadis grid math, landmarks, and highways
- `app.js` — Interactive SVG map renderer, two-step dice engine, route/distance estimator, and `localStorage` persistence

## How to Run
- **Option 1 (Zero setup):** Open `explore-islamabad/index.html` directly in any modern browser.
- **Option 2 (Local server):**
  ```bash
  cd explore-islamabad
  python3 -m http.server 8000
  ```
  Then open `http://localhost:8000`.
