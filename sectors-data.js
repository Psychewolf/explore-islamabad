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

  // Curated dataset for all 71 Islamabad master-plan sectors (B..I)
  const RAW_SECTORS = [
    // B Series
    {
      id: "B-17",
      letter: "B",
      number: 17,
      title: "Multi Gardens (Zone II)",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 3,
      coords: { lat: 33.6810, lng: 72.8191 },
      vibe: "Suburban Zone II township between GT Road and the M-1 Motorway. Wide arterial boulevards, low- and mid-rise apartment blocks, and clear views of the western Margalla ridge.",
      highlights: [
        "Block A-G commercial centers with active evening family crowds",
        "B-17 Water Tank and Lake Park overlooking the western ridge",
        "Access corridor toward Taxila Museum, Julian ruins, and Khanpur Dam",
        "Sangjani Interchange link onto the M-1 Motorway",
      ],
      food: [
        "Jamil Sweets & Bakers in Block B Markaz",
        "Family BBQ, karahi, and fast-food outlets across Blocks B and C",
        "Roadside chai dhabas along the GT Road and Margalla Avenue approach",
      ],
      tips: "Far from central Islamabad (~22-24 km by road from H-11). Worth pairing with Khanpur Dam or a Taxila trip.",
    },

    // C Series
    {
      id: "C-13",
      letter: "C",
      number: 13,
      title: "Undeveloped Margalla Foothills",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Raw foothill terrain north of D-13 still held up by CDA land-sharing disputes. Expect scrubland, unpaved rural tracks, and steep limestone slopes with no commercial development.",
      highlights: [
        "Close views of the northern Margalla ridge",
        "Potohar scrub and informal foothill paths",
        "Adjacent to the Shah Allah Ditta corridor",
      ],
      food: ["No markets inside C-13; stop in D-12 or Shah Allah Ditta."],
      tips: "No paved internal retail zone. Best seen only along the Margalla Avenue drive past D-12.",
    },
    {
      id: "C-14",
      letter: "C",
      number: 14,
      title: "Margalla Foothill Expansion",
      category: "developing",
      status: "Rapidly Developing",
      hangoutScore: 2,
      vibe: "Recently balloted CDA foothill sector with newly paved streets and 1-kanal plots directly beneath the ridge. Quiet, sparse, and slowly adding early residential construction.",
      highlights: [
        "Front-row mountain backdrop along Margalla Avenue",
        "Clean paved grid streets suited for quiet evening drives",
        "Minutes east to the Shah Allah Ditta caves and banyan grove",
      ],
      food: ["Markaz plots are demarcated without open eateries yet; use D-12 Markaz or Shah Allah Ditta tea stalls 5 minutes east."],
      tips: "Useful for checking newer CDA foothill plots or taking a quiet drive along Margalla Avenue.",
    },
    {
      id: "C-15",
      letter: "C",
      number: 15,
      title: "Land-Sharing Foothill Zone",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 1,
      vibe: "Earthwork and new arterial roads running west from C-14 at the mountain base. Heavy machinery, fresh asphalt edges, rocky terrain, and older hamlets transitioning to grid plots.",
      highlights: [
        "Margalla Avenue extension cutting beneath the foothills",
        "Wide southern views down toward the Potohar plateau and Golra",
      ],
      food: ["No active markets; stop at D-12 Markaz beforehand."],
      tips: "Outer construction zone; avoid unpaved side tracks after dark.",
    },
    {
      id: "C-16",
      letter: "C",
      number: 16,
      title: "Sarai Kharbooza Foothills",
      category: "undeveloped",
      status: "Active Construction",
      hangoutScore: 1,
      vibe: "Western edge of the C-band near Sarai Kharbooza where Margalla Avenue reaches toward GT Road. Mostly surveyed open ground, early embankments, and scattered village settlements.",
      highlights: [
        "Margalla Avenue western corridor linking toward GT Road (N-5)",
        "Open horizon over western Islamabad and the Sangjani hills",
      ],
      food: ["Roadside tea stalls near GT Road and Sarai Kharbooza; none inside the sector."],
      tips: "Mainly a through-corridor connecting Margalla Avenue out to GT Road and B-17.",
    },

    // D Series
    {
      id: "D-10",
      letter: "D",
      number: 10,
      title: "Margalla Buffer Foothills",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Steep forested foothill buffer above E-10, largely untouched and non-commercial. Green after monsoon rains and tucked off main public roads.",
      highlights: [
        "Dense Margalla foothill vegetation and natural ravines",
        "Immediate northern buffer above the E-9 / E-10 institutional belt",
      ],
      food: ["None inside D-10; nearest spots are down in F-10 Markaz or E-11."],
      tips: "The adjoining E-10 boundary is security-restricted; stay on public roads in F-10, E-11, or D-12.",
    },
    {
      id: "D-11",
      letter: "D",
      number: 11,
      title: "Golra Hillsides & Pocket Schemes",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 2,
      vibe: "Patchwork strip between the E-11 apartment blocks and D-12 ridges. Mixes older village lanes near the Golra foothills with partial cooperative plots.",
      highlights: [
        "Mountain-edge roads linking Khayaban-e-Iqbal toward D-12",
        "Short distance from Golra Sharif and foothill paths",
      ],
      food: ["Small neighborhood tuck-shops; E-11 dining strips are 3 minutes south."],
      tips: "Stick to main link roads like Khayaban-e-Iqbal or Margalla Avenue rather than tight inner lanes.",
    },
    {
      id: "D-12",
      letter: "D",
      number: 12,
      title: "Foothill Gateway & Shah Allah Ditta",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Elevated residential sector tucked against the western Margalla cliffs. Noticeably cooler and quieter than central sectors, with mountain walls closing most north-south streets.",
      highlights: [
        "Shah Allah Ditta Caves at the NW edge, with centuries-old banyan trees and rock chambers",
        "D-12 Markaz, steadily adding coffee shops, bakeries, and everyday stores",
        "Informal foothill walking tracks and sunset views along Margalla Avenue",
        "Cooler evening air dropping off the Margalla ridges",
      ],
      food: [
        "Hillside chai and paratha dhabas beside Shah Allah Ditta Caves",
        "Neighborhood cafes, shawarma, and bakeries in D-12 Markaz",
      ],
      tips: "About 10.5 km from H-11 via 11th Avenue and Golra Road. Arrive around 4:30 PM for caves and chai before dusk.",
    },
    {
      id: "D-13",
      letter: "D",
      number: 13,
      title: "Western Foothill Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Stalled CDA land west of D-12 with Potohar scrub, small rural settlements, and clear views toward C-13 and the ridge.",
      highlights: [
        "Unobstructed mountain skyline beside D-12",
        "Rural outskirts directly adjacent to modern D-12 villas",
      ],
      food: ["No commercial options; use D-12 Markaz next door."],
      tips: "Unbuilt CDA sector; keep to D-12 or Margalla Avenue for paved driving.",
    },
    {
      id: "D-14",
      letter: "D",
      number: 14,
      title: "Raw Potohar Foothills",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Unbuilt master-plan square west of D-13. Dirt ridges, seasonal stream beds, and no civic infrastructure.",
      highlights: [
        "Open rural terrain below the western Margallas",
      ],
      food: ["None."],
      tips: "Paper sector only; pass to the north via Margalla Avenue if driving west.",
    },
    {
      id: "D-15",
      letter: "D",
      number: 15,
      title: "Planned Western Sector",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Semi-rural ground in the western D-band without formal CDA roads or commercial centers.",
      highlights: [
        "Open Potohar countryside along the western edge of Zone I",
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
      vibe: "Rural periphery near the GT Road and Sangjani approach, mixing farmland with unbuilt private society layouts.",
      highlights: [
        "Near the western pass where GT Road meets the Margalla foothills",
      ],
      food: ["Basic tea stalls along GT Road."],
      tips: "Not a city destination; bypass via GT Road or Margalla Avenue.",
    },
    {
      id: "D-17",
      letter: "D",
      number: 17,
      title: "Margalla View / Sangjani Edge",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 2,
      vibe: "Zone II cooperative housing pocket (including Margalla View Housing Scheme) near GT Road and Sangjani. Quiet, dispersed plots facing the western hills.",
      highlights: [
        "Margalla View Housing Scheme residential lanes",
        "Close to Sangjani Toll Plaza and B-17 Multi Gardens",
      ],
      food: ["Small convenience shops; B-17 Markaz across GT Road carries full restaurants."],
      tips: "Check society gate access if driving into private blocks.",
    },

    // E Series
    {
      id: "E-5",
      letter: "E",
      number: 5,
      title: "Trail 5 & Foothill Sanctuary",
      category: "park",
      status: "Institutional / Restricted",
      hangoutScore: 4,
      vibe: "Forested foothill strip bordering the upper Diplomatic Enclave. Shaded seasonal streams, wild macaques along Margalla Road, and direct trail access above F-5.",
      highlights: [
        "Trail 5 (Dara Janglan) trailhead—shaded forest creek hike into the Margallas",
        "Nearby Trail 6 access west along the Margalla Road edge",
        "Freshwater mountain streams and forest birdlife inside city limits",
      ],
      food: ["Water and tea stalls at Trail 5 parking; F-6 Kohsar Market cafes are 4 minutes south."],
      tips: "Start Trail 5 between 6:30 and 9:30 AM. Keep food zipped away from monkeys, and note the southern border meets Diplomatic Enclave checkpoints.",
    },
    {
      id: "E-6",
      letter: "E",
      number: 6,
      title: "Saidpur Village & Trail 3 Approach",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Foothill sector climbing from diplomatic hillside streets into Saidpur Village, an old stone-and-plaster Potohar settlement sitting inside a wooded amphitheater.",
      highlights: [
        "Saidpur Village—restored Hindu Temple (Rama Kund), Sikh Gurdwara, and cobblestone lanes",
        "Trail 3 trailhead off Margalla Road on the E-6 / F-6 boundary",
        "Daman-e-Koh switchback road winding directly above the sector",
      ],
      food: [
        "Des Pardes in Saidpur for evening Pakistani courtyard dining",
        "Polo Lounge, Hot Spot, and hillside tea terraces inside the village",
        "Kohsar Market cafes right across Margalla Road in F-6",
      ],
      tips: "Hike Trail 3 early morning or eat in Saidpur on a weeknight; weekend parking backs up after 7 PM.",
    },
    {
      id: "E-7",
      letter: "E",
      number: 7,
      title: "Hillside Mansions & Embassies",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Quiet, heavily treed residential enclave wedged between Saidpur and Faisal Mosque. Wide shaded streets, embassy residences, and almost no commercial traffic.",
      highlights: [
        "Hillside Road—one of the cleanest shaded walking and driving strips in town",
        "Steps from Faisal Mosque and the Trail 2 / Trail 3 foothills",
        "Calm cul-de-sacs and small neighborhood parks",
      ],
      food: ["Purely residential; walk or drive 2 minutes south into F-7 Jinnah Super and Gol Market."],
      tips: "Expect discreet diplomatic security posts and zero through-traffic. Ideal for a quiet evening walk before F-7 dinner.",
    },
    {
      id: "E-8",
      letter: "E",
      number: 8,
      title: "Faisal Mosque & Bahria University",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Anchored at its northern foothill tip by Faisal Mosque against the Margalla ridge, while the southern half holds Bahria University and quiet institutional streets.",
      highlights: [
        "Faisal Mosque—Vedat Dalokay's modernist concrete canopy overlooking the city axis",
        "Trail 6 behind Faisal Mosque—stream trail through the protected wildlife valley",
        "Bahria University Main Campus on Shangrila Road",
        "Faisal Mosque plaza at dusk and after rain when low clouds sit on the ridge",
      ],
      food: [
        "Tea, snacks, and ice cream carts around the Faisal Mosque parking plaza",
        "Student cafeterias along Shangrila Road, with F-8 Markaz 5 minutes south",
      ],
      tips: "Park at Faisal Mosque around sunrise or sunset. Dress modestly for the prayer hall, and avoid Friday noon congestion.",
    },
    {
      id: "E-9",
      letter: "E",
      number: 9,
      title: "PAF Complex, Air Univ & NDU",
      category: "institutional",
      status: "Institutional / Restricted",
      hangoutScore: 2,
      vibe: "Gated defense and university sector housing Air Headquarters (PAF Complex), Air University, and National Defence University. Strictly ordered, clean, and security-controlled.",
      highlights: [
        "Air University Main Campus and PAF educational institutions",
        "National Defence University tucked against the Margalla foothills",
        "Manicured institutional boulevards and aircraft display monuments",
      ],
      food: ["On-campus cafeterias only; public dining is nearby in F-9 Park or F-10 Markaz."],
      tips: "Most of E-9 is gated. Carry original CNIC and expect gate clearance if visiting Air University or NDU.",
    },
    {
      id: "E-10",
      letter: "E",
      number: 10,
      title: "Restricted Foothill Zone",
      category: "institutional",
      status: "Institutional / Restricted",
      hangoutScore: 1,
      vibe: "Heavily wooded restricted institutional sector tucked between E-9 and E-11 beneath the ridge. Closed to casual civilian traffic.",
      highlights: [
        "Forested Margalla slopes visible from Margalla Road and F-10",
      ],
      food: ["No public eateries; head south into F-10 Markaz."],
      tips: "Restricted access; do not enter internal gates without clearance.",
    },
    {
      id: "E-11",
      letter: "E",
      number: 11,
      title: "High-Rise Apartments & Cafes",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "High-density vertical apartment district managed through cooperative societies (MPCHS, FECHS, Services). Busy past midnight with students, families, rooftop terraces, and retail plazas.",
      highlights: [
        "E-11 Markaz and E-11/2 to /4 commercial lanes active late into the night",
        "Indoor gaming centers including We Play",
        "Short drive to Golra Sharif Shrine and the Railway Museum",
        "Direct link north up Khayaban-e-Iqbal toward D-12 and Shah Allah Ditta",
      ],
      food: [
        "Havana Terraces and Cafe Rustic for rooftop hill views and continental or BBQ",
        "Jamil Sweets, major pizza chains, and late-night chai and roll stalls",
      ],
      tips: "About 6 km north of H-11. Parking gets cramped in E-11/2 lanes at dinner; practical for budget apartments, late food, and Golra visits.",
    },
    {
      id: "E-12",
      letter: "E",
      number: 12,
      title: "Golra Heritage Edge & CDA Plots",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 3,
      vibe: "Long-stalled since 1989, now actively clearing plots and paving internal avenues across E-12/1-3. Its western edge borders the 1881 Golra Railway Museum.",
      highlights: [
        "Golra Sharif Railway Station & Museum on the E-11/E-12 border, with vintage steam locomotives under old banyan trees",
        "Newly graded CDA avenues and wide views of the western Margallas",
      ],
      food: ["Tea stalls by Golra Station and E-11 plazas 2 minutes east."],
      tips: "Worth a visit primarily for the Golra Railway Museum (~6 km from H-11), which has low entry fees and quiet grounds.",
    },
    {
      id: "E-13",
      letter: "E",
      number: 13,
      title: "Unbuilt Western Foothill Tract",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Pending CDA acquisition sector west of E-12. Open Potohar grassland, dirt tracks, and foothill views awaiting layout work.",
      highlights: [
        "Open horizon looking north toward D-12/D-13 and the ridge",
      ],
      food: ["None inside E-13."],
      tips: "Undeveloped land with no commercial activity.",
    },
    {
      id: "E-14",
      letter: "E",
      number: 14,
      title: "Planned Western Sector",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Unbuilt CDA grid square west of E-13. Open terrain with no commercial blocks.",
      highlights: ["Open western Potohar fields"],
      food: ["None."],
      tips: "Master-plan reserve awaiting on-ground development.",
    },
    {
      id: "E-15",
      letter: "E",
      number: 15,
      title: "Zone II Society Corridor",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Western Zone II fringe mixing raw land with scattered private cooperative housing pockets. Sparse and quiet.",
      highlights: ["Outer suburban layouts along western link roads"],
      food: ["Minimal; closest full markets are in G-15 or E-11."],
      tips: "Verify society NOC and road access before visiting specific blocks.",
    },
    {
      id: "E-16",
      letter: "E",
      number: 16,
      title: "Roshan Pakistan / Cooperative Zone",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Outer Zone II cooperative housing pocket (including Roshan Pakistan) with scattered construction amid open fields.",
      highlights: ["Developing suburban streets and open terrain"],
      food: ["Basic local karyana shops only."],
      tips: "Quiet outer zone near the GT Road corridor.",
    },
    {
      id: "E-17",
      letter: "E",
      number: 17,
      title: "Tarnol / Sangjani Fringe",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Far-western edge of the E-series along the Tarnol and Fateh Jhang axis. Agricultural landholdings mixed with private plot signboards.",
      highlights: ["Western approach toward the M-1 and Fateh Jhang interchange"],
      food: ["Highway dhabas out on Tarnol / Fateh Jhang Road."],
      tips: "Outer boundary land; head northwest to B-17 for established markets.",
    },

    // F Series
    {
      id: "F-5",
      letter: "F",
      number: 5,
      title: "Marriott, Diplomatic Edge & Trail 5",
      category: "administrative",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "High-security, low-density sector flanking Jinnah Avenue and the Red Zone. Wide manicured lawns, embassy traffic, luxury hotel lobbies, software technology parks, and foothill access to Trail 5.",
      highlights: [
        "Islamabad Marriott Hotel and the Serena / Red Zone approach along Aga Khan Rd",
        "Software Technology Park and federal office blocks",
        "Trail 5 and Trail 6 foothill access across Margalla Rd",
        "Red Line Metrobus access near Secretariat and 7th Ave",
      ],
      food: [
        "Nadia Cafe, Dumpukht, and Sakura inside Marriott Hotel",
        "Super Market and Kohsar Market immediately west in F-6",
      ],
      tips: "Expect Red Zone checkpoints along Constitution Ave and keep your CNIC on you. Works well as a morning trailhead start or hotel coffee stop.",
    },
    {
      id: "F-6",
      letter: "F",
      number: 6,
      title: "Super Market & Kohsar Cafe Hub",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "One of Islamabad's oldest upscale sectors, shaded by mature banyan and jacaranda trees. Anchored by Super Market (F-6 Markaz) and outdoor-terrace Kohsar Market (F-6/3), it moves at an unhurried, bookish pace.",
      highlights: [
        "Kohsar Market (F-6/3) outdoor cafe terrace and weekend brunch square",
        "Super Market (F-6 Markaz) heritage bookshops, boutiques, electronics, and bakeries",
        "Trail 3 trailhead at the northern F-6/3 edge on Margalla Road",
        "St. Thomas Church and quiet tree-lined sub-sector parks",
      ],
      food: [
        "Street 1 Cafe in Kohsar for outdoor brunch and wood-fired pizza",
        "Roasters Coffee House, Butler's Chocolate Cafe, and Table Talk around Kohsar",
        "Classic Super Market fresh juice stalls, snacks, and bakeries",
      ],
      tips: "About 13.5 km from H-11 via Srinagar Hwy and 7th Ave north. Best visited for weekend morning brunch or coffee right after Trail 3.",
    },
    {
      id: "F-7",
      letter: "F",
      number: 7,
      title: "Jinnah Super & Gol Market",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Central Islamabad's busiest commercial and social square. Jinnah Super Market (F-7 Markaz) stays busy from noon to midnight with fashion shops, bookstores, and cafes, while Gol Market (F-7/3) keeps a quieter neighborhood pace.",
      highlights: [
        "Jinnah Super Market boutiques, crafts, jewelry, and Saeed Book Bank",
        "Safa Gold Mall and Rana Market bookshop enclave",
        "Gol Market (F-7/3) circular park-side square",
        "Direct avenue sightline up Faisal Avenue toward Faisal Mosque",
      ],
      food: [
        "Chaaye Khana (F-7 Markaz) for tea, parathas, and all-day breakfast",
        "Artrio Cafe, Gloria Jean's, Loafology nearby, and late-night burger spots",
        "Hot Spot (Gol Market) late-night ice cream and desserts",
      ],
      tips: "Parking inside Jinnah Super fills up Friday through Sunday evenings; park toward F-7/3 or visit on weekday afternoons.",
    },
    {
      id: "F-8",
      letter: "F",
      number: 8,
      title: "Centaurus Mall & Ayub Market",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Split personality between day and night. F-8 Markaz hums with lawyers around the District Courts until mid-afternoon, while evenings shift toward specialty coffee in Ayub Market and crowds at The Centaurus Mall in F-8/4.",
      highlights: [
        "The Centaurus Mall (F-8/4) retail floors, Cineplex, and food court",
        "F-8 Gol Masjid modernist dome mosque in the Markaz",
        "Ayub Market cafes, sourdough bakeries, bookshops, and hardware rows",
        "Red Line Metrobus Centaurus and Ibn-e-Sina stops nearby",
      ],
      food: [
        "Loafology Bakery & Cafe for sourdough, croissants, and espresso",
        "Mocca Coffee and F-8 Markaz burgers, Chinese, and lunch joints",
        "Centaurus Mall food court for large groups",
      ],
      tips: "Avoid the inner District Court lanes between 9 AM and 2 PM on weekdays; evenings around Centaurus or F-8 Markaz cafes are relaxed.",
    },
    {
      id: "F-9",
      letter: "F",
      number: 9,
      title: "Fatima Jinnah Park (F-9 Park)",
      category: "park",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "An entire 2 km x 2 km sector (~750 acres) kept as open parkland with no houses or private plazas. Sprawling meadows, pine and banyan groves, solar-lit jogging tracks, and unobstructed views of the Margalla ridge.",
      highlights: [
        "Aiwan-e-Quaid pavilion and cultural exhibition complex",
        "MegaZone bowling alley, arcade, pool tables, and swimming complex",
        "Kilometers of paved cycling lanes and solar-lit walking tracks",
        "Gandhara Citizen's Club and wide sunset picnic lawns",
      ],
      food: [
        "Park canteens, corn/chai kiosks, and MegaZone snack bars",
        "F-10 Markaz lies right across 10th Avenue on the western edge for full dinner",
      ],
      tips: "About 6-7 km from H-11 via 9th Ave (Mehran Gate) or 10th Ave (Bolan Gate). Sunrise walks and late-afternoon picnics work best.",
    },
    {
      id: "F-10",
      letter: "F",
      number: 10,
      title: "F-10 Markaz Nightlife & Food Hub",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Loud, crowded, and utilitarian. F-10 Markaz is one of Islamabad's busiest commercial loops, packed with phone repair shops, retail plazas, dessert bars, and late-night grill stalls directly across from F-9 Park.",
      highlights: [
        "F-10 Markaz electronics, tailoring, opticians, and dense shopping plazas",
        "Immediate western border of Fatima Jinnah Park (Bolan Gate)",
        "Lively residential streets and well-kept neighborhood family parks",
      ],
      food: [
        "Late-night food plaza for smash burgers, rolls, fries, waffles, and ice cream",
        "Casual cafes, shinwari, and desi BBQ spots",
        "Late-night chai stalls open well past midnight",
      ],
      tips: "A quick ~6 km run from H-11 up 10th Ave. Peak energy is after 7 PM; expect slow traffic inside the inner Markaz loop.",
    },
    {
      id: "F-11",
      letter: "F",
      number: 11,
      title: "Olympus Mall & Modern Apartments",
      category: "upscale",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Clean, suburban, and apartment-heavy. F-11 pairs wide residential streets with contemporary mid-rise towers and an organized Markaz anchored by Olympus Mall, just northwest of H-11.",
      highlights: [
        "Olympus Mall and F-11 Markaz supermarkets, gyms, and retail",
        "Hilal Road and clean sub-sector parks with paved walking loops",
        "Direct back-road connections north into E-11 and D-12",
      ],
      food: [
        "Burning Brownie (Olympus Mall) for cheesecakes and brownies",
        "The Blue Whale Cafe, specialty coffee nooks, and family dining",
        "Reliable bakeries and grocery stops for a short hop from H-11",
      ],
      tips: "Close to H-11 (~5 km / ~9 min up 11th Ave). Practical dessert or coffee stop when you do not want to drive all the way east to F-6.",
    },
    {
      id: "F-12",
      letter: "F",
      number: 12,
      title: "Stalled FGEHA Sector",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Long bottlenecked by land acquisition and affectee disputes under FGEHA. Surrounded by built-up F-11 and E-11, yet inside it remains open fields and scattered rural settlements.",
      highlights: [
        "Abrupt contrast between open rural plots and adjacent F-11 high-rises",
        "Close to the Golra Railway Station heritage corridor to the north",
      ],
      food: ["None inside F-12; drive 3 minutes east to F-11 Markaz."],
      tips: "Still unbuilt; treat as a pass-through toward F-11 or Golra Museum.",
    },
    {
      id: "F-13",
      letter: "F",
      number: 13,
      title: "Unbuilt Western F-Band",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Undeveloped master-plan square west of F-12. Potohar scrub, dirt tracks, and open ground awaiting basic sector roads.",
      highlights: ["Open countryside between Golra and the F-14/F-15 zone"],
      food: ["None."],
      tips: "Raw land with no public facilities yet.",
    },
    {
      id: "F-14",
      letter: "F",
      number: 14,
      title: "FGEHA Active Infrastructure Zone",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "Federal employee housing sector under active earthworks. Newly carved wide avenues and underground utility corridors by NLC mark out the emerging western grid.",
      highlights: [
        "New arterial roads and wide graded sector blocks",
        "Open views north toward the D-12 and C-14 Margalla ridge",
      ],
      food: ["No cafes or markets yet; nearest food is in G-13 or F-11."],
      tips: "Mostly heavy machinery and construction dust; only worth a drive if checking development progress.",
    },
    {
      id: "F-15",
      letter: "F",
      number: 15,
      title: "FGEHA Sister Development Sector",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "Developing alongside F-14 under FGEHA and NLC. Long straight graded boulevards across rolling Potohar terrain with ongoing civil works.",
      highlights: [
        "Wide empty graded roads overlooking G-15 and the Motorway corridor",
      ],
      food: ["None inside yet; G-15 / J&K Society to the south has local eateries."],
      tips: "Construction-stage sector; visit during daylight if inspecting plots.",
    },
    {
      id: "F-16",
      letter: "F",
      number: 16,
      title: "Outer Western F-Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Untouched outer western F-band square near the Tarnol corridor. Rural farmland and unbuilt reserve plots.",
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
      vibe: "Far-western F-tier along the Tarnol and Fateh Jhang axis. Mix of raw land and emerging private residential tracts.",
      highlights: ["Gateway views toward the M-1 and Fateh Jhang interchange"],
      food: ["Roadside dhabas out on Tarnol / Fateh Jhang Rd."],
      tips: "Outer boundary land; no formal CDA markaz exists.",
    },

    // G Series
    {
      id: "G-5",
      letter: "G",
      number: 5,
      title: "Red Zone, Serena & Pak-China Centre",
      category: "administrative",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Monumental seat of federal government paired with major convention venues. Wide Constitution Avenue links Parliament House, Supreme Court, Aiwan-e-Sadr, Serena Hotel, Pak-China Friendship Centre, and the Diplomatic Enclave.",
      highlights: [
        "Serena Hotel courtyard architecture blending Swat and Mughal brickwork",
        "Pak-China Friendship Centre art expos, book fairs, and cultural events",
        "Jinnah Convention Centre and Constitution Avenue monumental vistas",
        "Zero Point, Shakarparian, and Lake View Park just south",
      ],
      food: [
        "Zamana, Rakaposhi, and Al-Maghreb inside Serena Hotel",
        "Quick hop west across to G-6 Melody or Aabpara for budget street food",
      ],
      tips: "Carry original CNIC for Red Zone entry. Pak-China Centre and Serena remain accessible via Srinagar Hwy without entering restricted Secretariat lanes.",
    },
    {
      id: "G-6",
      letter: "G",
      number: 6,
      title: "Aabpara & Melody Food Park",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Islamabad's 1960s pioneer sector. Less polished than F-6 across Jinnah Ave, G-6 carries lived-in working-city warmth around Aabpara Market (the city's first bazaar), Melody Food Park, and shaded low-rise CDA quarters.",
      highlights: [
        "Aabpara Market stalls for spices, fabrics, samosas, and secondhand books",
        "Melody Market and open-air Melody Food Park",
        "Lal Masjid and nearby Islamabad Sports Complex / Liaquat Gymnasium",
        "Direct Red Line Metrobus access along 7th Ave and Aabpara",
      ],
      food: [
        "Melody Food Park open-air BBQ, chapli kabab, rolls, and doodh-patti chai",
        "Aabpara samosa-chaat, Kashmiri chai, and classic neighborhood bakeries",
      ],
      tips: "Essential stop for old Islamabad street food. From H-11, run east along Srinagar Hwy or take Orange Line to Red Line.",
    },
    {
      id: "G-7",
      letter: "G",
      number: 7,
      title: "Sitara Market & Zero Point Hub",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Classic central CDA sector immediately north of Zero Point and Shakarparian. Dense low-rise government housing blocks and pedestrian courtyards frame everyday Sitara Market (G-7/2 Markaz).",
      highlights: [
        "Sitara Market neighborhood bazaar for tailors, hardware, and affordable meals",
        "Immediate northern neighbor to Zero Point, Rose & Jasmine Garden, and Lok Virsa",
        "Mature street canopies and Doxiadis courtyard lanes across G-7/1-4",
      ],
      food: [
        "Desi tikkas, nihari, parathas, and roadside tea stalls in Sitara Market",
        "5 minutes south to Shakarparian kiosks or north across Jinnah Ave to F-7",
      ],
      tips: "Right on the Red Line Metrobus spine. Easy stopover before or after Pakistan Monument and Shakarparian.",
    },
    {
      id: "G-8",
      letter: "G",
      number: 8,
      title: "PIMS Hospital & G-8 Markaz",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Practical mid-city medical and service hub. G-8/3 is anchored by PIMS (Islamabad's main public hospital), while G-8 Markaz stays busy with clinics, diagnostic labs, print shops, and old-school sit-down restaurants.",
      highlights: [
        "PIMS Hospital and PIMS Metrobus Station transit hub",
        "G-8 Markaz printing presses, medical suppliers, and electronics plazas",
        "Centaurus Mall sits right across Jinnah Avenue",
      ],
      food: [
        "Tandoori Restaurant in G-8 Markaz for reliable family Pakistani dining",
        "24-hour chai and paratha stalls serving hospital visitors and commuters",
      ],
      tips: "Daytime parking and traffic around PIMS move slowly; reachable cleanly via 9th Ave or Metrobus.",
    },
    {
      id: "G-9",
      letter: "G",
      number: 9,
      title: "Karachi Company Mega Bazaar",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Crowded, affordable, and loud until midnight. Karachi Company (G-9 Markaz) is Islamabad's densest middle-class shopping strip, packed with clothing plazas, phone repair kiosks, and nonstop street food.",
      highlights: [
        "Karachi Company (G-9 Markaz) for budget clothes, shoes, jewelry, and tech repairs",
        "Active neighborhood blocks (G-9/1-4) with cricket-filled inner parks",
        "Easy transit via Ibn-e-Sina / Faiz Ahmed Faiz (Peshawar Morr) interchange",
      ],
      food: [
        "Crispy gol gappas, dahi bhallay, bun kababs, and fresh sugarcane juice",
        "Budget shawarma, tandoori BBQ, and late-night tea stalls across the Markaz",
      ],
      tips: "Only ~4.5 km NE of H-11 via 9th/10th Ave or Orange Line to Peshawar Morr. Park at the outer lot and walk the bazaar lanes.",
    },
    {
      id: "G-10",
      letter: "G",
      number: 10,
      title: "Madina Market & Kabuli Pulao Hub",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Grounded commercial sector right across Srinagar Highway from H-10 and H-11. G-10 Markaz mixes hardware, furniture, and computer retail with some of Islamabad's best Afghan and Pashtun food.",
      highlights: [
        "G-10 Markaz (Madina / Mastung Market) laptops, furniture, and auto accessories",
        "G-10 Orange Line Metrobus station along its southern highway boundary",
        "Walkable community parks and mixed student/family apartment blocks",
      ],
      food: [
        "Afghan Kabuli Pulao, mutton rosh, mantu, and chapli kabab spots",
        "Neighborhood bakeries, shawarma corners, and Pathan chai hotels",
      ],
      tips: "Just ~3.5 km from H-11. Strong casual dinner option when you want proper Kabuli Pulao without crossing town.",
    },
    {
      id: "G-11",
      letter: "G",
      number: 11,
      title: "Close-In Residential & Cafe Hub",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Closest full-service residential sector north of H-11 across Srinagar Highway. Tidy streets, mid-rise apartments, specialty coffee shops, study cafes, and superstores popular with FAST, NUST, and IIUI students.",
      highlights: [
        "G-11 Markaz third-wave cafes, bakeries, barbers, salons, and supermarkets",
        "I&T Centre G-11 auto workshops and service bays",
        "Direct pedestrian bridge link to the H-11 / G-11 Orange Line station",
      ],
      food: [
        "Specialty espresso bars, waffle/dessert cafes, and late-evening study nooks",
        "Casual burger joints, desi restaurants, and bakeries open late",
      ],
      tips: "Roughly 2.5 km north of H-11. Practical default for quick groceries, errands, or late coffee.",
    },
    {
      id: "G-12",
      letter: "G",
      number: 12,
      title: "Unacquired Inner-City Enclave",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Well-known urban anomaly inside the capital grid: an unacquired rural village pocket (Mehrabadi/Golra fringe) completely hemmed in by paved G-11, G-13, F-11, and Srinagar Highway.",
      highlights: [
        "Bordered along Srinagar Highway by the NUST / G-12 Orange Line stations",
        "Sharp rural-urban boundary right inside Zone I",
      ],
      food: ["Small village shops only; drive 3 minutes east to G-11 or west to G-13."],
      tips: "Not a retail or hangout destination; stay on Srinagar Highway or detour to G-11/G-13.",
    },
    {
      id: "G-13",
      letter: "G",
      number: 13,
      title: "TELECHS & Student/Family Hub",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "Dense, fast-growing residential sector built largely through TELECHS and FGEHA. Packed with multi-story townhomes, student hostels, budget restaurants, and active commercial plazas along Srinagar Highway.",
      highlights: [
        "G-13/1 and G-13/4 commercial strips for groceries, clinics, and gyms",
        "Golra Mor Orange Line Metrobus station at the southern highway corner",
        "Lively NUST/IIUI/FAST student and young-family street life",
      ],
      food: [
        "Value-for-money karahi spots, biryani houses, and paratha dhabas",
        "Neighborhood cafes and bakeries along the main markaz lanes",
      ],
      tips: "Easy ~5 km ride west down Srinagar Highway from H-11. Reliable spot for budget student meals and everyday errands.",
    },
    {
      id: "G-14",
      letter: "G",
      number: 14,
      title: "FGEHA Residential Grid",
      category: "developing",
      status: "Rapidly Developing",
      hangoutScore: 2,
      vibe: "Quiet FGEHA residential grid west of G-13, with G-14/4 serving as the most settled sub-sector. Newly built houses, neighborhood mosques, and low traffic away from central avenues.",
      highlights: [
        "Settled G-14/4 residential blocks and clean paved streets",
        "Quick exit onto Srinagar Highway and GT Road (26 No. Chungi)",
      ],
      food: ["Small Class-III bakeries and dhabas in G-14/4; fuller options in G-13 or G-15."],
      tips: "Quiet suburban loop ~7 km west of H-11 down Srinagar Highway.",
    },
    {
      id: "G-15",
      letter: "G",
      number: 15,
      title: "J&K Cooperative & Motorway Link",
      category: "residential",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Populous western cooperative sector (Jammu & Kashmir Housing Society) beside Srinagar Highway and the M-1/M-2 Motorway entry. Self-contained markets and steady family street activity.",
      highlights: [
        "J&K Society / G-15 Markaz supermarkets, banks, and family parks",
        "Jammu & Kashmir / G-15 Orange Line Metrobus station right on the highway",
        "Last dense urban sector before Islamabad Airport and M-1/M-2 Toll Plaza",
      ],
      food: [
        "Busy neighborhood BBQ, pizza, bakeries, and karahi spots in G-15 Markaz",
        "Highway chai and breakfast stops near 26 No. Chungi",
      ],
      tips: "About 9-10 km straight west of H-11 via Srinagar Highway or Orange Line Metro.",
    },
    {
      id: "G-16",
      letter: "G",
      number: 16,
      title: "Badhana Kalan / Highway Edge",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Transitional western corridor along Srinagar Highway around Badhana Kalan Metro station, mixing sparse cooperative pockets with open semi-rural ground.",
      highlights: [
        "Badhana Kalan / G-16 Orange Line Metrobus station",
        "Open highway sightlines toward Islamabad Airport and M-1/M-2",
      ],
      food: ["Roadside tea stalls; head back east to G-15 for proper dining."],
      tips: "Mostly a transit stretch rather than a stopover sector.",
    },
    {
      id: "G-17",
      letter: "G",
      number: 17,
      title: "Paradise City / Fateh Jhang Border",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 1,
      vibe: "Westernmost edge of the G-band meeting Fateh Jhang Road and Tarnol. Mixes private housing pockets (Paradise City), open plots, and highway transit traffic.",
      highlights: [
        "Near the M-1 / M-2 Motorway interchange and Airport approach road",
      ],
      food: ["Traveler dhabas along GT / Fateh Jhang Road."],
      tips: "Check society access routes ahead of time if visiting specific private blocks.",
    },

    // H Series
    {
      id: "H-8",
      letter: "H",
      number: 8,
      title: "Universities, Shifa & Central Cemetery",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Education, healthcare, and institutional corridor. Tree-lined avenues connect AIOU, SZABIST, Riphah, private school campuses, Shifa International Hospital, FBISE, and the historic shaded H-8 Graveyard.",
      highlights: [
        "Allama Iqbal Open University (AIOU) main campus and SZABIST Islamabad",
        "Shifa International Hospital on H-8/4 along Pitras Bukhari Rd",
        "FBISE Headquarters and major school campuses",
        "H-8 Graveyard spanning H-8/3 under dense old trees",
      ],
      food: [
        "Hospital and campus cafes along Pitras Bukhari Rd",
        "Immediate bridge across to I-8 Markaz bakeries and coffee bars",
      ],
      tips: "Heavy school and university rush around 8 AM and 2 PM. Cross Pitras Bukhari Rd into I-8 Markaz for good food.",
    },
    {
      id: "H-9",
      letter: "H",
      number: 9,
      title: "Itwar Bazaar, NUML & HEC",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "Split between calm higher-ed grounds (NUML and HEC) and Islamabad's largest open-air flea market, the H-9 Itwar Bazaar right beside Peshawar Morr.",
      highlights: [
        "H-9 Itwar Bazaar (Sundays, Tuesdays, and Fridays) for thrift jackets, rugs, produce, and books",
        "NUML (National University of Modern Languages) main campus",
        "Higher Education Commission (HEC) HQ and Pakistan Bait-ul-Mal",
        "Adjacent to the Faiz Ahmed Faiz (Peshawar Morr) Metrobus interchange",
      ],
      food: [
        "Itwar Bazaar fresh jalebi, pakoras, fruit chaat, and chai stalls on market days",
        "NUML food court and nearby G-9 Karachi Company street food across Srinagar Hwy",
      ],
      tips: "Only ~3.5 km from H-11. Go Sunday, Tuesday, or Friday morning/afternoon for the bazaar with cash and comfortable walking shoes.",
    },
    {
      id: "H-10",
      letter: "H",
      number: 10,
      title: "IIUI Grand Campus",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Immediate eastern neighbor of H-11. Nearly the entire sector houses the International Islamic University Islamabad (IIUI) campus, marked by white modernist academic blocks, broad lawns, and quiet student paths.",
      highlights: [
        "IIUI Central Mosque and modernist white academic architecture",
        "Wide cricket ovals, green quads, and international student hostels",
        "G-10 Orange Line Metrobus station along its northern highway boundary",
      ],
      food: [
        "Campus canteens and central cafeterias; cross Srinagar Hwy to G-10 Markaz for Kabuli Pulao",
      ],
      tips: "Directly across A.K. Brohi Rd from H-11. Main gates check student/visitor IDs and maintain separate male and female campus zones.",
    },
    {
      id: "H-11",
      letter: "H",
      number: 11,
      title: "FAST-NUCES, Police Lines & Hospitals",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Institutional anchor combining the FAST-NUCES campus in H-11/4, ICT Police Lines HQ and National Police Academy, PAEC / NESCOM General Hospital, and Islamabad's Central Municipal Cemetery along Srinagar Highway.",
      highlights: [
        "FAST-NUCES (H-11/4) engineering/CS campus and sports grounds",
        "ICT Police Lines HQ and National Police Academy grounds",
        "PAEC / NESCOM General Hospital and medical complex",
        "H-11 / G-11 Orange Line Metrobus station linking directly to Airport and Peshawar Morr",
      ],
      food: [
        "FAST-NUCES campus cafe and nearby paratha/roll dhabas around H-11/4",
        "Two-minute hop across Srinagar Hwy into G-11 Markaz or G-10 Markaz",
      ],
      tips: "Mostly institutional; campus and police gates check IDs. Pair any trip here with G-11 coffee or G-10 Kabuli Pulao.",
    },
    {
      id: "H-12",
      letter: "H",
      number: 12,
      title: "NUST Mini-City & Science Park",
      category: "institutional",
      status: "Fully Developed",
      hangoutScore: 4,
      vibe: "A 700-acre green campus enclave directly west of H-11. NUST Main Campus and NSTP (National Science & Technology Park) stay calm, tree-lined, and walkable with artificial lakes and shaded bike paths.",
      highlights: [
        "NUST Main Campus stone-and-brick schools (SEECS, SMME, SCEE, NBS, SADA)",
        "National Science & Technology Park (NSTP) innovation center",
        "NUST Lake, Concordia student hubs, sports complexes, and cycling loops",
        "NUST East and West Orange Line Metrobus stations on Srinagar Hwy",
      ],
      food: [
        "Concordia 1 & 2, Retro, Coffee Lounge, and NSTP cafes inside campus",
      ],
      tips: "Immediate western neighbor of H-11. Entry requires a NUST ID, NSTP visitor pass, or a student/faculty host with original CNIC.",
    },
    {
      id: "H-13",
      letter: "H",
      number: 13,
      title: "NUST Student Town & Chai Dhabas",
      category: "developing",
      status: "Partially Settled",
      hangoutScore: 3,
      vibe: "Dense, un-manicured, and busy late into the night. Built up organically outside NUST H-12, H-13 is a tight maze of student hostels, apartment towers, print shops, and 24/7 chai dhabas.",
      highlights: [
        "Student hostel high-street right outside NUST Gate 2 and Gate 10",
        "Organic non-CDA street energy with late-night activity",
      ],
      food: [
        "Late-night Pathan chai and anda-paratha dhabas running past 2 AM",
        "Budget student biryani, shawarma, loaded fries, and grill spots",
      ],
      tips: "Only ~4 km west of H-11. Expect narrow uneven lanes and lively midnight student crowds for cheap chai.",
    },
    {
      id: "H-14",
      letter: "H",
      number: 14,
      title: "Reserved Institutional Horizon",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Undeveloped institutional reserve south of Srinagar Highway and west of H-13. Quiet grassland and dirt tracks with zero cafes or public facilities.",
      highlights: [
        "Open horizon views toward the airport highway and Margalla range",
      ],
      food: ["None; nearest chai is back in H-13 or across in G-14."],
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
      highlights: ["Open ground along the western Srinagar Hwy and airport approach"],
      food: ["None."],
      tips: "Not developed yet; visit G-15 across the highway instead.",
    },
    {
      id: "H-16",
      letter: "H",
      number: 16,
      title: "Outer H-Band Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Far-western edge of the H-series near the M-1/M-2 Motorway corridor. Raw undeveloped terrain.",
      highlights: ["Western edge bordering the Airport / Motorway approach"],
      food: ["None."],
      tips: "Undeveloped future-reserve land.",
    },

    // I Series
    {
      id: "I-8",
      letter: "I",
      number: 8,
      title: "I-8 Markaz · Dessert & Cafe Magnet",
      category: "commercial",
      status: "Fully Developed",
      hangoutScore: 5,
      vibe: "The residential and social outlier of the I-band. While I-9 through I-11 skew industrial and wholesale, I-8 is affluent, leafy, and hosts I-8 Markaz, one of the twin cities' busiest evening dessert and coffee hubs.",
      highlights: [
        "I-8 Markaz commercial plazas, fashion outlets, gaming zones, and rooftop lounges",
        "Adjacent to Shifa International Hospital across Pitras Bukhari Rd and Faizabad",
        "Quick link onto Islamabad Expressway and Murree Rd toward Rawalpindi",
      ],
      food: [
        "Layers Bakeshop, Crust/Tehzeeb bakeries, and trendy dessert/waffle parlors",
        "Specialty coffee spots, burger joints, shinwari, and continental dining",
      ],
      tips: "About 8.5 km east of H-11 via Srinagar Hwy and 9th Ave or IJP Rd. Evening parking gets tight after 8 PM.",
    },
    {
      id: "I-9",
      letter: "I",
      number: 9,
      title: "Industrial Estate & Rugged Dhabas",
      category: "industrial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Islamabad's industrial engine room. Pharma plants, flour mills, warehouses, and the Islamabad Dry Port share the grid with residential sub-sectors and no-nonsense trade shops in I-9 Markaz (Potohar Market).",
      highlights: [
        "I-9 Industrial Area and Islamabad Dry Port",
        "I-9 Markaz / Potohar Market hardware, workshops, and wholesale suppliers",
        "Direct frontage on 9th Avenue and IJP Road",
      ],
      food: [
        "Truck-style dhabas serving mutton karahi, chana, fresh naan, and kadak chai",
        "Solid low-cost lunch stops inside I-9 Markaz",
      ],
      tips: "About 6 km east of H-11 via IJP Rd or 9th Ave. Worth a lunchtime trip for unpretentious dhaba karahi.",
    },
    {
      id: "I-10",
      letter: "I",
      number: 10,
      title: "Auto Markets, Hardware & Bustling Streets",
      category: "industrial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Dense, practical, and lively along the Rawalpindi border. Pairs older residential blocks (I-10/1-4) with one of the twin cities' largest auto-parts, mechanic, and hardware markets in I-10 Markaz.",
      highlights: [
        "I-10 Markaz auto spares, garages, power tools, and everyday retail",
        "I-10/4 access toward Faiz Ahmed Faiz / IJP Road interchange",
        "Active neighborhood parks and blended Islamabad/Pindi street culture",
      ],
      food: [
        "Street-food bun kababs, nihari, tikka-boti, and samosas",
        "Neighborhood bakeries and late-night chai stalls",
      ],
      tips: "Roughly 4-5 km SE of H-11 down Faqir Aipee / IJP Rd. Best sector to fix a car/bike issue and grab cheap street food.",
    },
    {
      id: "I-11",
      letter: "I",
      number: 11,
      title: "Sabzi Mandi & Railway Carriage Works",
      category: "industrial",
      status: "Fully Developed",
      hangoutScore: 3,
      vibe: "Islamabad's chaotic wholesale hub immediately south of H-11. Houses the vast Sabzi Mandi (Wholesale Fruit & Vegetable Market) and the Pakistan Railways Carriage Factory, busy with trucks and dawn auctions.",
      highlights: [
        "Islamabad Sabzi Mandi wholesale produce crates in peak fruit seasons",
        "Pakistan Railways Carriage Factory and logistics depots",
        "Immediate southern neighbor of H-11 across Service / IJP Rd",
      ],
      food: [
        "Early-morning market chai, hot halwa-puri, chana, and seasonal fruit straight from crates",
      ],
      tips: "Immediate southern neighbor. Visit Sabzi Mandi between 6:00 AM and 9:00 AM for the market atmosphere and skip midday truck congestion.",
    },
    {
      id: "I-12",
      letter: "I",
      number: 12,
      title: "Carriage Factory Border & CDA Plots",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 1,
      vibe: "Slow-developing residential and industrial plot zone south of NUST H-12 and west of Sabzi Mandi. Sparse houses, cleared plots, and gradual infrastructure rollout.",
      highlights: [
        "Adjoins the Railway Carriage Factory corridor and NUST southern perimeter",
      ],
      food: ["Minimal tuck-shops; head north to H-13 or east to I-11/I-10."],
      tips: "Low-density developing plot zone; not an active market hub yet.",
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
      highlights: ["Southern border link roads feeding into western Rawalpindi"],
      food: ["Basic roadside tea stalls along the main link road."],
      tips: "Mainly outer border transit terrain.",
    },
    {
      id: "I-14",
      letter: "I",
      number: 14,
      title: "Affordable CDA Housing Growth",
      category: "developing",
      status: "Rapidly Developing",
      hangoutScore: 2,
      vibe: "Fast-settling affordable CDA residential sector on the southern edge. Compact family houses, quiet local streets, and small neighborhood shops overlooking Rawalpindi.",
      highlights: [
        "Newly inhabited residential blocks across I-14/1-4",
        "Wide unobstructed southern views over the Potohar hills and Rawalpindi",
      ],
      food: ["Local bakeries, biryani shops, and neighborhood dhabas."],
      tips: "About 7-8 km SW of H-11 via IJP / Girja link roads; quiet suburban driving.",
    },
    {
      id: "I-15",
      letter: "I",
      number: 15,
      title: "CDA Low-Cost Apartments & Revival",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "Revived CDA affordable housing and apartment sector. Active road paving, drainage work, and multi-family blocks marking Islamabad's southern expansion.",
      highlights: [
        "Large-scale CDA residential and apartment project footprint",
        "Emerging arterial links bridging I-14 and I-16",
      ],
      food: ["Very sparse right now; nearest active market is I-14 or GT Road."],
      tips: "Active construction site if you want to see new CDA housing coming up.",
    },
    {
      id: "I-16",
      letter: "I",
      number: 16,
      title: "Southern Frontier & Ring Road Link",
      category: "developing",
      status: "Active Construction",
      hangoutScore: 2,
      vibe: "Southernmost developing CDA residential edge. Windy open plateaus near the Rawalpindi Ring Road and Thalian / M-2 Motorway corridor with steady plot construction.",
      highlights: [
        "Direct proximity to M-2 Motorway (Thalian) and Ring Road alignment",
        "Open Potohar vistas far outside inner-city congestion",
      ],
      food: ["Minimal convenience stalls; carry snacks if exploring."],
      tips: "Far SW corner (~11-13 km from H-11); mainly for checking the outer Motorway-side frontier.",
    },
    {
      id: "I-17",
      letter: "I",
      number: 17,
      title: "SW Industrial / Institutional Reserve",
      category: "undeveloped",
      status: "Undeveloped / Raw",
      hangoutScore: 1,
      vibe: "Outer southwestern limit of Zone I near the M-2 Motorway. Marked on the master plan for future industrial and institutional plots; currently open Potohar land.",
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

  // Orange Line Metrobus stops along Srinagar Highway
  const METRO_STOPS = [
    { name: "Faiz Ahmed Faiz (Peshawar Morr)", lat: 33.6788, lng: 73.0448 },
    { name: "NHA Station", lat: 33.6730, lng: 73.0332 },
    { name: "G-10 / IIUI", lat: 33.6682, lng: 73.0218 },
    { name: "Police Foundation", lat: 33.6648, lng: 73.0124 },
    { name: "H-11 / G-11", lat: 33.6626, lng: 73.0022 },
    { name: "NUST / G-12 (East)", lat: 33.6572, lng: 72.9905 },
    { name: "NUST / G-12 (West)", lat: 33.6520, lng: 72.9788 },
    { name: "Golra Mor / G-13", lat: 33.6462, lng: 72.9635 },
    { name: "J&K / G-15", lat: 33.6335, lng: 72.9282 },
  ];

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
    METRO_STOPS,
    MARGALLA_RIDGES,
    RAWAL_LAKE,
    SHAKARPARIAN,
    gridToLatLng,
    latLngToGrid,
    getSubLocationsForSector,
    getDefaultSpotForSector,
  };
})();
