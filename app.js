(() => {
  const DATA = window.ISLAMABAD_DATA;
  const SVG_NS = "http://www.w3.org/2000/svg";

  // Projection constants: equal-aspect North-Up cartographic space for 1320 x 880
  const PROJ = {
    minLng: 72.795,
    maxLat: 33.778,
    cosLat: Math.cos((33.68 * Math.PI) / 180),
    scale: 4000.0,
    padX: 40,
    padY: 40,
  };

  function latLngToSvg(lat, lng) {
    const x = PROJ.padX + (lng - PROJ.minLng) * PROJ.cosLat * PROJ.scale;
    const y = PROJ.padY + (PROJ.maxLat - lat) * PROJ.scale;
    return { x, y };
  }

  // Persistence keys (unified state + legacy v1 keys for smooth migration)
  const STORAGE_STATE = "isb_dice_state_v2";
  const LEGACY_EXPLORED = "isb_dice_explored_v1";
  const LEGACY_HISTORY = "isb_dice_history_v1";
  const LEGACY_GPS = "isb_dice_gps_v1";

  const VALID_POOLS = new Set(["all", "active", "hangout", "unexplored"]);
  const VALID_SORTS = new Set(["distance", "grid", "hangout"]);

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // ignore storage errors
    }
  }

  function loadPersistedState() {
    const saved = loadJson(STORAGE_STATE, null);
    const defaultSector = DATA.DEFAULT_HOME.sectorId;
    const defaultSpot = DATA.DEFAULT_HOME.spotId;

    const base = {
      homeMode: "sector",
      homeSectorId: defaultSector,
      homeSpotId: defaultSpot,
      homeSpotBySector: { [defaultSector]: defaultSpot },
      gpsOrigin: null,
      poolMode: "all",
      rolledLetter: null,
      rolledNumber: null,
      selectedSectorId: null,
      soundEnabled: true,
      showLandmarks: true,
      focusRoute: false,
      explored: [],
      history: [],
      atlasSearch: "",
      atlasLetterFilter: "ALL",
      atlasSort: "distance",
      viewBox: { x: 0, y: 0, w: 1320, h: 880 },
    };

    if (!saved || typeof saved !== "object") {
      // Migrate legacy explored/history/gps while ensuring default Home starts at H-11/4 FAST-NUCES
      const oldExplored = loadJson(LEGACY_EXPLORED, []);
      if (Array.isArray(oldExplored)) {
        base.explored = oldExplored.filter((id) => Boolean(DATA.SECTOR_MAP[id]));
      }
      const oldHistory = loadJson(LEGACY_HISTORY, []);
      if (Array.isArray(oldHistory)) {
        base.history = oldHistory.filter((id) => Boolean(DATA.SECTOR_MAP[id])).slice(0, 8);
      }
      const oldGps = loadJson(LEGACY_GPS, null);
      if (oldGps && Number.isFinite(oldGps.lat) && Number.isFinite(oldGps.lng)) {
        base.gpsOrigin = { lat: oldGps.lat, lng: oldGps.lng };
      }
      return base;
    }

    const sectorId = DATA.SECTOR_MAP[saved.homeSectorId] ? saved.homeSectorId : defaultSector;
    const validSpots = DATA.getSubLocationsForSector(sectorId);
    const fallbackSpot = DATA.getDefaultSpotForSector(sectorId)?.id || validSpots[0]?.id || null;
    const spotId = validSpots.some((sp) => sp.id === saved.homeSpotId) ? saved.homeSpotId : fallbackSpot;

    const spotMap = {};
    if (saved.homeSpotBySector && typeof saved.homeSpotBySector === "object") {
      for (const [sid, spId] of Object.entries(saved.homeSpotBySector)) {
        if (!DATA.SECTOR_MAP[sid]) continue;
        const list = DATA.getSubLocationsForSector(sid);
        if (list.some((sp) => sp.id === spId)) {
          spotMap[sid] = spId;
        }
      }
    }
    if (spotId) spotMap[sectorId] = spotId;

    const hasValidGps =
      saved.gpsOrigin &&
      Number.isFinite(saved.gpsOrigin.lat) &&
      Number.isFinite(saved.gpsOrigin.lng);
    const gpsOrigin = hasValidGps ? { lat: saved.gpsOrigin.lat, lng: saved.gpsOrigin.lng } : null;

    const homeMode = saved.homeMode === "gps" && gpsOrigin ? "gps" : "sector";
    const selectedSectorId = DATA.SECTOR_MAP[saved.selectedSectorId] ? saved.selectedSectorId : null;
    let rolledLetter = DATA.LETTERS.includes(saved.rolledLetter) ? saved.rolledLetter : null;
    let rolledNumber = Number.isFinite(saved.rolledNumber) ? saved.rolledNumber : null;

    if (selectedSectorId) {
      rolledLetter = DATA.SECTOR_MAP[selectedSectorId].letter;
      rolledNumber = DATA.SECTOR_MAP[selectedSectorId].number;
    } else if (rolledLetter) {
      const nums = DATA.SECTORS.filter((s) => s.letter === rolledLetter).map((s) => s.number);
      if (!nums.includes(rolledNumber)) rolledNumber = null;
    } else {
      rolledNumber = null;
    }

    let viewBox = { x: 0, y: 0, w: 1320, h: 880 };
    if (
      saved.viewBox &&
      Number.isFinite(saved.viewBox.x) &&
      Number.isFinite(saved.viewBox.y) &&
      Number.isFinite(saved.viewBox.w) &&
      Number.isFinite(saved.viewBox.h) &&
      saved.viewBox.w >= 280 &&
      saved.viewBox.w <= 1480
    ) {
      viewBox = {
        x: saved.viewBox.x,
        y: saved.viewBox.y,
        w: saved.viewBox.w,
        h: (saved.viewBox.w * 880) / 1320,
      };
    }

    return {
      homeMode,
      homeSectorId: sectorId,
      homeSpotId: spotId,
      homeSpotBySector: spotMap,
      gpsOrigin,
      poolMode: VALID_POOLS.has(saved.poolMode) ? saved.poolMode : "all",
      rolledLetter,
      rolledNumber,
      selectedSectorId,
      soundEnabled: typeof saved.soundEnabled === "boolean" ? saved.soundEnabled : true,
      showLandmarks: typeof saved.showLandmarks === "boolean" ? saved.showLandmarks : true,
      focusRoute: Boolean(saved.focusRoute),
      explored: Array.isArray(saved.explored) ? saved.explored.filter((id) => Boolean(DATA.SECTOR_MAP[id])) : [],
      history: Array.isArray(saved.history) ? saved.history.filter((id) => Boolean(DATA.SECTOR_MAP[id])).slice(0, 8) : [],
      atlasSearch: typeof saved.atlasSearch === "string" ? saved.atlasSearch : "",
      atlasLetterFilter: saved.atlasLetterFilter === "ALL" || DATA.LETTERS.includes(saved.atlasLetterFilter) ? saved.atlasLetterFilter : "ALL",
      atlasSort: VALID_SORTS.has(saved.atlasSort) ? saved.atlasSort : "distance",
      viewBox,
    };
  }

  function parseHashSectorId(hashStr = window.location.hash) {
    if (!hashStr) return null;
    let raw = hashStr.replace(/^#/, "").trim();
    if (!raw) return null;
    if (raw.toLowerCase().startsWith("sector=")) {
      raw = raw.slice(7);
    }
    try {
      raw = decodeURIComponent(raw);
    } catch {
      // ignore malformed URI sequence
    }
    const clean = raw.trim().toUpperCase();
    if (DATA.SECTOR_MAP[clean]) return clean;
    const m = clean.match(/^([B-I])-?(\d{1,2})$/);
    if (m) {
      const normalized = `${m[1]}-${parseInt(m[2], 10)}`;
      if (DATA.SECTOR_MAP[normalized]) return normalized;
    }
    return null;
  }

  function syncUrlHash(sectorId) {
    const targetHash = sectorId ? `#${sectorId}` : "";
    if (window.location.hash === targetHash) return;
    try {
      const baseUrl = window.location.pathname + window.location.search;
      history.replaceState(null, "", targetHash ? `${baseUrl}${targetHash}` : baseUrl);
    } catch {
      if (targetHash) window.location.hash = targetHash;
    }
  }

  const initial = loadPersistedState();
  const initialHashSectorId = parseHashSectorId();
  if (initialHashSectorId && DATA.SECTOR_MAP[initialHashSectorId]) {
    const sec = DATA.SECTOR_MAP[initialHashSectorId];
    initial.selectedSectorId = sec.id;
    initial.rolledLetter = sec.letter;
    initial.rolledNumber = sec.number;
  }

  // App state
  const state = {
    homeMode: initial.homeMode,
    homeSectorId: initial.homeSectorId,
    homeSpotId: initial.homeSpotId,
    homeSpotBySector: initial.homeSpotBySector,
    gpsOrigin: initial.gpsOrigin,
    poolMode: initial.poolMode, // 'all' | 'active' | 'hangout' | 'unexplored'
    rolledLetter: initial.rolledLetter,
    rolledNumber: initial.rolledNumber,
    selectedSectorId: initial.selectedSectorId,
    isRolling: false,
    showLandmarks: initial.showLandmarks,
    soundEnabled: initial.soundEnabled,
    focusRoute: initial.focusRoute,
    explored: new Set(initial.explored),
    history: initial.history,
    atlasSearch: initial.atlasSearch,
    atlasLetterFilter: initial.atlasLetterFilter,
    atlasSort: initial.atlasSort,
    viewBox: initial.viewBox,
  };

  function persistState() {
    saveJson(STORAGE_STATE, {
      homeMode: state.homeMode,
      homeSectorId: state.homeSectorId,
      homeSpotId: state.homeSpotId,
      homeSpotBySector: state.homeSpotBySector,
      gpsOrigin: state.gpsOrigin,
      poolMode: state.poolMode,
      rolledLetter: state.rolledLetter,
      rolledNumber: state.rolledNumber,
      selectedSectorId: state.selectedSectorId,
      soundEnabled: state.soundEnabled,
      showLandmarks: state.showLandmarks,
      focusRoute: state.focusRoute,
      explored: Array.from(state.explored),
      history: state.history,
      atlasSearch: state.atlasSearch,
      atlasLetterFilter: state.atlasLetterFilter,
      atlasSort: state.atlasSort,
      viewBox: state.viewBox,
    });
  }

  // DOM References
  const el = {
    homeSectorSelect: document.getElementById("home-sector-select"),
    homeSpotSelect: document.getElementById("home-spot-select"),
    useGpsBtn: document.getElementById("use-gps-btn"),
    brandSubOrigin: document.getElementById("brand-sub-origin"),
    legendHomeLabel: document.getElementById("legend-home-label"),
    atlasSortDistanceOpt: document.getElementById("atlas-sort-distance-opt"),
    soundToggleBtn: document.getElementById("sound-toggle-btn"),
    soundLabel: document.getElementById("sound-label"),
    openAtlasBtn: document.getElementById("open-atlas-btn"),
    closeAtlasBtn: document.getElementById("close-atlas-btn"),
    atlasBackdrop: document.getElementById("atlas-backdrop"),
    atlasSearch: document.getElementById("atlas-search"),
    atlasLetterFilter: document.getElementById("atlas-letter-filter"),
    atlasSort: document.getElementById("atlas-sort"),
    atlasGrid: document.getElementById("atlas-grid"),

    svg: document.getElementById("islamabad-map"),
    mapStage: document.querySelector(".map-stage"),
    viewport: document.getElementById("map-viewport"),
    tooltip: document.getElementById("map-tooltip"),
    mapLegend: document.getElementById("map-legend"),
    toggleLegendBtn: document.getElementById("toggle-legend-btn"),
    mapToast: document.getElementById("map-status-toast"),
    sectorSearch: document.getElementById("sector-search"),
    searchResults: document.getElementById("search-results"),
    poolPills: document.querySelectorAll(".pool-pill"),
    toggleLandmarksBtn: document.getElementById("toggle-landmarks-btn"),
    focusRouteBtn: document.getElementById("focus-route-btn"),
    zoomInBtn: document.getElementById("zoom-in-btn"),
    zoomOutBtn: document.getElementById("zoom-out-btn"),
    resetViewBtn: document.getElementById("reset-view-btn"),

    stepPill: document.getElementById("step-pill"),
    letterDieCol: document.getElementById("letter-die-col"),
    numberDieCol: document.getElementById("number-die-col"),
    letterDie: document.getElementById("letter-die"),
    numberDie: document.getElementById("number-die"),
    letterDieVal: document.getElementById("letter-die-val"),
    numberDieVal: document.getElementById("number-die-val"),
    rollLetterBtn: document.getElementById("roll-letter-btn"),
    rollNumberBtn: document.getElementById("roll-number-btn"),
    rollBothBtn: document.getElementById("roll-both-btn"),
    resetDiceBtn: document.getElementById("reset-dice-btn"),
    letterPoolChips: document.getElementById("letter-pool-chips"),
    numberPoolChips: document.getElementById("number-pool-chips"),
    rollHistoryList: document.getElementById("roll-history-list"),

    fieldGuide: document.getElementById("field-guide"),
  };

  // ==================== Web Audio Dice FX ====================
  let audioCtx = null;
  function playTick(freq = 320, duration = 0.035, vol = 0.06, type = "triangle") {
    if (!state.soundEnabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // ignore audio blocks
    }
  }

  function playSuccessChime() {
    if (!state.soundEnabled) return;
    playTick(523.25, 0.12, 0.08, "sine");
    setTimeout(() => playTick(659.25, 0.14, 0.08, "sine"), 85);
    setTimeout(() => playTick(783.99, 0.22, 0.09, "sine"), 175);
  }

  // ==================== Distance & Route Calculations ====================
  function findNearestSector(lat, lng) {
    let best = DATA.SECTORS[0];
    let bestDist = Infinity;
    for (const s of DATA.SECTORS) {
      const d = haversineKm(lat, lng, s.lat, s.lng);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return { sector: best, distKm: bestDist };
  }

  function getCurrentOrigin() {
    if (state.homeMode === "gps" && state.gpsOrigin) {
      const near = findNearestSector(state.gpsOrigin.lat, state.gpsOrigin.lng);
      const nearTag = near.distKm < 2.2 ? `near ${near.sector.id}` : `${near.distKm.toFixed(1)} km from ${near.sector.id}`;
      return {
        id: "gps",
        sector: near.distKm < 1.3 ? near.sector.id : null,
        nearestSector: near.sector.id,
        spotId: "gps",
        spotLabel: `GPS (${state.gpsOrigin.lat.toFixed(4)}°N, ${state.gpsOrigin.lng.toFixed(4)}°E)`,
        shortLabel: "GPS",
        label: `My GPS (${nearTag})`,
        lat: state.gpsOrigin.lat,
        lng: state.gpsOrigin.lng,
        note: `Live GPS (${state.gpsOrigin.lat.toFixed(4)}°N, ${state.gpsOrigin.lng.toFixed(4)}°E · ${nearTag})`,
        isGps: true,
      };
    }

    const sec = DATA.SECTOR_MAP[state.homeSectorId] || DATA.SECTOR_MAP[DATA.DEFAULT_HOME.sectorId];
    const spots = DATA.getSubLocationsForSector(sec.id);
    const spot =
      spots.find((sp) => sp.id === state.homeSpotId) ||
      DATA.getDefaultSpotForSector(sec.id) || {
        id: `${sec.id}-center`.toLowerCase(),
        label: `${sec.id} Center`,
        shortLabel: sec.id,
        lat: sec.lat,
        lng: sec.lng,
        note: `${sec.id} · ${sec.title}`,
      };

    return {
      id: `${sec.id}:${spot.id}`,
      sector: sec.id,
      nearestSector: sec.id,
      spotId: spot.id,
      spotLabel: spot.label,
      shortLabel: spot.shortLabel || sec.id,
      label: spot.label,
      lat: spot.lat,
      lng: spot.lng,
      note: spot.note || `Sector ${sec.id} · ${sec.title}`,
      isGps: false,
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

  function bearingCompass(lat1, lng1, lat2, lng2) {
    const y = Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(((lng2 - lng1) * Math.PI) / 180);
    const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const dir = dirs[Math.round(deg / 22.5) % 16];
    return { deg: Math.round(deg), dir };
  }

  function corridorForRowTransition(r1, r2) {
    const low = Math.min(r1, r2);
    const high = Math.max(r1, r2);
    if (low <= 1 && high >= 4) return "Margalla Ave / 11th Ave → Srinagar Hwy";
    if (r2 <= 1) return "Margalla Avenue";
    if (r2 === 2) return "Khayaban-e-Iqbal (Margalla Rd)";
    if (r2 === 3) return "Jinnah Avenue / Blue Area";
    if (r2 === 4 || r2 === 5) return "Srinagar Highway";
    return "IJP Road";
  }

  function avenueForColumn(col) {
    if (col <= 5) return "Constitution Ave / Ataturk Ave";
    if (col === 6) return "7th Avenue";
    if (col === 7) return "Faisal Avenue";
    if (col === 8) return "9th Avenue";
    if (col <= 10) return "10th Avenue";
    if (col <= 12) return "11th Ave / Golra Rd";
    return "GT Road (N-5) / Western Link";
  }

  function computeTravelInfo(sec) {
    const origin = getCurrentOrigin();
    if (!origin.isGps && origin.sector && sec.id === origin.sector) {
      const intraKm = haversineKm(origin.lat, origin.lng, sec.lat, sec.lng);
      return {
        straightKm: 0,
        roadKm: 0.6,
        driveMin: "1–4 min",
        bearing: { deg: 0, dir: "HERE" },
        routeText: `You're already in <strong>${sec.id}</strong> (active start pin: <strong>${origin.spotLabel}</strong>${intraKm > 0.15 ? `, ~${intraKm.toFixed(1)} km from sector center` : ""}). Use the topbar selector to shift your pin anywhere in ${sec.id} or pick another sector.`,
      };
    }

    const straightKm = haversineKm(origin.lat, origin.lng, sec.lat, sec.lng);
    const bearing = bearingCompass(origin.lat, origin.lng, sec.lat, sec.lng);
    const originSec = DATA.SECTOR_MAP[origin.sector || origin.nearestSector];

    let roadKm;
    if (sec.letter === "B" || originSec.letter === "B" || origin.isGps) {
      roadKm = straightKm * 1.32;
    } else {
      const origGrid = DATA.latLngToGrid(origin.lat, origin.lng);
      const dr = Math.abs(sec.rowIdx - origGrid.r);
      const dc = Math.abs(sec.colIdx - origGrid.c);
      const gridKm = (dr + dc) * 1.84;
      roadKm = Math.max(straightKm * 1.18, gridKm + (dr > 0.25 && dc > 0.25 ? 0.5 : 0.2));
    }

    const minLow = Math.max(3, Math.round(roadKm * 1.35 + 2));
    const minHigh = Math.max(minLow + 3, Math.round(roadKm * 1.85 + 4));
    const driveMin = `${minLow}–${minHigh} min`;

    let routeText = "";
    const c = sec.number;
    const L = sec.letter;

    if (!origin.isGps && origin.sector === "H-11") {
      if (sec.id === "B-17") {
        routeText = "Head west on <strong>Srinagar Hwy</strong> past G-15/26 No. Chungi, then northwest on <strong>GT Road (N-5)</strong> or via <strong>Margalla Ave</strong> to Sangjani.";
      } else if (L === "I" && c <= 11) {
        routeText = "Exit south via <strong>Faqir Aipee Rd / IJP Rd</strong> toward Rawalpindi border (direct short hop from H-11).";
      } else if (L === "I" && c >= 12) {
        routeText = "Head southwest via <strong>Service Rd / IJP Rd Extension</strong> or Srinagar Hwy → GT Rd link.";
      } else if (L === "H" && c === 12) {
        routeText = "Head west along <strong>Srinagar Hwy Service Rd</strong> past Police Lines (or 1 stop on <strong>Orange Line Metro</strong> to NUST East/West).";
      } else if (L === "H" && c >= 13) {
        routeText = "Head west on <strong>Srinagar Hwy</strong> past NUST H-12; turn left at NUST Gate 2/Golra Mor approach.";
      } else if (origin.spotId === "h11-4-fast" && L === "H" && c === 10) {
        routeText = "Literally right across <strong>A.K. Brohi Rd</strong> east into H-10 (or via Srinagar Hwy Service Rd).";
      } else if (L === "H" && c <= 10) {
        routeText = "Head east along <strong>A.K. Brohi Rd / Srinagar Hwy Service Rd</strong> (or Orange Line Metro toward Peshawar Morr for H-9/H-8).";
      } else if ((L === "C" || L === "D") && c >= 12) {
        routeText = "Take <strong>Srinagar Hwy</strong> → <strong>11th Ave / Golra Rd</strong> north up to <strong>Margalla Avenue</strong>, then west along the foothills.";
      } else if (c >= 13 && (L === "E" || L === "F" || L === "G")) {
        routeText = "Cruise west straight down <strong>Srinagar Hwy</strong> (or <strong>Orange Line Metro</strong> to Golra Mor / J&K G-15).";
      } else if (c === 11 || c === 12) {
        routeText = "Head directly north across <strong>Srinagar Hwy</strong> via <strong>11th Ave / Golra Rd</strong> (or via H-11/G-11 Metro stop).";
      } else if (c >= 8 && c <= 10) {
        routeText = `Head east on <strong>Srinagar Hwy</strong>, then turn north onto <strong>${c === 10 ? "10th Avenue" : "9th Avenue"}</strong>${L === "E" || L === "F" ? " past Jinnah Ave" : ""}.`;
      } else if (c <= 7) {
        routeText = `Take <strong>Srinagar Hwy</strong> east toward Zero Point, then head north on <strong>${c === 7 ? "Faisal Ave / 7th Ave" : "7th Ave / Constitution Ave"}</strong> (or Orange Line → Red Line Metro at Peshawar Morr).`;
      } else {
        routeText = "Use <strong>Srinagar Highway</strong> as your main spine from H-11.";
      }
    } else if (sec.id === "B-17" || originSec.letter === "B") {
      routeText = `Connect via <strong>GT Road (N-5)</strong> or <strong>Margalla Avenue</strong> and <strong>Srinagar Highway</strong> (~${roadKm.toFixed(0)} km drive).`;
    } else {
      const dr = sec.rowIdx - originSec.rowIdx;
      const dc = sec.colIdx - originSec.colIdx;
      const ewSpine = corridorForRowTransition(originSec.rowIdx, sec.rowIdx);
      const nsAve = avenueForColumn(Math.abs(dc) > 0 ? sec.colIdx : originSec.colIdx);
      if (dr === 0) {
        const dirWord = dc > 0 ? "west" : "east";
        routeText = `Head ${dirWord} along <strong>${ewSpine}</strong> directly across ${Math.abs(dc)} sector${Math.abs(dc) > 1 ? "s" : ""} to <strong>${sec.id}</strong>.`;
      } else if (dc === 0) {
        const dirWord = dr > 0 ? "south" : "north";
        routeText = `Head ${dirWord} along <strong>${nsAve}</strong> directly across ${Math.abs(dr)} band${Math.abs(dr) > 1 ? "s" : ""} to <strong>${sec.id}</strong>.`;
      } else {
        const nsWord = dr > 0 ? "south" : "north";
        const ewWord = dc > 0 ? "west" : "east";
        routeText = `Travel ${ewWord} on <strong>${ewSpine}</strong> and turn ${nsWord} via <strong>${nsAve}</strong> toward <strong>${sec.id}</strong>.`;
      }
    }

    return {
      straightKm,
      roadKm,
      driveMin,
      bearing,
      routeText,
    };
  }

  // ==================== Pool Filtering ====================
  function getEligibleSectors() {
    return DATA.SECTORS.filter((s) => {
      if (state.poolMode === "active") return s.tier === "active" || s.tier === "developing";
      if (state.poolMode === "hangout") return s.hangoutScore >= 4;
      if (state.poolMode === "unexplored") return !state.explored.has(s.id);
      return true;
    });
  }

  function getEligibleLetters() {
    const set = new Set(getEligibleSectors().map((s) => s.letter));
    return DATA.LETTERS.filter((L) => set.has(L));
  }

  function getEligibleNumbersForLetter(letter) {
    if (!letter) return [];
    return getEligibleSectors()
      .filter((s) => s.letter === letter)
      .map((s) => s.number)
      .sort((a, b) => a - b);
  }

  // ==================== SVG Map Rendering ====================
  const sectorNodes = new Map();
  let sectorsLayerEl = null;
  let landmarksLayerEl = null;
  let fxLayerEl = null;
  let hoveredSectorId = null;
  let suppressClickUntil = 0;
  let gestureDragged = false;

  function svgEl(tag, attrs = {}, parent = null) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, v);
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function polyPointsStr(latLngList) {
    return latLngList
      .map((pt) => {
        const p = latLngToSvg(pt.lat, pt.lng);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");
  }

  function sectorBaseFill(sec) {
    switch (sec.category) {
      case "park":
        return "rgba(34, 197, 94, 0.2)";
      case "commercial":
        return "rgba(245, 158, 11, 0.14)";
      case "upscale":
        return "rgba(56, 189, 248, 0.14)";
      case "institutional":
        return "rgba(167, 139, 250, 0.15)";
      case "administrative":
        return "rgba(251, 113, 133, 0.15)";
      case "industrial":
        return "rgba(251, 146, 60, 0.14)";
      case "developing":
        return "rgba(45, 212, 191, 0.1)";
      case "residential":
        return "rgba(16, 185, 129, 0.12)";
      default:
        return "rgba(71, 85, 105, 0.14)";
    }
  }

  function sectorBaseStroke(sec) {
    switch (sec.category) {
      case "park":
        return "rgba(74, 222, 128, 0.45)";
      case "commercial":
        return "rgba(251, 191, 36, 0.42)";
      case "upscale":
        return "rgba(56, 189, 248, 0.42)";
      case "institutional":
        return "rgba(167, 139, 250, 0.42)";
      case "administrative":
        return "rgba(251, 113, 133, 0.42)";
      case "industrial":
        return "rgba(251, 146, 60, 0.42)";
      case "developing":
        return "rgba(45, 212, 191, 0.34)";
      case "residential":
        return "rgba(52, 211, 153, 0.38)";
      default:
        return "rgba(100, 116, 139, 0.35)";
    }
  }

  function initMap() {
    const vp = el.viewport;
    vp.innerHTML = "";
    sectorNodes.clear();

    // 1. Subtle Cartographic Graticule (static)
    const gridG = svgEl("g", { id: "grid-layer", opacity: "0.22", "pointer-events": "none" }, vp);
    for (let x = 0; x <= 1320; x += 110) {
      svgEl("line", { x1: x, y1: 0, x2: x, y2: 880, stroke: "#1e3a52", "stroke-width": 0.7, "stroke-dasharray": "3 6" }, gridG);
    }
    for (let y = 0; y <= 880; y += 110) {
      svgEl("line", { x1: 0, y1: y, x2: 1320, y2: y, stroke: "#1e3a52", "stroke-width": 0.7, "stroke-dasharray": "3 6" }, gridG);
    }

    // 2. Natural Topography: Margalla Hills & Rawal Lake & Shakarparian (static)
    const topoG = svgEl("g", { id: "topo-layer", "pointer-events": "none" }, vp);
    DATA.MARGALLA_RIDGES.forEach((ridge, idx) => {
      svgEl(
        "polygon",
        {
          points: polyPointsStr(ridge),
          fill: "url(#margalla-grad)",
          stroke: idx === 2 ? "rgba(52, 211, 153, 0.25)" : "rgba(52, 211, 153, 0.14)",
          "stroke-width": 1.1,
          "stroke-dasharray": idx === 2 ? "none" : "5 5",
        },
        topoG
      );
    });

    const margallaLabelPt = latLngToSvg(33.761, 72.978);
    const mTxt = svgEl(
      "text",
      {
        x: margallaLabelPt.x,
        y: margallaLabelPt.y,
        fill: "rgba(110, 231, 183, 0.52)",
        "font-size": "13",
        "font-weight": "700",
        "letter-spacing": "7",
        "text-anchor": "middle",
        transform: `rotate(-25 ${margallaLabelPt.x} ${margallaLabelPt.y})`,
      },
      topoG
    );
    mTxt.textContent = "MARGALLA HILLS NATIONAL PARK";

    // Rawal Lake
    svgEl(
      "polygon",
      {
        points: polyPointsStr(DATA.RAWAL_LAKE),
        fill: "rgba(14, 116, 144, 0.34)",
        stroke: "rgba(56, 189, 248, 0.4)",
        "stroke-width": 1.4,
      },
      topoG
    );
    const rlPt = latLngToSvg(33.702, 73.133);
    const rlTxt = svgEl(
      "text",
      { x: rlPt.x, y: rlPt.y, fill: "#7dd3fc", "font-size": "9.5", "font-weight": "600", "text-anchor": "middle", opacity: "0.75" },
      topoG
    );
    rlTxt.textContent = "Rawal Lake";

    // Shakarparian green wedge
    svgEl(
      "polygon",
      {
        points: polyPointsStr(DATA.SHAKARPARIAN),
        fill: "rgba(34, 197, 94, 0.14)",
        stroke: "rgba(74, 222, 128, 0.24)",
        "stroke-width": 1,
        "stroke-dasharray": "3 3",
      },
      topoG
    );
    const shakPt = latLngToSvg(33.686, 73.073);
    const sTxt = svgEl(
      "text",
      { x: shakPt.x, y: shakPt.y, fill: "rgba(134, 239, 172, 0.58)", "font-size": "8", "font-weight": "600", "text-anchor": "middle" },
      topoG
    );
    sTxt.textContent = "Shakarparian";

    // 3. Arterial Highways & Avenues (static)
    const roadsG = svgEl("g", { id: "roads-layer", "pointer-events": "none" }, vp);
    DATA.CORRIDORS.forEach((road) => {
      const pts = road.points.map((pt) => {
        const p = latLngToSvg(pt.lat, pt.lng);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      });
      svgEl(
        "polyline",
        {
          points: pts.join(" "),
          fill: "none",
          stroke: road.kind === "highway" ? "rgba(251, 191, 36, 0.32)" : "rgba(148, 176, 194, 0.22)",
          "stroke-width": road.kind === "highway" ? 2.6 : 1.3,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        },
        roadsG
      );
    });

    // Highway labels
    const srinagarLbl = latLngToSvg(33.679, 73.035);
    const srTxt = svgEl(
      "text",
      {
        x: srinagarLbl.x,
        y: srinagarLbl.y - 5,
        fill: "rgba(253, 224, 71, 0.62)",
        "font-size": "8",
        "font-weight": "700",
        "letter-spacing": "1.8",
        "text-anchor": "middle",
        transform: `rotate(-28 ${srinagarLbl.x} ${srinagarLbl.y})`,
      },
      roadsG
    );
    srTxt.textContent = "SRINAGAR HIGHWAY";

    const jinnahLbl = latLngToSvg(33.715, 73.063);
    const jnTxt = svgEl(
      "text",
      {
        x: jinnahLbl.x,
        y: jinnahLbl.y - 4,
        fill: "rgba(203, 213, 225, 0.45)",
        "font-size": "7",
        "font-weight": "600",
        "letter-spacing": "1.5",
        "text-anchor": "middle",
        transform: `rotate(-28 ${jinnahLbl.x} ${jinnahLbl.y})`,
      },
      roadsG
    );
    jnTxt.textContent = "BLUE AREA · JINNAH AVE";

    const ijpLbl = latLngToSvg(33.643, 73.044);
    const ijTxt = svgEl(
      "text",
      {
        x: ijpLbl.x,
        y: ijpLbl.y + 11,
        fill: "rgba(251, 146, 60, 0.48)",
        "font-size": "7.5",
        "font-weight": "700",
        "letter-spacing": "1.4",
        "text-anchor": "middle",
        transform: `rotate(-28 ${ijpLbl.x} ${ijpLbl.y})`,
      },
      roadsG
    );
    ijTxt.textContent = "IJP ROAD · RAWALPINDI BORDER";

    // 4. All 71 Sector Polygons (created once; state transitions toggle CSS classes)
    sectorsLayerEl = svgEl("g", { id: "sectors-layer" }, vp);

    DATA.SECTORS.forEach((sec) => {
      const centerSvg = latLngToSvg(sec.lat, sec.lng);
      const g = svgEl("g", { class: "sector-group", "data-id": sec.id }, sectorsLayerEl);

      const poly = svgEl(
        "polygon",
        {
          class: "sector-poly",
          points: polyPointsStr(sec.polygon),
          fill: sectorBaseFill(sec),
          stroke: sectorBaseStroke(sec),
          "stroke-width": 1.15,
          rx: 3,
        },
        g
      );

      // Subtle inner Markaz crosshairs on developed/commercial sectors
      if (sec.tier === "active" && sec.category !== "park") {
        svgEl("circle", { cx: centerSvg.x, cy: centerSvg.y + 8, r: 1.8, fill: "rgba(255,255,255,0.22)", "pointer-events": "none" }, g);
      }

      const lbl = svgEl("text", { class: "sector-label", x: centerSvg.x, y: centerSvg.y - 2 }, g);
      lbl.textContent = sec.id;

      const sublabel = svgEl("text", { class: "sector-sublabel", x: centerSvg.x, y: centerSvg.y + 11 }, g);

      sectorNodes.set(sec.id, { sec, group: g, poly, sublabel });
    });

    // Event delegation across all 71 sector groups
    sectorsLayerEl.addEventListener("pointerover", (e) => {
      if (e.pointerType === "touch" || gestureDragged) return;
      const g = e.target.closest(".sector-group");
      if (!g) return;
      const secId = g.dataset.id;
      if (secId !== hoveredSectorId) {
        hoveredSectorId = secId;
        const sec = DATA.SECTOR_MAP[secId];
        if (sec) showTooltip(sec, e);
      }
    });

    sectorsLayerEl.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch" || !hoveredSectorId || gestureDragged) return;
      moveTooltip(e);
    });

    sectorsLayerEl.addEventListener("pointerout", (e) => {
      if (e.pointerType === "touch") return;
      const nextG = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".sector-group") : null;
      if (!nextG) {
        hoveredSectorId = null;
        hideTooltip();
      }
    });

    sectorsLayerEl.addEventListener("click", (e) => {
      if (performance.now() < suppressClickUntil) return;
      const g = e.target.closest(".sector-group");
      if (!g) return;
      selectSectorManually(g.dataset.id);
    });

    // 5. Landmarks & Orange Line Metro Layer (created once, toggled cleanly)
    landmarksLayerEl = svgEl("g", { id: "landmarks-layer", "pointer-events": "none" }, vp);
    DATA.METRO_STOPS.forEach((stop) => {
      const p = latLngToSvg(stop.lat, stop.lng);
      svgEl("circle", { cx: p.x, cy: p.y, r: 2.5, fill: "#fb923c", stroke: "#070e15", "stroke-width": 0.9 }, landmarksLayerEl);
    });
    DATA.LANDMARKS.forEach((lm) => {
      const p = latLngToSvg(lm.lat, lm.lng);
      svgEl("circle", { cx: p.x, cy: p.y, r: 3.1, fill: "#38bdf8", stroke: "#070e15", "stroke-width": 1.1 }, landmarksLayerEl);
      const t = svgEl(
        "text",
        {
          x: p.x + (lm.dx ?? 5),
          y: p.y + (lm.dy ?? 3),
          fill: "rgba(186, 230, 253, 0.88)",
          "font-size": "7.2",
          "font-weight": "600",
          "text-anchor": lm.anchor || "start",
          style: "text-shadow: 0 1px 3px #000;",
        },
        landmarksLayerEl
      );
      t.textContent = lm.name;
    });

    // 6. Dynamic Home Radar + Active Route Trajectory Layer
    fxLayerEl = svgEl("g", { id: "fx-layer", "pointer-events": "none" }, vp);
  }

  function renderFxLayer(origin) {
    if (!fxLayerEl) return;
    fxLayerEl.innerHTML = "";

    const originPt = latLngToSvg(origin.lat, origin.lng);
    svgEl("circle", { class: "home-ring", cx: originPt.x, cy: originPt.y, r: 10 }, fxLayerEl);
    svgEl("circle", { cx: originPt.x, cy: originPt.y, r: 4.5, fill: "#34d399", stroke: "#042f2e", "stroke-width": 1.6 }, fxLayerEl);

    if (origin.isGps && originPt.x >= -20 && originPt.x <= 1340 && originPt.y >= -20 && originPt.y <= 900) {
      const gpsTxt = svgEl(
        "text",
        {
          x: originPt.x + 8,
          y: originPt.y - 6,
          fill: "#6ee7b7",
          "font-family": "var(--font-mono)",
          "font-size": "9",
          "font-weight": "700",
          style: "text-shadow: 0 1px 4px #000;",
        },
        fxLayerEl
      );
      gpsTxt.textContent = "GPS";
    }

    if (!state.selectedSectorId) return;
    const target = DATA.SECTOR_MAP[state.selectedSectorId];
    if (!target) return;

    const targetPt = latLngToSvg(target.lat, target.lng);
    svgEl("circle", { class: "beacon-ring", cx: targetPt.x, cy: targetPt.y, r: 14 }, fxLayerEl);

    if (origin.isGps || target.id !== origin.sector) {
      // Curved trajectory arc from current Home Base to target
      const midX = (originPt.x + targetPt.x) / 2;
      const midY = (originPt.y + targetPt.y) / 2;
      const dx = targetPt.x - originPt.x;
      const dy = targetPt.y - originPt.y;
      const len = Math.hypot(dx, dy) || 1;
      const curveOffset = Math.min(48, len * 0.16);
      const ctrlX = midX - (dy / len) * curveOffset;
      const ctrlY = midY + (dx / len) * curveOffset;
      const pathD = `M ${originPt.x.toFixed(1)} ${originPt.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${targetPt.x.toFixed(1)} ${targetPt.y.toFixed(1)}`;

      svgEl("path", { class: "route-line-bg", d: pathD }, fxLayerEl);
      svgEl("path", { class: "route-line-flow", d: pathD }, fxLayerEl);

      // Midpoint distance badge along the curve (at t=0.5 of quadratic bezier)
      const labelX = 0.25 * originPt.x + 0.5 * ctrlX + 0.25 * targetPt.x;
      const labelY = 0.25 * originPt.y + 0.5 * ctrlY + 0.25 * targetPt.y;
      const info = computeTravelInfo(target);
      const pillText = `${info.straightKm.toFixed(1)} km · ~${info.roadKm.toFixed(0)} km drive`;
      const pillW = pillText.length * 6.4 + 18;

      svgEl(
        "rect",
        {
          x: labelX - pillW / 2,
          y: labelY - 11,
          width: pillW,
          height: 21,
          rx: 10.5,
          fill: "rgba(9, 17, 26, 0.94)",
          stroke: "#fbbf24",
          "stroke-width": 1.3,
        },
        fxLayerEl
      );
      const badgeTxt = svgEl(
        "text",
        {
          x: labelX,
          y: labelY + 0.5,
          fill: "#fde68a",
          "font-family": "var(--font-mono)",
          "font-size": "9.5",
          "font-weight": "700",
          "text-anchor": "middle",
          "dominant-baseline": "central",
        },
        fxLayerEl
      );
      badgeTxt.textContent = pillText;
    }

    // Target pin dot
    svgEl("circle", { cx: targetPt.x, cy: targetPt.y, r: 5.5, fill: "#fbbf24", stroke: "#070e15", "stroke-width": 1.8, filter: "url(#glow-amber)" }, fxLayerEl);
  }

  function updateMapState() {
    if (!sectorsLayerEl) return;
    const eligibleIds = new Set(getEligibleSectors().map((s) => s.id));
    const origin = getCurrentOrigin();

    sectorNodes.forEach(({ sec, group, sublabel }) => {
      const isHome = !origin.isGps && sec.id === origin.sector;
      const isSelected = sec.id === state.selectedSectorId;
      const isRowLit = state.rolledLetter === sec.letter && !state.selectedSectorId;
      const isRowDimmed = Boolean(state.rolledLetter && sec.letter !== state.rolledLetter && !state.selectedSectorId);
      const isExplored = state.explored.has(sec.id);
      const isDimPool = !eligibleIds.has(sec.id) && !isSelected && !isHome;

      group.classList.toggle("home-base", isHome);
      group.classList.toggle("selected", isSelected);
      group.classList.toggle("row-lit", isRowLit);
      group.classList.toggle("row-dimmed", isRowDimmed);
      group.classList.toggle("dimmed-pool", isDimPool);

      if (isHome) {
        sublabel.textContent = "HOME";
        sublabel.style.fill = "#6ee7b7";
      } else if (isExplored) {
        sublabel.textContent = "✓";
        sublabel.style.fill = "#34d399";
      } else if (sublabel.textContent) {
        sublabel.textContent = "";
      }
    });

    if (landmarksLayerEl) {
      landmarksLayerEl.style.display = state.showLandmarks ? "" : "none";
    }

    renderFxLayer(origin);
  }

  // ==================== Map Tooltip ====================
  function showTooltip(sec, evt) {
    const origin = getCurrentOrigin();
    const isHome = !origin.isGps && sec.id === origin.sector;
    const dist = isHome ? `Home · ${origin.shortLabel}` : `${haversineKm(origin.lat, origin.lng, sec.lat, sec.lng).toFixed(1)} km straight`;
    el.tooltip.innerHTML = `
      <div class="tt-head">
        <span class="tt-code">${sec.id}</span>
        <span class="tt-dist">${dist}</span>
      </div>
      <div class="tt-title">${sec.title}</div>
      <div class="tt-status">${sec.status} · Click to inspect</div>
    `;
    el.tooltip.classList.add("visible");
    moveTooltip(evt);
  }

  function moveTooltip(evt) {
    const rect = el.svg.getBoundingClientRect();
    el.tooltip.style.left = `${evt.clientX - rect.left}px`;
    el.tooltip.style.top = `${evt.clientY - rect.top}px`;
  }

  function hideTooltip() {
    hoveredSectorId = null;
    el.tooltip.classList.remove("visible");
  }

  // ==================== Map Pan & Zoom ====================
  function getSvgMetrics() {
    const rect = el.svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const unitsPerPx = Math.max(state.viewBox.w / rect.width, state.viewBox.h / rect.height);
    const drawnW = state.viewBox.w / unitsPerPx;
    const drawnH = state.viewBox.h / unitsPerPx;
    const offX = (rect.width - drawnW) / 2;
    const offY = (rect.height - drawnH) / 2;
    return { rect, unitsPerPx, drawnW, drawnH, offX, offY };
  }

  function applyViewBox() {
    const { x, y, w, h } = state.viewBox;
    el.svg.setAttribute("viewBox", `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  }

  function zoomMap(factor, centerClient = null, shouldPersist = true) {
    const m = getSvgMetrics();
    if (!m) return;
    const rx = centerClient ? (centerClient.x - m.rect.left - m.offX) / m.drawnW : 0.5;
    const ry = centerClient ? (centerClient.y - m.rect.top - m.offY) / m.drawnH : 0.5;

    const newW = Math.max(280, Math.min(1480, state.viewBox.w * factor));
    const newH = (newW * 880) / 1320;
    const dw = state.viewBox.w - newW;
    const dh = state.viewBox.h - newH;

    state.viewBox.x += dw * rx;
    state.viewBox.y += dh * ry;
    state.viewBox.w = newW;
    state.viewBox.h = newH;
    applyViewBox();
    if (shouldPersist) persistState();
  }

  function resetMapView() {
    state.viewBox = { x: 0, y: 0, w: 1320, h: 880 };
    applyViewBox();
    persistState();
  }

  function focusOnRoute(secId) {
    const sec = DATA.SECTOR_MAP[secId];
    if (!sec) return;
    const origin = getCurrentOrigin();
    const p1 = latLngToSvg(origin.lat, origin.lng);
    const p2 = latLngToSvg(sec.lat, sec.lng);

    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const spanX = Math.max(320, (maxX - minX) * 1.9);
    const spanY = Math.max(220, (maxY - minY) * 1.9);
    let w = Math.max(spanX, (spanY * 1320) / 880);
    w = Math.min(1320, Math.max(460, w));
    const h = (w * 880) / 1320;

    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    state.viewBox = {
      x: Math.max(-40, Math.min(1360 - w, cx - w / 2)),
      y: Math.max(-40, Math.min(920 - h, cy - h / 2)),
      w,
      h,
    };
    applyViewBox();
    persistState();
  }

  // ==================== Dice Rolling Engine ====================
  function renderDiceUI() {
    const letters = getEligibleLetters();
    const allDoneUnexplored =
      state.poolMode === "unexplored" && state.explored.size === DATA.SECTORS.length && letters.length === 0;

    el.letterPoolChips.innerHTML = "";
    if (!letters.length) {
      const msg = document.createElement("span");
      msg.className = `pool-empty-msg${allDoneUnexplored ? " complete" : ""}`;
      msg.textContent = allDoneUnexplored
        ? `All ${DATA.SECTORS.length} sectors explored!`
        : "No sectors match this filter";
      el.letterPoolChips.appendChild(msg);

      if (allDoneUnexplored) {
        const showAllBtn = document.createElement("button");
        showAllBtn.type = "button";
        showAllBtn.className = "pool-chip action-chip";
        showAllBtn.textContent = "Show All (71)";
        showAllBtn.addEventListener("click", () => setPoolMode("all"));
        el.letterPoolChips.appendChild(showAllBtn);
      }
    } else {
      letters.forEach((L) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `pool-chip ${state.rolledLetter === L ? "selected-letter" : ""}`;
        btn.textContent = L;
        btn.title = `Lock Letter ${L} row`;
        btn.addEventListener("click", () => {
          if (state.isRolling) return;
          lockLetter(L);
        });
        el.letterPoolChips.appendChild(btn);
      });
    }

    const nums = getEligibleNumbersForLetter(state.rolledLetter);
    el.numberPoolChips.innerHTML = "";
    if (!letters.length && !state.rolledLetter) {
      el.numberPoolChips.innerHTML = `<span class="pool-empty-msg">Switch filter or unmark a sector</span>`;
    } else if (!state.rolledLetter) {
      el.numberPoolChips.innerHTML = `<span class="pool-empty-msg">Roll Letter first to unlock numbers</span>`;
    } else if (!nums.length) {
      const poolAdj = state.poolMode === "unexplored" ? "unexplored " : "";
      el.numberPoolChips.innerHTML = `<span class="pool-empty-msg">No ${poolAdj}sectors left in Row ${state.rolledLetter} — roll Letter again</span>`;
    } else {
      nums.forEach((n) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `pool-chip ${state.rolledNumber === n ? "selected-number" : ""}`;
        btn.textContent = n;
        btn.title = `Select ${state.rolledLetter}-${n}`;
        btn.addEventListener("click", () => {
          if (state.isRolling) return;
          finalizeSector(`${state.rolledLetter}-${n}`, true);
        });
        el.numberPoolChips.appendChild(btn);
      });
    }

    el.letterDieVal.textContent = state.rolledLetter || "?";
    el.numberDieVal.textContent = state.rolledNumber !== null ? state.rolledNumber : "?";

    el.letterDie.classList.toggle("landed-letter", Boolean(state.rolledLetter));
    el.numberDie.classList.toggle("landed-number", state.rolledNumber !== null);

    const canRollLetter = !state.isRolling && letters.length > 0;
    const canRollNumber = !state.isRolling && Boolean(state.rolledLetter) && nums.length > 0;

    el.rollLetterBtn.disabled = !canRollLetter;
    el.rollNumberBtn.disabled = !canRollNumber;
    el.rollBothBtn.disabled = !canRollLetter;
    el.rollBothBtn.classList.toggle("rolling", state.isRolling);

    el.letterDie.classList.toggle("disabled-die", !canRollLetter && !state.isRolling);
    el.numberDie.classList.toggle("disabled-die", !canRollNumber && !state.isRolling);
    el.letterDie.setAttribute("aria-disabled", String(!canRollLetter));
    el.numberDie.setAttribute("aria-disabled", String(!canRollNumber));

    el.letterDieCol.classList.toggle("active-step", !state.rolledLetter && letters.length > 0);
    el.letterDieCol.classList.toggle("locked-step", Boolean(state.rolledLetter));
    el.numberDieCol.classList.toggle("active-step", Boolean(state.rolledLetter) && state.rolledNumber === null && nums.length > 0);
    el.numberDieCol.classList.toggle("locked-step", state.rolledNumber !== null);

    if (allDoneUnexplored && !state.selectedSectorId) {
      el.stepPill.textContent = `All ${DATA.SECTORS.length} Explored!`;
      el.stepPill.classList.add("lit");
    } else if (state.selectedSectorId) {
      el.stepPill.textContent = `Selected: ${state.selectedSectorId}`;
      el.stepPill.classList.add("lit");
    } else if (state.rolledLetter && !nums.length) {
      el.stepPill.textContent = `Row ${state.rolledLetter} Empty · Roll Letter`;
      el.stepPill.classList.add("lit");
    } else if (state.rolledLetter) {
      el.stepPill.textContent = `Row ${state.rolledLetter} Lit · Step 2: Roll Number`;
      el.stepPill.classList.add("lit");
    } else {
      el.stepPill.textContent = "Step 1: Roll Letter";
      el.stepPill.classList.remove("lit");
    }

    renderHistory();
  }

  function renderHistory() {
    if (!state.history.length) {
      el.rollHistoryList.textContent = "None yet";
      return;
    }
    el.rollHistoryList.innerHTML = "";
    state.history.slice(0, 6).forEach((id) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "history-chip";
      chip.textContent = id;
      chip.addEventListener("click", () => selectSectorManually(id));
      el.rollHistoryList.appendChild(chip);
    });
  }

  function lockLetter(letter) {
    state.rolledLetter = letter;
    state.rolledNumber = null;
    state.selectedSectorId = null;
    syncUrlHash(null);
    playTick(440, 0.06, 0.07);
    renderDiceUI();
    updateMapState();
    renderFieldGuide(null);
    persistState();
    el.mapToast.textContent = `Row ${letter} illuminated! Now roll the Number die.`;
  }

  function rollLetterDie() {
    if (state.isRolling) return Promise.resolve(null);
    const pool = getEligibleLetters();
    if (!pool.length) {
      el.mapToast.textContent =
        state.poolMode === "unexplored"
          ? `All ${DATA.SECTORS.length} sectors explored! Switch filter to All (71) to keep rolling.`
          : "No eligible letters in the active filter.";
      renderDiceUI();
      return Promise.resolve(null);
    }

    state.isRolling = true;
    state.rolledNumber = null;
    state.selectedSectorId = null;
    syncUrlHash(null);
    el.letterDie.classList.add("rolling");
    renderDiceUI();

    return new Promise((resolve) => {
      let ticks = 0;
      const totalTicks = 12;
      const timer = setInterval(() => {
        ticks++;
        const preview = pool[Math.floor(Math.random() * pool.length)];
        el.letterDieVal.textContent = preview;
        playTick(240 + ticks * 16, 0.03, 0.05);
        if (ticks >= totalTicks) {
          clearInterval(timer);
          el.letterDie.classList.remove("rolling");
          const winner = pool[Math.floor(Math.random() * pool.length)];
          state.isRolling = false;
          lockLetter(winner);
          resolve(winner);
        }
      }, 65);
    });
  }

  function rollNumberDie() {
    if (state.isRolling || !state.rolledLetter) return Promise.resolve(null);
    const pool = getEligibleNumbersForLetter(state.rolledLetter);
    if (!pool.length) {
      el.mapToast.textContent = `No eligible sectors left in Row ${state.rolledLetter} — roll Letter again.`;
      renderDiceUI();
      return Promise.resolve(null);
    }

    state.isRolling = true;
    state.rolledNumber = null;
    state.selectedSectorId = null;
    syncUrlHash(null);
    el.numberDie.classList.add("rolling");
    renderDiceUI();
    updateMapState();

    return new Promise((resolve) => {
      let ticks = 0;
      const totalTicks = 14;
      const timer = setInterval(() => {
        ticks++;
        const preview = pool[Math.floor(Math.random() * pool.length)];
        el.numberDieVal.textContent = preview;
        playTick(280 + ticks * 20, 0.03, 0.055);
        if (ticks >= totalTicks) {
          clearInterval(timer);
          el.numberDie.classList.remove("rolling");
          const winner = pool[Math.floor(Math.random() * pool.length)];
          state.isRolling = false;
          const id = `${state.rolledLetter}-${winner}`;
          finalizeSector(id, true);
          resolve(id);
        }
      }, 60);
    });
  }

  async function rollBothSequence() {
    if (state.isRolling) return;
    const letter = await rollLetterDie();
    if (!letter) return;
    await new Promise((r) => setTimeout(r, 380));
    await rollNumberDie();
  }

  let mobileScrollTimer = null;

  function scrollBehaviorPref() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function maybeScrollToFieldGuide(delayMs = 100) {
    if (!window.matchMedia || !window.matchMedia("(max-width: 1020px)").matches) return;
    if (mobileScrollTimer) clearTimeout(mobileScrollTimer);
    mobileScrollTimer = setTimeout(() => {
      mobileScrollTimer = null;
      if (el.fieldGuide && typeof el.fieldGuide.scrollIntoView === "function") {
        el.fieldGuide.scrollIntoView({ behavior: scrollBehaviorPref(), block: "start" });
      }
    }, delayMs);
  }

  function scrollToMapView() {
    if (el.mapStage && typeof el.mapStage.scrollIntoView === "function") {
      el.mapStage.scrollIntoView({ behavior: scrollBehaviorPref(), block: "start" });
    }
  }

  function finalizeSector(id, addToHistory = false) {
    const sec = DATA.SECTOR_MAP[id];
    if (!sec) return;
    state.rolledLetter = sec.letter;
    state.rolledNumber = sec.number;
    state.selectedSectorId = sec.id;

    if (addToHistory) {
      state.history = [sec.id, ...state.history.filter((x) => x !== sec.id)].slice(0, 8);
      playSuccessChime();
    } else {
      playTick(540, 0.06, 0.06);
    }

    syncUrlHash(sec.id);
    renderDiceUI();
    updateMapState();
    renderFieldGuide(sec);
    if (state.focusRoute) {
      focusOnRoute(sec.id);
    }
    persistState();

    const info = computeTravelInfo(sec);
    const origin = getCurrentOrigin();
    el.mapToast.textContent =
      !origin.isGps && sec.id === origin.sector
        ? `${sec.id} · Home Base Selected (${origin.shortLabel})`
        : `${sec.id} lit up! ${info.straightKm.toFixed(1)} km ${info.bearing.dir} (~${info.roadKm.toFixed(0)} km drive from ${origin.shortLabel})`;

    maybeScrollToFieldGuide(addToHistory ? 220 : 80);
  }

  function selectSectorManually(id) {
    if (state.isRolling) return;
    finalizeSector(id, false);
  }

  function resetDice() {
    if (state.isRolling) return;
    state.rolledLetter = null;
    state.rolledNumber = null;
    state.selectedSectorId = null;
    state.focusRoute = false;
    el.focusRouteBtn.classList.remove("active");
    syncUrlHash(null);
    resetMapView();
    renderDiceUI();
    updateMapState();
    renderFieldGuide(null);
    persistState();
    el.mapToast.textContent = "Reset complete · Click any sector or roll Letter → Number";
  }

  // ==================== Field Guide Rendering ====================
  const EXTRA_NEIGHBORS = {
    "B-17": ["C-16", "D-17"],
    "C-16": ["B-17"],
    "D-17": ["B-17"],
  };

  function getAdjacentSectors(sec) {
    const neighbors = [];
    const seen = new Set();

    // Standard Doxiadis grid neighbors
    const gridCandidates = [
      { dir: "N", r: sec.rowIdx - 1, c: sec.colIdx },
      { dir: "S", r: sec.rowIdx + 1, c: sec.colIdx },
      { dir: "E", r: sec.rowIdx, c: sec.colIdx - 1 },
      { dir: "W", r: sec.rowIdx, c: sec.colIdx + 1 },
    ];
    gridCandidates.forEach(({ dir, r, c }) => {
      const match = DATA.SECTORS.find((x) => x.rowIdx === r && x.colIdx === c);
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        neighbors.push({ dir, sec: match });
      }
    });

    // Geographic approach neighbors for off-grid Zone II sectors (e.g. B-17)
    const extraIds = EXTRA_NEIGHBORS[sec.id] || [];
    extraIds.forEach((nId) => {
      const match = DATA.SECTOR_MAP[nId];
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        const { dir } = bearingCompass(sec.lat, sec.lng, match.lat, match.lng);
        neighbors.push({ dir, sec: match });
      }
    });

    return neighbors;
  }

  function renderFieldGuide(sec) {
    if (!sec) {
      const origin = getCurrentOrigin();
      const exploredCount = state.explored.size;
      const pct = Math.round((exploredCount / DATA.SECTORS.length) * 100);
      const isDefaultHome =
        state.homeMode === "sector" &&
        state.homeSectorId === DATA.DEFAULT_HOME.sectorId &&
        state.homeSpotId === DATA.DEFAULT_HOME.spotId;
      el.fieldGuide.innerHTML = `
        <div class="guide-hero">
          <div>
            <div class="sector-code-pill">${origin.shortLabel} <span class="home-tag">HOME BASE</span></div>
            <h3 class="guide-title">Ready to Roll &amp; Explore Islamabad</h3>
            <div class="badge-row">
              <span class="meta-badge status-active">${exploredCount} / ${DATA.SECTORS.length} Explored (${pct}%)</span>
              <span class="meta-badge">${origin.label}</span>
            </div>
          </div>
          ${
            !isDefaultHome
              ? `<div class="guide-top-actions"><button id="reset-home-default-btn" class="set-home-btn" type="button">Reset to H-11/4 (FAST)</button></div>`
              : ""
          }
        </div>
        <div class="telemetry-card">
          <div class="route-brief">
            <strong>Starting Point:</strong> ${origin.note}.<br />
            Roll <strong>Letter (B–I)</strong> first to light up an entire Islamabad corridor across the map, then roll <strong>Number</strong> to lock onto a sector, calculate its real distance from <strong>${origin.shortLabel}</strong>, and pull up your local guide! Use the top <strong>Home: Sector › Spot</strong> menus, <strong>GPS</strong>, or <strong>Set as Home</strong> on any sector anytime.
          </div>
        </div>
        <div class="guide-section">
          <h3>Quick Grid Cheat-Sheet</h3>
          <ul class="guide-list">
            <li><strong>B &amp; C &amp; D:</strong> Scenic Margalla foothills, D-12 / Shah Allah Ditta &amp; far-west B-17</li>
            <li><strong>E &amp; F:</strong> Trailheads, Faisal Mosque, Saidpur, Kohsar, Jinnah Super, Centaurus &amp; F-9 Park</li>
            <li><strong>G:</strong> Red Zone (G-5), historic Aabpara/Melody (G-6), PIMS (G-8), Karachi Co (G-9) &amp; G-11 cafes</li>
            <li><strong>H:</strong> University belt — AIOU, NUML &amp; Itwar Bazaar (H-9), IIUI (H-10), FAST &amp; Police Lines (H-11), NUST (H-12)</li>
            <li><strong>I:</strong> I-8 Markaz desserts/cafes, I-9 industrial dhabas, I-10 auto hub &amp; I-11 Sabzi Mandi</li>
          </ul>
        </div>
      `;
      const resetHomeBtn = document.getElementById("reset-home-default-btn");
      if (resetHomeBtn) {
        resetHomeBtn.addEventListener("click", resetDefaultHome);
      }
      return;
    }

    const origin = getCurrentOrigin();
    const info = computeTravelInfo(sec);
    const catMeta = DATA.CATEGORIES[sec.category] || { label: sec.category, color: "#94a3b8" };
    const statusTone = DATA.STATUS_META[sec.status]?.tier || "active";
    const isExplored = state.explored.has(sec.id);
    const isThisHome = origin.sector === sec.id && !origin.isGps;
    const neighbors = getAdjacentSectors(sec);

    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${sec.lat},${sec.lng}`;
    const gdirUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${sec.lat},${sec.lng}`;

    el.fieldGuide.innerHTML = `
      <div class="guide-hero">
        <div>
          <div class="sector-code-pill">
            ${sec.id}
            ${isThisHome ? '<span class="home-tag">HOME BASE</span>' : ""}
          </div>
          <h3 class="guide-title">${sec.title}</h3>
          <div class="badge-row">
            <span class="meta-badge status-${statusTone}">${sec.status}</span>
            <span class="meta-badge" style="border-color:${catMeta.color}55;color:${catMeta.color};">${catMeta.label}</span>
            <span class="meta-badge">${sec.lat.toFixed(4)}°N, ${sec.lng.toFixed(4)}°E</span>
          </div>
        </div>
        <div class="guide-top-actions">
          <button id="scroll-to-map-btn" class="back-to-map-btn" type="button">↑ View Map</button>
          <button id="set-home-btn" class="set-home-btn ${isThisHome ? "is-home" : ""}" type="button" ${isThisHome ? "disabled" : ""}>
            ${isThisHome ? "⌂ Home Base ✓" : "⌂ Set as Home"}
          </button>
          <button id="toggle-explored-btn" class="explored-btn ${isExplored ? "checked" : ""}" type="button">
            ${isExplored ? "✓ Explored" : "○ Mark Explored"}
          </button>
        </div>
      </div>

      <div class="telemetry-card">
        <div class="telemetry-metrics">
          <div class="metric-box">
            <div class="metric-label">Straight Distance</div>
            <div class="metric-val">${isThisHome ? "0.0 km" : `${info.straightKm.toFixed(1)} km ${info.bearing.dir}`}</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Approx. Road</div>
            <div class="metric-val highlight">${isThisHome ? "< 1 km" : `~${info.roadKm.toFixed(1)} km`}</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Est. Drive Time</div>
            <div class="metric-val">${info.driveMin}</div>
          </div>
        </div>
        <div class="route-brief">
          <strong>From ${origin.label}:</strong> ${info.routeText}
        </div>
      </div>

      <div class="guide-section">
        <h3>What to Expect (The Vibe)</h3>
        <p>${sec.vibe}</p>
      </div>

      <div class="guide-section">
        <h3>Nice Things to Look Out For</h3>
        <ul class="guide-list">
          ${sec.highlights.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>

      <div class="guide-section">
        <h3>Food, Chai &amp; Hangout Spots</h3>
        <ul class="guide-list">
          ${sec.food.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>

      <div class="tips-callout">
        <strong>Local Heads-Up:</strong> ${sec.tips}
      </div>

      <div class="guide-footer-links">
        <div class="neighbor-chips">
          <span class="neighbor-label">Adjacent:</span>
          ${
            neighbors.length
              ? neighbors
                  .map(
                    ({ dir, sec: nSec }) =>
                      `<button type="button" class="neighbor-btn" data-jump="${nSec.id}">${dir}: ${nSec.id}</button>`
                  )
                  .join("")
              : '<span style="font-size:0.72rem;color:var(--text-muted);">Outer edge</span>'
          }
        </div>
        <div class="external-links">
          <a class="ext-link" href="${gmapsUrl}" target="_blank" rel="noopener">Map ↗</a>
          <a class="ext-link" href="${gdirUrl}" target="_blank" rel="noopener">Directions ↗</a>
        </div>
      </div>
    `;

    const scrollToMapBtn = document.getElementById("scroll-to-map-btn");
    if (scrollToMapBtn) {
      scrollToMapBtn.addEventListener("click", scrollToMapView);
    }

    const setHomeBtn = document.getElementById("set-home-btn");
    if (setHomeBtn && !isThisHome) {
      setHomeBtn.addEventListener("click", () => {
        setHomeSector(sec.id);
      });
    }

    document.getElementById("toggle-explored-btn").addEventListener("click", () => {
      if (state.explored.has(sec.id)) state.explored.delete(sec.id);
      else state.explored.add(sec.id);
      persistState();
      renderFieldGuide(sec);
      renderDiceUI();
      updateMapState();
    });

    el.fieldGuide.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => selectSectorManually(btn.dataset.jump));
    });
  }

  // ==================== Search & Atlas Modal ====================
  function setupSearch() {
    function updateSearch() {
      const q = el.sectorSearch.value.trim().toLowerCase();
      if (!q) {
        el.searchResults.classList.remove("open");
        return;
      }
      const matches = DATA.SECTORS.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.id.replace("-", "").toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.vibe.toLowerCase().includes(q) ||
          s.highlights.some((h) => h.toLowerCase().includes(q)) ||
          s.food.some((f) => f.toLowerCase().includes(q))
      ).slice(0, 10);

      if (!matches.length) {
        el.searchResults.innerHTML = `<div class="search-result-item" style="color:var(--text-muted);cursor:default;">No matching sectors</div>`;
      } else {
        el.searchResults.innerHTML = matches
          .map(
            (s) => `
          <button type="button" class="search-result-item" data-id="${s.id}">
            <span class="search-result-code">${s.id}</span>
            <span class="search-result-title">${s.title}</span>
          </button>`
          )
          .join("");
        el.searchResults.querySelectorAll("[data-id]").forEach((btn) => {
          btn.addEventListener("click", () => {
            el.sectorSearch.value = "";
            el.searchResults.classList.remove("open");
            selectSectorManually(btn.dataset.id);
          });
        });
      }
      el.searchResults.classList.add("open");
    }

    el.sectorSearch.addEventListener("input", updateSearch);
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".map-search-wrap")) {
        el.searchResults.classList.remove("open");
      }
    });
  }

  function renderAtlas() {
    state.atlasSearch = el.atlasSearch.value;
    state.atlasLetterFilter = el.atlasLetterFilter.value;
    state.atlasSort = el.atlasSort.value;
    const q = state.atlasSearch.trim().toLowerCase();
    const letter = state.atlasLetterFilter;
    const sortBy = state.atlasSort;
    const origin = getCurrentOrigin();

    let list = DATA.SECTORS.filter((s) => {
      if (letter !== "ALL" && s.letter !== letter) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.vibe.toLowerCase().includes(q) ||
        s.highlights.some((h) => h.toLowerCase().includes(q)) ||
        s.food.some((f) => f.toLowerCase().includes(q))
      );
    }).map((s) => ({
      ...s,
      isHome: !origin.isGps && s.id === origin.sector,
      distKm: !origin.isGps && s.id === origin.sector ? 0 : haversineKm(origin.lat, origin.lng, s.lat, s.lng),
    }));

    if (sortBy === "distance") {
      list.sort((a, b) => a.distKm - b.distKm);
    } else if (sortBy === "hangout") {
      list.sort((a, b) => b.hangoutScore - a.hangoutScore || a.distKm - b.distKm);
    } else {
      list.sort((a, b) => a.rowIdx - b.rowIdx || a.colIdx - b.colIdx);
    }

    el.atlasGrid.innerHTML = list
      .map(
        (s) => `
      <button type="button" class="atlas-card" data-atlas-id="${s.id}">
        <div class="atlas-card-top">
          <span class="atlas-code">${s.id} ${state.explored.has(s.id) ? "✓" : ""}</span>
          <span class="atlas-dist">${s.isHome ? "HOME" : `${s.distKm.toFixed(1)} km`}</span>
        </div>
        <div class="atlas-name">${s.title}</div>
        <div class="atlas-desc">${s.vibe}</div>
      </button>`
      )
      .join("");

    el.atlasGrid.querySelectorAll("[data-atlas-id]").forEach((card) => {
      card.addEventListener("click", () => {
        closeAtlasModal({ restoreFocus: false });
        selectSectorManually(card.dataset.atlasId);
      });
    });
  }

  let lastFocusedBeforeAtlas = null;

  function openAtlasModal() {
    lastFocusedBeforeAtlas = document.activeElement;
    renderAtlas();
    el.atlasBackdrop.classList.add("open");
    el.atlasSearch.focus();
  }

  function closeAtlasModal({ restoreFocus = true } = {}) {
    if (!el.atlasBackdrop.classList.contains("open")) return;
    el.atlasBackdrop.classList.remove("open");
    if (
      restoreFocus &&
      lastFocusedBeforeAtlas &&
      typeof lastFocusedBeforeAtlas.focus === "function" &&
      document.contains(lastFocusedBeforeAtlas)
    ) {
      lastFocusedBeforeAtlas.focus();
    }
    lastFocusedBeforeAtlas = null;
  }

  // ==================== Home Base Management ====================
  const SERIES_LABELS = {
    B: "B-Series (Zone II)",
    C: "C-Series",
    D: "D-Series",
    E: "E-Series",
    F: "F-Series",
    G: "G-Series",
    H: "H-Series",
    I: "I-Series",
  };

  function populateHomeSectorSelect() {
    el.homeSectorSelect.innerHTML = "";

    if (state.homeMode === "gps" && state.gpsOrigin) {
      const gpsOpt = document.createElement("option");
      gpsOpt.value = "__gps__";
      gpsOpt.textContent = "GPS · Live Pin";
      el.homeSectorSelect.appendChild(gpsOpt);
    }

    DATA.LETTERS.forEach((letter) => {
      const grp = document.createElement("optgroup");
      grp.label = SERIES_LABELS[letter] || `${letter}-Series`;
      DATA.SECTORS.filter((s) => s.letter === letter).forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.id} — ${s.title}`;
        grp.appendChild(opt);
      });
      el.homeSectorSelect.appendChild(grp);
    });

    el.homeSectorSelect.value =
      state.homeMode === "gps" && state.gpsOrigin ? "__gps__" : state.homeSectorId;
  }

  function populateHomeSpotSelect() {
    el.homeSpotSelect.innerHTML = "";

    if (state.homeMode === "gps" && state.gpsOrigin) {
      const near = findNearestSector(state.gpsOrigin.lat, state.gpsOrigin.lng);
      const opt = document.createElement("option");
      opt.value = "__gps__";
      opt.textContent = `${state.gpsOrigin.lat.toFixed(4)}°N, ${state.gpsOrigin.lng.toFixed(4)}°E (near ${near.sector.id})`;
      el.homeSpotSelect.appendChild(opt);
      el.homeSpotSelect.value = "__gps__";
      el.homeSpotSelect.disabled = true;
      return;
    }

    el.homeSpotSelect.disabled = false;
    const spots = DATA.getSubLocationsForSector(state.homeSectorId);
    spots.forEach((sp) => {
      const opt = document.createElement("option");
      opt.value = sp.id;
      opt.textContent = sp.label;
      el.homeSpotSelect.appendChild(opt);
    });

    const validMatch = spots.some((sp) => sp.id === state.homeSpotId);
    if (!validMatch) {
      const fallback = DATA.getDefaultSpotForSector(state.homeSectorId);
      state.homeSpotId = fallback ? fallback.id : spots[0]?.id || null;
    }
    if (state.homeSpotId) {
      el.homeSpotSelect.value = state.homeSpotId;
    }
  }

  function syncOriginUI() {
    const origin = getCurrentOrigin();
    el.brandSubOrigin.textContent = origin.shortLabel;
    el.legendHomeLabel.textContent = `Home (${origin.shortLabel})`;
    el.atlasSortDistanceOpt.textContent = `Sort: Nearest to ${origin.shortLabel}`;
    document.title = `Islamabad Sector Dice · Explorer from ${origin.shortLabel}`;
    el.useGpsBtn.classList.toggle("active", origin.isGps);

    const sectorVal = origin.isGps ? "__gps__" : state.homeSectorId;
    if (el.homeSectorSelect.value !== sectorVal) {
      el.homeSectorSelect.value = sectorVal;
    }
    if (!origin.isGps && origin.spotId && el.homeSpotSelect.value !== origin.spotId) {
      el.homeSpotSelect.value = origin.spotId;
    }
  }

  function commitOriginChange() {
    populateHomeSectorSelect();
    populateHomeSpotSelect();
    syncOriginUI();
    persistState();
    updateMapState();
    renderFieldGuide(state.selectedSectorId ? DATA.SECTOR_MAP[state.selectedSectorId] : null);
    if (el.atlasBackdrop.classList.contains("open")) {
      renderAtlas();
    }
    if (state.focusRoute && state.selectedSectorId) {
      focusOnRoute(state.selectedSectorId);
    }
    const origin = getCurrentOrigin();
    el.mapToast.textContent = `Home Base set to ${origin.label}`;
    playTick(580, 0.07, 0.06);
  }

  function setHomeSector(sectorId) {
    if (!DATA.SECTOR_MAP[sectorId]) return;
    state.homeMode = "sector";
    state.homeSectorId = sectorId;
    const spots = DATA.getSubLocationsForSector(sectorId);
    const remembered = state.homeSpotBySector[sectorId];
    const fallback = DATA.getDefaultSpotForSector(sectorId);
    const chosenSpotId = spots.some((sp) => sp.id === remembered)
      ? remembered
      : fallback?.id || spots[0]?.id || null;
    state.homeSpotId = chosenSpotId;
    if (chosenSpotId) state.homeSpotBySector[sectorId] = chosenSpotId;
    commitOriginChange();
  }

  function setHomeSpot(spotId) {
    const spots = DATA.getSubLocationsForSector(state.homeSectorId);
    if (!spots.some((sp) => sp.id === spotId)) return;
    state.homeMode = "sector";
    state.homeSpotId = spotId;
    state.homeSpotBySector[state.homeSectorId] = spotId;
    commitOriginChange();
  }

  function resetDefaultHome() {
    state.homeMode = "sector";
    state.homeSectorId = DATA.DEFAULT_HOME.sectorId;
    state.homeSpotId = DATA.DEFAULT_HOME.spotId;
    state.homeSpotBySector[DATA.DEFAULT_HOME.sectorId] = DATA.DEFAULT_HOME.spotId;
    commitOriginChange();
  }

  function detectGpsHomeBase() {
    if (!navigator.geolocation) {
      el.mapToast.textContent = "Geolocation is not supported by this browser.";
      return;
    }
    el.mapToast.textContent = "Detecting your current GPS location...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(5);
        const lng = +pos.coords.longitude.toFixed(5);
        state.gpsOrigin = { lat, lng };
        state.homeMode = "gps";
        commitOriginChange();
        const near = findNearestSector(lat, lng);
        if (near.distKm > 30) {
          el.mapToast.textContent = `GPS set (${near.distKm.toFixed(0)} km outside Islamabad grid, nearest: ${near.sector.id})`;
        }
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Location permission denied — pick any sector and sub-location from Home."
            : "Could not read GPS location right now.";
        el.mapToast.textContent = msg;
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function setPoolMode(mode) {
    if (!VALID_POOLS.has(mode)) return;
    state.poolMode = mode;
    el.poolPills.forEach((p) => p.classList.toggle("active", p.dataset.pool === mode));
    if (state.rolledLetter && !getEligibleLetters().includes(state.rolledLetter)) {
      state.rolledLetter = null;
      state.rolledNumber = null;
      state.selectedSectorId = null;
      syncUrlHash(null);
    }
    persistState();
    renderDiceUI();
    updateMapState();
    renderFieldGuide(state.selectedSectorId ? DATA.SECTOR_MAP[state.selectedSectorId] : null);
  }

  function setupMapPointerGestures() {
    const activePointers = new Map();
    let panPointerId = null;
    let gestureMode = "none"; // "none" | "pan" | "pinch"
    let prevPinchDist = 0;
    let prevPinchMid = { x: 0, y: 0 };

    function resetGestures(shouldPersist = false) {
      const didDrag = gestureDragged;
      activePointers.clear();
      panPointerId = null;
      gestureMode = "none";
      gestureDragged = false;
      el.svg.classList.remove("is-panning");
      if (didDrag && shouldPersist) {
        persistState();
      }
    }

    el.svg.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      hideTooltip();

      activePointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        type: e.pointerType,
      });

      if (activePointers.size === 1) {
        panPointerId = e.pointerId;
        gestureMode = "pan";
        gestureDragged = false;
      } else if (activePointers.size === 2) {
        gestureMode = "pinch";
        gestureDragged = true;
        panPointerId = null;
        const pts = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        prevPinchMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        for (const pid of activePointers.keys()) {
          try {
            el.svg.setPointerCapture(pid);
          } catch {
            // ignore capture errors
          }
        }
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (!activePointers.has(e.pointerId)) return;
      const ptr = activePointers.get(e.pointerId);
      ptr.x = e.clientX;
      ptr.y = e.clientY;

      if (gestureMode === "pinch" && activePointers.size >= 2) {
        const pts = Array.from(activePointers.values());
        const currDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const currMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const m = getSvgMetrics();

        if (m) {
          state.viewBox.x -= (currMid.x - prevPinchMid.x) * m.unitsPerPx;
          state.viewBox.y -= (currMid.y - prevPinchMid.y) * m.unitsPerPx;
          if (prevPinchDist > 10 && currDist > 10) {
            zoomMap(prevPinchDist / currDist, currMid, false);
          } else {
            applyViewBox();
          }
        }

        prevPinchDist = currDist;
        prevPinchMid = currMid;
        return;
      }

      if (gestureMode === "pan" && e.pointerId === panPointerId) {
        if (!gestureDragged && Math.hypot(e.clientX - ptr.startX, e.clientY - ptr.startY) > 6) {
          gestureDragged = true;
          hideTooltip();
          el.svg.classList.add("is-panning");
          try {
            el.svg.setPointerCapture(e.pointerId);
          } catch {
            // ignore capture errors
          }
        }

        if (gestureDragged) {
          const m = getSvgMetrics();
          if (m) {
            state.viewBox.x -= (e.clientX - ptr.lastX) * m.unitsPerPx;
            state.viewBox.y -= (e.clientY - ptr.lastY) * m.unitsPerPx;
            applyViewBox();
          }
        }

        ptr.lastX = e.clientX;
        ptr.lastY = e.clientY;
      }
    });

    function onPointerEnd(e) {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.delete(e.pointerId);
      try {
        if (el.svg.hasPointerCapture && el.svg.hasPointerCapture(e.pointerId)) {
          el.svg.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore release errors
      }

      if (gestureMode === "pinch") {
        if (activePointers.size === 1) {
          const [remId, remPtr] = activePointers.entries().next().value;
          panPointerId = remId;
          remPtr.lastX = remPtr.x;
          remPtr.lastY = remPtr.y;
          gestureMode = "pan";
          return;
        }
        if (activePointers.size === 0) {
          suppressClickUntil = performance.now() + 120;
          resetGestures(true);
        }
        return;
      }

      if (gestureMode === "pan" && (e.pointerId === panPointerId || activePointers.size === 0)) {
        const wasDragged = gestureDragged;
        gestureMode = "none";
        panPointerId = null;
        gestureDragged = false;
        el.svg.classList.remove("is-panning");
        if (wasDragged) {
          suppressClickUntil = performance.now() + 120;
          persistState();
        }
      }
    }

    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("blur", () => resetGestures(true));
  }

  // ==================== Event Bindings & Init ====================
  function init() {
    initMap();
    populateHomeSectorSelect();
    populateHomeSpotSelect();
    syncOriginUI();

    // Hydrate saved toggles & toolbar controls
    el.soundToggleBtn.classList.toggle("active", state.soundEnabled);
    el.soundLabel.textContent = state.soundEnabled ? "Sound On" : "Muted";
    el.toggleLandmarksBtn.classList.toggle("active", state.showLandmarks);
    el.focusRouteBtn.classList.toggle("active", state.focusRoute);
    el.poolPills.forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.pool === state.poolMode);
    });
    el.atlasSearch.value = state.atlasSearch;
    el.atlasLetterFilter.value = state.atlasLetterFilter;
    el.atlasSort.value = state.atlasSort;

    el.homeSectorSelect.addEventListener("change", () => {
      const val = el.homeSectorSelect.value;
      if (val === "__gps__") {
        if (state.gpsOrigin) {
          state.homeMode = "gps";
          commitOriginChange();
        }
        return;
      }
      setHomeSector(val);
    });

    el.homeSpotSelect.addEventListener("change", () => {
      const val = el.homeSpotSelect.value;
      if (val && val !== "__gps__") {
        setHomeSpot(val);
      }
    });

    el.useGpsBtn.addEventListener("click", detectGpsHomeBase);

    el.soundToggleBtn.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      el.soundToggleBtn.classList.toggle("active", state.soundEnabled);
      el.soundLabel.textContent = state.soundEnabled ? "Sound On" : "Muted";
      persistState();
    });

    el.poolPills.forEach((pill) => {
      pill.addEventListener("click", () => setPoolMode(pill.dataset.pool));
    });

    // Map Zoom / Pan / Controls
    el.toggleLandmarksBtn.addEventListener("click", () => {
      state.showLandmarks = !state.showLandmarks;
      el.toggleLandmarksBtn.classList.toggle("active", state.showLandmarks);
      persistState();
      updateMapState();
    });

    if (el.toggleLegendBtn && el.mapLegend) {
      el.toggleLegendBtn.addEventListener("click", () => {
        const isOpen = el.mapLegend.classList.toggle("mobile-open");
        el.toggleLegendBtn.classList.toggle("active", isOpen);
        el.toggleLegendBtn.setAttribute("aria-expanded", String(isOpen));
        el.toggleLegendBtn.textContent = isOpen ? "Legend ▴" : "Legend ▾";
      });
    }

    el.focusRouteBtn.addEventListener("click", () => {
      state.focusRoute = !state.focusRoute;
      el.focusRouteBtn.classList.toggle("active", state.focusRoute);
      if (state.focusRoute && state.selectedSectorId) {
        focusOnRoute(state.selectedSectorId);
      } else {
        resetMapView();
      }
      persistState();
    });

    el.zoomInBtn.addEventListener("click", () => zoomMap(0.78));
    el.zoomOutBtn.addEventListener("click", () => zoomMap(1.28));
    el.resetViewBtn.addEventListener("click", () => {
      state.focusRoute = false;
      el.focusRouteBtn.classList.remove("active");
      resetMapView();
    });

    el.svg.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        hideTooltip();
        const factor = e.deltaY < 0 ? 0.88 : 1.13;
        zoomMap(factor, { x: e.clientX, y: e.clientY });
      },
      { passive: false }
    );

    setupMapPointerGestures();

    // Dice Buttons
    el.rollLetterBtn.addEventListener("click", rollLetterDie);
    el.letterDie.addEventListener("click", rollLetterDie);
    el.letterDie.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        rollLetterDie();
      }
    });

    el.rollNumberBtn.addEventListener("click", rollNumberDie);
    el.numberDie.addEventListener("click", rollNumberDie);
    el.numberDie.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        rollNumberDie();
      }
    });

    el.rollBothBtn.addEventListener("click", rollBothSequence);
    el.resetDiceBtn.addEventListener("click", resetDice);

    // Atlas Modal
    el.openAtlasBtn.addEventListener("click", openAtlasModal);
    el.closeAtlasBtn.addEventListener("click", () => closeAtlasModal());
    el.atlasBackdrop.addEventListener("click", (e) => {
      if (e.target === el.atlasBackdrop) closeAtlasModal();
    });
    el.atlasSearch.addEventListener("input", () => {
      renderAtlas();
      persistState();
    });
    el.atlasLetterFilter.addEventListener("change", () => {
      renderAtlas();
      persistState();
    });
    el.atlasSort.addEventListener("change", () => {
      renderAtlas();
      persistState();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (el.atlasBackdrop.classList.contains("open")) {
          e.preventDefault();
          closeAtlasModal();
          return;
        }
        if (el.searchResults.classList.contains("open")) {
          el.searchResults.classList.remove("open");
          el.sectorSearch.blur();
        }
      }
    });

    window.addEventListener("hashchange", () => {
      if (state.isRolling) return;
      const hashSecId = parseHashSectorId();
      if (hashSecId) {
        if (hashSecId !== state.selectedSectorId) {
          finalizeSector(hashSecId, false);
        }
      } else if (state.selectedSectorId) {
        resetDice();
      }
    });

    setupSearch();
    renderDiceUI();
    updateMapState();
    const initialSec = state.selectedSectorId ? DATA.SECTOR_MAP[state.selectedSectorId] : null;
    if (initialSec) {
      syncUrlHash(initialSec.id);
    }
    renderFieldGuide(initialSec);
    if (state.focusRoute && initialSec) {
      focusOnRoute(initialSec.id);
    } else {
      applyViewBox();
    }
    if (initialSec) {
      const origin = getCurrentOrigin();
      el.mapToast.textContent =
        !origin.isGps && initialSec.id === origin.sector
          ? `${initialSec.id} · Home Base (${origin.shortLabel})`
          : initialHashSectorId
          ? `Opened shared link ${initialSec.id} · Measuring from ${origin.shortLabel}`
          : `Restored ${initialSec.id} · Measuring from ${origin.shortLabel}`;
    } else if (state.rolledLetter) {
      el.mapToast.textContent = `Restored Row ${state.rolledLetter} · Roll Number to pick a sector`;
    }
    persistState();
  }

  init();
})();
