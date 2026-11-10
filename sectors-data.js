/**
 * Islamabad Complete Sector Atlas & Cartographic Data
 * ---------------------------------------------------
 * Calibrated against Islamabad's Constantinos A. Doxiadis master-plan grid
 * (~1.83 km x 1.83 km module rotated ~30° along the Margalla Hills foothills)
 * plus verified real-world GPS coordinates for Zone II (B-17) and landmarks.
 */

window.ISLAMABAD_DATA = (() => {
  // Affine calibration fitted from verified GPS coordinates of 13 Islamabad Markaz/sector anchors:
  // row r: B=-1, C=0, D=1, E=2, F=3, G=4, H=5, I=6
  // col c: sector number (5..17)
  const GRID_AFFINE = {
    a0: 33.819896,
    a1: -0.01406716,
    a2: -0.00852741,
    b0: 73.151435,
    b1: 0.00923827,
    b2: -0.01734420,
  };

  const ROW_INDEX = { B: -1, C: 0, D: 1, E: 2, F: 3, G: 4, H: 5, I: 6 };

  function gridToLatLng(r, c) {
    return {
      lat: +(GRID_AFFINE.a0 + GRID_AFFINE.a1 * r + GRID_AFFINE.a2 * c).toFixed(5),
      lng: +(GRID_AFFINE.b0 + GRID_AFFINE.b1 * r + GRID_AFFINE.b2 * c).toFixed(5),
    };
  }

  const GRID_DET = GRID_AFFINE.a1 * GRID_AFFINE.b2 - GRID_AFFINE.a2 * GRID_AFFINE.b1;

  function latLngToGrid(lat, lng) {
    const dl = lat - GRID_AFFINE.a0;
    const dg = lng - GRID_AFFINE.b0;
    return {
      r: (dl * GRID_AFFINE.b2 - dg * GRID_AFFINE.a2) / GRID_DET,
      c: (GRID_AFFINE.a1 * dg - GRID_AFFINE.b1 * dl) / GRID_DET,
    };
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Polygon corners of a sector in (r, c) space (slightly inset by 0.065 to show avenue/greenbelt gaps)
  function sectorPolygonLatLng(letter, num, customCenter) {
    const r = ROW_INDEX[letter];
    const c = num;
    const half = 0.435;
    if (letter === "B" && num === 17 && customCenter) {
      // Zone II B-17 polygon aligned slightly rotated along GT Rd / M-1 corridor
      const corners = [
        [-0.44, -0.46],
        [-0.44, 0.46],
        [0.44, 0.46],
        [0.44, -0.46],
      ];
      return corners.map(([dr, dc]) => ({
        lat: +(customCenter.lat + GRID_AFFINE.a1 * dr + GRID_AFFINE.a2 * dc).toFixed(5),
        lng: +(customCenter.lng + GRID_AFFINE.b1 * dr + GRID_AFFINE.b2 * dc).toFixed(5),
      }));
    }
    const corners = [
      [r - half, c + half], // NW-ish (higher number, upper row)
      [r - half, c - half], // NE-ish
      [r + half, c - half], // SE-ish
      [r + half, c + half], // SW-ish
    ];
    return corners.map(([rr, cc]) => gridToLatLng(rr, cc));
  }

  // Default Home Base starting location (any sector & sub-location can be selected cleanly in UI)
  const DEFAULT_HOME = {
    sectorId: "H-11",
    spotId: "h11-4-fast",
  };

  // Category styles & labels
  const CATEGORIES = {
    commercial: { label: "Commercial & Residential", color: "#f59e0b" },
    upscale: { label: "Upscale / Diplomatic", color: "#38bdf8" },
    residential: { label: "Residential Hub", color: "#10b981" },
    park: { label: "Green Park / Recreation", color: "#22c55e" },
    institutional: { label: "University / Institutional", color: "#a78bfa" },
    administrative: { label: "Red Zone / Govt Seat", color: "#fb7185" },
    industrial: { label: "Industrial / Wholesale", color: "#fb923c" },
    developing: { label: "Developing CDA / FGEHA", color: "#2dd4bf" },
    undeveloped: { label: "Planned / Raw Land", color: "#64748b" },
  };

  const STATUS_META = {
    "Fully Developed": { tier: "active", tone: "emerald" },
    "Rapidly Developing": { tier: "active", tone: "teal" },
    "Active Construction": { tier: "developing", tone: "cyan" },
    "Institutional / Restricted": { tier: "active", tone: "violet" },
    "Partially Settled": { tier: "developing", tone: "amber" },
    "Undeveloped / Raw": { tier: "raw", tone: "slate" },
  };

  // Curated dataset for EVERY sector in Islamabad (71 sectors across B..I)
  const RAW_SECTORS = [
    // ======================== B SERIES ========================
    {
      id: "B-17",
      letter: "B",
      number: 17,
      title: "Multi Gardens (Zone II)",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 3,
      coords: { lat: 33.6810, lng: 72.8191 },
      vibe: "A self-contained, bustling suburban city tucked on Islamabad's far western flank between GT Road and the M-1 Motorway. Wide clean boulevards, rising apartment plazas, and dramatic western Margalla ridge backdrops give it a fresh, open-sky feel.",
      highlights: [
        "Block A–G commercial Markazes with lively evening family crowds",
        "B-17 Water Tank & Lake Park viewpoint overlooking the western hills",
        "Direct gateway to Taxila Museum, Julian Buddhist ruins & Khanpur Dam",
        "Sangjani Interchange access connecting straight onto M-1 Motorway",
      ],
      food: [
        "Jamil Sweets & Bakers (popular branch in Block B Markaz)",
        "Family BBQ, tikka karahi & fast-food spots across Block B & C",
        "Chai dhabas along the GT Road / Margalla Avenue approach",
      ],
      tips: "Far from central Islamabad (~22–24 km road from H-11). Pair a trip here with sunset at Khanpur Dam or a Taxila heritage run.",
    },

    // ======================== C SERIES ========================
    {
      id: "C-13",
      letter: "C",
      number: 13,
      title: "Undeveloped Margalla Foothills",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Quiet, raw hillside terrain hugging the Margalla foothills north of D-13. Still largely unbuilt under CDA's land-sharing backlog—expect natural scrubland, scattered rural tracks, and mountain silence rather than shops.",
      highlights: [
        "Close-up views of the steep northern Margalla ridge",
        "Natural Potohar flora and rural foothill footpaths",
        "Bordering the scenic Shah Allah Ditta foothills corridor",
      ],
      food: ["No commercial markets inside C-13—grab food/chai in D-12 or Shah Allah Ditta."],
      tips: "Not a retail destination yet. Best appreciated only as part of a scenic Margalla Avenue drive past D-12.",
    },
    {
      id: "C-14",
      letter: "C",
      number: 14,
      title: "Margalla Foothill Expansion",
      category: "developing",
      status: "Rapidly Developing",
      hangoutScore: 2,
      vibe: "CDA's showcase newly carved foothill sector—freshly paved wide streets, newly balloted 1-kanal plots, and uninterrupted mountain walls right behind the plots. Very quiet and airy, with early home construction starting to pick up.",
      highlights: [
        "Direct front-row mountain views along Margalla Avenue",
        "Crisp brand-new paved grid roads great for quiet sunset drives",
        "Minutes away from Shah Allah Ditta ancient caves & banyan trees",
      ],
      food: ["Markaz plots are laid out, but eateries aren't open yet—head 5 min east to D-12 Markaz or Shah Allah Ditta tea stalls."],
      tips: "Great if you want to see brand-new CDA infrastructure or take an uncluttered evening drive along Margalla Avenue from H-11.",
    },
    {
      id: "C-15",
      letter: "C",
      number: 15,
      title: "Land-Sharing Foothill Zone",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 1,
      vibe: "Active earthwork and emerging arterial roads running west from C-14 at the base of the hills. Expect graders, fresh asphalt edges, rocky terrain, and rural hamlets transitioning into urban plots.",
      highlights: [
        "Newly built Margalla Avenue link corridor cutting cleanly beneath the hills",
        "Panoramic views down toward the Potohar plateau & Golra side",
      ],
      food: ["No active markets—bring water or stop at D-12 Markaz beforehand."],
      tips: "Strictly an outer drive/real-estate exploration zone right now; avoid dirt side-tracks after dark.",
    },
    {
      id: "C-16",
      letter: "C",
      number: 16,
      title: "Sarai Kharbooza Foothills",
      category: "undeveloped",
      status: "Active Construction",
      hangoutScore: 1,
      vibe: "Western edge of the C-band near Sarai Kharbooza where Margalla Avenue reaches out toward GT Road. Mostly surveyed open land, early road embankments, and rural foothill charm.",
      highlights: [
        "Margalla Avenue western corridor connecting toward GT Road (N-5)",
        "Open horizon views over western Islamabad and Sangjani hills",
      ],
      food: ["Roadside tea stalls near GT Road / Sarai Kharbooza; none inside the sector yet."],
      tips: "Only worth passing through if connecting from Margalla Avenue out toward GT Road / B-17.",
    },

    // ======================== D SERIES ========================
    {
      id: "D-10",
      letter: "D",
      number: 10,
      title: "Margalla Buffer Foothills",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Steep forested foothill buffer right above E-10, largely untouched and non-commercial. Lush after monsoon rains, quiet, and tucked off public thoroughfares.",
      highlights: [
        "Dense Margalla foothill greenery and natural ravines",
        "Sits immediately north of the E-9 / E-10 institutional belt",
      ],
      food: ["None inside D-10; nearest food is down in F-10 Markaz or E-11."],
      tips: "Much of the adjoining E-10 boundary is security-sensitive; stick to public roads in F-10/E-11/D-12.",
    },
    {
      id: "D-11",
      letter: "D",
      number: 11,
      title: "Golra Hillsides & Pocket Schemes",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 2,
      vibe: "An interesting patchwork between the bustling apartments of E-11 and the scenic ridges of D-12. Combines older local village lanes near Golra foothills with partial cooperative plots.",
      highlights: [
        "Mountain-edge roads connecting E-11/Khayaban-e-Iqbal toward D-12",
        "Close proximity to historic Golra Sharif & foothill trails",
      ],
      food: ["Small neighborhood tuck-shops; walk/drive 3 minutes south to E-11 for full dining."],
      tips: "Use main link roads (Khayaban-e-Iqbal / Margalla Ave) rather than winding inner village lanes.",
    },
    {
      id: "D-12",
      letter: "D",
      number: 12,
      title: "Foothill Gateway & Shah Allah Ditta",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "One of Islamabad's most scenic, breezy residential sectors—perched right against the western Margalla Hills with dramatic cliff views at the end of almost every street. Calm, clean, cooler than the lower sectors, and beloved for evening drives.",
      highlights: [
        "Shah Allah Ditta Caves (right at D-12's NW edge)—2,400-year-old meditation caves & giant ancient banyan trees",
        "D-12 Markaz—rapidly growing commercial square with coffee stops & bakeries",
        "Informal foothill hiking tracks & dramatic sunset views along Margalla Ave",
        "Noticeably cooler evening breezes rolling straight off the Margalla cliffs",
      ],
      food: [
        "Hillside chai & paratha dhabas right by Shah Allah Ditta Caves (iconic sunset vibe!)",
        "Cozy neighborhood cafes, shawarma, and bakeries popping up in D-12 Markaz",
      ],
      tips: "A top-tier roll from H-11! ~10.5 km drive up 11th Ave / Golra Rd / Margalla Rd—go around 4:30 PM to catch caves + chai before dusk.",
    },
    {
      id: "D-13",
      letter: "D",
      number: 13,
      title: "Western Foothill Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Stalled CDA land west of D-12—open Potohar scrub, small older hamlets, and rugged views up toward C-13 and the Margalla peaks.",
      highlights: [
        "Unobstructed mountain silhouette bordering D-12",
        "Quiet rural outskirts vibe just minutes from modern D-12 villas",
      ],
      food: ["No commercial spots; rely on D-12 Markaz right next door."],
      tips: "Unbuilt CDA zone—stick to D-12 or Margalla Avenue for smooth driving.",
    },
    {
      id: "D-14",
      letter: "D",
      number: 14,
      title: "Raw Potohar Foothills",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Unbuilt master-plan grid square west of D-13. Rolling dirt ridges, natural stream beds, and zero civic infrastructure.",
      highlights: [
        "Wide open rural landscape beneath the western Margallas",
      ],
      food: ["None."],
      tips: "Purely raw land on paper; visit only conceptually or pass via Margalla Ave to the north.",
    },
    {
      id: "D-15",
      letter: "D",
      number: 15,
      title: "Planned Western Sector",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Open semi-rural terrain in the western D-band without formal CDA road networks or commercial markaz.",
      highlights: [
        "Rural Potohar countryside on the outer edge of Zone I",
      ],
      food: ["None."],
      tips: "Undeveloped master-plan reserve.",
    },
    {
      id: "D-16",
      letter: "D",
      number: 16,
      title: "Outer Western Corridor",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Transitional rural periphery near the GT Road / Sangjani approach, mixed with agricultural fields and early unbuilt society layouts.",
      highlights: [
        "Near the western mountain gap where GT Road meets the Margallas",
      ],
      food: ["Basic roadside tea spots near GT Road."],
      tips: "Not an urban hangout spot yet; bypass via GT Rd or Margalla Ave.",
    },
    {
      id: "D-17",
      letter: "D",
      number: 17,
      title: "Margalla View / Sangjani Edge",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 2,
      vibe: "Zone II cooperative housing cluster (Margalla View Housing Scheme & private layouts) tucked near GT Road / Sangjani. Quiet, spread-out suburban plots with wide views of the western Margallas.",
      highlights: [
        "Margalla View Housing Scheme residential lanes",
        "Close proximity to Sangjani Toll Plaza & B-17 Multi Gardens",
      ],
      food: ["Small local shops; B-17 Markaz just across GT Road has full restaurants."],
      tips: "Check society gate rules if driving inside private blocks.",
    },

    // ======================== E SERIES ========================
    {
      id: "E-5",
      letter: "E",
      number: 5,
      title: "Trail 5 & Foothill Sanctuary",
      category: "park",
      status: "Institutional / Restricted",
      hangoutScore: 4,
      vibe: "Lush forest sanctuary meeting the upper edge of the Diplomatic Enclave! Shaded mountain streams, wild rhesus macaques along Margalla Road, and crisp pine-scented trail air right above F-5.",
      highlights: [
        "Trail 5 (Dara Janglan) trailhead—one of Islamabad's prettiest green stream hikes",
        "Trail 6 access right nearby near Faisal Mosque / Margalla Road edge",
        "Freshwater mountain streams & birdwatching right inside city limits",
      ],
      food: ["Tea/water stalls at Trail 5 parking; upscale cafes 4 minutes south in F-6 Kohsar Market."],
      tips: "Go early morning (6:30–9:30 AM) for Trail 5! Carry water, watch out for cheeky monkeys near food bags, and note southern border meets Diplomatic Enclave security.",
    },
    {
      id: "E-6",
      letter: "E",
      number: 6,
      title: "Saidpur Village & Trail 3 Approach",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Steeped in 500 years of Potohar history! E-6 climbs from leafy diplomatic hillsides right into Saidpur Village—an atmospheric heritage hamlet nestled in a Margalla amphitheater with cobbled lanes, art galleries, and ancient shrines.",
      highlights: [
        "Saidpur Village—restored historic Hindu Temple (Rama Kund), Sikh Gurdwara & mud-plaster heritage houses",
        "Trail 3 trailhead right along Margalla Road on the E-6/F-6 border",
        "Daman-e-Koh mountain road switchbacks winding right above the sector",
      ],
      food: [
        "Des Pardes (Saidpur)—classic Pakistani dinner under twinkling fairy lights & mountain air",
        "Polo Lounge / Hot Spot / local hillside cafes inside Saidpur Village",
        "Street 1 & Kohsar cafes just across Margalla Rd in F-6",
      ],
      tips: "One of Islamabad's absolute best evening or morning rolls! Hike Trail 3 at dawn or do dinner in Saidpur Village—expect busy weekend parking after 7 PM.",
    },
    {
      id: "E-7",
      letter: "E",
      number: 7,
      title: "Hillside Mansions & Embassies",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Arguably Islamabad's quietest, leafiest, most prestigious residential enclave—nestled directly into the foothills between Saidpur and Faisal Mosque. Huge tree-lined boulevards, grand embassy residences, and pure calm.",
      highlights: [
        "Hillside Road—one of the prettiest shaded walking/driving strips in Islamabad",
        "Right next door to Faisal Mosque and Trail 2 / Trail 3 foothills",
        "Immaculate cul-de-sacs, pocket green parks & bird-filled canopies",
      ],
      food: ["Almost purely residential—step 2 minutes south into F-7 Jinnah Super (Chaaye Khana, Gol Market) for food & coffee."],
      tips: "Expect discreet diplomatic security guards and calm, zero-honking streets. Wonderful for an evening stroll before heading to F-7 Markaz.",
    },
    {
      id: "E-8",
      letter: "E",
      number: 8,
      title: "Faisal Mosque & Bahria University",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Iconic Islamabad! Anchored at its northern foothill tip by the majestic white tent-like **Faisal Mosque** against the dark green Margallas, while the lower sector hums with student energy around **Bahria University**.",
      highlights: [
        "Faisal Mosque—world-famous modernist mosque by Vedat Dalokay with sweeping city views",
        "Trail 6 (behind Faisal Mosque)—gorgeous forest stream trail & wildlife reserve",
        "Bahria University Main Campus (Shangrila Rd) & serene tree-lined avenues",
        "Faisal Mosque courtyard at dusk & post-rain cloud-kissed Margalla backdrop",
      ],
      food: [
        "Snacks, Kashmiri chai & ice cream carts around Faisal Mosque parking plaza",
        "Student cafes inside/around Shangrila Rd & quick access to F-8 Markaz (5 min south)",
      ],
      tips: "A must-visit! Park at Faisal Mosque around sunset or sunrise. Dress modestly if entering the main prayer hall, and avoid Friday noon rush if you dislike traffic.",
    },
    {
      id: "E-9",
      letter: "E",
      number: 9,
      title: "PAF Complex, Air Univ & NDU",
      category: "institutional",
      status: "Institutional / Restricted",
      hangoutScore: 2,
      vibe: "Spotlessly manicured defense & higher-education sector housing **Air Headquarters (PAF Complex)**, **Air University**, and **National Defence University (NDU)**. Disciplined, tree-lined, and high-security.",
      highlights: [
        "Air University Main Campus & PAF Educational Complexes",
        "National Defence University (NDU) against the Margalla ridge",
        "Pristine institutional boulevards & aviation heritage displays",
      ],
      food: ["On-campus cafeterias only—general public usually visits F-9 Park or F-10 Markaz nearby."],
      tips: "Heads up: Most of E-9 is gated/access-controlled! Carry original CNIC and expect security verification if visiting Air Univ/NDU, or admire from Margalla Rd.",
    },
    {
      id: "E-10",
      letter: "E",
      number: 10,
      title: "Restricted Foothill Zone",
      category: "institutional",
      status: "Institutional / Restricted",
      hangoutScore: 1,
      vibe: "Heavily forested, restricted institutional & defense sector tucked beneath the foothills between E-9 and E-11. Not open for casual civilian roaming.",
      highlights: [
        "Green Margalla foothill slopes visible from Margalla Rd / F-10",
      ],
      food: ["None accessible to the public—head directly south to F-10 Markaz."],
      tips: "Access is restricted; do not try to drive through internal gates without official clearance.",
    },
    {
      id: "E-11",
      letter: "E",
      number: 11,
      title: "High-Rise Apartments & Cafes",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Unlike Islamabad's low-rise bungalow sectors, E-11 feels like a lively vertical apartment district! Managed through cooperative societies (MPCHS, FECHS, Services), it's packed with high-rises, rooftops, students, families, and nonstop street buzz.",
      highlights: [
        "E-11 Markaz & E-11/2–/4 commercial strips—dense, active late into the night",
        "Indoor gaming & entertainment hubs like We Play",
        "Minutes from historic Golra Sharif Shrine & Colonial Railway Museum",
        "Quick foothill access up Khayaban-e-Iqbal toward D-12 & Shah Allah Ditta",
      ],
      food: [
        "Havana Terraces & Cafe Rustic (rooftop hill views & continental/BBQ)",
        "Jamil Sweets, Domino's, KFC, Broadway & tons of late-night chai/roll stalls",
      ],
      tips: "Only ~6 km north from H-11! Expect tighter parking in E-11/2 commercial lanes during dinner hours—great for budget-friendly apartment cafes & Golra visits.",
    },
    {
      id: "E-12",
      letter: "E",
      number: 12,
      title: "Golra Heritage Edge & CDA Plots",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 3,
      vibe: "A sector in major transformation! Long stalled since 1989, CDA has aggressively cleared encroachments and paved roads across E-12/1–3. Right on its edge sits one of Islamabad's sweetest hidden gems: the Golra Railway Museum.",
      highlights: [
        "Golra Sharif Railway Station & Museum (right on the E-11/E-12 boundary)—1881 British-era station, vintage steam locomotives & banyan shade!",
        "Newly constructed CDA residential avenues & Margalla foothills vista",
      ],
      food: ["Tea/snacks near Golra Station & nearby E-11 commercial plazas (2 min east)."],
      tips: "Roll E-12 specifically as an excuse to visit the **Golra Railway Museum**—super photogenic, cheap entry, and only ~6 km from H-11!",
    },
    {
      id: "E-13",
      letter: "E",
      number: 13,
      title: "Unbuilt Western Foothill Tract",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Pending CDA acquisition sector west of E-12. Mostly open Potohar grass, old village tracks, and quiet foothill horizons awaiting development.",
      highlights: [
        "Quiet rural views looking north toward D-12/D-13 & the Margallas",
      ],
      food: ["None inside E-13."],
      tips: "Undeveloped land—not a hangout spot yet.",
    },
    {
      id: "E-14",
      letter: "E",
      number: 14,
      title: "Planned Western Sector",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Unbuilt CDA sector west of E-13. Open green/brown countryside with zero commercial life.",
      highlights: ["Open western Potohar fields"],
      food: ["None."],
      tips: "Master-plan sector still awaiting on-ground execution.",
    },
    {
      id: "E-15",
      letter: "E",
      number: 15,
      title: "Zone II Society Corridor",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Western Zone II fringe mixing raw land with scattered private cooperative housing pockets. Quiet, semi-rural, and far from city buzz.",
      highlights: ["Outer suburban layouts along western link roads"],
      food: ["Minimal—nearest major spots are down in G-15 or E-11."],
      tips: "Check society layout approvals if visiting for property.",
    },
    {
      id: "E-16",
      letter: "E",
      number: 16,
      title: "Roshan Pakistan / Cooperative Zone",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Outer Zone II cooperative housing enclave (like Roshan Pakistan) with patchy construction amidst quiet open fields.",
      highlights: ["Developing suburban streets and open skies"],
      food: ["Basic local karyana shops only."],
      tips: "Quiet outer zone near GT Road corridor.",
    },
    {
      id: "E-17",
      letter: "E",
      number: 17,
      title: "Tarnol / Sangjani Fringe",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Far-western boundary of the E-series near Tarnol/Sangjani. Mostly rural agricultural landholdings and emerging private real-estate signboards.",
      highlights: ["Western edge connecting toward GT Road & B-17"],
      food: ["Highway dhabas along GT Road nearby."],
      tips: "Outer boundary land—head a bit northwest to B-17 for developed amenities.",
    },

    // ======================== F SERIES ========================
    {
      id: "F-5",
      letter: "F",
      number: 5,
      title: "Marriott, Diplomatic Edge & Trail 5",
      category: "administrative",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Polished, high-security, diplomatic-tier sector flanking Jinnah Avenue and the Red Zone! Wide manicured lawns, luxury hotel lobbies, software technology parks, and immediate foothill access to Trail 5.",
      highlights: [
        "Islamabad Marriott Hotel & Serena/Red Zone approach along Aga Khan Rd",
        "Software Technology Park & major federal headquarters",
        "Minutes from Trail 5 & Trail 6 foothills right across Margalla Rd",
        "Quick Red Line Metrobus access near Secretariat / 7th Ave side",
      ],
      food: [
        "Nadia Cafe, Dumpukht & Sakura at Marriott Hotel (upscale dining & buffets)",
        "Super Market & Kohsar Market right next door in F-6 (3 min west)",
      ],
      tips: "Expect Red Zone security checkpoints along Constitution Ave edge—keep CNIC handy. Great spot for hotel coffee or linking to Trail 5!",
    },
    {
      id: "F-6",
      letter: "F",
      number: 6,
      title: "Super Market & Kohsar Cafe Hub",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Islamabad's original aristocratic gem! Mature banyan & jacaranda canopies shade calm streets leading to two iconic markets: classic **Super Market (F-6 Markaz)** and trendy, al-fresco **Kohsar Market (F-6/3)**. Relaxed, cosmopolitan, bookish, and classy.",
      highlights: [
        "Kohsar Market (F-6/3)—Islamabad's famous outdoor terrace cafe & brunch square",
        "Super Market (F-6 Markaz)—heritage bookshops, boutiques, electronics & bakeries",
        "Trail 3 hiking trailhead right at the northern F-6/3 Margalla Road edge",
        "St. Thomas Church & quiet shaded sub-sector parks",
      ],
      food: [
        "Street 1 Cafe (Kohsar)—iconic brunch, wood-fired pizza & outdoor terrace",
        "Roasters Coffee House, Butler's Chocolate Cafe & Table Talk in Kohsar/F-6",
        "Classic Super Market snacks, fresh juices & bakery treats",
      ],
      tips: "Peak Islamabad atmosphere! From H-11 (~13.5 km), take Srinagar Hwy → 7th Ave north. Best for weekend morning brunch or evening coffee after Trail 3.",
    },
    {
      id: "F-7",
      letter: "F",
      number: 7,
      title: "Jinnah Super & Gol Market",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "The vibrant, stylish social heart of Islamabad! **Jinnah Super Market (F-7 Markaz)** buzzes from noon to midnight with fashion boutiques, bookstores, cafes, and families, while leafy **Gol Market (F-7/3)** offers laid-back neighborhood charm.",
      highlights: [
        "Jinnah Super Market—famous fashion, traditional crafts, jewelry & bookstores",
        "Safa Gold Mall & Rana Market (classic neighborhood food & bookstore enclave)",
        "Gol Market (F-7/3)—peaceful circular park-side hangout with iconic cafes",
        "Direct visual line up Faisal Avenue straight to Faisal Mosque!",
      ],
      food: [
        "Chaaye Khana (F-7 Markaz)—iconic cottage-style tea house, parathas & books",
        "Gloria Jean's, Artrio Cafe, Loafology nearby & countless ice-cream/burger spots",
        "Hot Spot (Gol Market)—legendary late-night gourmet ice cream & desserts",
      ],
      tips: "Always a win on the dice! Parking in Jinnah Super gets tight Friday–Sunday evenings—Gol Market or weekday afternoons are super chill.",
    },
    {
      id: "F-8",
      letter: "F",
      number: 8,
      title: "Centaurus Mall & Ayub Market",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "A fascinating split personality: by day, **F-8 Markaz** hums with lawyers in black suits around the District Courts; by evening, **The Centaurus Mall** in F-8/4 lights up the skyline while **Loafology** & **Mocca** pull in the coffee crowd.",
      highlights: [
        "The Centaurus Mall (F-8/4)—Islamabad's flagship mall, Cineplex & food court",
        "F-8 Gol Masjid—striking modernist circular dome mosque in the Markaz",
        "F-8 Markaz (Ayub Market)—famous cafes, artisanal bakeries & hardware/books",
        "Red Line Metrobus Centaurus / Ibn-e-Sina stops within easy reach",
      ],
      food: [
        "Loafology Bakery & Cafe (artisanal sourdough, croissants & specialty coffee)",
        "Mocca Coffee & F-8 Markaz eateries (great burgers, Chinese & desi lunch spots)",
        "Centaurus Mall Food Court (wide variety for groups)",
      ],
      tips: "Avoid the inner court lanes during weekday mornings (9 AM–2 PM lawyer traffic); evenings around Centaurus or F-8 Markaz cafes are breezy and fun!",
    },
    {
      id: "F-9",
      letter: "F",
      number: 9,
      title: "Fatima Jinnah Park (F-9 Park)",
      category: "park",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "An entire 2 km × 2 km city sector (~750 acres!) dedicated 100% to green parklands—no houses, no private plazas, just sprawling meadows, pine & banyan groves, solar-lit jogging tracks, and views of the Margallas.",
      highlights: [
        "Aiwan-e-Quaid—monumental pavilion & cultural exhibition complex inside the park",
        "MegaZone—indoor bowling alley, arcade games, pool tables & swimming complex",
        "Kilometers of paved cycling/jogging tracks & solar-lit walking trails",
        "Gandhara Citizen's Club & peaceful sunset picnic lawns",
      ],
      food: [
        "Park canteens, corn/chai stalls & MegaZone snack bars (great for bringing a picnic!)",
        "F-10 Markaz sits right across 10th Avenue on the western edge for full dinner",
      ],
      tips: "Only ~6–7 km from H-11! Enter via Mehran Gate (9th Ave) or Bolan Gate (10th Ave). Sunrise walks or 5 PM golden-hour picnics here are unbeatable.",
    },
    {
      id: "F-10",
      letter: "F",
      number: 10,
      title: "F-10 Markaz Nightlife & Food Hub",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Loud, energetic, populist, and delicious! **F-10 Markaz** is one of Islamabad's busiest commercial engines—jam-packed with smartphone markets, fashion outlets, dessert bars, and late-night grill/roll spots, right across from F-9 Park.",
      highlights: [
        "F-10 Markaz—nonstop shopping, electronics, tailoring & bustling plazas",
        "Immediate western border of Fatima Jinnah Park (Bolan Gate access)",
        "Lively residential streets & well-kept neighborhood family parks",
      ],
      food: [
        "Famous late-night food plaza: smash burgers, rolls, fries, waffles & ice cream",
        "Monal Express / casual cafes, shinwari & desi BBQ spots",
        "Countless late-night chai spots buzzing past midnight",
      ],
      tips: "Quick ~6 km drive from H-11 up 10th Ave! Go after 7 PM if you want high energy and street food; watch for tight traffic inside the Markaz loop.",
    },
    {
      id: "F-11",
      letter: "F",
      number: 11,
      title: "Olympus Mall & Modern Apartments",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Sleek, modern, and family-friendly! F-11 blends grand villas with contemporary apartment blocks and a sprawling, well-organized **F-11 Markaz** anchored by Olympus Mall—just a stone's throw northwest of H-11.",
      highlights: [
        "Olympus Mall & F-11 Markaz—modern supermarkets, gyms, salons & boutiques",
        "Hilal Road & sub-sector walking parks with clean jogging tracks",
        "Easy back-road connections straight up into E-11 & D-12",
      ],
      food: [
        "Burning Brownie (Olympus Mall)—famous New York cheesecakes & warm brownies",
        "The Blue Whale Cafe, specialty coffee nooks & diverse family restaurants",
        "Great bakeries & grocery stops for an effortless hangout from H-11",
      ],
      tips: "Super close to H-11 (~5 km / ~9 min up 11th Ave/G-11)! Ideal for a quick dessert/coffee run when you don't want to drive all the way to F-6.",
    },
    {
      id: "F-12",
      letter: "F",
      number: 12,
      title: "Stalled FGEHA Sector",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Historically bottlenecked by decades-long land acquisition & affectee disputes under FGEHA. Surrounded by thriving F-11 and E-11, yet inside it remains mostly open fields and scattered rural settlements.",
      highlights: [
        "Stark contrast between raw rural land and adjacent F-11 high-rises",
        "Near Golra Railway Station heritage area to the north",
      ],
      food: ["None inside F-12—head 3 min east to F-11 Markaz."],
      tips: "Still unbuilt; treat as pass-through or detour directly to F-11 or Golra Museum.",
    },
    {
      id: "F-13",
      letter: "F",
      number: 13,
      title: "Unbuilt Western F-Band",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Undeveloped master-plan square west of F-12. Quiet Potohar scrub, dirt tracks, and open skies awaiting future infrastructure.",
      highlights: ["Open countryside between Golra and the F-14/F-15 zone"],
      food: ["None."],
      tips: "Raw land—nothing open for visiting yet.",
    },
    {
      id: "F-14",
      letter: "F",
      number: 14,
      title: "FGEHA Active Infrastructure Zone",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "A federal government employee housing sector finally springing to life! NLC earthworks, newly carved wide avenues, and underground utility corridors signal a new city block in the making.",
      highlights: [
        "Fresh NLC-built arterial roads and wide grid earthworks",
        "Clear open views north toward the D-12 / C-14 Margalla ridge",
      ],
      food: ["No cafes/markets yet—closest food is down in G-13 or F-11."],
      tips: "Fun if you're curious about Islamabad's expanding western frontier, otherwise mostly construction dust.",
    },
    {
      id: "F-15",
      letter: "F",
      number: 15,
      title: "FGEHA Sister Development Sector",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "Developing in tandem with F-14 by FGEHA/NLC. Long straight newly graded boulevards across rolling Potohar terrain with active construction crews.",
      highlights: [
        "Wide empty freshly graded roads overlooking G-15 & the Motorway corridor",
      ],
      food: ["None inside yet—G-15 / J&K Society to the south has local eateries."],
      tips: "Construction-stage sector; best visited during daylight if checking progress.",
    },
    {
      id: "F-16",
      letter: "F",
      number: 16,
      title: "Outer Western F-Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Untouched outer western F-band square near Tarnol corridor. Rural landscapes and unbuilt reserve land.",
      highlights: ["Quiet western countryside horizon"],
      food: ["None."],
      tips: "Not developed for public visits.",
    },
    {
      id: "F-17",
      letter: "F",
      number: 17,
      title: "Tarnol Edge / Emerging Layouts",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Far-western F-tier along the Tarnol / Fateh Jhang axis. Mix of raw land and emerging private residential tracts.",
      highlights: ["Gateway views toward the M-1 / Fateh Jhang interchange"],
      food: ["Roadside dhabas out on Tarnol / Fateh Jhang Rd."],
      tips: "Outer boundary frontier—no CDA markaz exists.",
    },

    // ======================== G SERIES ========================
    {
      id: "G-5",
      letter: "G",
      number: 5,
      title: "Red Zone, Serena & Pak-China Centre",
      category: "administrative",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Pakistan's monumental seat of state power mixed with grand cultural venues! Wide flag-lined Constitution Avenue connects **Parliament House**, **Supreme Court**, **Aiwan-e-Sadr**, **Serena Hotel**, **Jinnah Convention Centre**, and the **Diplomatic Enclave**.",
      highlights: [
        "Serena Hotel—stunning Swat/Mughal-inspired terracotta & courtyard architecture",
        "Pak-China Friendship Centre—art expos, book fairs, cultural festivals & concerts",
        "Jinnah Convention Centre & Constitution Ave monumental vistas",
        "Zero Point / Shakarparian & Lake View Park right around the southern bend",
      ],
      food: [
        "Zamana, Rakaposhi & Al-Maghreb at Serena Hotel (luxurious high-tea & dining)",
        "Quick jump across to G-6 Melody / Aabpara for budget street food",
      ],
      tips: "Keep original CNIC for Red Zone checkpoints! Pak-China Centre & Serena are accessible via Srinagar Hwy without entering restricted Secretariat blocks.",
    },
    {
      id: "G-6",
      letter: "G",
      number: 6,
      title: "Aabpara & Melody Food Park",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Islamabad's soulful 1960s pioneer sector! Unlike posh F-6, G-6 radiates nostalgic, lively working-city warmth—historic **Aabpara Market** (the capital's very first bazaar), **Melody Food Park**, and classic CDA quarters shaded by 60-year-old trees.",
      highlights: [
        "Aabpara Market—Islamabad's oldest bazaar for spices, fabrics, samosas & vintage bookstalls",
        "Melody Market & Melody Food Park—open-air evening food street staple",
        "Lal Masjid & nearby Islamabad Sports Complex / Liaquat Gymnasium",
        "Red Line Metrobus (7th Ave / Aabpara / Secretariat nearby) makes transit super easy!",
      ],
      food: [
        "Melody Food Park open-air BBQ, chapli kabab, burger & doodh-patti chai stalls",
        "Aabpara's famous samosa-chaat, Kashmiri chai & traditional bakeries",
      ],
      tips: "A must-explore for classic Islamabad soul! From H-11, take Srinagar Hwy east or hop on Orange Line → Red Line Metrobus.",
    },
    {
      id: "G-7",
      letter: "G",
      number: 7,
      title: "Sitara Market & Zero Point Hub",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Classic central Islamabad! Dense, lived-in low-rise CDA residential blocks framing busy **Sitara Market (G-7/2 Markaz)**, sitting right above Zero Point Interchange and Shakarparian.",
      highlights: [
        "Sitara Market—unpretentious neighborhood bazaar for tailors, hardware & cheap eats",
        "Immediate northern neighbor to Zero Point, Rose & Jasmine Garden & Lok Virsa",
        "Mature old trees and classic Doxiadis courtyard pedestrian lanes in G-7/1–4",
      ],
      food: [
        "Affordable desi tikkas, nihari, parathas & local tea spots in Sitara Market",
        "5 min south to Shakarparian food kiosks or north to F-7 Jinnah Super",
      ],
      tips: "Right on the Red Line Metrobus (PIMS / Zero Point / 7th Ave axis). Great stopover before visiting Shakarparian / Pakistan Monument!",
    },
    {
      id: "G-8",
      letter: "G",
      number: 8,
      title: "PIMS Hospital & G-8 Markaz",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Busy, practical mid-city heartbeat! Dominated in G-8/3 by **PIMS** (Islamabad's flagship public hospital), while **G-8 Markaz** pulses with medical labs, printing presses, computer shops, and beloved old-school sit-down restaurants.",
      highlights: [
        "PIMS Hospital & PIMS Metrobus Station (major Red/Green Line transit hub)",
        "G-8 Markaz—print shops, medical hubs, electronics & bustling local plazas",
        "Centaurus Mall sits literally across Jinnah Ave from G-8!",
      ],
      food: [
        "Tandoori Restaurant (G-8 Markaz)—classic Islamabad family Pakistani dining",
        "Busy 24-hour chai & paratha spots catering to hospital attendants & commuters",
      ],
      tips: "Expect heavy daytime traffic around PIMS. Super easy to reach via Srinagar Hwy → 9th Ave or Metrobus.",
    },
    {
      id: "G-9",
      letter: "G",
      number: 9,
      title: "Karachi Company Mega Bazaar",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Electric, crowded, affordable, and iconic! **Karachi Company (G-9 Markaz)** is Islamabad's most democratic shopping carnival—neon signs, bargained fabrics, phone repairs, street food aromas, and constant motion till midnight.",
      highlights: [
        "Karachi Company (G-9 Markaz)—best spot for budget clothes, shoes, jewelry & tech repairs",
        "Dense, friendly family blocks (G-9/1–4) with lively cricket-filled street parks",
        "Easy transit via Ibn-e-Sina / Peshawar Morr (Faiz Ahmed Faiz) Metro interchange",
      ],
      food: [
        "Legendary street food: crispy gol gappas, dahi bhallay, bun kababs & fresh sugarcane juice",
        "Affordable shawarma, tandoori BBQ & late-night tea stalls all around the Markaz",
      ],
      tips: "Just ~4.5 km NE of H-11! Take Orange Line straight to Faiz Ahmed Faiz (Peshawar Morr) or drive up 9th/10th Ave. Leave big SUVs at home—walking the bazaar is best!",
    },
    {
      id: "G-10",
      letter: "G",
      number: 10,
      title: "Madina Market & Kabuli Pulao Hub",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Lively, grounded, and a quiet foodie goldmine! **G-10 Markaz** blends thriving hardware/auto/computer shops with some of the finest authentic Afghan and Pashtun cuisine in Islamabad—right across Srinagar Highway from H-10/H-11!",
      highlights: [
        "G-10 Markaz (Madina / Mastung Market)—furniture, laptops, auto parts & bustling retail",
        "G-10 Orange Line Metrobus station right at the southern edge",
        "Walkable community parks & vibrant student/family apartment crowds",
      ],
      food: [
        "Famous Afghan Kabuli Pulao, mutton rosh, mantu & chappal kabab joints",
        "Lively local bakeries, shawarma corners & classic Pathan chai hotels",
      ],
      tips: "Right in your backyard (~3.5 km from H-11)! Awesome casual dinner roll when you want phenomenal Kabuli Pulao without driving across town.",
    },
    {
      id: "G-11",
      letter: "G",
      number: 11,
      title: "Your Neighbor Across Srinagar Hwy",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Your closest full-service residential & cafe neighbor right across Srinagar Highway! Polished, youthful, and booming with cozy specialty coffee shops, study-friendly cafes, gyms, and grocery superstores catering to FAST/NUST/IIUI crowds and young families.",
      highlights: [
        "G-11 Markaz—modern cafes, bakeries, barbers, salons & supermarkets",
        "I&T Centre G-11—auto services, workshops & tech showrooms",
        "Direct bridge/station link via H-11 / G-11 Orange Line Metrobus stop",
      ],
      food: [
        "Specialty third-wave coffee shops, waffle/dessert cafes & study nooks",
        "Casual burger joints, desi restaurants & popular bakeries open late",
      ],
      tips: "Literally ~2.5 km north of H-11! Great for everyday errands, late-night coffee, or meeting friends right next door.",
    },
    {
      id: "G-12",
      letter: "G",
      number: 12,
      title: "Unacquired Inner-City Enclave",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Islamabad's famous urban anomaly—an unacquired, largely rural village pocket (Mehrabadi/Golra fringe) surrounded completely by slick paved sectors G-11, G-13, F-11, and Srinagar Highway!",
      highlights: [
        "Surrounded by major Orange Line NUST / G-12 stations along Srinagar Highway",
        "Stark rural-urban contrast right in the middle of the capital grid",
      ],
      food: ["Small village shops only; head 3 min east to G-11 Markaz or west to G-13."],
      tips: "Not a commercial/leisure sector—stick to Srinagar Highway or hop to G-11 / G-13.",
    },
    {
      id: "G-13",
      letter: "G",
      number: 13,
      title: "TELECHS & Student/Family Hub",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Dense, energetic, and fast-growing! Developed largely via TELECHS & FGEHA, G-13 is packed with modern multi-story homes, student hostels, affordable restaurants, and bustling commercial plazas hugging Srinagar Highway.",
      highlights: [
        "G-13/1 & G-13/4 commercial zones—supermarkets, pharmacies, clinics & gyms",
        "Golra Mor Orange Line Metrobus Station at its southern highway corner",
        "Strong NUST/IIUI/FAST student & young-family community energy",
      ],
      food: [
        "Packed with value-for-money desi karahi spots, biryani houses & paratha dhabas",
        "Growing number of cozy cafes & bakeries along the main markaz lanes",
      ],
      tips: "Super easy ~5 km ride west down Srinagar Highway from H-11! Great for affordable dining and quick groceries.",
    },
    {
      id: "G-14",
      letter: "G",
      number: 14,
      title: "FGEHA Residential Grid",
      category: "developing",
      status: "Rapidly Developing",
      hangoutScore: 2,
      vibe: "Quiet, clean-grid residential sector developed by FGEHA (G-14/4 is the most lively and settled!). Freshly built homes, neighborhood mosques, and calm streets away from downtown rush.",
      highlights: [
        "Well-settled G-14/4 residential blocks and clean wide streets",
        "Quick access to Srinagar Highway & GT Road (26 No. Chungi)",
      ],
      food: ["Small Class-III neighborhood bakeries & dhabas in G-14/4; larger options in G-13 or G-15."],
      tips: "Peaceful suburban ride ~7 km west of H-11 along Srinagar Highway.",
    },
    {
      id: "G-15",
      letter: "G",
      number: 15,
      title: "J&K Cooperative & Motorway Link",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Thriving, densely populated western residential hub (Jammu & Kashmir Cooperative Housing Society) sitting right beside Srinagar Highway and the M-1/M-2 Motorway entry! Self-contained markets and lively family streets.",
      highlights: [
        "J&K Society / G-15 Markaz—active supermarkets, banks & family parks",
        "Jammu & Kashmir / G-15 Orange Line Metrobus station right at the highway",
        "Final bustling urban hub before Islamabad International Airport & M-1/M-2 Toll Plaza",
      ],
      food: [
        "Busy neighborhood BBQ, pizza, bakeries & karahi restaurants in G-15 Markaz",
        "Highway chai & breakfast spots near 26 No. Chungi / M-1 link",
      ],
      tips: "Easy ~9–10 km straight shot west from H-11 via Srinagar Highway (or Orange Line Metro!).",
    },
    {
      id: "G-16",
      letter: "G",
      number: 16,
      title: "Badhana Kalan / Highway Edge",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Transitional western corridor along Srinagar Highway featuring the Badhana Kalan Orange Line station, pockets of cooperative development, and semi-rural landscapes.",
      highlights: [
        "Badhana Kalan / G-16 Orange Line Metrobus Station",
        "Wide highway vista toward the Airport & M-1/M-2 Interchange",
      ],
      food: ["Roadside tea stalls; head back east to G-15 for restaurants."],
      tips: "More of a transit corridor than a destination.",
    },
    {
      id: "G-17",
      letter: "G",
      number: 17,
      title: "Paradise City / Fateh Jhang Border",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Westernmost edge of the G-band meeting Fateh Jhang Road & Tarnol. Mix of private housing pockets (Paradise City), open plots, and highway transit traffic.",
      highlights: [
        "Proximity to M-1 / M-2 Motorway Interchange & Islamabad Airport highway",
      ],
      food: ["Highway truck/traveler dhabas along GT / Fateh Jhang Rd."],
      tips: "Verify private society routes if visiting specific blocks.",
    },

    // ======================== H SERIES ========================
    {
      id: "H-8",
      letter: "H",
      number: 8,
      title: "Universities, Shifa & Central Cemetery",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Islamabad's monumental education, healthcare, and memorial hub! Green avenues packed with major universities (**AIOU**, **SZABIST**, **Riphah**), elite schools, **Shifa International Hospital**, **FBISE**, and the peaceful tree-canopied **H-8 Graveyard**.",
      highlights: [
        "Allama Iqbal Open University (AIOU) Main Campus & SZABIST Islamabad",
        "Shifa International Hospital (H-8/4 edge along Pitras Bukhari Rd)",
        "FBISE Headquarters & major international school campuses",
        "H-8 Graveyard—serene, tree-shaded historic cemetery spanning H-8/3",
      ],
      food: [
        "University/hospital-side cafes, bakeries & quick snacks along Pitras Bukhari Rd",
        "Just across 9th Ave / I-8 border from I-8 Markaz's top bakeries & coffee bars!",
      ],
      tips: "Heavy morning/afternoon school & university traffic around 8 AM and 2 PM. Hop across Pitras Bukhari Rd to I-8 Markaz for great food.",
    },
    {
      id: "H-9",
      letter: "H",
      number: 9,
      title: "Itwar Bazaar, NUML & HEC",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Half calm language university & higher-ed campus (**NUML** & **HEC**), half Islamabad's most legendary chaotic treasure hunt: the **H-9 Itwar Bazaar (Sunday Bazaar)** right beside Peshawar Morr!",
      highlights: [
        "H-9 Itwar Bazaar (open Sun, Tue & Fri!)—huge flea market for thrift jackets, rugs, produce, books & street snacks",
        "NUML (National University of Modern Languages) sprawling main campus",
        "Higher Education Commission (HEC) HQ & Pakistan Bait-ul-Mal",
        "Right next to Faiz Ahmed Faiz (Peshawar Morr) Metrobus Hub",
      ],
      food: [
        "Itwar Bazaar fresh jalebi, pakoras, fruit chaat, corn & chai stalls on market days!",
        "NUML food court & nearby G-9 Karachi Company street food across Srinagar Hwy",
      ],
      tips: "ONLY ~3.5 km from H-11! Visit on **Sunday, Tuesday, or Friday** morning/afternoon for the Itwar Bazaar—bring cash, comfy shoes, and bargaining energy!",
    },
    {
      id: "H-10",
      letter: "H",
      number: 10,
      title: "IIUI Grand Campus",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Your immediate eastern neighbor! Almost the entire sector is the vast, lush, modernist campus of **International Islamic University Islamabad (IIUI)**—grand white monumental buildings echoing Faisal Mosque, wide shaded paths, and international student life.",
      highlights: [
        "IIUI Central Mosque & iconic modernist academic blocks",
        "Sprawling green lawns, cricket ovals & international student hostels",
        "G-10 Orange Line Metrobus station right on its northern highway flank",
      ],
      food: [
        "Campus canteens & central cafeterias; step across Srinagar Hwy into G-10 Markaz for Kabuli Pulao!",
      ],
      tips: "Literally next door to H-11! Note that university main gates check student/visitor IDs and separate male/female campus zones.",
    },
    {
      id: "H-11",
      letter: "H",
      number: 11,
      title: "FAST-NUCES, Police Lines & Hospitals",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "A unique institutional anchor combining **FAST-NUCES** tech-student energy in H-11/4, **ICT Police Lines HQ & National Police Academy**, **PAEC / NESCOM General Hospital**, and Islamabad's vast **Central Municipal Cemetery**, linked seamlessly by Srinagar Highway & the Orange Line.",
      highlights: [
        "FAST-NUCES (H-11/4)—top CS/engineering campus, coding culture & sports grounds",
        "ICT Police Lines HQ & National Police Academy training grounds",
        "PAEC / NESCOM General Hospital & Islamabad Medical Complex",
        "H-11 / G-11 Orange Line Metrobus Station—instant airport or Peshawar Morr transit!",
      ],
      food: [
        "FAST-NUCES campus cafe & nearby dhaba/roll spots around H-11/4",
        "2-minute hop across Srinagar Hwy to G-11 Markaz or G-10 Markaz for full restaurants!",
      ],
      tips: "Primarily institutional—campus/police zones check IDs. Pair a visit with G-11 Markaz or G-10 Kabuli Pulao right across Srinagar Highway.",
    },
    {
      id: "H-12",
      letter: "H",
      number: 12,
      title: "NUST Mini-City & Science Park",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "A literal 700-acre green city-within-a-city right next door to H-11! **NUST Main Campus** and **NSTP (National Science & Technology Park)** feel calm, walkable, tree-filled, and collegiate, complete with artificial lakes and bike-friendly roads.",
      highlights: [
        "NUST Main Campus—gorgeous red-brick/stone schools (SEECS, SMME, SCEE, NBS, SADA)",
        "National Science & Technology Park (NSTP)—Pakistan's flagship tech innovation hub",
        "NUST Lake, Concordia student hubs, sports complexes & cycling paths",
        "NUST East & West Orange Line Metrobus stations right outside on Srinagar Hwy",
      ],
      food: [
        "Concordia 1 & 2, Retro, Coffee Lounge & NSTP cafes inside campus (student-friendly prices!)",
      ],
      tips: "Immediate western neighbor of H-11! Gate entry requires a NUST card, NSTP visitor registration, or a student/faculty host with original CNIC.",
    },
    {
      id: "H-13",
      letter: "H",
      number: 13,
      title: "NUST Student Town & Chai Dhabas",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 3,
      vibe: "Raw, bustling, un-manicured, and bursting with 20-something energy! Sitting right outside NUST H-12, H-13 evolved organically into a dense maze of private student hostels, apartment towers, 24/7 chai dhabas, and photocopy/fast-food shops.",
      highlights: [
        "Bustling student-hostel high-street right opposite NUST Gate 2 / Gate 10",
        "True non-CDA organic street energy—colorful, chaotic & affordable",
      ],
      food: [
        "Late-night Pathan chai & anda-paratha dhabas (open well past 2 AM!)",
        "Ultra-budget student biryani, shawarma, loaded fries & grill spots",
      ],
      tips: "Just ~4 km west of H-11! Expect narrow bumpy lanes and lively late-night student crowds—great for cheap midnight chai.",
    },
    {
      id: "H-14",
      letter: "H",
      number: 14,
      title: "Reserved Institutional Horizon",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Undeveloped institutional reserve south of Srinagar Highway and west of H-13. Quiet rolling grassland and sparse dirt paths—zero buildings or cafés.",
      highlights: [
        "Wide open views toward the airport highway and Margalla horizon",
      ],
      food: ["None—closest chai is back in H-13 or across in G-14."],
      tips: "Unbuilt master-plan reserve.",
    },
    {
      id: "H-15",
      letter: "H",
      number: 15,
      title: "Western Institutional Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Open Potohar land along the outer western H-band south of G-15. Completely undeveloped institutional zone.",
      highlights: ["Open skies along the western Srinagar Hwy / airport corridor"],
      food: ["None."],
      tips: "Not developed yet—visit neighboring G-15 across the highway instead.",
    },
    {
      id: "H-16",
      letter: "H",
      number: 16,
      title: "Outer H-Band Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Far-western edge of the H-series near Motorway M-1/M-2 corridor. Raw undeveloped terrain.",
      highlights: ["Western edge bordering the Airport / Motorway approach"],
      food: ["None."],
      tips: "Undeveloped future-reserve land.",
    },

    // ======================== I SERIES ========================
    {
      id: "I-8",
      letter: "I",
      number: 8,
      title: "I-8 Markaz · Dessert & Cafe Magnet",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "The glamorous anomaly of the I-band! While I-9 through I-11 are industrial/wholesale, **I-8** is affluent, impeccably planned, leafy, and boasts **I-8 Markaz**—one of the twin cities' hottest evening dessert, coffee, and food hubs!",
      highlights: [
        "I-8 Markaz—buzzing plazas, branded fashion, gaming zones (Game Inn) & rooftop lounges",
        "Adjacent to Shifa International Hospital (across Pitras Bukhari Rd) & Faizabad",
        "Instant link to Islamabad Expressway & Murree Rd / Rawalpindi",
      ],
      food: [
        "Layers Bakeshop, Tehzeeb/crust bakeries & trendy dessert/waffle parlors",
        "Specialty coffee cafes, burger houses, Habibi / shinwari & Thai/continental spots",
      ],
      tips: "Easy ~8.5 km east from H-11 via Srinagar Hwy → 9th Ave/Expressway or IJP Rd! Evening parking at I-8 Markaz is tight—worth every minute for dessert/coffee!",
    },
    {
      id: "I-9",
      letter: "I",
      number: 9,
      title: "Industrial Estate & Rugged Dhabas",
      category: "industrial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Islamabad's gritty, hardworking engine room! Factories, pharma/engineering plants, logistics warehouses, and **Islamabad Dry Port** sit alongside residential sub-sectors and **I-9 Markaz (Potohar Market)**.",
      highlights: [
        "I-9 Industrial Area & Islamabad Dry Port (rare industrial glimpse of Islamabad!)",
        "I-9 Markaz / Potohar Market—hardware, auto workshops & no-nonsense trade shops",
        "Flanked directly by 9th Avenue & IJP Road",
      ],
      food: [
        "Authentic working-man's truck-style dhabas: sizzling mutton karahi, chana, fresh naan & kadak chai!",
        "Great affordable lunch spots in I-9 Markaz",
      ],
      tips: "Only ~6 km east of H-11 via IJP Rd or 9th Ave! Go at lunchtime for unapologetically authentic dhaba karahi—not a sleek latte zone.",
    },
    {
      id: "I-10",
      letter: "I",
      number: 10,
      title: "Auto Markets, Hardware & Bustling Streets",
      category: "industrial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Lively, dense, practical, and loud in the best way! Mixing bustling residential blocks (I-10/1–4) with one of the twin cities' biggest auto-parts, mechanic, and hardware hubs in **I-10 Markaz** right above IJP Road.",
      highlights: [
        "I-10 Markaz—everything for cars, bikes, tools, electronics & economical fashion",
        "I-10/4 proximity toward Faiz Ahmed Faiz / IJP Road interchange",
        "Lively community parks & dense old-school Islamabad/Pindi border culture",
      ],
      food: [
        "Phenomenal affordable street food: bun kababs, nihari, tikka-boti & legendary samosas",
        "Busy local bakeries & late-night chai stalls",
      ],
      tips: "Literally ~4–5 km SE of H-11 right down Faqir Aipee / IJP Rd! Best place to fix anything on your car/bike and grab cheap tasty street food.",
    },
    {
      id: "I-11",
      letter: "I",
      number: 11,
      title: "Sabzi Mandi & Railway Carriage Works",
      category: "industrial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Islamabad's chaotic, colorful wholesale belly—literally right south of H-11! Home to the gigantic **Sabzi Mandi (Wholesale Fruit & Veg Market)** and the **Pakistan Railways Carriage Factory**, pulsing with trucks, crates, and dawn auctions.",
      highlights: [
        "Islamabad Sabzi Mandi—mountains of fresh mangoes, cherries, peaches & veggies at wholesale prices",
        "Pakistan Railways Carriage Factory & industrial depots",
        "Immediate southern neighbor to H-11 across IJP / Service Rd",
      ],
      food: [
        "Dawn-hour market chai, hot halwa-puri, chana & fresh seasonal fruit right off the crates!",
      ],
      tips: "Your immediate southern neighbor! For a genuinely wild local experience, visit Sabzi Mandi between **6:00 AM – 9:00 AM**—skip midday truck congestion.",
    },
    {
      id: "I-12",
      letter: "I",
      number: 12,
      title: "Carriage Factory Border & CDA Plots",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 1,
      vibe: "Slow-developing residential/industrial plot zone sitting south of NUST H-12 and west of Sabzi Mandi. Sparse houses, cleared plots, and ongoing infrastructure rollout.",
      highlights: [
        "Adjoins the Railway Carriage Factory corridor and NUST southern edge",
      ],
      food: ["Minimal tuck-shops; head north to H-13 or east to I-11/I-10."],
      tips: "Low-density developing plot zone—not an active market hub yet.",
    },
    {
      id: "I-13",
      letter: "I",
      number: 13,
      title: "IJP Western Fringe",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Semi-rural southern fringe west of I-12 along the IJP Road extension toward Rawalpindi's Pirwadhai/Chaklala side. Sparse houses and local trade yards.",
      highlights: ["Southern border roads connecting into western Rawalpindi"],
      food: ["Basic roadside tea stalls along the main link road."],
      tips: "Mainly transit/outer border terrain.",
    },
    {
      id: "I-14",
      letter: "I",
      number: 14,
      title: "Affordable CDA Housing Growth",
      category: "developing",
      status: "Rapidly Developing",
      hangoutScore: 2,
      vibe: "One of Islamabad's fast-rising affordable CDA residential sectors! Rows of newly built compact family houses, clean local streets, and quiet neighborhood shops along the Rawalpindi border.",
      highlights: [
        "Substantial newly inhabited residential blocks (I-14/1–4)",
        "Wide unobstructed southern views across Potohar hills & Rawalpindi",
      ],
      food: ["Growing local bakeries, biryani shops & neighborhood dhabas."],
      tips: "About 7–8 km SW of H-11 via IJP / Girja link roads—quiet suburban exploration.",
    },
    {
      id: "I-15",
      letter: "I",
      number: 15,
      title: "CDA Low-Cost Apartments & Revival",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "Freshly revived CDA affordable housing & apartment sector! Active road paving, drainage, and rising multi-family apartment blocks marking Islamabad's southern growth.",
      highlights: [
        "Large-scale CDA residential & apartment project footprint",
        "Emerging arterial roads linking I-14 and I-16",
      ],
      food: ["Very sparse right now—nearest active market is I-14 or GT Road side."],
      tips: "Active development site; interesting to see new CDA housing coming up.",
    },
    {
      id: "I-16",
      letter: "I",
      number: 16,
      title: "Southern Frontier & Ring Road Link",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "The southernmost developing CDA residential frontier! Quiet, windy open plateaus near the Rawalpindi Ring Road & Thalian/M-2 Motorway corridor with steadily growing construction.",
      highlights: [
        "Direct proximity to M-2 Motorway (Thalian) & Ring Road alignment",
        "Quiet breezy Potohar vistas far away from inner-city traffic",
      ],
      food: ["Minimal local convenience stalls; carry snacks if exploring."],
      tips: "Far SW corner (~11–13 km from H-11). Worth seeing only if checking the outer Motorway-side frontier.",
    },
    {
      id: "I-17",
      letter: "I",
      number: 17,
      title: "SW Industrial / Institutional Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Outer southwestern limit of Zone I near the Motorway M-2. Designated on the master plan for future industrial/institutional plots; currently quiet open Potohar land.",
      highlights: ["Open countryside flanking the M-2 Motorway corridor"],
      food: ["None."],
      tips: "Undeveloped master-plan boundary zone.",
    },
  ];

  // Enrich every sector with computed grid coordinates, polygons, and neighbor lookup
  const sectorMap = {};
  const SECTORS = RAW_SECTORS.map((s) => {
    const r = ROW_INDEX[s.letter];
    const c = s.number;
    const center = s.coords ? s.coords : gridToLatLng(r, c);
    const polygon = sectorPolygonLatLng(s.letter, s.number, s.coords || null);
    const enriched = {
      ...s,
      rowIdx: r,
      colIdx: c,
      lat: center.lat,
      lng: center.lng,
      polygon,
      tier: STATUS_META[s.status]?.tier || "active",
    };
    sectorMap[s.id] = enriched;
    return enriched;
  });

  // Major real-world landmarks for map orientation (with clean label offsets)
  const LANDMARKS = [
    { id: "faisal-mosque", name: "Faisal Mosque", lat: 33.72972, lng: 73.03722, icon: "mosque", sector: "E-8", dx: -6, dy: -7, anchor: "end" },
    { id: "centaurus", name: "Centaurus", lat: 33.70789, lng: 73.04987, icon: "mall", sector: "F-8", dx: 5, dy: 8, anchor: "start" },
    { id: "pakistan-monument", name: "Pakistan Monument", lat: 33.69345, lng: 73.06831, icon: "monument", sector: "G-7", dx: 6, dy: 10, anchor: "start" },
    { id: "zero-point", name: "Zero Point", lat: 33.6942, lng: 73.0652, icon: "node", sector: "G-7", dx: -6, dy: -6, anchor: "end" },
    { id: "faizabad", name: "Faizabad", lat: 33.6632, lng: 73.0842, icon: "node", sector: "I-8", dx: 6, dy: 4, anchor: "start" },
    { id: "golra-museum", name: "Golra Museum", lat: 33.6945, lng: 72.9765, icon: "heritage", sector: "E-11", dx: -6, dy: 12, anchor: "end" },
    { id: "shah-allah-ditta", name: "Shah Allah Ditta Caves", lat: 33.7192, lng: 72.9185, icon: "heritage", sector: "D-12", dx: 6, dy: -5, anchor: "start" },
    { id: "daman-e-koh", name: "Daman-e-Koh", lat: 33.749, lng: 73.054, icon: "view", sector: "E-6", dx: -6, dy: -5, anchor: "end" },
    { id: "saidpur", name: "Saidpur Village", lat: 33.748, lng: 73.071, icon: "heritage", sector: "E-6", dx: 6, dy: -5, anchor: "start" },
    { id: "nust-gate", name: "NUST", lat: 33.6452, lng: 72.9809, icon: "campus", sector: "H-12", dx: -6, dy: 13, anchor: "end" },
    { id: "fast-nuc", name: "FAST", lat: 33.65646, lng: 73.01645, icon: "campus", sector: "H-11", dx: 6, dy: 11, anchor: "start" },
    { id: "serena", name: "Serena / Red Zone", lat: 33.7136, lng: 73.1008, icon: "govt", sector: "G-5", dx: 6, dy: 6, anchor: "start" },
  ];

  // Key arterial corridors plotted using (r, c) grid coordinates or explicit lat/lng
  function rcLine(points) {
    return points.map(([r, c]) => gridToLatLng(r, c));
  }

  const CORRIDORS = [
    {
      id: "srinagar",
      name: "Srinagar Highway (Orange Line)",
      kind: "highway",
      points: [
        ...rcLine([[4.5, 4.4], [4.5, 16.5]]),
        { lat: 33.628, lng: 72.885 },
      ],
    },
    {
      id: "jinnah-ave",
      name: "Jinnah Avenue / Blue Area",
      kind: "avenue",
      points: rcLine([[3.5, 4.4], [3.5, 11.6]]),
    },
    {
      id: "margalla-rd",
      name: "Khayaban-e-Iqbal (Margalla Rd)",
      kind: "avenue",
      points: rcLine([[2.5, 4.4], [2.5, 11.8]]),
    },
    {
      id: "margalla-ave",
      name: "Margalla Avenue",
      kind: "avenue",
      points: [
        ...rcLine([[1.5, 11.5], [0.5, 12.6], [-0.45, 16.4]]),
        { lat: 33.694, lng: 72.835 },
      ],
    },
    {
      id: "ijp-rd",
      name: "IJP Road (Rawalpindi Border)",
      kind: "highway",
      points: rcLine([[6.5, 7.2], [6.5, 14.5]]),
    },
    {
      id: "expressway",
      name: "Islamabad Expressway",
      kind: "highway",
      points: [
        gridToLatLng(4.5, 7.5),
        gridToLatLng(6.5, 7.42),
        { lat: 33.635, lng: 73.102 },
      ],
    },
    {
      id: "faisal-ave",
      name: "Faisal Avenue",
      kind: "avenue",
      points: rcLine([[1.8, 7.5], [4.5, 7.5]]),
    },
    {
      id: "7th-ave",
      name: "7th Avenue",
      kind: "avenue",
      points: rcLine([[2.5, 6.5], [4.5, 6.5]]),
    },
    {
      id: "9th-ave",
      name: "9th Avenue",
      kind: "avenue",
      points: rcLine([[2.5, 8.5], [6.5, 8.5]]),
    },
    {
      id: "10th-ave",
      name: "10th Avenue",
      kind: "avenue",
      points: rcLine([[2.5, 9.5], [6.5, 9.5]]),
    },
    {
      id: "11th-ave",
      name: "11th Avenue / Golra Rd",
      kind: "avenue",
      points: rcLine([[1.5, 10.5], [6.5, 10.5]]),
    },
    {
      id: "gt-road",
      name: "GT Road (N-5)",
      kind: "highway",
      points: [
        { lat: 33.615, lng: 72.928 },
        { lat: 33.642, lng: 72.900 },
        { lat: 33.671, lng: 72.842 },
        { lat: 33.694, lng: 72.802 },
      ],
    },
  ];

  // Metrobus Network: Orange Line (Srinagar Hwy) + Red Line (Pak Secretariat -> Peshawar Morr -> Faizabad)
  const INTERCHANGE_FAF = {
    id: "faf-interchange",
    name: "Faiz Ahmed Faiz (Peshawar Morr)",
    lat: 33.6788,
    lng: 73.0448,
    interchange: true,
    serves: ["H-9", "G-9", "H-8", "G-8"],
  };

  const ORANGE_LINE_STOPS = [
    { ...INTERCHANGE_FAF, line: "orange", lines: ["orange", "red"] },
    { id: "nha", name: "NHA Station", lat: 33.6730, lng: 73.0332, line: "orange", lines: ["orange"], serves: ["G-9", "H-9"] },
    { id: "g10-iiui", name: "G-10 / IIUI", lat: 33.6682, lng: 73.0218, line: "orange", lines: ["orange"], serves: ["G-10", "H-10"] },
    { id: "police-foundation", name: "Police Foundation", lat: 33.6648, lng: 73.0124, line: "orange", lines: ["orange"], serves: ["G-10", "H-10", "H-11"] },
    { id: "h11-g11", name: "H-11 / G-11", lat: 33.6626, lng: 73.0022, line: "orange", lines: ["orange"], serves: ["H-11", "G-11"] },
    { id: "nust-east", name: "NUST / G-12 (East)", lat: 33.6572, lng: 72.9905, line: "orange", lines: ["orange"], serves: ["H-12", "G-12"] },
    { id: "nust-west", name: "NUST / G-12 (West)", lat: 33.6520, lng: 72.9788, line: "orange", lines: ["orange"], serves: ["H-12", "G-12", "H-13"] },
    { id: "golra-mor", name: "Golra Mor / G-13", lat: 33.6462, lng: 72.9635, line: "orange", lines: ["orange"], serves: ["G-13", "H-13"] },
    { id: "jk-g15", name: "J&K / G-15", lat: 33.6335, lng: 72.9282, line: "orange", lines: ["orange"], serves: ["G-15"] },
    { id: "badhana-g16", name: "Badhana Kalan / G-16 (N-5)", lat: 33.6210, lng: 72.9115, line: "orange", lines: ["orange"], serves: ["G-16"] },
  ];

  const RED_LINE_STOPS = [
    { id: "pak-secretariat", name: "Pak Secretariat", ...gridToLatLng(3.52, 5.15), line: "red", lines: ["red"], serves: ["F-5", "G-5"] },
    { id: "parade-ground", name: "Parade Ground", ...gridToLatLng(3.50, 5.75), line: "red", lines: ["red"], serves: ["F-6", "G-6"] },
    { id: "shaheed-e-millat", name: "Shaheed-e-Millat", ...gridToLatLng(3.50, 6.22), line: "red", lines: ["red"], serves: ["F-6", "G-6"] },
    { id: "7th-avenue", name: "7th Avenue", ...gridToLatLng(3.50, 6.60), line: "red", lines: ["red"], serves: ["F-6", "G-6", "F-7", "G-7"] },
    { id: "stock-exchange", name: "Stock Exchange (Blue Area)", ...gridToLatLng(3.50, 7.12), line: "red", lines: ["red"], serves: ["F-7", "G-7"] },
    { id: "pims", name: "PIMS Station (Centaurus / G-8)", ...gridToLatLng(3.62, 7.65), line: "red", lines: ["red"], serves: ["G-8", "F-8"] },
    { id: "kachehry", name: "Kachehry", ...gridToLatLng(3.82, 8.28), line: "red", lines: ["red"], serves: ["G-8", "F-8"] },
    { id: "ibn-e-sina", name: "Ibn-e-Sina", ...gridToLatLng(4.12, 8.50), line: "red", lines: ["red"], serves: ["G-8", "G-9"] },
    { id: "chaman", name: "Chaman", ...gridToLatLng(4.36, 8.50), line: "red", lines: ["red"], serves: ["G-9", "G-8"] },
    { id: "kashmir-hwy", name: "Kashmir Highway (Peshawar Morr N)", ...gridToLatLng(4.55, 8.55), line: "red", lines: ["red"], serves: ["G-9", "G-8", "H-9", "H-8"] },
    { ...INTERCHANGE_FAF, line: "red", lines: ["orange", "red"] },
    { id: "khayaban-e-johar", name: "Khayaban-e-Johar", ...gridToLatLng(5.28, 8.50), line: "red", lines: ["red"], serves: ["H-8", "H-9"] },
    { id: "potohar", name: "Potohar", ...gridToLatLng(5.88, 8.50), line: "red", lines: ["red"], serves: ["I-8", "I-9"] },
    { id: "ijp-road", name: "IJP Road", ...gridToLatLng(6.48, 8.42), line: "red", lines: ["red"], serves: ["I-8", "I-9"] },
    { id: "faizabad", name: "Faizabad (Expressway Interchange)", lat: 33.6632, lng: 73.0842, line: "red", lines: ["red"], serves: ["I-8"] },
  ];

  const METRO_LINES = [
    {
      id: "orange",
      name: "Orange Line Metrobus",
      shortName: "Orange Line",
      color: "#fb923c",
      corridorLabel: "Peshawar Morr ↔ G-16 / Airport Link",
      stops: ORANGE_LINE_STOPS,
    },
    {
      id: "red",
      name: "Red Line Metrobus",
      shortName: "Red Line",
      color: "#f43f5e",
      corridorLabel: "Pak Secretariat ↔ Peshawar Morr ↔ Faizabad",
      stops: RED_LINE_STOPS,
    },
  ];

  // Deduplicated station list (merges interchange stations once)
  const metroStopById = {};
  const METRO_STOPS = [];
  METRO_LINES.forEach((lineObj) => {
    lineObj.stops.forEach((st) => {
      if (!metroStopById[st.id]) {
        const clone = { ...st, lines: [...st.lines], serves: [...st.serves] };
        metroStopById[st.id] = clone;
        METRO_STOPS.push(clone);
      }
    });
  });

  function findNearestMetro(lat, lng) {
    let bestStop = METRO_STOPS[0];
    let bestDist = Infinity;
    for (const stop of METRO_STOPS) {
      const d = haversineKm(lat, lng, stop.lat, stop.lng);
      if (d < bestDist) {
        bestDist = d;
        bestStop = stop;
      }
    }
    return {
      ...bestStop,
      distKm: +bestDist.toFixed(2),
    };
  }

  // Enrich every sector with Metro Line accessibility & nearest Metro station telemetry
  SECTORS.forEach((sec) => {
    const servingStops = METRO_STOPS.filter((st) => Array.isArray(st.serves) && st.serves.includes(sec.id));
    const linesSet = new Set();
    servingStops.forEach((st) => st.lines.forEach((ln) => linesSet.add(ln)));
    sec.metroServed = servingStops.length > 0;
    sec.metroLines = Array.from(linesSet);
    sec.nearestMetro = findNearestMetro(sec.lat, sec.lng);
  });

  // Margalla Hills topographic ridge polygons (stylized real-world foothill band)
  const MARGALLA_RIDGES = [
    [
      { lat: 33.775, lng: 72.815 },
      { lat: 33.765, lng: 72.885 },
      { lat: 33.752, lng: 72.935 },
      { lat: 33.748, lng: 72.992 },
      { lat: 33.752, lng: 73.045 },
      { lat: 33.762, lng: 73.095 },
      { lat: 33.775, lng: 73.145 },
      { lat: 33.798, lng: 73.145 },
      { lat: 33.798, lng: 72.815 },
    ],
    [
      { lat: 33.758, lng: 72.825 },
      { lat: 33.746, lng: 72.890 },
      { lat: 33.732, lng: 72.940 },
      { lat: 33.730, lng: 72.998 },
      { lat: 33.737, lng: 73.052 },
      { lat: 33.748, lng: 73.105 },
      { lat: 33.758, lng: 73.142 },
      { lat: 33.778, lng: 73.142 },
      { lat: 33.778, lng: 72.825 },
    ],
    [
      { lat: 33.742, lng: 72.832 },
      { lat: 33.729, lng: 72.896 },
      { lat: 33.715, lng: 72.948 },
      { lat: 33.716, lng: 73.005 },
      { lat: 33.727, lng: 73.058 },
      { lat: 33.738, lng: 73.112 },
      { lat: 33.748, lng: 73.138 },
      { lat: 33.762, lng: 73.138 },
      { lat: 33.762, lng: 72.832 },
    ],
  ];

  // Rawal Lake western shore silhouette on the right edge
  const RAWAL_LAKE = [
    { lat: 33.712, lng: 73.118 },
    { lat: 33.716, lng: 73.135 },
    { lat: 33.710, lng: 73.148 },
    { lat: 33.694, lng: 73.148 },
    { lat: 33.688, lng: 73.132 },
    { lat: 33.695, lng: 73.117 },
  ];

  // Shakarparian green zone polygon south of Zero Point
  const SHAKARPARIAN = [
    gridToLatLng(4.52, 6.45),
    gridToLatLng(4.52, 7.45),
    gridToLatLng(5.48, 7.35),
    gridToLatLng(5.48, 6.35),
  ];

  // Offset coordinates cleanly along Doxiadis grid axes around any sector
  function offsetLatLng(sec, dr, dc) {
    if (sec.coords) {
      return {
        lat: +(sec.coords.lat + GRID_AFFINE.a1 * dr + GRID_AFFINE.a2 * dc).toFixed(5),
        lng: +(sec.coords.lng + GRID_AFFINE.b1 * dr + GRID_AFFINE.b2 * dc).toFixed(5),
      };
    }
    return gridToLatLng(sec.rowIdx + dr, sec.colIdx + dc);
  }

  // Bespoke precision sub-location builders & landmark enrichments per sector
  function getCustomSpotsOverride(sec) {
    if (sec.id === "H-11") {
      return [
        {
          id: "h11-4-fast",
          label: "H-11/4 · FAST-NUCES",
          shortLabel: "H-11/4 (FAST)",
          lat: 33.65646,
          lng: 73.01645,
          note: "FAST-NUCES Islamabad Campus on A.K. Brohi Rd in eastern H-11/4",
        },
        {
          id: "h11-4",
          label: "H-11/4 · NESCOM / PAEC (SE)",
          shortLabel: "H-11/4",
          ...offsetLatLng(sec, 0.22, -0.22),
          note: "South-east H-11/4 around NESCOM & PAEC General Hospital",
        },
        {
          id: "h11-center",
          label: "H-11 Center (Mid-Sector)",
          shortLabel: "H-11",
          lat: sec.lat,
          lng: sec.lng,
          note: "Geographic center of Sector H-11",
        },
        {
          id: "h11-1",
          label: "H-11/1 · Police Lines HQ (SW)",
          shortLabel: "H-11/1",
          lat: 33.6515,
          lng: 73.0032,
          note: "ICT Police Lines HQ & National Police Academy enclave in H-11/1",
        },
        {
          id: "h11-2-metro",
          label: "H-11/2 · Metro Station (NW)",
          shortLabel: "H-11/2 (Metro)",
          lat: 33.6626,
          lng: 73.0022,
          note: "H-11 / G-11 Orange Line Metrobus stop along Srinagar Highway",
        },
        {
          id: "h11-3",
          label: "H-11/3 · Srinagar Hwy Edge (NE)",
          shortLabel: "H-11/3",
          ...offsetLatLng(sec, -0.22, -0.22),
          note: "North-east H-11/3 bordering Srinagar Hwy Service Rd & H-10",
        },
      ];
    }

    if (sec.id === "B-17") {
      return [
        {
          id: "b17-block-b",
          label: "B-17 · Block B Markaz (Center)",
          shortLabel: "B-17 Block B",
          lat: sec.lat,
          lng: sec.lng,
          note: "Main commercial Markaz in Multi Gardens Block B",
        },
        {
          id: "b17-block-a",
          label: "B-17 · Block A (GT Rd East Gate)",
          shortLabel: "B-17 Block A",
          ...offsetLatLng(sec, 0.04, -0.32),
          note: "Eastern Multi Gardens gateway connecting out to GT Road (N-5)",
        },
        {
          id: "b17-block-c",
          label: "B-17 · Block C (Central)",
          shortLabel: "B-17 Block C",
          ...offsetLatLng(sec, 0.2, 0.02),
          note: "Multi Gardens Block C residential & commercial avenue",
        },
        {
          id: "b17-lake",
          label: "B-17 · Lake Park & Water Tank",
          shortLabel: "B-17 Lake Park",
          ...offsetLatLng(sec, -0.25, 0.06),
          note: "Elevated B-17 Water Tank & Lake View foothills park",
        },
        {
          id: "b17-west",
          label: "B-17 · Blocks D–G (M-1 West)",
          shortLabel: "B-17 Blocks D–G",
          ...offsetLatLng(sec, 0.08, 0.3),
          note: "Western Multi Gardens expansion blocks toward Sangjani / M-1",
        },
      ];
    }

    if (sec.id === "F-9") {
      return [
        {
          id: "f9-center",
          label: "F-9 Park · Aiwan-e-Quaid (Center)",
          shortLabel: "F-9 Center",
          lat: sec.lat,
          lng: sec.lng,
          note: "Central lawns & Aiwan-e-Quaid Pavilion inside Fatima Jinnah Park",
        },
        {
          id: "f9-mehran",
          label: "F-9 East · Mehran Gate / MegaZone",
          shortLabel: "F-9 Mehran Gate",
          ...offsetLatLng(sec, 0.08, -0.38),
          note: "9th Avenue side entrance near MegaZone & Gandhara Club",
        },
        {
          id: "f9-bolan",
          label: "F-9 West · Bolan Gate (F-10 Side)",
          shortLabel: "F-9 Bolan Gate",
          ...offsetLatLng(sec, 0.04, 0.38),
          note: "10th Avenue side entrance facing F-10 Markaz",
        },
        {
          id: "f9-north",
          label: "F-9 North · Hill View Edge",
          shortLabel: "F-9 North",
          ...offsetLatLng(sec, -0.34, 0),
          note: "Northern jogging tracks overlooking E-9 & the Margalla Hills",
        },
        {
          id: "f9-south",
          label: "F-9 South · Jinnah Ave / G-9 Side",
          shortLabel: "F-9 South",
          ...offsetLatLng(sec, 0.36, 0),
          note: "Southern boundary along Jinnah Avenue & Shaheen Chowk",
        },
      ];
    }

    return null;
  }

  // Known sub-sector & landmark refinements for standard Zone I grid sectors
  const SUBZONE_META = {
    "D-12": {
      centerLabel: "D-12 Markaz (Center)",
      s2Label: "D-12/2 · Margalla Ridge (NW)",
      extras: [
        {
          id: "d12-caves",
          label: "D-12 NW · Shah Allah Ditta Caves",
          shortLabel: "D-12 Caves",
          lat: 33.7192,
          lng: 72.9185,
          note: "Historic Shah Allah Ditta banyan trees & tea stalls at NW foothills",
        },
      ],
    },
    "E-5": {
      centerLabel: "E-5 Center · Foothill Forest",
      extras: [
        {
          id: "e5-trail5",
          label: "E-5 · Trail 5 Parking / Trailhead",
          shortLabel: "E-5 Trail 5",
          lat: 33.7495,
          lng: 73.0815,
          note: "Margalla Rd trailhead for Trail 5 (Dara Janglan)",
        },
      ],
    },
    "E-6": {
      centerLabel: "E-6 Center · Foothills",
      extras: [
        {
          id: "e6-saidpur",
          label: "E-6 · Saidpur Village Heritage Hub",
          shortLabel: "E-6 Saidpur",
          lat: 33.748,
          lng: 73.071,
          note: "Cobbled Saidpur Village square, museum & hillside restaurants",
        },
        {
          id: "e6-daman",
          label: "E-6 North · Daman-e-Koh Road",
          shortLabel: "E-6 Daman-e-Koh",
          lat: 33.749,
          lng: 73.054,
          note: "Scenic Daman-e-Koh overlook climb north of E-6",
        },
      ],
    },
    "E-7": { centerLabel: "E-7 Center · Hillside Road" },
    "E-8": {
      centerLabel: "E-8 Center · Campus Belt",
      s2Label: "E-8/2 · Faisal Mosque / Trail 6 (NW)",
      s2Coords: { lat: 33.72972, lng: 73.03722 },
      s4Label: "E-8/4 · Bahria University (SE)",
      extras: [
        {
          id: "e8-faisal",
          label: "E-8 · Faisal Mosque Plaza",
          shortLabel: "Faisal Mosque",
          lat: 33.72972,
          lng: 73.03722,
          note: "Faisal Mosque courtyard & Margalla foothill plaza",
        },
      ],
    },
    "E-9": {
      centerLabel: "E-9 Center · PAF Complex",
      s3Label: "E-9/3 · NDU / Foothill Side (NE)",
      s4Label: "E-9/4 · Air University Gate (SE)",
    },
    "E-11": {
      centerLabel: "E-11 Markaz (Center)",
      s1Label: "E-11/1 · Golra / F-11 Border (SW)",
      s2Label: "E-11/2 · Main Cafe & High-Rise Strip (NW)",
      s3Label: "E-11/3 · MPCHS Blocks (NE)",
      s4Label: "E-11/4 · Khayaban-e-Iqbal (SE)",
      extras: [
        {
          id: "e11-golra",
          label: "E-11 West · Golra Railway Museum",
          shortLabel: "Golra Museum",
          lat: 33.6945,
          lng: 72.9765,
          note: "Historic 1881 Golra Sharif Junction Railway Station & Museum",
        },
      ],
    },
    "E-12": {
      centerLabel: "E-12 Center · CDA Developing Grid",
      s4Label: "E-12/4 · Golra Heritage Side (SE)",
    },
    "F-5": { centerLabel: "F-5 Center · Marriott / Diplomatic Edge" },
    "F-6": {
      centerLabel: "F-6 Markaz · Super Market",
      s2Label: "F-6/2 · Margalla Rd / Trail 3 Edge (NW)",
      s3Label: "F-6/3 · Kohsar Market (NE)",
    },
    "F-7": {
      centerLabel: "F-7 Markaz · Jinnah Super",
      s2Label: "F-7/2 · Rana Market / Hillside (NW)",
      s3Label: "F-7/3 · Gol Market (NE)",
      s4Label: "F-7/4 · Safa Gold / 7th Ave Edge (SE)",
    },
    "F-8": {
      centerLabel: "F-8 Markaz · Ayub Market / Loafology",
      s4Label: "F-8/4 · The Centaurus Mall (SE)",
      s4Coords: { lat: 33.70789, lng: 73.04987 },
    },
    "F-10": {
      centerLabel: "F-10 Markaz (Food & Bazaar Hub)",
      s3Label: "F-10/3 · F-9 Park Bolan Gate Edge (NE)",
    },
    "F-11": {
      centerLabel: "F-11 Markaz · Olympus Mall",
      s1Label: "F-11/1 · Srinagar/Golra Approach (SW)",
      s2Label: "F-11/2 · Hilal Rd Parks (NW)",
      s3Label: "F-11/3 · E-11 Border (NE)",
      s4Label: "F-11/4 · F-10 Border (SE)",
    },
    "G-5": {
      centerLabel: "G-5 Center · Pak-China / Constitution Ave",
      s4Label: "G-5 · Serena Hotel / Zero Point East",
      s4Coords: { lat: 33.7136, lng: 73.1008 },
    },
    "G-6": {
      centerLabel: "G-6 Markaz · Melody Food Park",
      s1Label: "G-6/1 · Aabpara Market (SW)",
      s4Label: "G-6/4 · Sports Complex Side (SE)",
    },
    "G-7": {
      centerLabel: "G-7 Markaz · Sitara Market",
      s4Label: "G-7/4 · Zero Point Side (SE)",
      s4Coords: { lat: 33.6942, lng: 73.0652 },
    },
    "G-8": {
      centerLabel: "G-8 Markaz (Tech & Medical Hub)",
      s3Label: "G-8/3 · PIMS Hospital (NE)",
      s3Coords: { lat: 33.70366, lng: 73.05637 },
    },
    "G-9": {
      centerLabel: "G-9 Markaz · Karachi Company",
      s4Label: "G-9/4 · Peshawar Morr Metro Side (SE)",
    },
    "G-10": {
      centerLabel: "G-10 Markaz · Madina Market",
      s1Label: "G-10/1 · G-10 Metro Edge (SW)",
    },
    "G-11": {
      centerLabel: "G-11 Markaz (Cafes & Squares)",
      s1Label: "G-11/1 · H-11 Metro Bridge (SW)",
    },
    "G-13": {
      centerLabel: "G-13 Center · TELECHS Grid",
      s1Label: "G-13/1 · Golra Mor Metro / Shops (SW)",
      s4Label: "G-13/4 · Commercial Plaza Strip (SE)",
    },
    "G-14": { s4Label: "G-14/4 · Main Settled Blocks (SE)" },
    "G-15": { centerLabel: "G-15 Markaz · J&K Society" },
    "H-8": {
      centerLabel: "H-8 Center · AIOU Main Campus",
      s1Label: "H-8/1 · SZABIST / FBISE Side (SW)",
      s3Label: "H-8/3 · H-8 Central Cemetery (NE)",
      s4Label: "H-8/4 · Shifa Int'l Hospital (SE)",
    },
    "H-9": {
      centerLabel: "H-9 Center · NUML Campus",
      s2Label: "H-9/2 · HEC / Srinagar Hwy (NW)",
      s3Label: "H-9/3 · Itwar / Sunday Bazaar (NE)",
      s4Label: "H-9/4 · I-9 / Potohar Border (SE)",
    },
    "H-10": {
      centerLabel: "H-10 · IIUI Main Campus (Center)",
      s1Label: "H-10/1 · A.K. Brohi / FAST Edge (SW)",
      s2Label: "H-10/2 · G-10 Metro Gate (NW)",
    },
    "H-12": {
      centerLabel: "H-12 Center · NUST Campus / Lake",
      s1Label: "H-12/1 · H-13 / Gate 10 Side (SW)",
      s2Label: "H-12/2 · NUST West Metro Gate (NW)",
      s2Coords: { lat: 33.652, lng: 72.9788 },
      s3Label: "H-12/3 · NUST Main Gate / NSTP (NE)",
      s4Label: "H-12/4 · NUST South / I-12 Side (SE)",
    },
    "H-13": {
      centerLabel: "H-13 Center · Student High Street",
      s3Label: "H-13/3 · NUST Gate 2 / Hostels (NE)",
    },
    "I-8": {
      centerLabel: "I-8 Markaz (Cafes & Desserts)",
      s3Label: "I-8/3 · Faizabad Edge (NE)",
      s4Label: "I-8/4 · Expressway / Zero Edge (SE)",
    },
    "I-9": {
      centerLabel: "I-9 Markaz · Potohar Market",
      s2Label: "I-9/2 · Dry Port / Industrial (NW)",
    },
    "I-10": {
      centerLabel: "I-10 Markaz (Auto & Hardware Hub)",
      s4Label: "I-10/4 · IJP Metro / Faizabad Edge (SE)",
    },
    "I-11": {
      centerLabel: "I-11 Center",
      s1Label: "I-11/1 · Carriage Factory (SW)",
      s2Label: "I-11/2 · H-11 / IJP Border (NW)",
      s3Label: "I-11/3 · Wholesale Corridors (NE)",
      s4Label: "I-11/4 · Sabzi Mandi Wholesale (SE)",
    },
    "I-14": { centerLabel: "I-14 Center · CDA Housing Blocks" },
  };

  const COMMERCIAL_CATEGORIES = new Set(["commercial", "upscale", "residential", "industrial"]);

  function getSubLocationsForSector(sectorId) {
    const sec = sectorMap[sectorId];
    if (!sec) return [];

    const custom = getCustomSpotsOverride(sec);
    if (custom) return custom;

    const meta = SUBZONE_META[sec.id] || {};
    const hasMarkaz = sec.tier !== "raw" && COMMERCIAL_CATEGORIES.has(sec.category);
    const defaultCenterLabel = hasMarkaz ? `${sec.id} Markaz (Center)` : `${sec.id} Center`;

    const spots = [
      {
        id: `${sec.id}-center`.toLowerCase(),
        label: meta.centerLabel || defaultCenterLabel,
        shortLabel: sec.id,
        lat: meta.centerCoords ? meta.centerCoords.lat : sec.lat,
        lng: meta.centerCoords ? meta.centerCoords.lng : sec.lng,
        note: `Center / Markaz of ${sec.id} (${sec.title})`,
      },
      {
        id: `${sec.id}-1`.toLowerCase(),
        label: meta.s1Label || `${sec.id}/1 (South-West)`,
        shortLabel: `${sec.id}/1`,
        ...(meta.s1Coords || offsetLatLng(sec, 0.22, 0.22)),
        note: `South-west sub-sector ${sec.id}/1 inside ${sec.id}`,
      },
      {
        id: `${sec.id}-2`.toLowerCase(),
        label: meta.s2Label || `${sec.id}/2 (North-West)`,
        shortLabel: `${sec.id}/2`,
        ...(meta.s2Coords || offsetLatLng(sec, -0.22, 0.22)),
        note: `North-west sub-sector ${sec.id}/2 inside ${sec.id}`,
      },
      {
        id: `${sec.id}-3`.toLowerCase(),
        label: meta.s3Label || `${sec.id}/3 (North-East)`,
        shortLabel: `${sec.id}/3`,
        ...(meta.s3Coords || offsetLatLng(sec, -0.22, -0.22)),
        note: `North-east sub-sector ${sec.id}/3 inside ${sec.id}`,
      },
      {
        id: `${sec.id}-4`.toLowerCase(),
        label: meta.s4Label || `${sec.id}/4 (South-East)`,
        shortLabel: `${sec.id}/4`,
        ...(meta.s4Coords || offsetLatLng(sec, 0.22, -0.22)),
        note: `South-east sub-sector ${sec.id}/4 inside ${sec.id}`,
      },
    ];

    if (Array.isArray(meta.extras)) {
      spots.push(...meta.extras);
    }

    return spots;
  }

  function getDefaultSpotForSector(sectorId) {
    const spots = getSubLocationsForSector(sectorId);
    if (!spots.length) return null;
    if (sectorId === DEFAULT_HOME.sectorId) {
      return spots.find((sp) => sp.id === DEFAULT_HOME.spotId) || spots[0];
    }
    return spots[0];
  }

  return {
    GRID_AFFINE,
    ROW_INDEX,
    LETTERS: ["B", "C", "D", "E", "F", "G", "H", "I"],
    DEFAULT_HOME,
    CATEGORIES,
    STATUS_META,
    SECTORS,
    SECTOR_MAP: sectorMap,
    LANDMARKS,
    CORRIDORS,
    METRO_LINES,
    METRO_STOPS,
    MARGALLA_RIDGES,
    RAWAL_LAKE,
    SHAKARPARIAN,
    haversineKm,
    findNearestMetro,
    gridToLatLng,
    latLngToGrid,
    getSubLocationsForSector,
    getDefaultSpotForSector,
  };
})();
