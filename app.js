// GOOGLE CALENDAR REAL-TIME CREDENTIALS (Enter your credentials here to sync live)
const GOOGLE_CLIENT_ID = ""; 
const GOOGLE_API_KEY = "";   
let tokenClient = null;
let gapiInited = false;
let gisInited = false;

// Speech voices preloader to fix async empty voice list issue
let speechVoices = [];
function loadSpeechVoices() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    speechVoices = window.speechSynthesis.getVoices();
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadSpeechVoices;
  loadSpeechVoices();
  setTimeout(loadSpeechVoices, 100);
}

// MULTILINGUAL STATE
let currentLanguage = 'es';

// AI COMM DECK VOICE STATE
let recognition = null;
let speechMute = false;
let isSpeaking = false;
let isListening = false;
let canvasAnimId = null;

// GOOGLE MAPS PHOTO GALLERY METADATA
const categoryPhotos = {
  'CAT_A': [
    'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400&q=80',
    'https://images.unsplash.com/photo-1580977252924-f7b57bfbbd90?w=400&q=80',
    'https://images.unsplash.com/photo-1600208151241-797746a23617?w=400&q=80'
  ],
  'CAT_B': [
    'https://images.unsplash.com/photo-1518638150341-f70b53c47374?w=400&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
    'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=400&q=80'
  ],
  'CAT_C': [
    'https://images.unsplash.com/photo-1596422846543-75c6fc18a52b?w=400&q=80',
    'https://images.unsplash.com/photo-1509057091289-40892c53f864?w=400&q=80',
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80'
  ],
  'CAT_D': [
    'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80',
    'https://images.unsplash.com/photo-1509057091289-40892c53f864?w=400&q=80',
    'https://images.unsplash.com/photo-1618330834871-dd22c2c226ca?w=400&q=80'
  ],
  'CAT_E': [
    'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=400&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&q=80'
  ]
};

// Travel Companion Sassy Remarks
const companionRemarksEs = [
  " ¡Oye, si nos perdemos en la selva, al menos tenemos buena música!",
  " ¡Me encanta cómo ruge ese escape de la Súper Catarina cuando aceleras, guapo!",
  " ¡Prométeme que no vas a intentar hacer caballitos conmigo a bordo, Gastón!",
  " ¡Uff, con este calor de Yucatán ya se antoja una parada para comer ceviche y tomarnos algo frío!",
  " ¡Vas manejando increíble, Gastón! Me da total confianza ir abrazada a ti en la moto.",
  " ¡Oye, si ves un cenote secreto, nos paramos a nadar, sin excusas!"
];

const companionRemarksEn = [
  " Hey, if we get lost in the jungle, at least we have good music!",
  " I love how that Super Catarina exhaust roars when you rev it, handsome!",
  " Promise me you won't try to pull any wheelies with me on board, Gaston!",
  " Oof, with this Yucatan heat, I'm already craving a cold drink and some ceviche!",
  " You're riding beautifully, Gaston! I feel so safe holding onto you on this bike.",
  " Hey, if we spot a secret cenote, we're stopping for a swim, no excuses!"
];

// MULTILINGUAL TRANSLATIONS DICTIONARY
const projectTranslations = {
  es: {
    systemStatus: "ESTADO DEL SISTEMA",
    satLink: "Micrófono abierto. Esperando transmisión de voz...",
    satelliteActive: "Enlace satelital de voz Gemini establecido. Listo para traducción e interacción por voz (Di: 'presión de llantas', 'holgura de cadena' o 'golpe de calor').",
    welcomeText: "Bienvenido a la aventura",
    calendarSyncTitle: "Sincronización de Expediciones Google",
    calendarSyncSub: "Sincroniza tus fechas de filmación y rutas",
    calendarDisconnected: "Google Calendar desvinculado. Inicia sesión para sincronizar fechas de grabación.",
    calendarConnected: "Google Calendar sincronizado para Gastón.",
    evacAlert: "ALERTA DE UBICACIÓN DE ALTO RIESGO",
    evacNominal: "SALA DE EMERGENCIAS CERCANA",
    rainAlertTitle: "ALERTA DE LLUVIA",
    rainAlertBody: "Pronóstico de lluvia/barro en caliza. Ajusta presión a Modo Tierra (22/25 PSI).",
    micLabel: "ACTIVAR MICRÓFONO",
    micListening: "ESCUCHANDO...",
    voiceActive: "VOZ ACTIVADA",
    voiceMuted: "VOZ SILENCIADA",
    writeQueryPlaceholder: "Escribe aquí tu consulta...",
    sendButtonLabel: "Enviar"
  },
  en: {
    systemStatus: "SYSTEM STATUS",
    satLink: "Microphone open. Waiting for voice transmission...",
    satelliteActive: "Gemini satellite voice link established. Ready for translation & voice interaction (Say: 'tire pressure', 'chain slack' or 'heatstroke').",
    welcomeText: "Welcome to the adventure",
    calendarSyncTitle: "Google Expeditions Schedule Sync",
    calendarSyncSub: "Sync your recording dates and routes",
    calendarDisconnected: "Google Calendar disconnected. Log in to sync recording dates.",
    calendarConnected: "Google Calendar synchronized for Gaston.",
    evacAlert: "HIGH RISK LOCATION ALERT",
    evacNominal: "CLOSEST EMERGENCY ROOM",
    rainAlertTitle: "RAIN ALERT",
    rainAlertBody: "Rain/mud trail forecast. Switch tires to Dirt Mode (22/25 PSI).",
    micLabel: "TAP TO SPEAK",
    micListening: "LISTENING...",
    voiceActive: "VOZ ACTIVADA",
    voiceMuted: "VOZ SILENCIADA",
    writeQueryPlaceholder: "Type your query here...",
    sendButtonLabel: "Send"
  }
};

// APP STATE MANAGEMENT
const state = {
  activeTab: 'dashboard',
  userGpsCoords: [20.6274, -87.0799], // Default starting coords
  telemetry: {
    tireMode: 'road'
  },
  callActive: false,
  callTimer: null,
  callSeconds: 0,
  activeLocation: null,
  selectedSymptom: null,
  wizardStep: 1
};

// DATA DEFINITIONS

// CATEGORIES DEFINITIONS
const categories = [
  { id: "CAT_A", name: "Secret Beach", ui_color: "#4A80F5", label: "SECRET BEACH" },
  { id: "CAT_B", name: "Cenotes", ui_color: "#34A853", label: "UNDERWORLD" },
  { id: "CAT_C", name: "Gastro", ui_color: "#FBBC05", label: "FLAVORS" },
  { id: "CAT_D", name: "Archeo", ui_color: "#34A853", label: "ANCESTRAL" },
  { id: "CAT_E", name: "History", ui_color: "#EA4335", label: "WAR & FAITH" }
];

const locations = [
  // Secret Beach (CAT_A)
  { id: "1.1", name: "P. Bete", category: "CAT_A", geo: [20.68, -87.01], distance_km: 15, risk_level: "low", story_hook: "Sand B-roll", vstrom_risk: "Loose sand", gallery: ["pb1"] },
  { id: "1.2", name: "B. Soliman", category: "CAT_A", geo: [20.27, -87.35], distance_km: 75, risk_level: "low", story_hook: "Calm water", vstrom_risk: "Paved", gallery: ["bs1"] },
  { id: "1.3", name: "Xcacel", category: "CAT_A", geo: [20.33, -87.34], distance_km: 72, risk_level: "medium", story_hook: "Turtle Nest", vstrom_risk: "No drones", gallery: ["xc1"] },
  { id: "1.4", name: "Paamul", category: "CAT_A", geo: [20.52, -87.19], distance_km: 30, risk_level: "low", story_hook: "Reef macro", vstrom_risk: "Rocky", gallery: ["pm1"] },
  { id: "1.5", name: "Chemuyil", category: "CAT_A", geo: [20.35, -87.35], distance_km: 70, risk_level: "low", story_hook: "Jungle Edge", vstrom_risk: "Hidden", gallery: ["cm1"] },
  { id: "1.6", name: "Xcalacoco", category: "CAT_A", geo: [20.67, -87.03], distance_km: 8, risk_level: "low", story_hook: "Sunset port", vstrom_risk: "Rocky", gallery: ["xl1"] },
  { id: "1.7", name: "Xpu-Ha S.", category: "CAT_A", geo: [20.47, -87.25], distance_km: 40, risk_level: "low", story_hook: "White sand", vstrom_risk: "Private", gallery: ["xp1"] },
  { id: "1.8", name: "Boca Paila", category: "CAT_A", geo: [20.10, -87.48], distance_km: 95, risk_level: "medium", story_hook: "Wooden bridge", vstrom_risk: "Sand trap", gallery: ["bp1"] },
  { id: "1.9", name: "P. Allen", category: "CAT_A", geo: [19.79, -87.48], distance_km: 140, risk_level: "high", story_hook: "Village vlog", vstrom_risk: "Fuel req", gallery: ["pa1"] },
  { id: "1.10", name: "I. Blanca", category: "CAT_A", geo: [21.37, -86.81], distance_km: 90, risk_level: "high", story_hook: "Lagoon contrast", vstrom_risk: "Muddy", gallery: ["ib1"] },

  // Cenotes (CAT_B)
  { id: "2.1", name: "Taak Bi Ha", category: "CAT_B", geo: [20.31, -87.38], distance_km: 48, risk_level: "medium", story_hook: "Roots", vstrom_risk: "Wet floor", gallery: ["th1"] },
  { id: "2.2", name: "Tajma Ha", category: "CAT_B", geo: [20.48, -87.23], distance_km: 44, risk_level: "high", story_hook: "Light rays", vstrom_risk: "Deep", gallery: ["tj1"] },
  { id: "2.3", name: "Zapote", category: "CAT_B", geo: [20.84, -87.04], distance_km: 55, risk_level: "high", story_hook: "Bells", vstrom_risk: "Jump", gallery: ["zp1"] },
  { id: "2.4", name: "Escondido", category: "CAT_B", geo: [20.18, -87.49], distance_km: 68, risk_level: "medium", story_hook: "Trek", vstrom_risk: "Humidity", gallery: ["es1"] },
  { id: "2.5", name: "Kin-Ha", category: "CAT_B", geo: [20.85, -87.03], distance_km: 56, risk_level: "medium", story_hook: "Zenith", vstrom_risk: "Dark", gallery: ["kh1"] },
  { id: "2.6", name: "Chikin Ha", category: "CAT_B", geo: [20.49, -87.22], distance_km: 45, risk_level: "medium", story_hook: "Biomes", vstrom_risk: "Walk", gallery: ["ch1"] },
  { id: "2.7", name: "Nicte-Ha", category: "CAT_B", geo: [20.31, -87.36], distance_km: 47, risk_level: "low", story_hook: "Lilies", vstrom_risk: "Clear", gallery: ["nh1"] },
  { id: "2.8", name: "Calavera", category: "CAT_B", geo: [20.22, -87.46], distance_km: 62, risk_level: "low", story_hook: "Reels", vstrom_risk: "Small", gallery: ["cv1"] },
  { id: "2.9", name: "Carwash", category: "CAT_B", geo: [20.21, -87.48], distance_km: 64, risk_level: "low", story_hook: "Garden", vstrom_risk: "Algae", gallery: ["cw1"] },
  { id: "2.10", name: "Suytun", category: "CAT_B", geo: [20.69, -88.12], distance_km: 120, risk_level: "low", story_hook: "Walkway", vstrom_risk: "Early", gallery: ["sy1"] },

  // Gastro (CAT_C)
  { id: "3.1", name: "IX CAT IK", category: "CAT_C", geo: [20.69, -88.20], distance_km: 122, risk_level: "low", story_hook: "Pib", vstrom_risk: "Valla", gallery: ["ix1"] },
  { id: "3.2", name: "D. Bates", category: "CAT_C", geo: [20.68, -88.20], distance_km: 121, risk_level: "low", story_hook: "Market", vstrom_risk: "Crowd", gallery: ["db1"] },
  { id: "3.3", name: "Tia Kaua", category: "CAT_C", geo: [20.61, -88.44], distance_km: 145, risk_level: "low", story_hook: "Smoke", vstrom_risk: "Highway", gallery: ["tk1"] },
  { id: "3.4", name: "Honorio", category: "CAT_C", geo: [20.21, -87.46], distance_km: 65, risk_level: "low", story_hook: "Lechon", vstrom_risk: "Tulum", gallery: ["th1"] },
  { id: "3.5", name: "Cetli", category: "CAT_C", geo: [20.22, -87.45], distance_km: 64, risk_level: "low", story_hook: "Mole", vstrom_risk: "Art", gallery: ["ct1"] },
  { id: "3.6", name: "Axiote", category: "CAT_C", geo: [20.62, -87.07], distance_km: 1, risk_level: "low", story_hook: "Plating", vstrom_risk: "Center", gallery: ["ax1"] },
  { id: "3.7", name: "Cochi Loka", category: "CAT_C", geo: [20.62, -87.07], distance_km: 1, risk_level: "low", story_hook: "Street", vstrom_risk: "Fast", gallery: ["cl1"] },
  { id: "3.8", name: "85 Diag", category: "CAT_C", geo: [20.64, -87.09], distance_km: 3, risk_level: "low", story_hook: "Local", vstrom_risk: "Night", gallery: ["d81"] },
  { id: "3.9", name: "Angelito", category: "CAT_C", geo: [20.65, -87.09], distance_km: 4, risk_level: "low", story_hook: "Tacos", vstrom_risk: "Morning", gallery: ["an1"] },
  { id: "3.10", name: "Yaxche", category: "CAT_C", geo: [20.62, -87.07], distance_km: 1, risk_level: "low", story_hook: "Fusion", vstrom_risk: "Visual", gallery: ["yx1"] },

  // Archeo (CAT_D)
  { id: "4.1", name: "Muyil", category: "CAT_D", geo: [20.07, -87.61], distance_km: 80, risk_level: "low", story_hook: "Canal", vstrom_risk: "SianK", gallery: ["my1"] },
  { id: "4.2", name: "Ek Balam", category: "CAT_D", geo: [20.89, -88.13], distance_km: 145, risk_level: "medium", story_hook: "Mask", vstrom_risk: "Stucco", gallery: ["eb1"] },
  { id: "4.3", name: "Coba", category: "CAT_D", geo: [20.48, -87.73], distance_km: 109, risk_level: "medium", story_hook: "Bike", vstrom_risk: "Shade", gallery: ["cb1"] },
  { id: "4.4", name: "El Meco", category: "CAT_D", geo: [21.21, -86.80], distance_km: 80, risk_level: "low", story_hook: "Temple", vstrom_risk: "Coast", gallery: ["em1"] },
  { id: "4.5", name: "Yaxunah", category: "CAT_D", geo: [20.55, -88.55], distance_km: 165, risk_level: "high", story_hook: "Sacbe", vstrom_risk: "Remote", gallery: ["yx1"] },
  { id: "4.6", name: "S. Gervasio", category: "CAT_D", geo: [20.50, -86.84], distance_km: 45, risk_level: "medium", story_hook: "Island", vstrom_risk: "Ferry", gallery: ["sg1"] },
  { id: "4.7", name: "Balancanche", category: "CAT_D", geo: [20.66, -88.52], distance_km: 150, risk_level: "medium", story_hook: "Cave", vstrom_risk: "Humidity", gallery: ["bc1"] },
  { id: "4.8", name: "Chacchoben", category: "CAT_D", geo: [19.00, -88.23], distance_km: 220, risk_level: "high", story_hook: "Forest", vstrom_risk: "South", gallery: ["cc1"] },
  { id: "4.9", name: "Dzibanche", category: "CAT_D", geo: [18.63, -88.75], distance_km: 290, risk_level: "high", story_hook: "Snake", vstrom_risk: "Remote", gallery: ["dz1"] },
  { id: "4.10", name: "Xcabal", category: "CAT_D", geo: [18.91, -88.46], distance_km: 260, risk_level: "high", story_hook: "Hidden", vstrom_risk: "New", gallery: ["xc1"] },

  // History (CAT_E)
  { id: "5.1", name: "Tihosuco", category: "CAT_E", geo: [20.19, -88.37], distance_km: 160, risk_level: "high", story_hook: "War", vstrom_risk: "Facade", gallery: ["ti1"] },
  { id: "5.2", name: "Tepich", category: "CAT_E", geo: [20.22, -88.27], distance_km: 150, risk_level: "high", story_hook: "Rebel", vstrom_risk: "History", gallery: ["tp1"] },
  { id: "5.3", name: "Uayma", category: "CAT_E", geo: [20.73, -88.31], distance_km: 130, risk_level: "low", story_hook: "Red", vstrom_risk: "Visual", gallery: ["uy1"] },
  { id: "5.4", name: "S. Bernardino", category: "CAT_E", geo: [20.68, -88.20], distance_km: 122, risk_level: "low", story_hook: "Convent", vstrom_risk: "Vault", gallery: ["sb1"] },
  { id: "5.5", name: "Izamal", category: "CAT_E", geo: [20.93, -89.01], distance_km: 180, risk_level: "medium", story_hook: "Yellow", vstrom_risk: "Walls", gallery: ["iz1"] },
  { id: "5.6", name: "Oxman", category: "CAT_E", geo: [20.66, -88.23], distance_km: 124, risk_level: "low", story_hook: "Hacienda", vstrom_risk: "Cenote", gallery: ["ox1"] },
  { id: "5.7", name: "Xocen", category: "CAT_E", geo: [20.60, -88.17], distance_km: 125, risk_level: "medium", story_hook: "Center", vstrom_risk: "Maya", gallery: ["xo1"] },
  { id: "5.8", name: "Sisal Conv", category: "CAT_E", geo: [20.69, -88.21], distance_km: 123, risk_level: "low", story_hook: "Walls", vstrom_risk: "Dark", gallery: ["sl1"] },
  { id: "5.9", name: "Yaxcopoil", category: "CAT_E", geo: [20.74, -89.72], distance_km: 210, risk_level: "medium", story_hook: "Machine", vstrom_risk: "Rust", gallery: ["yc1"] },
  { id: "5.10", name: "Mani", category: "CAT_E", geo: [20.38, -89.31], distance_km: 170, risk_level: "low", story_hook: "Codex", vstrom_risk: "Ancestral", gallery: ["mn1"] }
];

// Hotspot Mechanical Specifications
const hotspots = {
  battery: {
    title: "Battery Access & Electrical Diagnostics",
    desc: "Located directly under the main seat. To access, insert the V-Strom tool kit key, remove the seat pillion, and use a 4mm Allen key to release the battery retainer. Humid jungle air accelerates terminal oxidation; verify tightness and apply dielectric grease if experiencing instrument cluster flickering."
  },
  clutch: {
    title: "Clutch Cable Adjustment",
    desc: "V-Strom 250 SX uses a cable-operated clutch. Maintain 10-15mm of free play at the clutch lever. Adjust using the thumbwheel knurled nut at the lever assembly. Improper play will cause clutch slippage on deep sand roads, overheating the oil."
  },
  chain: {
    title: "Drive Chain Tension & Lubrication",
    desc: "Chain play specification is 20-30mm measured at the midpoint of the lower run. The high coastal salinity of Quintana Roo and Yucatan requires cleaning and lubrication every 500km. Under-tensioned chains will slap the swingarm; over-tensioned chains risk snapping on rough karst limestone."
  },
  cooling: {
    title: "Suzuki Oil Cooling System (SOCS)",
    desc: "Unlike water-cooled bikes, the V-Strom 250 SX utilizes Suzuki's proprietary oil-cooling system. It circulates oil around the cylinder head combustion chamber to keep running temperatures stable. Check oil capacity is exactly 1.2L (with filter change). Do not overfill, and ensure the cooler grill is free of jungle mud."
  }
};

// Emergency Contacts
const hospitalDatabase = {
  "Boca Paila": {
    name: "Playa del Carmen General Hospital",
    dist: "58 km",
    eta: "1 hr 12 mins",
    route: "Tulum-Boca Paila dirt road north to Highway 307. Proceed north."
  },
  "Taak Bi Ha": {
    name: "Tulum Community Hospital",
    dist: "14 km",
    eta: "18 mins",
    route: "Federal Hwy 307 South. Turn right at Avenida Coba."
  },
  "Tihosuco": {
    name: "Felipe Carrillo Puerto General Hospital",
    dist: "82 km",
    eta: "59 mins",
    route: "Highway 295 South directly to Carrillo Puerto clinic."
  }
};

// Wilderness First Aid Protocols
const firstAidProtocols = {
  heatstroke: `
    <h4>Heatstroke Management (90% Jungle Humidity)</h4>
    <p>Under high humidity, sweat cannot evaporate, halting body cooling. Core temperature exceeding 40°C is an immediate medical emergency.</p>
    <ol class="triage-steps-ol">
      <li><strong>Rapid Triage:</strong> Assess consciousness and airway. Check if skin is red, hot, and dry (classic heatstroke) or clammy.</li>
      <li><strong>Immediate Evacuation:</strong> Call 911/078 and plot evacuation to the nearest medical clinic.</li>
      <li><strong>Aggressive Cooling:</strong> Move rider to shade. Strip motorcycle gear. Pour water over torso and head. Fan vigorously.</li>
      <li><strong>Hydration:</strong> Do NOT force fluid if rider is semi-conscious. If alert, sip cool water with oral rehydration electrolytes.</li>
    </ol>
  `,
  jellyfish: `
    <h4>Jellyfish Sting Protocol (CAT_A Coastal Areas)</h4>
    <p>Stings from Caribbean cnidarians like the Sea Wasp (Box Jellyfish relative) can cause severe systemic reactions.</p>
    <ol class="triage-steps-ol">
      <li><strong>Prevent Nematocyst Discharge:</strong> Do NOT wash with fresh water (this causes stings to fire venom). Wash only with seawater or vinegar.</li>
      <li><strong>Tentacle Removal:</strong> Gently scrape tentacles off using a plastic card (like a driver's license). Do not rub with bare hands.</li>
      <li><strong>Pain Management:</strong> Immerse the area in hot water (40-45°C) or apply hot packs for 20 minutes to denature the protein venom.</li>
      <li><strong>Allergic Monitoring:</strong> Administer oral antihistamines. Watch for anaphylaxis (breathing issues, chest tightness).</li>
    </ol>
  `,
  limestone: `
    <h4>Limestone Abrasion Protocol (CAT_B & Jungle Trails)</h4>
    <p>Limestone cuts are highly prone to infection due to porous rock containing bacteria, dirt, and organic matter.</p>
    <ol class="triage-steps-ol">
      <li><strong>Hemostasis:</strong> Apply direct pressure with sterile gauze from the kit. Use a tourniquet ONLY in cases of severe arterial bleeding.</li>
      <li><strong>Deep Wound Irrigation:</strong> Flush the cut with pressurized clean water. Use a syringe if available to wash limestone dust from inside the skin layers.</li>
      <li><strong>Disinfection:</strong> Clean with antiseptic solution (avoid pure alcohol directly in the wound as it kills cells).</li>
      <li><strong>Dress & Monitor:</strong> Apply burn gel or antibiotic ointment and cover. Inspect daily for jungle fever or local redness.</li>
    </ol>
  `
};

// INITIALIZATION
let map = null;
let markers = [];
let googleHybridLayer = null;
let googleRoadsLayer = null;
let darkCommandLayer = null;
let userGpsMarker = null;
let userGpsAccuracyCircle = null;
let activeExpeditionRoute = null;
let activeBestRoute = null;

document.addEventListener('DOMContentLoaded', () => {
  // Start dynamic time updater
  try {
    initClock();
  } catch (e) {
    console.error("initClock failed:", e);
  }
  
  // Set default first-aid pane
  try {
    showTriage('heatstroke');
  } catch (e) {
    console.error("showTriage failed:", e);
  }
  
  // Set default hotspot details
  try {
    showHotspot('cooling');
  } catch (e) {
    console.error("showHotspot failed:", e);
  }

  // Tab Setup
  try {
    setupTabs();
  } catch (e) {
    console.error("setupTabs failed:", e);
  }

  // Initialize Route Planner Dropdowns
  try {
    initRoutePlanner();
  } catch (e) {
    console.error("initRoutePlanner failed:", e);
  }

  // Attach radio track changer programmatically
  try {
    const radioSelect = document.getElementById('radio-track-select');
    if (radioSelect) {
      radioSelect.addEventListener('change', onRadioTrackChange);
    }
  } catch (e) {
    console.error("radioSelect failed:", e);
  }

  try {
    const loadBtn = document.getElementById('load-playlist-btn');
    if (loadBtn) {
      loadBtn.addEventListener('click', loadCustomPlaylist);
    }
  } catch (e) {
    console.error("loadBtn failed:", e);
  }

  // Load custom playlist if saved in local storage
  try {
    const savedPlaylist = localStorage.getItem('negocioup_custom_playlist');
    if (savedPlaylist) {
      const iframe = document.getElementById('radio-iframe');
      if (iframe) {
        iframe.src = `https://www.youtube.com/embed/videoseries?list=${savedPlaylist}&enablejsapi=1&controls=1`;
      }
      const customInput = document.getElementById('custom-playlist-input');
      if (customInput) {
        customInput.placeholder = "Playlist activa...";
      }
    }
  } catch (e) {
    console.error("load custom playlist failed:", e);
  }
  
  // Render Locations List
  try {
    renderLocations('ALL');
  } catch (e) {
    console.error("renderLocations failed:", e);
  }

  // Calculate Sun positions
  try {
    calculateGoldenHour();
  } catch (e) {
    console.error("calculateGoldenHour failed:", e);
  }

  // Populate YouTube script location selector dynamically
  try {
    const scriptSelect = document.getElementById('script-location');
    if (scriptSelect) {
      scriptSelect.innerHTML = '';
      locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc.name;
        opt.textContent = `${loc.name} (${loc.id})`;
        scriptSelect.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("scriptSelect failed:", e);
  }

  // Initialize speech recognition
  try {
    initSpeechRecognition();
  } catch (e) {
    console.error("initSpeechRecognition failed:", e);
  }
  
  try {
    setTimeout(() => {
      const canvas = document.getElementById('waveform-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(226, 27, 27, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
    }, 500);
  } catch (e) {
    console.error("waveform canvas failed:", e);
  }

  // Run preloader script
  try {
    runPreloader();
  } catch (e) {
    console.error("runPreloader failed:", e);
    // Absolute fallback: remove preloader directly if everything fails
    const preloader = document.getElementById('app-preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => preloader.remove(), 600);
    }
  }

  // Initialize Smartwatch simulation loop
  try {
    let watchSeconds = 2718; // 00:45:18 start
    let watchCalories = 242;
    setInterval(() => {
      watchSeconds++;
      const hours = String(Math.floor(watchSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((watchSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(watchSeconds % 60).padStart(2, '0');
      const cronoEl = document.getElementById('watch-crono-time');
      if (cronoEl) cronoEl.textContent = `${hours}:${mins}:${secs}`;
      
      const hrEl = document.getElementById('watch-heart-rate');
      if (hrEl) {
        const hr = Math.round(75 + Math.random() * 10);
        hrEl.innerHTML = `${hr} <span style="font-size: 1rem; font-weight: normal; color: var(--text-muted);">BPM</span>`;
      }
      
      if (watchSeconds % 10 === 0) {
        watchCalories += Math.round(Math.random() * 2);
        const calEl = document.getElementById('watch-calories');
        if (calEl) calEl.textContent = `${watchCalories} kcal`;
      }
    }, 1000);
  } catch (e) {
    console.error("smartwatch simulation failed:", e);
  }
});

// PRELOADER LOADER SYSTEM & LAZY INITIALIZATION FOR SPEED
function runPreloader() {
  // Defer map rendering slightly to prevent blocking initial FCP paint
  setTimeout(() => {
    try {
      initMap();
    } catch (e) {
      console.error("initMap failed:", e);
    }
  }, 300);

  // Exact 5 seconds animation duration, then automatically enter and speak welcome
  setTimeout(() => {
    try {
      startAppWelcome();
    } catch (e) {
      console.error("startAppWelcome failed:", e);
      // Absolute fallback: remove preloader directly
      const preloader = document.getElementById('app-preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.pointerEvents = 'none';
        setTimeout(() => preloader.remove(), 600);
      }
    }
  }, 5000);
}

// CLOCK
function initClock() {
  const timeEl = document.getElementById('current-time');
  
  function updateTime() {
    const now = new Date();
    // Offset simulated time to show Yucatan time matching timezone: -05:00
    const offsetTime = new Date(now.getTime());
    let hours = String(offsetTime.getHours()).padStart(2, '0');
    let minutes = String(offsetTime.getMinutes()).padStart(2, '0');
    let seconds = String(offsetTime.getSeconds()).padStart(2, '0');
    timeEl.textContent = `${hours}:${minutes}:${seconds}`;
  }
  
  updateTime();
  setInterval(updateTime, 1000);
}

// TABS SYSTEM
function setupTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(t => t.classList.remove('active'));
      
      item.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
      
      // Update Title
      if (targetTab === 'dashboard') pageTitle.textContent = 'Command Dashboard';
      else if (targetTab === 'mechanics') pageTitle.textContent = 'Mechanical Manual';
      else if (targetTab === 'safety') pageTitle.textContent = 'First Aid & Emergency';
      else if (targetTab === 'locations') {
        pageTitle.textContent = 'Yucatan Route Explorer';
        // Force Leaflet map resize fix when tab becomes visible
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 100);
      }
      else if (targetTab === 'content') pageTitle.textContent = 'Shooting Pro Engine';
      else if (targetTab === 'ai-deck') pageTitle.textContent = 'Ai partner';
      
      state.activeTab = targetTab;
    });
  });
}

// MAP COMPONENT
function initMap() {
  try {
    if (typeof L === 'undefined') {
      console.warn("Leaflet map library is not loaded. Map services are in offline/fallback mode.");
      const element = document.getElementById('leaflet-map-element');
      if (element) {
        element.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 480px; background: #030306; color: var(--text-muted); font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 8px;">
            <span>🛰️ INTERACTIVE SATELLITE MAP ENGINE - OFFLINE/FALLBACK MODE</span>
          </div>`;
      }
      return;
    }

    // Center near Tulum, Quintana Roo
    map = L.map('leaflet-map-element', {
      center: [20.25, -87.8],
      zoom: 9,
      zoomControl: true,
      attributionControl: false
    });

    // 1. Google Satellite Hybrid (Google Earth style)
    googleHybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20
    });

    // 2. Google Road Map (Detailed routes/highways)
    googleRoadsLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20
    });

    // 3. Dark Command Map Tiles
    darkCommandLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    });

    // Set default active layer (Google Earth)
    googleHybridLayer.addTo(map);

    // Custom icon creator
    function getCustomIcon(color) {
      return L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
    }

    // Draw markers
    locations.forEach(loc => {
      const catObj = categories.find(c => c.id === loc.category);
      const pinColor = catObj ? catObj.ui_color : '#E21B1B';

      const marker = L.marker(loc.geo, { icon: getCustomIcon(pinColor) })
        .addTo(map)
        .bindPopup(`<strong>${loc.name}</strong><br>${loc.story_hook}`);
      
      marker.on('click', () => {
        selectLocation(loc.id);
      });

      markers.push({ id: loc.id, category: loc.category, marker: marker });
    });

    // Start live Geolocation tracking
    startLiveGpsTracking();

    // Trigger initial route draw and weather fetch after map is ready
    calculateExpeditionRoute();
  } catch (err) {
    console.warn("Map initialization encountered an error:", err);
  }
}

// TOGGLE MAP TILES OVERLAY
function switchMapLayer(layerType) {
  if (!map) return;

  // Remove existing tile layers
  map.removeLayer(googleHybridLayer);
  map.removeLayer(googleRoadsLayer);
  map.removeLayer(darkCommandLayer);

  // Deactivate selector buttons
  document.getElementById('btn-layer-hybrid').classList.remove('active');
  document.getElementById('btn-layer-roads').classList.remove('active');
  document.getElementById('btn-layer-dark').classList.remove('active');

  // Activate selected layer
  const mapElement = document.getElementById('leaflet-map-element');
  if (layerType === 'hybrid') {
    googleHybridLayer.addTo(map);
    document.getElementById('btn-layer-hybrid').classList.add('active');
    mapElement.classList.remove('dark-map-tiles');
  } else if (layerType === 'roads') {
    googleRoadsLayer.addTo(map);
    document.getElementById('btn-layer-roads').classList.add('active');
    mapElement.classList.remove('dark-map-tiles');
  } else if (layerType === 'dark') {
    darkCommandLayer.addTo(map);
    document.getElementById('btn-layer-dark').classList.add('active');
    mapElement.classList.add('dark-map-tiles');
  }
}

// LIVE GPS TRACKING
function startLiveGpsTracking() {
  if (!navigator.geolocation || !map) return;

  navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      // Store in state
      state.userGpsCoords = [lat, lng];

      // Update telemetry GPS coordinate indicator in the header
      document.getElementById('gps-coords').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      // Update Dashboard Route Planner starting point
      const gpsStartCoords = document.getElementById('gps-coords-start');
      const startLocText = document.getElementById('start-location-text');
      if (gpsStartCoords && startLocText) {
        gpsStartCoords.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        startLocText.textContent = "GPS Satellite Lock Active";
      }

      const miniMapFrame = document.getElementById('dashboard-mini-map');
      if (miniMapFrame) {
        miniMapFrame.src = `https://maps.google.com/maps?q=${lat},${lng}&z=12&output=embed`;
      }

      // Recalculate route parameters
      calculateExpeditionRoute();

      // Setup/Move GPS Marker on map
      const radarIcon = L.divIcon({
        className: 'gps-radar-pin',
        html: `<div class="gps-pulse-outer"><div class="gps-pulse-inner"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (userGpsMarker) {
        userGpsMarker.setLatLng([lat, lng]);
        userGpsAccuracyCircle.setLatLng([lat, lng]);
        userGpsAccuracyCircle.setRadius(accuracy);
      } else {
        userGpsMarker = L.marker([lat, lng], { icon: radarIcon }).addTo(map);
        userGpsAccuracyCircle = L.circle([lat, lng], {
          radius: accuracy,
          color: '#E21B1B',
          fillColor: '#E21B1B',
          fillOpacity: 0.12,
          weight: 1,
          dashArray: '3, 3'
        }).addTo(map);

        // Center map to user position on initial lock
        map.setView([lat, lng], 12);
      }
    },
    (error) => {
      console.warn("Real-time GPS lock denied or unavailable: ", error.message);
      document.getElementById('gps-coords').textContent = "YUCATAN, MX";
      const gpsStartCoords = document.getElementById('gps-coords-start');
      const startLocText = document.getElementById('start-location-text');
      if (gpsStartCoords && startLocText) {
        gpsStartCoords.textContent = "20.6274, -87.0799 (Fallback)";
        startLocText.textContent = "Playa del Carmen Baseline";
      }
      state.userGpsCoords = [20.6274, -87.0799];
      calculateExpeditionRoute();
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    }
  );
}

// LOCATION SELECTION
function selectLocation(id) {
  const loc = locations.find(l => l.id === id);
  if (!loc) return;

  state.activeLocation = loc;

  // Sync Route Planner dropdowns with selected location
  const catSelect = document.getElementById('route-category-select');
  const locSelect = document.getElementById('route-location-select');
  if (catSelect && locSelect) {
    catSelect.value = loc.category;
    
    // Repopulate locSelect with the locations in this category
    locSelect.innerHTML = '';
    const filteredLocs = locations.filter(l => l.category === loc.category);
    filteredLocs.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = `${l.name} (${l.distance_km}km from baseline)`;
      locSelect.appendChild(opt);
    });
    locSelect.value = loc.id;
  }

  // Highlight list item
  const items = document.querySelectorAll('.location-item');
  items.forEach(item => {
    if (item.getAttribute('data-id') === id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Center Map on Location
  if (map) {
    map.setView(loc.geo, 12, { animate: true });
    // Find active marker and open its popup
    const markerObj = markers.find(m => m.id === id);
    if (markerObj) markerObj.marker.openPopup();
  }

  // Render Google-Maps-based photo gallery
  const photos = categoryPhotos[loc.category] || categoryPhotos['CAT_A'];
  let galleryHtml = '<div class="location-gallery">';
  photos.forEach((url, index) => {
    galleryHtml += `
      <div class="gallery-photo-frame">
        <img src="${url}" class="gallery-photo" alt="${loc.name} photo ${index + 1}">
      </div>`;
  });
  galleryHtml += '</div>';

  // Translate Card Labels
  const labels = {
    risk: currentLanguage === 'es' ? 'Riesgo V-Strom' : 'V-Strom Risk',
    alert: currentLanguage === 'es' ? 'Alerta de Aventura V-Strom' : 'V-Strom Adventure Alert',
    earth: currentLanguage === 'es' ? 'Google Earth Drone Prompt' : 'Google Earth Drone Prompt',
    Mayan: currentLanguage === 'es' ? 'Relato Histórico Maya' : 'Mayan Historical Story Hook',
    photosTitle: currentLanguage === 'es' ? 'Galería de Google Maps' : 'Google Maps Photos'
  };

  // Update Detail Card
  const detailsContainer = document.getElementById('active-location-card');
  if (detailsContainer) {
    detailsContainer.innerHTML = `
      <div class="location-detail-content">
        <div class="detail-header-row">
          <div>
            <h3>${loc.name}</h3>
            <span>ID: ${loc.id} • Coords: ${loc.geo[0]}, ${loc.geo[1]}</span>
          </div>
          <span class="risk-pill risk-${loc.risk_level}">${labels.risk}: ${loc.risk_level}</span>
        </div>
        <div class="detail-body-grid">
          <div class="detail-block">
            <h5>${labels.alert}</h5>
            <p>${loc.vstrom_risk}</p>
          </div>
          <div class="detail-block">
            <h5>${labels.earth}</h5>
            <p>${loc.earth_prompt}</p>
          </div>
          <div class="detail-block col-span-2">
            <h5>${labels.Mayan}</h5>
            <p><strong>${loc.story_hook}</strong> ${loc.historical_notes}</p>
          </div>
        </div>
        <div style="margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div>
            <h5 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 6px;">${labels.photosTitle}</h5>
            ${galleryHtml}
          </div>
          <div>
            <h5 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 6px;">Google Street View 360°</h5>
            <div style="width: 100%; height: 90px; border-radius: 6px; border: 1px solid var(--border-color); overflow: hidden; background: #000;">
              <iframe src="https://maps.google.com/maps?q=${loc.geo[0]},${loc.geo[1]}&cbll=${loc.geo[0]},${loc.geo[1]}&layer=c&cbp=12,0,0,0,0&output=embed" width="100%" height="100%" style="border: 0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Update YouTube Selector
  const scriptSelect = document.getElementById('script-location');
  if (scriptSelect) {
    scriptSelect.value = loc.name;
  }

  // Draw route and calculate stats
  calculateExpeditionRoute();

  // Trigger Gemini Expert real-time terrain & mechanical monitoring advice based on the selected location
  let aiAdvice = "";
  if (loc.category === 'CAT_A') {
    aiAdvice = currentLanguage === 'es'
      ? `• Coasts: ${loc.name}.\\n• Terreno: ${loc.vstrom_risk}.\\n• Toma: ${loc.story_hook}.\\n• Llantas: 22F/25R Dirt.\\n• Lubricar cadena diario cerca del mar.\\n• Asiento: 835mm - verificar inclinación de suelo.`
      : `• Coasts: ${loc.name}.\\n• Terrain: ${loc.vstrom_risk}.\\n• Shoot: ${loc.story_hook}.\\n• Tires: 22F/25R Dirt.\\n• Lube chain daily near salt water.\\n• Seat: 835mm - check ground slope.`;
  } else if (loc.category === 'CAT_B') {
    aiAdvice = currentLanguage === 'es'
      ? `• Underworld: ${loc.name}.\\n• Terreno: ${loc.vstrom_risk}.\\n• Toma: ${loc.story_hook}.\\n• Llantas: 22F/25R Dirt.\\n• Caliza resbaladiza - usar primera marcha.\\n• Hidratación: 1L por hora en selva.`
      : `• Underworld: ${loc.name}.\\n• Terrain: ${loc.vstrom_risk}.\\n• Shoot: ${loc.story_hook}.\\n• Tires: 22F/25R Dirt.\\n• Slippery limestone - use 1st gear.\\n• Hydrate: 1L per hour in jungle.`;
  } else if (loc.category === 'CAT_C') {
    aiAdvice = currentLanguage === 'es'
      ? `• Flavors: ${loc.name}.\\n• Terreno: ${loc.vstrom_risk}.\\n• Toma: ${loc.story_hook}.\\n• Llantas: 29F/33R Road.\\n• Estacionar firme en calzada urbana.\\n• Evitar golpe calor - hidratar.`
      : `• Flavors: ${loc.name}.\\n• Terrain: ${loc.vstrom_risk}.\\n• Shoot: ${loc.story_hook}.\\n• Tires: 29F/33R Road.\\n• Park securely in city center.\\n• Avoid heatstroke - keep hydrating.`;
  } else if (loc.category === 'CAT_D') {
    aiAdvice = currentLanguage === 'es'
      ? `• Ancestral: ${loc.name}.\\n• Terreno: ${loc.vstrom_risk}.\\n• Toma: ${loc.story_hook}.\\n• Llantas: 25F/28R Mix.\\n• Autopista larga - crucero 100km/h.\\n• Calor extremo: parar bajo la sombra.`
      : `• Ancestral: ${loc.name}.\\n• Terrain: ${loc.vstrom_risk}.\\n• Shoot: ${loc.story_hook}.\\n• Tires: 25F/28R Mix.\\n• Long highway - cruise at 100km/h.\\n• Extreme heat: rest in shade.`;
  } else if (loc.category === 'CAT_E') {
    aiAdvice = currentLanguage === 'es'
      ? `• War & Faith: ${loc.name}.\\n• Terreno: ${loc.vstrom_risk}.\\n• Toma: ${loc.story_hook}.\\n• Llantas: 25F/28R Mix.\\n• Vibración fuerte - revisar pernos.\\n• Kit de trauma y primeros auxilios.`
      : `• War & Faith: ${loc.name}.\\n• Terrain: ${loc.vstrom_risk}.\\n• Shoot: ${loc.story_hook}.\\n• Tires: 25F/28R Mix.\\n• High vibration - check all bolts.\\n• Trauma and first-aid kit ready.`;
  }

  addAiMessage('system', aiAdvice);
  // speakAiResponse suppressed per AUDIO policy (only on specific user request)

  // Update bottom ticker marquee dynamically with active destination fuel/mechanics/tires status
  try {
    const tickerEl = document.getElementById('ticker-telemetry-data');
    const tickerDupEl = document.getElementById('ticker-telemetry-data-dup');
    if (tickerEl && tickerDupEl) {
      const tirePsi = loc.category === 'CAT_A' || loc.category === 'CAT_B' ? "22F/25R Dirt" : "29F/33R Road";
      const fuelEl = document.getElementById('metric-fuel-liters');
      const fuelVal = fuelEl ? fuelEl.textContent : "0 L";
      const remainingEl = document.getElementById('metric-km-remaining');
      const remainingVal = remainingEl ? remainingEl.textContent : "0 km";
      const msg = `🤖 GEMINI CO-PILOT: ONLINE // EXPEDITION: ${loc.name.toUpperCase()} [${loc.geo[0]}, ${loc.geo[1]}] // TIRE PSI: ${tirePsi} // OIL: 1.2L 10W40 // CHAIN: 20-30MM // DISTANCE: ${remainingVal} // FUEL: ${fuelVal} // SLOPE: slope OK // STATUS: ONLINE`;
      tickerEl.textContent = msg;
      tickerDupEl.textContent = msg;
    }
  } catch (err) {
    console.error("Bottom ticker update failed:", err);
  }
}

// LOCATION FILTERING
function filterLocations(cat) {
  // Update UI buttons
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    const clickAttr = btn.getAttribute('onclick');
    if (clickAttr && String(clickAttr).includes(cat)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Render list
  renderLocations(cat);

  // Toggle map markers
  markers.forEach(m => {
    if (cat === 'ALL' || m.category === cat) {
      map.addLayer(m.marker);
    } else {
      map.removeLayer(m.marker);
    }
  });
}

function renderLocations(cat) {
  const container = document.getElementById('locations-list');
  if (!container) return;
  container.innerHTML = '';

  const filtered = locations.filter(l => cat === 'ALL' || l.category === cat);

  filtered.forEach(loc => {
    const item = document.createElement('div');
    item.className = 'location-item';
    if (state.activeLocation && state.activeLocation.id === loc.id) {
      item.classList.add('active');
    }
    item.setAttribute('data-id', loc.id);
    
    // ULTRA_COMPACT layout (font-size: 8pt / 10px, horizontal header, bullet points, no extra whitespace)
    item.innerHTML = `
      <div class="loc-card-body" style="display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal; font-size: 8.5pt; padding: 2px 0; max-height: 120px; overflow: hidden;">
        <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: var(--primary);">
          <span>📍</span>
          <span style="font-size: 9pt; text-transform: uppercase;">${loc.name}</span>
        </div>
        <div style="padding-left: 14px; display: flex; flex-direction: column; gap: 1px; color: var(--text-muted); font-size: 8pt; line-height: 1.15;">
          <span>• GPS: ${loc.geo[0].toFixed(2)}, ${loc.geo[1].toFixed(2)}</span>
          <span style="color: #fff;">• 🎬 ${loc.story_hook}</span>
          <span style="color: #FBBC05;">• ⚠️ ${loc.vstrom_risk}</span>
        </div>
      </div>
    `;

    item.addEventListener('click', () => selectLocation(loc.id));
    container.appendChild(item);
  });
}

// INITIALIZE ROUTE PLANNER
function initRoutePlanner() {
  state.userGpsCoords = [20.6274, -87.0799]; // Playa del Carmen fallback
  const gpsStartCoords = document.getElementById('gps-coords-start');
  const startLocText = document.getElementById('start-location-text');
  if (gpsStartCoords && startLocText) {
    gpsStartCoords.textContent = `${state.userGpsCoords[0].toFixed(4)}, ${state.userGpsCoords[1].toFixed(4)} (Playa del Carmen Fallback)`;
  }

  // Populate Categories Select
  const catSelect = document.getElementById('route-category-select');
  if (catSelect) {
    catSelect.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }

  // Attach change listeners programmatically
  const locSelect = document.getElementById('route-location-select');
  if (catSelect && locSelect) {
    catSelect.addEventListener('change', onRouteCategoryChange);
    locSelect.addEventListener('change', onRouteLocationChange);
  }

  // Populate Destinations Select based on first Category
  onRouteCategoryChange();
}

function getThreeClosestLocations(startCoords, categoryId) {
  const filtered = locations.filter(loc => categoryId === 'ALL' || loc.category === categoryId);
  const withDistance = filtered.map(loc => ({
    loc,
    dist: haversineDistance(startCoords, loc.geo)
  }));
  withDistance.sort((a, b) => a.dist - b.dist);
  return withDistance.slice(0, 3).map(x => x.loc);
}

function onRouteCategoryChange() {
  const catSelect = document.getElementById('route-category-select');
  const locSelect = document.getElementById('route-location-select');
  if (!catSelect || !locSelect) return;

  const selectedCatId = catSelect.value;
  locSelect.innerHTML = '';

  // Filter locations by selected category
  const filteredLocs = locations.filter(loc => loc.category === selectedCatId || selectedCatId === 'ALL');
  filteredLocs.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc.id;
    opt.textContent = `${loc.name} (${loc.distance_km}km from baseline)`;
    locSelect.appendChild(opt);
  });

  // Hide all non-selected category markers
  markers.forEach(m => {
    if (selectedCatId === 'ALL' || m.category === selectedCatId) {
      if (map && !map.hasLayer(m.marker)) {
        m.marker.addTo(map);
      }
    } else {
      if (map) {
        map.removeLayer(m.marker);
      }
    }
  });

  // Update the primary theme color dynamically to match the selected category
  const catObj = categories.find(c => c.id === selectedCatId);
  if (catObj) {
    document.documentElement.style.setProperty('--primary', catObj.ui_color);
    document.documentElement.style.setProperty('--primary-glow', catObj.ui_color + '40');
  }

  // Update locations list UI (Hide non-selected category nodes)
  renderLocations(selectedCatId);

  // Trigger Gemini AI Core voice transmission for this category
  let aiMessage = "";
  if (selectedCatId === 'CAT_A') {
    aiMessage = currentLanguage === 'es'
      ? "• Terreno arenoso costero.\n• Presión recomendada: 22/25 PSI.\n• Evita frenada delantera.\n• Hidratación cada 45 min."
      : "• Coastal sandy trails.\n• Pressure: 22/25 PSI.\n• Avoid front braking.\n• Hydrate every 45 min.";
  } else if (selectedCatId === 'CAT_B') {
    aiMessage = currentLanguage === 'es'
      ? "• Caliza mojada resbaladiza.\n• Tensión cadena: 20-30mm.\n• Aceite motor: 1.2L.\n• Lavar raspadas con agua."
      : "• Slippery wet limestone.\n• Chain play: 20-30mm.\n• Engine oil: 1.2L.\n• Clean cuts with water.";
  } else if (selectedCatId === 'CAT_E') {
    aiMessage = currentLanguage === 'es'
      ? "• Vibración por empedrados.\n• Revisa cadena 20-30mm.\n• Ajustar tornillos maletas.\n• Kit primeros auxilios listo."
      : "• Heavy cobblestone vibrations.\n• Check chain play.\n• Tighten luggage bolts.\n• Trauma kit ready.";
  } else {
    aiMessage = currentLanguage === 'es'
      ? "• Oráculo Gemini en línea.\n• Sincronizando parámetros Súper Catarina."
      : "• Gemini Oracle online.\n• Syncing Super Catarina specs.";
  }

  addAiMessage('system', aiMessage);
  // speakAiResponse suppressed per AUDIO policy (only on specific user request)

  onRouteLocationChange();
}

function onRouteLocationChange() {
  const locSelect = document.getElementById('route-location-select');
  if (!locSelect) return;

  const selectedLocId = locSelect.value;
  if (!selectedLocId) return;

  const loc = locations.find(l => l.id === selectedLocId);
  if (loc) {
    state.activeLocation = loc;

    // Pan map to destination and open popup
    if (map) {
      map.setView(loc.geo, 12, { animate: true });
      const markerObj = markers.find(m => m.id === loc.id);
      if (markerObj) markerObj.marker.openPopup();
    }

    // Update active location panel details elsewhere
    selectLocation(loc.id);
    
    // Draw route and calculate stats
    calculateExpeditionRoute();
  }
}

function calculateExpeditionRoute() {
  if (!state.activeLocation) return;

  const startCoords = state.userGpsCoords || [20.6274, -87.0799];
  const destCoords = state.activeLocation.geo;
  const cat = state.activeLocation.category;

  // 1. Fetch exact road routing from free OSRM driving service
  const startLng = startCoords[1];
  const startLat = startCoords[0];
  const destLng = destCoords[1];
  const destLat = destCoords[0];

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;

  fetch(osrmUrl)
    .then(res => res.json())
    .then(data => {
      if (!data.routes || data.routes.length === 0) throw new Error("No routes returned");

      const fastest = data.routes[0];
      const fastestCoords = fastest.geometry.coordinates.map(c => [c[1], c[0]]);

      // Guard Leaflet map calls
      if (typeof L !== 'undefined' && map) {
        if (activeExpeditionRoute) map.removeLayer(activeExpeditionRoute);
        activeExpeditionRoute = L.polyline(fastestCoords, {
          color: '#E21B1B',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(map);

        if (activeBestRoute) map.removeLayer(activeBestRoute);
        if (data.routes.length > 1) {
          const scenic = data.routes[1];
          const scenicCoords = scenic.geometry.coordinates.map(c => [c[1], c[0]]);
          activeBestRoute = L.polyline(scenicCoords, {
            color: '#FF9900',
            weight: 4,
            opacity: 0.7,
            dashArray: '5, 5',
            lineJoin: 'round'
          }).addTo(map);
        }
      }

      // Update distance and travel time from road calculation
      const roadDistance = fastest.distance / 1000;
      const roadDuration = fastest.duration;
      
      document.getElementById('metric-distance').textContent = `${roadDistance.toFixed(1)} km`;

      const hours = Math.floor(roadDuration / 3600);
      const minutes = Math.round((roadDuration % 3600) / 60);
      document.getElementById('metric-duration').textContent = `${hours}h ${minutes}m`;

      // Recalculate fuel
      const fuelLiters = roadDistance / 32;
      const fuelCost = fuelLiters * 26.00;
      document.getElementById('metric-fuel-liters').textContent = `${fuelLiters.toFixed(1)} L`;
      document.getElementById('metric-fuel-cost').textContent = `$${fuelCost.toFixed(2)} MXN`;

      // Update dynamic GPS Telemetry Gauges
      document.getElementById('metric-km-traveled').textContent = `0.0 km`;
      document.getElementById('metric-km-remaining').textContent = `${roadDistance.toFixed(1)} km`;
      
      const altVal = Math.round(5 + Math.abs(destLat % 0.05) * 500);
      document.getElementById('metric-altitude').textContent = `${altVal} m`;
      
      let avgSpeed = 60;
      if (cat === 'CAT_A') avgSpeed = 48;
      else if (cat === 'CAT_B') avgSpeed = 40;
      else if (cat === 'CAT_C') avgSpeed = 68;
      else if (cat === 'CAT_D') avgSpeed = 78;
      else if (cat === 'CAT_E') avgSpeed = 58;
      document.getElementById('metric-avg-speed').textContent = `${avgSpeed} km/h`;
    })
    .catch(err => {
      console.warn("OSRM routing failed, running straight polyline fallback:", err);
      // Fallback straight line
      const distance = haversineDistance(startCoords, destCoords) * 1.22;
      document.getElementById('metric-distance').textContent = `${distance.toFixed(1)} km`;

      let speed = 60;
      if (cat === 'CAT_A') speed = 45;
      else if (cat === 'CAT_B') speed = 35;
      else if (cat === 'CAT_C') speed = 60;
      else if (cat === 'CAT_D') speed = 75;
      else if (cat === 'CAT_E') speed = 55;

      const totalHours = distance / speed;
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      document.getElementById('metric-duration').textContent = `${hours}h ${minutes}m`;

      const fuelLiters = distance / 32;
      const fuelCost = fuelLiters * 26.00;
      document.getElementById('metric-fuel-liters').textContent = `${fuelLiters.toFixed(1)} L`;
      document.getElementById('metric-fuel-cost').textContent = `$${fuelCost.toFixed(2)} MXN`;

      // Fallback updates
      document.getElementById('metric-km-traveled').textContent = `0.0 km`;
      document.getElementById('metric-km-remaining').textContent = `${distance.toFixed(1)} km`;
      
      const altVal = Math.round(5 + Math.abs(destCoords[0] % 0.05) * 500);
      document.getElementById('metric-altitude').textContent = `${altVal} m`;
      document.getElementById('metric-avg-speed').textContent = `${speed} km/h`;

      // Guard Leaflet map calls
      if (typeof L !== 'undefined' && map) {
        if (activeExpeditionRoute) map.removeLayer(activeExpeditionRoute);
        activeExpeditionRoute = L.polyline([startCoords, destCoords], {
          color: '#E21B1B',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
          lineJoin: 'round'
        }).addTo(map);
      }
    });

  let roadType = "High-speed road";
  if (cat === 'CAT_A') {
    roadType = currentLanguage === 'es' ? "Sendas de costa y arena profunda" : "Coastal dirt & sand tracks";
  } else if (cat === 'CAT_B') {
    roadType = currentLanguage === 'es' ? "Pistas de piedra caliza mojada en selva" : "Jungle wet limestone trails";
  } else if (cat === 'CAT_C') {
    roadType = currentLanguage === 'es' ? "Tránsito urbano y rutas estatales" : "Urban transit & state roads";
  } else if (cat === 'CAT_D') {
    roadType = currentLanguage === 'es' ? "Carreteras federales pavimentadas" : "Federal paved highways";
  } else if (cat === 'CAT_E') {
    roadType = currentLanguage === 'es' ? "Caminos empedrados y rurales" : "Cobblestone and rural paths";
  }
  const roadTypeEl = document.getElementById('metric-road-type');
  if (roadTypeEl) {
    roadTypeEl.textContent = roadType;
  }

  // 3. Sun times & photography cues
  const longitudeOffset = (destCoords[1] - (-87.0799)) * 4; // minutes
  const baseSunriseMin = 6 * 60 + 14; 
  const baseSunsetMin = 19 * 60 + 2;  
  
  const localSunriseMin = baseSunriseMin + longitudeOffset;
  const localSunsetMin = baseSunsetMin + longitudeOffset;

  const sunriseStr = minutesToTimeString(localSunriseMin);
  const sunsetStr = minutesToTimeString(localSunsetMin);

  document.getElementById('cue-sunrise').textContent = `${sunriseStr} AM`;
  document.getElementById('cue-sunset').textContent = `${sunsetStr} PM`;

  // Golden and Blue hours
  const morningGoldenStart = minutesToTimeString(localSunriseMin);
  const morningGoldenEnd = minutesToTimeString(localSunriseMin + 60);
  const eveningGoldenStart = minutesToTimeString(localSunsetMin - 60);
  const eveningGoldenEnd = minutesToTimeString(localSunsetMin);
  const blueHourStart = minutesToTimeString(localSunsetMin);
  const blueHourEnd = minutesToTimeString(localSunsetMin + 30);

  document.getElementById('cue-morning-golden').textContent = `${morningGoldenStart} AM to ${morningGoldenEnd} AM`;
  document.getElementById('cue-evening-golden').textContent = `${eveningGoldenStart} PM to ${eveningGoldenEnd} PM`;
  document.getElementById('cue-blue-hour').textContent = `${blueHourStart} PM to ${blueHourEnd} PM`;

  // 4. Weather & Rain Alert - Fetch live forecast from keyless Open-Meteo API
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${destCoords[0]}&longitude=${destCoords[1]}&current=temperature_2m,relative_humidity_2m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
  
  fetch(weatherUrl)
    .then(res => res.json())
    .then(wData => {
      const temp = wData.current.temperature_2m;
      const humidity = wData.current.relative_humidity_2m;
      const rainProb = Math.max(...(wData.hourly.precipitation_probability || [25]));

      document.getElementById('weather-temp').textContent = `${temp.toFixed(1)}°C`;
      document.getElementById('weather-humidity').textContent = `${humidity}%`;
      document.getElementById('weather-rain-prob').textContent = `${rainProb}%`;

      let weatherDesc = currentLanguage === 'es' ? "Cielo despejado" : "Clear skies";
      if (rainProb > 70) weatherDesc = currentLanguage === 'es' ? "Lluvias intensas" : "Heavy downpours";
      else if (rainProb > 40) weatherDesc = currentLanguage === 'es' ? "Chubascos tropicales" : "Tropical showers";
      else if (rainProb > 20) weatherDesc = currentLanguage === 'es' ? "Parcialmente nublado" : "Partly cloudy";
      document.getElementById('weather-desc').textContent = weatherDesc;

      // Toggle Rain Alert Banner and Alert Pill in top bar
      const rainBanner = document.getElementById('weather-rain-alert');
      const alertBadge = document.getElementById('header-alert-badge');
      const alertText = document.getElementById('header-alert-text');

      if (rainProb > 40) {
        if (rainBanner) rainBanner.style.display = 'block';
        if (alertBadge && alertText) {
          alertBadge.style.display = 'flex';
          alertBadge.className = 'telemetry-pill warning-glow';
          const alertLocName = state.activeLocation ? state.activeLocation.name : "PLAYA DEL CARMEN";
          alertText.textContent = currentLanguage === 'es' ? `ALERTA DE LLUVIA // ${alertLocName.toUpperCase()}` : `RAIN WARNING // ${alertLocName.toUpperCase()}`;
        }
      } else {
        if (rainBanner) rainBanner.style.display = 'none';
        if (alertBadge) alertBadge.style.display = 'none';
      }
    })
    .catch(err => {
      console.warn("Weather fetch failed, running fallback calculations:", err);
      let humidityFallback = 75 + Math.round(Math.sin(destCoords[0] * 5) * 10);
      let tempFallback = 30 + Math.round(Math.cos(destCoords[1] * 5) * 3);
      let rainProbFallback = 20;

      if (cat === 'CAT_B') {
        rainProbFallback = 80;
        humidityFallback = 92;
      } else if (cat === 'CAT_D') {
        rainProbFallback = 65;
        humidityFallback = 84;
      } else if (cat === 'CAT_A') {
        rainProbFallback = 25;
        humidityFallback = 70;
      } else if (cat === 'CAT_E') {
        rainProbFallback = 45;
        humidityFallback = 78;
      } else {
        rainProbFallback = 35;
        humidityFallback = 72;
      }

      document.getElementById('weather-temp').textContent = `${tempFallback}°C`;
      document.getElementById('weather-humidity').textContent = `${humidityFallback}%`;
      document.getElementById('weather-rain-prob').textContent = `${rainProbFallback}%`;

      let weatherDesc = currentLanguage === 'es' ? "Cielo despejado" : "Clear skies";
      if (rainProbFallback > 70) weatherDesc = currentLanguage === 'es' ? "Lluvias intensas" : "Heavy downpours";
      else if (rainProbFallback > 40) weatherDesc = currentLanguage === 'es' ? "Chubascos tropicales" : "Tropical showers";
      else if (rainProbFallback > 20) weatherDesc = currentLanguage === 'es' ? "Parcialmente nublado" : "Partly cloudy";
      document.getElementById('weather-desc').textContent = weatherDesc;

      const rainBanner = document.getElementById('weather-rain-alert');
      const alertBadge = document.getElementById('header-alert-badge');
      const alertText = document.getElementById('header-alert-text');

      if (rainProbFallback > 40) {
        if (rainBanner) rainBanner.style.display = 'block';
        if (alertBadge && alertText) {
          alertBadge.style.display = 'flex';
          alertBadge.className = 'telemetry-pill warning-glow';
          const alertLocName = state.activeLocation ? state.activeLocation.name : "PLAYA DEL CARMEN";
          alertText.textContent = currentLanguage === 'es' ? `ALERTA DE LLUVIA // ${alertLocName.toUpperCase()}` : `RAIN WARNING // ${alertLocName.toUpperCase()}`;
        }
      } else {
        if (rainBanner) rainBanner.style.display = 'none';
        if (alertBadge) alertBadge.style.display = 'none';
      }
    });

  // Update hospital dispatch as well
  updateHospitalDispatchUI();
}

// Utility: convert minutes since midnight to HH:MM format
function minutesToTimeString(minutes) {
  let hrs = Math.floor(minutes / 60) % 24;
  let mins = Math.round(minutes % 60);
  if (mins < 0) mins = 0;
  let hrsStr = String(hrs).padStart(2, '0');
  let minsStr = String(mins).padStart(2, '0');
  return `${hrsStr}:${minsStr}`;
}

function haversineDistance(coords1, coords2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLng = toRad(coords2[1] - coords1[1]);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(coords1[0])) * Math.cos(toRad(coords2[0])) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// SIMULATE ROUTING OVERLAYS
let activeRouteLayer = null;

function highlightHospitalOrGas(type) {
  if (!map) return;
  
  if (activeRouteLayer) {
    map.removeLayer(activeRouteLayer);
    activeRouteLayer = null;
  }

  // Draw simulated path
  let pathCoords = [];
  let pathColor = 'var(--primary)';
  
  if (type === 'pemex') {
    // Route from Boca Paila to Tulum PEMEX (Simulated coordinates)
    pathCoords = [
      [20.1033, -87.4844], // Boca Paila
      [20.1500, -87.4700],
      [20.2100, -87.4600], // Tulum PEMEX Hwy 307
    ];
    pathColor = '#f59e0b';
  } else if (type === 'cenote') {
    // Route from dry hot spots to Taak Bi Ha cenote
    pathCoords = [
      [20.25, -87.8], 
      [20.28, -87.5],
      [20.3167, -87.3833] // Taak Bi Ha
    ];
    pathColor = '#10b981';
  }

  if (pathCoords.length > 0) {
    activeRouteLayer = L.polyline(pathCoords, {
      color: pathColor,
      weight: 5,
      opacity: 0.85,
      dashArray: '10, 8'
    }).addTo(map);

    // Zoom map to show entire route
    map.fitBounds(activeRouteLayer.getBounds(), { padding: [30, 30] });
  }
}

// HOSPITAL DISPATCH LOGIC
function updateHospitalDispatchUI() {
  const container = document.getElementById('hospital-routing-status');
  const actionBox = document.getElementById('dispatch-action-box');
  if (!container || !actionBox) return;
  
  const currentLoc = state.activeLocation;
  if (!currentLoc) {
    actionBox.style.display = 'none';
    container.innerHTML = `<p>Select an adventure location to view emergency hospital dispatch plans.</p>`;
    return;
  }

  const hospital = hospitalDatabase[currentLoc.name];
  if (!hospital) {
    actionBox.style.display = 'none';
    container.innerHTML = `<p>Hospital dispatch routing stands by for selected destination.</p>`;
    return;
  }
  
  // Activate emergency routing if location is high risk or has high rain probability
  const isHighRisk = currentLoc.risk_level === 'high' || currentLoc.category === 'CAT_B';
  
  if (isHighRisk) {
    actionBox.style.display = 'block';
    container.innerHTML = `
      <div class="hospital-badge" style="background-color: var(--primary); box-shadow: 0 0 10px var(--primary-glow); margin-bottom: 8px;">HIGH RISK LOCATION ALERT</div>
      <h5>Closest Emergency Room: ${hospital.name}</h5>
      <p>Distance: <strong>${hospital.dist}</strong> | Est: <strong>${hospital.eta}</strong></p>
      <p style="margin-top: 6px; font-size: 0.72rem; color: var(--text-muted);">Evacuation Route: ${hospital.route}</p>
    `;
  } else {
    actionBox.style.display = 'block';
    container.innerHTML = `
      <div class="hospital-badge" style="background-color: var(--success); color: #fff; margin-bottom: 8px;">NOMINAL AREA ER DIAL</div>
      <h5>Closest Emergency Room: ${hospital.name}</h5>
      <p>Distance: <strong>${hospital.dist}</strong> | Est. Rescue: <strong>${hospital.eta}</strong></p>
      <p style="margin-top: 6px; font-size: 0.72rem; color: var(--text-muted);">Evacuation Route: ${hospital.route}</p>
    `;
  }
}

function simulateMedicalRoute() {
  if (!map) return;

  const currentLoc = state.activeLocation || locations[1];
  const hospital = hospitalDatabase[currentLoc.name];

  if (activeRouteLayer) {
    map.removeLayer(activeRouteLayer);
  }

  // Draw emergency route to clinic
  const start = currentLoc.geo;
  let end = [20.2117, -87.4643]; // Tulum Hospital coord
  if (currentLoc.name === 'Tihosuco') end = [19.5786, -88.0450]; // Carrillo Puerto Clinic
  if (currentLoc.name === 'Boca Paila') end = [20.6300, -87.0700]; // Playa Hospital

  activeRouteLayer = L.polyline([start, [(start[0]+end[0])/2, start[1]], end], {
    color: 'var(--secondary)',
    weight: 6,
    opacity: 0.9,
    dashArray: '5, 5'
  }).addTo(map);

  map.fitBounds(activeRouteLayer.getBounds(), { padding: [50, 50] });
}

// MECHANICAL HOTSPOT SELECTION
function showHotspot(id) {
  const detailPanel = document.getElementById('hotspot-details');
  const hs = hotspots[id];
  if (!hs) return;

  // Toggle active hotspots indicators
  const hotspotsEl = document.querySelectorAll('.hotspot');
  hotspotsEl.forEach((hsEl, idx) => {
    if (idx === (id === 'battery' ? 0 : id === 'clutch' ? 1 : id === 'chain' ? 2 : 3)) {
      hsEl.style.backgroundColor = 'var(--secondary)';
      hsEl.style.transform = 'translate(-50%, -50%) scale(1.2)';
    } else {
      hsEl.style.backgroundColor = 'var(--primary)';
      hsEl.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });

  detailPanel.innerHTML = `
    <h4>${hs.title}</h4>
    <p>${hs.desc}</p>
  `;
}

// TIRE CONFIG TOGGLE
function setTireMode(mode) {
  state.telemetry.tireMode = mode;
  const roadBtn = document.getElementById('tire-road');
  const dirtBtn = document.getElementById('tire-dirt');
  
  if (mode === 'road') {
    roadBtn.classList.add('active');
    dirtBtn.classList.remove('active');
  } else {
    roadBtn.classList.remove('active');
    dirtBtn.classList.add('active');
  }
}

// WIZARD TROUBLESHOOTER CONTROLLER
function selectSymptom(symptom) {
  state.selectedSymptom = symptom;
  
  // Highlight card
  const cards = document.querySelectorAll('.symptom-card');
  cards.forEach(c => {
    const clickAttr = c.getAttribute('onclick');
    if (clickAttr && String(clickAttr).includes(symptom)) {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });

  // Populate Step 2
  const checklist = document.getElementById('triage-checklists');
  const title = document.getElementById('wizard-triage-title');
  
  if (symptom === 'temp_alert') {
    title.textContent = 'High Temperature Diagnostics';
    checklist.innerHTML = `
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Check if Oil Cooling radiator is blocked by Yucatan Karst limestone clay.</span></div>
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Inspect V-Strom Oil level via right-side glass window (verify 1.2L capacity).</span></div>
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Verify electrical cooling fan rotation behind the SOCS oil radiator.</span></div>
    `;
  } else if (symptom === 'elec_fail') {
    title.textContent = 'Electrical Continuity Diagnostics';
    checklist.innerHTML = `
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Locate battery under seat (requires 4mm Allen key).</span></div>
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Inspect main 30A fuse and ignition relay box for swamp humidity condensation.</span></div>
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Check terminal leads for cobblestone vibration-induced loosening.</span></div>
    `;
  } else if (symptom === 'low_octane') {
    title.textContent = 'FI System Diagnostics';
    checklist.innerHTML = `
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Check for pinging / knocking sound under load below 4,000 RPM.</span></div>
      <div class="triage-item"><span class="triage-bullet"></span><span class="triage-text">Verify if local gas was filled from container drum (high risk of water contamination).</span></div>
    `;
  }

  // Go to step 2
  setWizardStep(2);
}

function proceedToWizardStep3() {
  if (!state.selectedSymptom) return;
  setWizardStep(3);
  populateWizardRemedy(state.selectedSymptom);
}

function setWizardStep(step) {
  state.wizardStep = step;
  
  const buttons = document.querySelectorAll('.wz-tab');
  const panes = document.querySelectorAll('.wizard-step-pane');
  
  buttons.forEach((btn, index) => {
    if (index + 1 === step) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  panes.forEach((pane, index) => {
    if (index + 1 === step) pane.classList.add('active');
    else pane.classList.remove('active');
  });
}

function populateWizardRemedy(code) {
  const title = document.getElementById('wizard-remedy-title');
  const body = document.getElementById('wizard-remedy-body');

  if (code === 'temp_alert' || code === 'TEMP_HIGH') {
    title.textContent = 'SOCS Overheating Remediation';
    body.innerHTML = `
      <h5>Step 1: Engine Thermal Shutdown</h5>
      <p>Immediately kill ignition. Leave V-Strom 250 SX parked on flat, stable limestone. Do not shut off completely if fan is running (let fan run in accessory power mode for 2 minutes).</p>
      <h5>Step 2: Clean Oil Cooler Grill</h5>
      <p>Humid Yucatan limestone soil turns into heavy plaster when wet. Gently wash mud blockages out of the oil cooling radiator fins using clean water. Do NOT use high pressure, which bends soft aluminum fins.</p>
      <h5>Step 3: Oil Level Verification</h5>
      <p>Let engine settle 5 minutes. Hold motorcycle level (avoid seat height 835mm tilt). Check glass portal. If oil level is low, top up with 10W-40 MA2 oil up to capacity (1.2L total).</p>
    `;
  } else if (code === 'elec_fail' || code === 'ELEC_FAIL') {
    title.textContent = 'Electrical Recovery Checklist';
    body.innerHTML = `
      <h5>Step 1: Seat Removal</h5>
      <p>Remove the pillion seat with ignition key. Locate the main rider seat holding hex screws. Use the 4mm Allen key to remove them.</p>
      <h5>Step 2: Battery Tightness & Cleaning</h5>
      <p>Check battery terminal bolts. Cobblestone vibrations from Tihosuco historic streets loosen contacts. Clean oxidation and dry with a dry cloth. Fasten terminal cables firmly.</p>
      <h5>Step 3: Moisture Dispersal</h5>
      <p>Open fuse cover. Spray WD-40 or equivalent moisture displacer if contacts are damp from Yucatan 90% humidity. Ensure the main 30A fuse is intact.</p>
    `;
  } else if (code === 'low_octane' || code === 'FI_ERR') {
    title.textContent = 'Low-Octane Spark Knock Mitigation';
    body.innerHTML = `
      <h5>Step 1: Reroute to Premium Gas</h5>
      <p>Do NOT run engine at high throttle opening. Avoid 'Magna' (87 Octane) in Yucatan inland towns. Ride cautiously to nearest PEMEX providing 91+ Octane 'Premium' gasoline.</p>
      <h5>Step 2: RPM Regulation</h5>
      <p>Keep engine revs above 4500 RPM. Lugging the single-cylinder engine under low RPM increases spark knock pressure, which damages piston rings.</p>
      <h5>Step 3: Fuel Treatment</h5>
      <p>Add 50ml of octane booster or mix immediately with Premium gas. FI mapping will automatically compensate once higher octane fuel reaches the combustion sensor.</p>
    `;
  } else {
    // Default
    title.textContent = 'Active Diagnostic Guide';
    body.innerHTML = `
      <h5>Diagnostic Override</h5>
      <p>Troubleshoot the system using the steps under the mechanics panels or select a different symptom to generate an interactive guide.</p>
    `;
  }
}

function activateMechanicDialer() {
  initiateCall('078', 'Green Angels Road Assistance');
}

// FIRST AID PROTOCOL TOGGLES
function showTriage(type) {
  // Update Tabs
  const buttons = document.querySelectorAll('.triage-tab');
  buttons.forEach(btn => {
    const clickAttr = btn.getAttribute('onclick');
    if (clickAttr && String(clickAttr).includes(type)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const contentBox = document.getElementById('triage-content');
  contentBox.innerHTML = firstAidProtocols[type];
}

// PHONE CALL SIMULATOR (Select Contact First to Prevent Accidental Dialing)
function initiateCall(number, name) {
  state.selectedContactNumber = number;
  state.selectedContactName = name;
  
  const panel = document.getElementById('phone-sim');
  const status = panel.querySelector('.calling-status');
  const nameEl = panel.querySelector('.calling-name');
  const numEl = panel.querySelector('.calling-number');
  const timer = panel.querySelector('.call-timer');
  const dialBtn = document.getElementById('dial-btn');
  const hangupBtn = document.getElementById('hangup-btn');
  
  // Highlight list item
  const cards = document.querySelectorAll('.contact-card-item');
  cards.forEach(card => {
    const cardNum = card.querySelector('.contact-num').textContent.trim();
    if (number.includes(cardNum) || (cardNum.includes('Cross') && number.includes('1233')) || (cardNum.includes('Red') && number.includes('1233'))) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  status.textContent = currentLanguage === 'es' ? "LISTO PARA LLAMAR" : "READY TO DIAL";
  status.style.color = 'var(--warning)';
  nameEl.textContent = name;
  numEl.textContent = number;
  timer.style.display = 'none';
  
  if (dialBtn) dialBtn.disabled = false;
  if (hangupBtn) hangupBtn.disabled = true;

  // Switch to first aid tab to see contacts
  const firstAidTabBtn = document.querySelector('[data-tab="safety"]');
  if (firstAidTabBtn && state.activeTab !== 'safety') {
    firstAidTabBtn.click();
  }
}

function dialSelectedContact() {
  if (!state.selectedContactNumber) return;
  
  const number = state.selectedContactNumber;
  const name = state.selectedContactName;
  
  const panel = document.getElementById('phone-sim');
  const status = panel.querySelector('.calling-status');
  const timer = panel.querySelector('.call-timer');
  const dialBtn = document.getElementById('dial-btn');
  const hangupBtn = document.getElementById('hangup-btn');
  
  // Set call states
  state.callActive = true;
  status.textContent = currentLanguage === 'es' ? "CONECTANDO..." : "CONNECTING...";
  status.style.color = 'var(--warning)';
  timer.style.display = 'block';
  timer.textContent = '00:00';
  
  if (dialBtn) dialBtn.disabled = true;
  if (hangupBtn) hangupBtn.disabled = false;

  // Real connection trigger (open mobile dialer with real emergency number)
  window.location.href = `tel:${number}`;

  // Start simulation counter
  state.callSeconds = 0;
  if (state.callTimer) clearInterval(state.callTimer);
  
  setTimeout(() => {
    if (!state.callActive) return;
    status.textContent = currentLanguage === 'es' ? "LLAMADA ACTIVA" : "ACTIVE CALL";
    status.style.color = 'var(--success)';
    
    state.callTimer = setInterval(() => {
      state.callSeconds++;
      let mins = String(Math.floor(state.callSeconds / 60)).padStart(2, '0');
      let secs = String(state.callSeconds % 60).padStart(2, '0');
      timer.textContent = `${mins}:${secs}`;
    }, 1000);
  }, 1200);
}

function endCall() {
  const panel = document.getElementById('phone-sim');
  const status = panel.querySelector('.calling-status');
  const nameEl = panel.querySelector('.calling-name');
  const numEl = panel.querySelector('.calling-number');
  const timer = panel.querySelector('.call-timer');
  const dialBtn = document.getElementById('dial-btn');
  const hangupBtn = document.getElementById('hangup-btn');

  state.callActive = false;
  if (state.callTimer) {
    clearInterval(state.callTimer);
    state.callTimer = null;
  }

  status.textContent = "IDLE";
  status.style.color = 'var(--text-muted)';
  nameEl.textContent = currentLanguage === 'es' ? "Sin Despacho Activo" : "No Active Dispatch";
  numEl.textContent = "-- -- --";
  timer.style.display = 'none';
  
  if (dialBtn) dialBtn.disabled = true;
  if (hangupBtn) hangupBtn.disabled = true;

  // Clear list highlights
  const cards = document.querySelectorAll('.contact-card-item');
  cards.forEach(card => card.classList.remove('active'));
}

// YOUTUBE STUDIO - GOLDEN HOUR COUNTDOWN
function calculateGoldenHour() {
  const countdown = document.getElementById('sunset-timer');
  const startEl = document.getElementById('val-golden-start');
  const sunsetEl = document.getElementById('val-sunset-time');

  if (!countdown || !startEl || !sunsetEl) return;

  // Hardcode beautiful Yucatan golden hour times for simulated calendar
  const goldenHourStart = 18; // 6 PM
  const goldenHourMin = 14;
  const sunsetHour = 19;     // 7 PM
  const sunsetMin = 2;

  startEl.textContent = `${goldenHourStart}:${String(goldenHourMin).padStart(2, '0')}`;
  sunsetEl.textContent = `${sunsetHour}:${String(sunsetMin).padStart(2, '0')}`;

  function updateCountdown() {
    const now = new Date();
    const target = new Date();
    target.setHours(goldenHourStart, goldenHourMin, 0);

    // If current time is past today's golden hour, set for tomorrow
    if (now.getTime() > target.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const diff = target.getTime() - now.getTime();
    
    let diffHrs = Math.floor(diff / (1000 * 60 * 60));
    let diffMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let diffSecs = Math.floor((diff % (1000 * 60)) / 1000);

    countdown.textContent = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// SCRIPT GENERATOR
function generateScriptHook() {
  const locName = document.getElementById('script-location').value;
  const vibe = document.getElementById('script-vibe').value;
  const output = document.getElementById('script-output');

  let script = "";

  const selectedLoc = locations.find(l => l.name === locName) || locations[0];

  if (vibe === 'epic') {
    script = `[SCENE START]
(DRONE SHOT: Smoothly flying over Yucatan's thick jungle canopy, catching the distant reflection of coastal turquoise water. Cut to low, wide angle of La Súper Catarina kicking up white sand sprays).

RIDER (VOICE OVER):
"This isn't just an adventure. It's a journey into history. Riding the legendary La Súper Catarina through ${locName}, we're standing right where ${selectedLoc.story_hook.toLowerCase()}... but the terrain isn't friendly. Underneath this beauty is slick karst limestone and deep coastal sands that can trap a 250cc bike in seconds. Today, we conquer the wilderness!"

[CUT TO: Exhaust note growl close up, followed by a wide profile shot of the rider facing the golden hour sun].`;
  } else if (vibe === 'mechanic') {
    script = `[SCENE START]
(CLOSE UP: A 4mm Allen key twisting battery terminals under a dusty Súper Catarina seat. Mosquitoes buzz. Perspiration drips in 90% humidity).

HOST (TO CAMERA):
"What's up ADV family. We are deep in the Yucatan backcountry near ${locName}, and our Súper Catarina is testing the limits of its Oil Cooling System (SOCS). In this heat, one mistake—like letting limestone plaster block your radiator fins, or using contaminated gasoline from a remote village drum—will strand you here. We've got 150km of trail, 29 PSI in the front, and only a tool kit between us and survival. Let's see what this single-cylinder can handle."

[CUT TO: Súper Catarina tire clearance shot as it rolls over a limestone plateau].`;
  } else if (vibe === 'historic') {
    script = `[SCENE START]
(FADE IN: Golden hour light casting long, haunting shadows through the half-destroyed arches of a colonial stone church).

HOST (TO CAMERA):
"Look at these stones. This is Tihosuco—the heart of the Caste War, where the Mayan rebellion fought for their freedom. Riding La Súper Catarina down these ancient Sacbeob networks makes you appreciate the resilience of this land. But respect the road: these cobbles will rattle your bike to pieces if you don't torque your fairing bolts. Today, we explore the shadows of rebellion."

[CUT TO: Drone B-roll panning down from the church facade to the parked Súper Catarina silhouette].`;
  }

  output.value = script;
}

function copyScriptText() {
  const output = document.getElementById('script-output');
  if (!output.value) return;

  output.select();
  document.execCommand('copy');
  
  const copyBtn = document.querySelector('.btn-copy');
  const originalText = copyBtn.textContent;
  copyBtn.textContent = "COPIED!";
  copyBtn.style.color = 'var(--success)';
  copyBtn.style.borderColor = 'var(--success)';
  
  setTimeout(() => {
    copyBtn.textContent = originalText;
    copyBtn.style.color = 'var(--text-main)';
    copyBtn.style.borderColor = 'var(--border-color)';
  }, 2000);
}

function toggleLanguage() {
  currentLanguage = (currentLanguage === 'es') ? 'en' : 'es';
  document.getElementById('lang-label').textContent = currentLanguage.toUpperCase();
  
  // Translate Sidebar Navigation
  const navDashboard = document.getElementById('nav-lbl-dashboard');
  const navMap = document.getElementById('nav-lbl-map');
  const navStudio = document.getElementById('nav-lbl-studio');
  const navAi = document.getElementById('nav-lbl-ai');
  const navMechanics = document.getElementById('nav-lbl-mechanics');
  const navSafety = document.getElementById('nav-lbl-safety');
  const footStatus = document.getElementById('sidebar-foot-status');

  if (navDashboard) navDashboard.textContent = currentLanguage === 'es' ? 'Tablero' : 'Dashboard';
  if (navMap) navMap.textContent = currentLanguage === 'es' ? 'Mapa Yucatán' : 'Yucatan Map';
  if (navStudio) navStudio.textContent = currentLanguage === 'es' ? 'Grabación Pro' : 'Shooting Pro';
  if (navAi) navAi.textContent = currentLanguage === 'es' ? 'Asistente IA' : 'Ai partner';
  if (navSmartwatch) navSmartwatch.textContent = currentLanguage === 'es' ? 'Reloj OnePlus' : 'OnePlus Watch';
  if (navMechanics) navMechanics.textContent = currentLanguage === 'es' ? 'Mecánica' : 'Mechanics';
  if (navSafety) navSafety.textContent = currentLanguage === 'es' ? 'Primeros Auxilios' : 'First Aid';
  if (footStatus) footStatus.textContent = currentLanguage === 'es' ? 'Sistema Activo (Pro)' : 'System Active (Pro)';

  // Translate Smartwatch tab
  const watchTitle = document.getElementById('lbl-watch-title');
  const watchSub = document.getElementById('lbl-watch-subtitle');
  const healthTitle = document.getElementById('lbl-watch-health-title');
  const healthSub = document.getElementById('lbl-watch-health-subtitle');
  const lblSpo2 = document.getElementById('lbl-spo2');
  const lblCal = document.getElementById('lbl-calories');
  const lblStress = document.getElementById('lbl-stress');
  const lblWatchGps = document.getElementById('lbl-watch-gps');
  const valWatchGps = document.getElementById('watch-gps');
  const valEcg = document.getElementById('watch-ecg-status');

  if (watchTitle) watchTitle.textContent = currentLanguage === 'es' ? 'Cronómetro OnePlus Watch 4' : 'OnePlus Watch 4 Crono';
  if (watchSub) watchSub.textContent = currentLanguage === 'es' ? 'Enlace Satelital Wearable Activo' : 'Wearable Satellite Link Active';
  if (healthTitle) healthTitle.textContent = currentLanguage === 'es' ? 'Telemetría Biométrica' : 'Biometric Telemetry';
  if (healthSub) healthSub.textContent = currentLanguage === 'es' ? 'Nodos de salud en tiempo real de OnePlus Health' : 'Real-time health nodes from OnePlus Health App';
  if (lblSpo2) lblSpo2.textContent = currentLanguage === 'es' ? 'Oxígeno SpO2' : 'SpO2 Oxygen';
  if (lblCal) lblCal.textContent = currentLanguage === 'es' ? 'Calorías Activas' : 'Active Calories';
  if (lblStress) lblStress.textContent = currentLanguage === 'es' ? 'Nivel de Estrés' : 'Stress Level';
  if (lblWatchGps) lblWatchGps.textContent = currentLanguage === 'es' ? 'Conexión GPS Reloj' : 'Watch GPS Lock';
  if (valWatchGps) valWatchGps.textContent = currentLanguage === 'es' ? '🛰️ CONECTADO (3D)' : '🛰️ LOCKED (3D)';
  if (valEcg) valEcg.textContent = currentLanguage === 'es' ? 'Ritmo Sinusal (Normal)' : 'Sinus Rhythm (Normal)';

  const lblQuickActions = document.getElementById('lbl-quick-actions');
  if (lblQuickActions) lblQuickActions.textContent = currentLanguage === 'es' ? 'Acciones de Voz Inteligentes' : 'Smart Voice Actions';

  // Translate Telemetry Widget Card
  const teleTitle = document.getElementById('lbl-telemetry-title');
  const teleSub = document.getElementById('lbl-telemetry-subtitle');
  const lblDist = document.getElementById('lbl-route-dist');
  const lblDur = document.getElementById('lbl-route-dur');
  const lblTraveled = document.getElementById('lbl-route-traveled');
  const lblRemaining = document.getElementById('lbl-route-remaining');
  const lblPerf = document.getElementById('lbl-performance');
  const lblAlt = document.getElementById('lbl-altitude');
  const lblSpeed = document.getElementById('lbl-avg-speed');
  const lblFuel = document.getElementById('lbl-fuel-needed');

  if (teleTitle) teleTitle.textContent = currentLanguage === 'es' ? 'Métricas de Telemetría' : 'Expedition Telemetry Metrics';
  if (teleSub) teleSub.textContent = currentLanguage === 'es' ? 'Cálculos de ruta en tiempo real y rendimiento' : 'Real-time route calculations & Super Catarina performance';
  if (lblDist) lblDist.textContent = currentLanguage === 'es' ? 'Distancia' : 'En-Route Distance';
  if (lblDur) lblDur.textContent = currentLanguage === 'es' ? 'Tiempo Estimado' : 'Travel Time';
  if (lblTraveled) lblTraveled.textContent = currentLanguage === 'es' ? 'Km Recorridos' : 'Km Traveled';
  if (lblRemaining) lblRemaining.textContent = currentLanguage === 'es' ? 'Km Faltantes' : 'Km Remaining';
  if (lblPerf) lblPerf.textContent = currentLanguage === 'es' ? 'Rendimiento Súper Catarina' : 'Super Catarina Performance';
  if (lblAlt) lblAlt.textContent = currentLanguage === 'es' ? 'Altitud' : 'Altitude';
  if (lblSpeed) lblSpeed.textContent = currentLanguage === 'es' ? 'Velocidad Promedio' : 'Average Speed';
  if (lblFuel) lblFuel.textContent = currentLanguage === 'es' ? 'Gasolina Necesaria' : 'Fuel Required';

  // Translate UI elements
  const breadcrumb = document.querySelector('.breadcrumb');
  if (breadcrumb) {
    breadcrumb.textContent = currentLanguage === 'es' ? 'SÚPER CATARINA // SISTEMAS INTERACTIVOS' : 'SUPER CATARINA // INTERACTIVE SYSTEMS';
  }
  
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    if (state.activeTab === 'dashboard') pageTitle.textContent = currentLanguage === 'es' ? 'Tablero de Control' : 'Command Dashboard';
    else if (state.activeTab === 'mechanics') pageTitle.textContent = currentLanguage === 'es' ? 'Manual Mecánico' : 'Mechanical Manual';
    else if (state.activeTab === 'safety') pageTitle.textContent = currentLanguage === 'es' ? 'Primeros Auxilios y Emergencia' : 'First Aid & Emergency';
    else if (state.activeTab === 'locations') pageTitle.textContent = currentLanguage === 'es' ? 'Explorador de Rutas' : 'Yucatan Route Explorer';
    else if (state.activeTab === 'content') pageTitle.textContent = currentLanguage === 'es' ? 'Módulo Shooting Pro' : 'Shooting Pro Engine';
    else if (state.activeTab === 'ai-deck') pageTitle.textContent = currentLanguage === 'es' ? 'Asistente Ai partner' : 'Ai partner Link';
  }

  // Update speech engine language
  if (recognition) {
    recognition.lang = currentLanguage === 'es' ? 'es-MX' : 'en-US';
  }

  // Re-run route planner to refresh metrics translations
  calculateExpeditionRoute();
  
  // Re-render locations list
  renderLocations('ALL');
  
  // Update details panel if active
  if (state.activeLocation) {
    selectLocation(state.activeLocation.id);
  }
  
  // Update calendar display texts
  updateCalendarTexts();

  addAiMessage('system', currentLanguage === 'es' ? "Idioma cambiado a Español." : "Language switched to English.");
}

function updateCalendarTexts() {
  const trans = projectTranslations[currentLanguage];
  const title = document.querySelector('#calendar-node-card h3');
  const subtitle = document.getElementById('calendar-subtitle');
  if (title) title.textContent = trans.calendarSyncTitle;
  if (subtitle) {
    if (state.googleConnected) {
      subtitle.textContent = trans.calendarConnected;
    } else {
      subtitle.textContent = trans.calendarSyncSub;
    }
  }
  
  const disconnectedText = document.querySelector('#calendar-disconnected p');
  if (disconnectedText) disconnectedText.textContent = trans.calendarDisconnected;
  const linkBtn = document.querySelector('#calendar-disconnected button');
  if (linkBtn) linkBtn.textContent = currentLanguage === 'es' ? 'Vincular Calendario' : 'Link Calendar';
}

// MOCK CALENDAR DATABASE FOR GASTON
const gastonCalendarEvents = [
  { date: "13-Jul-2026", title: "Expedición V-Strom Off-road Scan (Boca Paila)", time: "10:00 AM" },
  { date: "15-Jul-2026", title: "B-Roll Capture: Sunlight Reflection (Taak Bi Ha)", time: "06:14 AM" },
  { date: "18-Jul-2026", title: "Grabación Histórica: Guerra de Castas (Tihosuco)", time: "05:00 PM" }
];

// GOOGLE OAUTH MODAL SYSTEMS
function triggerGoogleLoginModal() {
  document.getElementById('google-login-modal').style.display = 'flex';
}

function closeGoogleLoginModal() {
  document.getElementById('google-login-modal').style.display = 'none';
}

function loadGoogleLibraries(callback) {
  if (gapiInited && gisInited) {
    callback();
    return;
  }

  // Load GAPI client libraries
  const gapiScript = document.createElement('script');
  gapiScript.src = "https://apis.google.com/js/api.js";
  gapiScript.onload = () => {
    gapi.load('client', () => {
      gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/docs/generator/v1/discovery'],
      }).then(() => {
        gapiInited = true;
        checkLibInit();
      });
    });
  };
  document.head.appendChild(gapiScript);

  // Load Google Identity Services OAuth
  const gisScript = document.createElement('script');
  gisScript.src = "https://accounts.google.com/gsi/client";
  gisScript.onload = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/youtube.readonly',
      callback: '', // defined dynamically
    });
    gisInited = true;
    checkLibInit();
  };
  document.head.appendChild(gisScript);

  function checkLibInit() {
    if (gapiInited && gisInited) {
      callback();
    }
  }
}

function simulateGoogleLogin() {
  if (GOOGLE_CLIENT_ID && GOOGLE_API_KEY) {
    // RUN REAL GOOGLE CALENDAR AUTH
    addAiMessage('system', currentLanguage === 'es' ? "Conectando con Google Calendar..." : "Connecting to Google Calendar...");
    loadGoogleLibraries(() => {
      tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          addAiMessage('system', `Google OAuth Error: ${resp.error}`);
          return;
        }
        
        state.googleConnected = true;
        closeGoogleLoginModal();
        
        try {
          // Query live events
          const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 5,
            orderBy: 'startTime',
          });
          
          const events = response.result.items;
          const list = document.getElementById('calendar-events');
          document.getElementById('calendar-disconnected').style.display = 'none';
          list.style.display = 'flex';
          list.innerHTML = '';
          
          if (!events || events.length === 0) {
            list.innerHTML = `<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center;">${currentLanguage === 'es' ? 'No hay próximos viajes.' : 'No upcoming events.'}</p>`;
          } else {
            events.forEach(ev => {
              const start = ev.start.dateTime || ev.start.date;
              const dateObj = new Date(start);
              const dateStr = dateObj.toLocaleDateString(currentLanguage === 'es' ? 'es-MX' : 'en-US', { day: 'numeric', month: 'short' });
              const timeStr = dateObj.toLocaleTimeString(currentLanguage === 'es' ? 'es-MX' : 'en-US', { hour: '2-digit', minute: '2-digit' });
              
              const item = document.createElement('div');
              item.className = 'calendar-event-item';
              item.innerHTML = `
                <div class="event-left">
                  <span class="event-date">${dateStr}</span>
                  <span class="event-title">${ev.summary || 'Expedition'}</span>
                </div>
                <span class="event-time">${timeStr}</span>
              `;
              list.appendChild(item);
            });
          }
          
          const trans = projectTranslations[currentLanguage];
          document.getElementById('calendar-subtitle').textContent = trans.calendarConnected;
          playSynthBeep(440, 'sine', 0.15);
          addAiMessage('system', currentLanguage === 'es' ? "Calendario de Google real vinculado." : "Real Google Calendar successfully synced.");
          
          // Fetch real YouTube playlists
          fetchUserYoutubePlaylists();
          
        } catch (err) {
          console.error("Google Calendar list error: ", err);
          addAiMessage('system', `Error de API de Google Calendar: ${err.message}`);
        }
      };

      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
      } else {
        tokenClient.requestAccessToken({prompt: ''});
      }
    });
  } else {
    // RUN HIGH-FIDELITY INTERACTIVE POPUP SIMULATION
    const width = 450;
    const height = 620;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);
    const popup = window.open('google_oauth.html', 'GoogleOAuthPopup', `width=${width},height=${height},left=${left},top=${top}`);
    
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      alert(currentLanguage === 'es' 
        ? "Tu navegador bloqueó la ventana emergente. Por favor, habilita las ventanas emergentes en tu navegador para continuar con el inicio de sesión de Google."
        : "Your browser blocked the popup. Please allow popups in your browser settings to continue signing in with Google.");
    }
    
    const handleOauthMessage = (event) => {
      // Relax origin checks to support local filesystem file:// previews and development environments
      if (event.origin !== window.location.origin && event.origin !== "null" && !event.origin.startsWith("file")) return;
      if (event.data && event.data.status === 'success') {
        window.removeEventListener('message', handleOauthMessage);
        
        state.googleConnected = true;
        closeGoogleLoginModal();
        
        document.getElementById('calendar-disconnected').style.display = 'none';
        const list = document.getElementById('calendar-events');
        list.style.display = 'flex';
        list.innerHTML = '';
        
        gastonCalendarEvents.forEach(ev => {
          const item = document.createElement('div');
          item.className = 'calendar-event-item';
          item.innerHTML = `
            <div class="event-left">
              <span class="event-date">${ev.date}</span>
              <span class="event-title">${ev.title}</span>
            </div>
            <span class="event-time">${ev.time}</span>
          `;
          list.appendChild(item);
        });
        
        const trans = projectTranslations[currentLanguage];
        document.getElementById('calendar-subtitle').textContent = trans.calendarConnected;
        
        playSynthBeep(440, 'sine', 0.15);
        addAiMessage('system', currentLanguage === 'es' 
          ? `Sesión iniciada como ${event.data.name}. Calendario de expediciones sincronizado.` 
          : `Signed in as ${event.data.name}. Expeditions schedule synced.`);
        
        if (event.data.musicConnected) {
          addAiMessage('system', currentLanguage === 'es'
            ? "Licencia de YouTube Music enlazada a NegocioUp Radio de forma exitosa."
            : "YouTube Music license linked to NegocioUp Radio successfully.");
          
          const gastonMockPlaylists = [
            { id: "PLofht4PTc7ysV867zV5Z5yOep_P1E9M68", title: "La Súper Catarina Mix (Gastón's Choice)" },
            { id: "PLr7wK_1wK5NlJ2_Qv9i7qTjF56rN3xO90", title: "Tulum Sunset Chill vol.4 - gastonmorante@gmail.com" },
            { id: "PLhSZ95G2C5WqR7lQ7O1z-Ysh6a2H5C05n", title: "Rock ADV Offroad Mix (Gastón Morante)" }
          ];
          populateRadioPlaylists(gastonMockPlaylists);
        }
      }
    };
    window.addEventListener('message', handleOauthMessage);
  }
}

function simulateGoogleLoginAny() {
  const width = 450;
  const height = 620;
  const left = (screen.width / 2) - (width / 2);
  const top = (screen.height / 2) - (height / 2);
  const popup = window.open('google_oauth.html?mode=any', 'GoogleOAuthPopupAny', `width=${width},height=${height},left=${left},top=${top}`);
  
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    alert(currentLanguage === 'es' 
      ? "Tu navegador bloqueó la ventana emergente. Por favor, habilita las ventanas emergentes en tu navegador para continuar con el inicio de sesión de Google."
      : "Your browser blocked the popup. Please allow popups in your browser settings to continue signing in with Google.");
  }
  
  const handleOauthMessage = (event) => {
    // Relax origin checks to support local filesystem file:// previews and development environments
    if (event.origin !== window.location.origin && event.origin !== "null" && !event.origin.startsWith("file")) return;
    if (event.data && event.data.status === 'success') {
      window.removeEventListener('message', handleOauthMessage);
      
      state.googleConnected = true;
      closeGoogleLoginModal();
      
      document.getElementById('calendar-disconnected').style.display = 'none';
      const list = document.getElementById('calendar-events');
      list.style.display = 'flex';
      list.innerHTML = '';
      
      // Populate custom playlists with Gaston's mock lists
      const gastonMockPlaylists = [
        { id: "PLofht4PTc7ysV867zV5Z5yOep_P1E9M68", title: "La Súper Catarina Mix (Gastón's Choice)" },
        { id: "PLr7wK_1wK5NlJ2_Qv9i7qTjF56rN3xO90", title: "Tulum Sunset Chill vol.4 - gastonmorante@gmail.com" },
        { id: "PLhSZ95G2C5WqR7lQ7O1z-Ysh6a2H5C05n", title: "Rock ADV Offroad Mix (Gastón Morante)" }
      ];
      populateRadioPlaylists(gastonMockPlaylists);

      gastonCalendarEvents.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'calendar-event-item';
        item.innerHTML = `
          <div class="event-left">
            <span class="event-date">${ev.date}</span>
            <span class="event-title">${ev.title}</span>
          </div>
          <span class="event-time">${ev.time}</span>
        `;
        list.appendChild(item);
      });
      
      const trans = projectTranslations[currentLanguage];
      document.getElementById('calendar-subtitle').textContent = trans.calendarConnected;
      
      playSynthBeep(440, 'sine', 0.15);
      addAiMessage('system', currentLanguage === 'es' 
        ? `Sesión iniciada como ${event.data.name} (${event.data.email}). Calendario sincronizado.` 
        : `Signed in as ${event.data.name} (${event.data.email}). Expeditions schedule synced.`);
      
      if (event.data.musicConnected) {
        addAiMessage('system', currentLanguage === 'es'
          ? "Licencia de YouTube Music enlazada a NegocioUp Radio de forma exitosa."
          : "YouTube Music license linked to NegocioUp Radio successfully.");
      }
    }
  };
  window.addEventListener('message', handleOauthMessage);
}

// BEEP GENERATOR USING WEB AUDIO API
function playSynthBeep(freq, type, duration) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(freq || 440, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("AudioContext beep failed: ", e);
  }
}

// WELCOME BANNER LAUNCH
function startAppWelcome() {
  try {
    // Play satellite locked beep
    playSynthBeep(587.33, 'triangle', 0.25);
    setTimeout(() => playSynthBeep(880, 'sine', 0.3), 150);
  } catch (e) {
    console.warn("AudioContext beep failed: ", e);
  }

  // Greeting message in chat log (Voice Welcome Skipped)
  try {
    const welcomeText = projectTranslations[currentLanguage].welcomeText;
    addAiMessage('system', welcomeText);
  } catch (e) {
    console.warn("welcome status write failed:", e);
  }

  // Fade out preloader
  try {
    const preloader = document.getElementById('app-preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => {
        try {
          preloader.remove();
          if (map) map.invalidateSize();
          
          // Trigger Google login modal immediately after entrance
          triggerGoogleLoginModal();
        } catch (e) {
          console.error("preloader remove inner failed:", e);
        }
      }, 600);
    }
  } catch (e) {
    console.error("preloader fade out failed:", e);
  }
}

// YOUTUBE MUSIC RADIO TRACK CHANGEOVER
function onRadioTrackChange() {
  const select = document.getElementById('radio-track-select');
  const iframe = document.getElementById('radio-iframe');
  if (select && iframe) {
    const baseUrl = select.value;
    const delimiter = baseUrl.includes('?') ? '&' : '?';
    iframe.src = `${baseUrl}${delimiter}enablejsapi=1&controls=1`;
    playSynthBeep(523.25, 'sine', 0.1);
  }
}

function loadCustomPlaylist() {
  const input = document.getElementById('custom-playlist-input');
  const iframe = document.getElementById('radio-iframe');
  if (!input || !iframe) return;

  const urlText = input.value.trim();
  if (!urlText) return;

  // Extract playlist ID from URL (e.g. list=PL...)
  let playlistId = "";
  if (urlText.includes("list=")) {
    const parts = urlText.split("list=");
    playlistId = parts[1].split("&")[0];
  } else {
    // Treat the whole input as the ID if it looks like a playlist ID
    playlistId = urlText;
  }

  if (playlistId) {
    iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1&controls=1`;
    playSynthBeep(659.25, 'sine', 0.1); // Play high confirmation beep
    input.value = "";
    input.placeholder = "Playlist activa...";
    // Save to localStorage so it persists across reloads!
    localStorage.setItem('negocioup_custom_playlist', playlistId);
  }
}

// TEXT ENTRY SUBMISSIONS FOR GEMINI AI AGENT
function sendAiTextQuery() {
  const input = document.getElementById('ai-text-input');
  if (!input || !input.value.trim()) return;

  const queryText = input.value.trim();
  addAiMessage('user', queryText);
  
  // Process query
  processAiTextQuery(queryText);
  
  // Reset input field
  input.value = '';
}

// Initialize Speech Recognition
function initSpeechRecognition() {
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-MX'; // Mexican Spanish
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById('btn-mic-trigger').classList.add('recording');
    document.getElementById('mic-status-label').textContent = "ESCUCHANDO...";
    document.getElementById('holo-core-orb').classList.add('holo-listening');
    addAiMessage('system', 'Micrófono abierto. Esperando transmisión de voz...');
    startWaveformAnimation();
  };

  recognition.onspeechend = () => {
    recognition.stop();
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById('btn-mic-trigger').classList.remove('recording');
    document.getElementById('mic-status-label').textContent = "ACTIVAR MICRÓFONO";
    document.getElementById('holo-core-orb').classList.remove('holo-listening');
    if (!isSpeaking) {
      stopWaveformAnimation();
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error: ", event.error);
    addAiMessage('system', `Error de transmisión de voz: ${event.error}`);
    isListening = false;
    const btn = document.getElementById('btn-mic-trigger');
    if (btn) btn.classList.remove('recording');
    const label = document.getElementById('mic-status-label');
    if (label) label.textContent = "ACTIVAR MICRÓFONO";
    const orb = document.getElementById('holo-core-orb');
    if (orb) orb.classList.remove('holo-listening');
    stopWaveformAnimation();
  };

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    addAiMessage('user', speechResult);
    processAiTextQuery(speechResult);
  };
  } catch (err) {
    console.warn("Speech recognition initialization failed:", err);
    recognition = null;
  }
}

function toggleVoiceSpeech() {
  if (!recognition) {
    initSpeechRecognition();
  }

  if (!recognition) {
    addAiMessage('system', 'Error: Tu navegador no es compatible con el reconocimiento de voz web.');
    return;
  }

  if (isListening) {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }
  } else {
    // Stop speaking if AI is talking
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    isSpeaking = false;
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {}
    }
  }
}

function toggleVoiceMute() {
  speechMute = !speechMute;
  const muteBtn = document.getElementById('btn-voice-mute');
  const label = document.getElementById('mute-status-label');
  if (speechMute) {
    muteBtn.classList.add('muted');
    label.textContent = "VOZ MUTED";
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    isSpeaking = false;
  } else {
    muteBtn.classList.remove('muted');
    label.textContent = "VOZ ACTIVADA";
  }
}

function triggerQuickAiQuery(query) {
  addAiMessage('user', `[Botón Rápido] ${query}`);
  processAiTextQuery(query);
}

function processAiTextQuery(text) {
  const query = text.toLowerCase();
  let reply = "";

  // 1. Voice Action: Route Report
  if (query.includes('ruta') || query.includes('reporte')) {
    if (state.activeLocation) {
      const distanceEl = document.getElementById('metric-distance');
      const durationEl = document.getElementById('metric-duration');
      const fuelEl = document.getElementById('metric-fuel-liters');
      const costEl = document.getElementById('metric-fuel-cost');

      const distVal = distanceEl ? distanceEl.textContent : "0 km";
      const durVal = durationEl ? durationEl.textContent : "0h 0m";
      const fuelVal = fuelEl ? fuelEl.textContent : "0 L";
      const costVal = costEl ? costEl.textContent : "$0 MXN";

      if (currentLanguage === 'es') {
        reply = `Análisis de ruta satelital hacia ${state.activeLocation.name}. La distancia calculada por carretera es de ${distVal}. Tiempo estimado de viaje: ${durVal}. Consumo estimado de combustible: ${fuelVal} con un costo aproximado de ${costVal}.`;
      } else {
        reply = `Satellite route analysis to ${state.activeLocation.name}. The calculated road distance is ${distVal}. Estimated travel time: ${durVal}. Estimated fuel consumption: ${fuelVal} with an approximate cost of ${costVal}.`;
      }
    } else {
      reply = currentLanguage === 'es' 
        ? "No he detectado ninguna ruta activa. Por favor selecciona tu destino en el panel de control." 
        : "No active route detected. Please select your destination in the control panel.";
    }
  }
  // 2. Voice Action: Sales Pitch Script (~20 seconds)
  else if (query.includes('vendedor')) {
    if (state.activeLocation) {
      const loc = state.activeLocation;
      if (currentLanguage === 'es') {
        reply = `¡Prepárate Gastón para vivir una expedición legendaria a ${loc.name}! Imagina sentir la potencia de la Súper Catarina conquistando caminos indómitos de caliza y selva virgen, guiado por la brisa tropical. Este rincón secreto guarda historias ancestrales y paisajes espectaculares que quedarán grabados en tus tomas de video. ¡El motor está encendido, el destino aguarda y la aventura de tu vida comienza hoy mismo con NegocioUp Adventures!`;
      } else {
        reply = `Get ready Gaston to experience a legendary expedition to ${loc.name}! Picture the raw power of the Super Catarina conquering wild limestone trails and virgin jungle, guided by the tropical breeze. This secret spot holds ancestral Mayan secrets and breathtaking vistas perfect for your next viral video. The engine is running, the road is clear, and your ultimate adventure starts now with NegocioUp Adventures!`;
      }
    } else {
      reply = currentLanguage === 'es'
        ? "Por favor, selecciona un destino en el mapa de Yucatán primero para generar el guion vendedor."
        : "Please select a destination on the Yucatan map first to generate the sales pitch.";
    }
  }
  // 3. Voice Action: Route & Stops Diagnosis
  else if (query.includes('diagnostico_ruta') || query.includes('diagnóstico')) {
    if (state.activeLocation) {
      const loc = state.activeLocation;
      let roadType = "";
      let psiVal = "";
      let tireMode = "";
      let towns = "";

      const cat = loc.category;
      if (cat === 'CAT_A') {
        roadType = currentLanguage === 'es' ? "arena costera y caminos de terracería" : "coastal sand & dirt roads";
        psiVal = "22 PSI adelante, 25 PSI atrás";
        tireMode = currentLanguage === 'es' ? "Tierra (baja presión)" : "Dirt (low pressure)";
        towns = "Playa del Carmen, Xcalacoco, Paamul, Akumal, Tulum";
      } else if (cat === 'CAT_B') {
        roadType = currentLanguage === 'es' ? "caminos de terracería con piedras sueltas y caliza" : "gravel roads with loose stones & limestone";
        psiVal = "22 PSI adelante, 25 PSI atrás";
        tireMode = currentLanguage === 'es' ? "Tierra (baja presión)" : "Dirt (low pressure)";
        towns = "Playa del Carmen, Puerto Aventuras, Tulum, Cobá";
      } else if (cat === 'CAT_C') {
        roadType = currentLanguage === 'es' ? "carretera pavimentada interurbana" : "paved intercity highway";
        psiVal = "29 PSI adelante, 33 PSI atrás";
        tireMode = currentLanguage === 'es' ? "Carretera (presión nominal)" : "Road (nominal pressure)";
        towns = "Cancún, Puerto Morelos, Leona Vicario, Valladolid";
      } else if (cat === 'CAT_D') {
        roadType = currentLanguage === 'es' ? "carretera pavimentada y accesos de grava" : "paved highway & gravel access paths";
        psiVal = "25 PSI adelante, 28 PSI atrás";
        tireMode = currentLanguage === 'es' ? "Mixto" : "Mixed";
        towns = "Valladolid, Chichén Itzá, Pisté, Cobá";
      } else {
        roadType = currentLanguage === 'es' ? "carreteras secundarias y terracería ligera" : "secondary roads & light dirt trails";
        psiVal = "25 PSI adelante, 28 PSI atrás";
        tireMode = currentLanguage === 'es' ? "Mixto" : "Mixed";
        towns = "Tulum, Felipe Carrillo Puerto, Tihosuco, Chunhuhub";
      }

      if (currentLanguage === 'es') {
        reply = `Diagnóstico de ruta para ${loc.name}. Terreno previsto: ${roadType}. Ajuste de la Súper Catarina: Neumáticos en ${psiVal} (Modo ${tireMode}). Tips: ${loc.tips}. En tu trayecto pasarás por los poblados clave de: ${towns}.`;
      } else {
        reply = `Route diagnosis for ${loc.name}. Terrain type: ${roadType}. Super Catarina Spec: Set tires to ${psiVal} (Mode ${tireMode}). Tips: ${loc.tips}. On your way, you will pass through key settlements of: ${towns}.`;
      }
    } else {
      reply = currentLanguage === 'es'
        ? "No hay ningún destino activo para diagnosticar la ruta. Selecciona un punto en el mapa de Yucatán."
        : "No active destination to diagnose the route. Please select a point on the Yucatan map.";
    }
  }
  // Voice State Swapping commands (navigation HUD toggle)
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('instrument') || lowerQuery.includes('chrono')) {
    const hud = document.getElementById('instrument-hud-overlay');
    if (hud && hud.style.display === 'none') {
      toggleCockpitView();
      reply = currentLanguage === 'es' ? "Cambiando a vista de cabina táctica." : "Swapping to tactical cockpit view.";
      addAiMessage('ai', reply);
      return;
    }
  } else if (lowerQuery.includes('volver') || lowerQuery.includes('regresar') || lowerQuery.includes('back')) {
    const hud = document.getElementById('instrument-hud-overlay');
    if (hud && hud.style.display !== 'none') {
      toggleCockpitView();
      reply = currentLanguage === 'es' ? "Regresando a navegación de mapas." : "Returning to map navigation.";
      addAiMessage('ai', reply);
      return;
    }
  }

  // 4. Mechanical Expert
  else if (query.includes('mecanic') || query.includes('aceite') || query.includes('cadena') || query.includes('fi code') || query.includes('presion') || query.includes('v-strom') || query.includes('altura')) {
    if (currentLanguage === 'es') {
      reply = "• Suzuki V-Strom 250 SX.\n• Aceite motor: 1.2L.\n• Tensión cadena: 20-30mm.\n• Asiento: 835mm de altura.\n• Verificar suelo en paradas.\n• Escanear códigos FI.";
    } else {
      reply = "• Suzuki V-Strom 250 SX.\n• Engine oil: 1.2L.\n• Chain tension: 20-30mm.\n• Seat height: 835mm.\n• Check ground before parking.\n• Scan active FI codes.";
    }
  }
  // 5. Voice Action: First aid & survival
  else if (query.includes('auxilio') || query.includes('calor') || query.includes('hidratacion') || query.includes('abrasion') || query.includes('emergencia') || query.includes('green angels') || query.includes('hospital')) {
    if (currentLanguage === 'es') {
      reply = "• Golpe de calor: 911.\n• Ángeles Verdes: 078.\n• Hidratación: cada 45 min.\n• Cortes: lavar con agua.\n• Picaduras: usar antihistamínicos.";
    } else {
      reply = "• Heatstroke: call 911.\n• Road assistance: 078.\n• Hydrate every 45 minutes.\n• Clean cuts with water.\n• Stings: use antihistamines.";
    }
  }
  // 6. Voice Action: Storytelling & video scripts
  else if (query.includes('b-roll') || query.includes('guion') || query.includes('youtube') || query.includes('dron') || query.includes('filmacion') || query.includes('histori')) {
    const loc = state.activeLocation || locations[0];
    if (currentLanguage === 'es') {
      reply = `• Guion B-Roll: ${loc.name}.\n• Toma cenital con dron.\n• Detalle de motor SOCS.\n• Gancho: ${loc.story_hook}.`;
    } else {
      reply = `• B-Roll Script: ${loc.name}.\n• Zenithal drone path.\n• Detail SOCS engine.\n• Hook: ${loc.story_hook}.`;
    }
  }
  // Default General Response
  else {
    reply = currentLanguage === 'es'
      ? "Enlace satelital Gemini activo. Puedo guiarte con tu reporte de ruta, emitir el guion vendedor del destino, o diagnosticar el camino y los poblados por transitar. ¿Qué deseas hacer?"
      : "Gemini satellite link active. I can guide you with your route report, generate the sales pitch for the destination, or diagnose the road and villages along your path. What would you like to do?";
  }

  // Add AI reply to log
  addAiMessage('ai', reply);

  // Speak AI reply ONLY on specific user request per critical_action_03
  const isSpecificRequest = 
    query.includes("tell me about this place") || 
    query.includes("hablame de este lugar") || 
    query.includes("cuentame de este lugar") || 
    query.includes("sobre este lugar") || 
    query.includes("give me mechanical info") || 
    query.includes("dame info mecanica") || 
    query.includes("informacion mecanica") || 
    query.includes("mecanica") || 
    query.includes("auxilios") || 
    query.includes("b-roll");

  if (isSpecificRequest) {
    speakAiResponse(reply);
  } else {
    console.log("Speech output skipped: query does not match explicit request criteria.");
  }
}

function addAiMessage(sender, text) {
  const chatLog = document.getElementById('ai-chat-log');
  if (!chatLog) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}`;

  let labelText = "PILOTO";
  if (sender === 'ai') labelText = "GEMINI SPECIALIST";
  if (sender === 'system') labelText = "SAT LINK";

  msgDiv.innerHTML = `
    <span class="msg-time">${timeStr} // ${labelText}</span>
    <p>${text}</p>
  `;

  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function speakAiResponse(text) {
  if (speechMute) return;

  // 35% chance of appending a random travel companion remark, but only if it's not the initial welcome message
  let finalSpeechText = text;
  if (!text.includes("Catarina") && !text.includes("motor") && Math.random() < 0.35) {
    finalSpeechText += " " + generateCompanionRemark();
  }

  // If a Google API Key is present, use Google Cloud Text-to-Speech (Neural2 hyper-realistic voice)
  if (GOOGLE_API_KEY) {
    speakAiResponseGoogleCloud(finalSpeechText);
  } else {
    speakAiResponseNative(finalSpeechText);
  }
}

function speakAiResponseGoogleCloud(text) {
  // Play holo core speaking visual animation
  isSpeaking = true;
  const orb = document.getElementById('holo-core-orb');
  if (orb) orb.classList.add('holo-speaking');
  startWaveformAnimation();

  // Cancel any active Web Speech synthesis
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn(e);
    }
  }

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
  const requestData = {
    input: { text: text },
    voice: {
      languageCode: currentLanguage === 'es' ? 'es-ES' : 'en-US',
      name: currentLanguage === 'es' ? 'es-ES-Neural2-F' : 'en-US-Neural2-F', // Hyper-realistic Neural2 female voices
      ssmlGender: 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.98,
      pitch: -1.0 // Lower pitch gives an intimate, natural, warmer human tone
    }
  };

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  })
  .then(res => res.json())
  .then(data => {
    if (!data.audioContent) {
      throw new Error("No audio content");
    }
    
    const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
    const blob = new Blob([audioBytes], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    if (window.activeAudioSpeech) {
      window.activeAudioSpeech.pause();
    }
    window.activeAudioSpeech = audio;
    audio.play();
    
    audio.onended = () => {
      isSpeaking = false;
      if (orb) orb.classList.remove('holo-speaking');
      if (!isListening) stopWaveformAnimation();
    };
  })
  .catch(err => {
    console.warn("Google Cloud TTS failed, falling back to native SpeechSynthesis:", err);
    speakAiResponseNative(text);
  });
}

function speakAiResponseNative(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    console.warn("Web SpeechSynthesis is not supported in this browser.");
    return;
  }
  // Cancel any active speech
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    console.warn(e);
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = currentLanguage === 'es' ? 'es-ES' : 'en-US'; // Set Spain Spanish (es-ES) for Spain voice accent
  
  // Tuned parameters for a warm, natural, and friendly female voice
  utterance.pitch = 1.12; // Warmer tone
  utterance.rate = 0.98;  // Slightly more relaxed speed for natural delivery
  
  let voices = speechVoices || [];
  if (voices.length === 0) {
    try {
      voices = window.speechSynthesis.getVoices() || [];
    } catch (err) {
      console.warn("getVoices failed:", err);
      voices = [];
    }
  }
  const langMatch = currentLanguage === 'es' ? 'es' : 'en';
  const langVoices = (voices || []).filter(v => v && v.lang && v.lang.toLowerCase().includes(langMatch));
  
  // First priority: Check if the user has a custom voice selected as default on their phone/OS
  let targetVoice = langVoices.find(v => v.default);
  
  if (!targetVoice) {
    const preferredNames = currentLanguage === 'es' 
      ? ['helena', 'elena', 'lucia', 'penelope', 'siri', 'google', 'female', 'es-es'] 
      : ['samantha', 'zira', 'hazel', 'siri', 'susan', 'mary', 'karen', 'female', 'google'];
      
    for (let nameKey of preferredNames) {
      targetVoice = langVoices.find(v => v && v.name && v.name.toLowerCase().includes(nameKey));
      if (targetVoice) break;
    }
  }
  
  // Strict female name matching fallback (excluding common male voice names like David)
  if (!targetVoice && langVoices.length > 0) {
    const femaleKeywords = ['female', 'zira', 'samantha', 'siri', 'monica', 'paulina', 'sabina', 'helena', 'elena', 'hazel', 'susan', 'mary', 'karen', 'lisa', 'microsoft', 'google'];
    targetVoice = langVoices.find(v => {
      if (!v || !v.name) return false;
      const name = v.name.toLowerCase();
      if (name.includes('david') || name.includes('male') || name.includes('haruka') || name.includes('ichiro') || name.includes('heera')) return false;
      return femaleKeywords.some(kw => name.includes(kw));
    });
  }
  
  // Final fallback
  if (!targetVoice && langVoices.length > 0) {
    targetVoice = langVoices[0];
  }
  
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  utterance.onstart = () => {
    isSpeaking = true;
    const orb = document.getElementById('holo-core-orb');
    if (orb) orb.classList.add('holo-speaking');
    startWaveformAnimation();
  };

  utterance.onend = () => {
    isSpeaking = false;
    document.getElementById('holo-core-orb').classList.remove('holo-speaking');
    if (!isListening) {
      stopWaveformAnimation();
    }
  };

  utterance.onerror = (e) => {
    console.error("Speech Synthesis error: ", e);
    isSpeaking = false;
    document.getElementById('holo-core-orb').classList.remove('holo-speaking');
    stopWaveformAnimation();
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("speechSynthesis.speak failed: ", e);
    isSpeaking = false;
    const orb = document.getElementById('holo-core-orb');
    if (orb) orb.classList.remove('holo-speaking');
    stopWaveformAnimation();
  }
}

function generateCompanionRemark() {
  const openings = currentLanguage === 'es' ? [
    "¡Oye, Gastón! ",
    "¡Escucha esto, guapo: ",
    "¡Dato curioso para nuestra bitácora! ",
    "¡Mira nada más, ",
    "¡Un pequeño secreto de tu copiloto favorita: ",
    "¡Oye, ",
    "¡Por cierto, Gastón, ",
    "¡Qué viaje tan increíble! ",
    "¡Me encanta estar aquí contigo! ",
    "¡Escucha, "
  ] : [
    "Hey Gaston! ",
    "Listen to this, handsome: ",
    "Fun fact for our log: ",
    "Check this out, ",
    "A little secret from your favorite co-pilot: ",
    "Hey, ",
    "By the way, Gaston, ",
    "What an amazing trip! ",
    "I love being out here with you! ",
    "Listen up: "
  ];

  const bodies = currentLanguage === 'es' ? [
    "si nos perdemos en la selva, al menos tenemos buena música en la radio.",
    "adoro cómo ruge el escape de la Súper Catarina cuando aceleras a fondo.",
    "más vale que no intentes hacer caballitos conmigo a bordo.",
    "con este calor de Yucatán, ya se antoja una parada para comer ceviche y tomarnos algo bien helado.",
    "me fascina ir abrazada a ti mientras cruzamos estos caminos de caliza.",
    "si vemos un cenote secreto, nos paramos a nadar aunque no llevemos traje de baño.",
    "el atardecer de hoy va a estar espectacular para unas tomas de dron increíbles.",
    "esa Súper Catarina se porta como una campeona en la arena profunda.",
    "vamos a necesitar repelente de mosquitos si nos paramos aquí, ¡me están comiendo viva!",
    "me encanta sentir el viento tropical en la cara mientras manejas.",
    "este camino de terracería es perfecto para probar la suspensión de la Súper Catarina.",
    "creo que nos espera una gran historia en el próximo poblado maya.",
    "tengo el presentimiento de que esta filmación de YouTube va a ser un éxito viral."
  ] : [
    "if we get lost in the jungle, at least we have great music on the radio.",
    "I just love how the Super Catarina exhaust roars when you rev it.",
    "you better not try to pull any wheelies with me holding onto you.",
    "with this Yucatan heat, I'm already craving a cold drink and some fresh ceviche.",
    "I love holding onto you while we cross these limestone trails.",
    "if we spot a secret cenote, we are stopping for a swim, even without swimsuits.",
    "tonight's sunset is going to be perfect for some epic drone shots.",
    "the Super Catarina is behaving like an absolute champion on this deep sand.",
    "we'll need bug spray if we stop here, the mosquitoes are eating me alive!",
    "I love feeling the tropical wind on my face while you ride.",
    "this dirt trail is perfect for testing the suspension of the Super Catarina.",
    "I think a great story awaits us in the next Mayan village.",
    "I have a feeling this YouTube shoot is going to be a viral hit."
  ];

  const closings = currentLanguage === 'es' ? [
    " ¡Sigue así, guapo!",
    " ¡A darle gas!",
    " ¡No te distraigas viéndome!",
    " ¡Qué gran piloto eres!",
    " ¿Listos para el siguiente tramo?",
    " ¡Me encantas!"
  ] : [
    " Keep it up, handsome!",
    " Let's roll!",
    " Don't get distracted looking at me!",
    " You're a great rider!",
    " Ready for the next stretch?",
    " I love this!"
  ];

  const op = openings[Math.floor(Math.random() * openings.length)];
  const bd = bodies[Math.floor(Math.random() * bodies.length)];
  const cl = closings[Math.floor(Math.random() * closings.length)];

  return op + bd + cl;
}

async function fetchUserYoutubePlaylists() {
  try {
    const response = await gapi.client.youtube.playlists.list({
      mine: true,
      part: 'snippet',
      maxResults: 10
    });
    const playlists = response.result.items.map(item => ({
      id: item.id,
      title: item.snippet.title
    }));
    populateRadioPlaylists(playlists);
  } catch (err) {
    console.warn("YouTube API playlists fetch failed, loading default mixes:", err);
  }
}

function populateRadioPlaylists(playlists) {
  const select = document.getElementById('radio-track-select');
  if (!select) return;

  // Clear existing default options
  select.innerHTML = '';

  // Add the synced playlists
  playlists.forEach(pl => {
    const opt = document.createElement('option');
    opt.value = `https://www.youtube.com/embed/videoseries?list=${pl.id}`;
    opt.textContent = pl.title.includes(' - ') ? pl.title : `🎵 ${pl.title}`;
    select.appendChild(opt);
  });

  // Automatically trigger the first playlist update
  onRadioTrackChange();
}

// HOLOGRAPHIC WAVEFORM CANVAS ANIMATION
function startWaveformAnimation() {
  if (canvasAnimId) return;

  const canvas = document.getElementById('waveform-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let phase = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#E21B1B';

    const layers = [
      { amp: 25, freq: 0.02, speed: 0.15, alpha: 0.8 },
      { amp: 15, freq: 0.04, speed: -0.22, alpha: 0.45 },
      { amp: 8, freq: 0.06, speed: 0.35, alpha: 0.25 }
    ];

    layers.forEach(layer => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(226, 27, 27, ${layer.alpha})`;
      
      const scale = isSpeaking ? 1.2 : (isListening ? 0.7 : 0.08);

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin(x * layer.freq + phase * layer.speed) * layer.amp * scale;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    phase += 0.5;
    canvasAnimId = requestAnimationFrame(draw);
  }

  canvasAnimId = requestAnimationFrame(draw);
}

function stopWaveformAnimation() {
  if (canvasAnimId) {
    cancelAnimationFrame(canvasAnimId);
    canvasAnimId = null;
    
    // Draw flat line
    const canvas = document.getElementById('waveform-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(226, 27, 27, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
  }
}

// EXPOSE INTERACTIVE MODULE FUNCTIONS TO GLOBAL WINDOW OBJECT FOR INLINE HTML HANDLERS
window.toggleLanguage = toggleLanguage;
window.triggerGoogleLoginModal = triggerGoogleLoginModal;
window.setTireMode = setTireMode;
window.showHotspot = showHotspot;
window.setWizardStep = setWizardStep;
window.selectSymptom = selectSymptom;
window.proceedToWizardStep3 = proceedToWizardStep3;
window.activateMechanicDialer = activateMechanicDialer;
window.showTriage = showTriage;
window.initiateCall = initiateCall;
window.endCall = endCall;
window.simulateMedicalRoute = simulateMedicalRoute;
window.filterLocations = filterLocations;
window.switchMapLayer = switchMapLayer;
window.generateScriptHook = generateScriptHook;
window.copyScriptText = copyScriptText;
window.toggleVoiceSpeech = toggleVoiceSpeech;
window.toggleVoiceMute = toggleVoiceMute;
window.sendAiTextQuery = sendAiTextQuery;
window.triggerQuickAiQuery = triggerQuickAiQuery;
window.simulateGoogleLogin = simulateGoogleLogin;
window.simulateGoogleLoginAny = simulateGoogleLoginAny;
window.closeGoogleLoginModal = closeGoogleLoginModal;
window.selectLocation = selectLocation;
window.triggerWelcomeSpeech = triggerWelcomeSpeech;
window.dialSelectedContact = dialSelectedContact;
window.onRouteCategoryChange = onRouteCategoryChange;
window.onRouteLocationChange = onRouteLocationChange;
window.onRadioTrackChange = onRadioTrackChange;
window.loadCustomPlaylist = loadCustomPlaylist;


// COCKPIT VIEW TOGGLE, SCRAMBLE TRANSITIONS, AND DYNAMIC DIALS
let hudInterval = null;
function toggleCockpitView() {
  const hud = document.getElementById('instrument-hud-overlay');
  const appContainer = document.querySelector('.app-container');
  if (hud && appContainer) {
    const isHidden = hud.style.display === 'none';
    hud.style.display = isHidden ? 'block' : 'none';
    
    if (isHidden) {
      hud.style.opacity = '0';
      hud.style.transition = 'opacity 0.25s ease-in-out';
      setTimeout(() => { hud.style.opacity = '1'; }, 30);
      
      // Hide other elements
      appContainer.style.display = 'none';
      document.body.style.overflow = 'hidden';
      
      // Text scramble animation
      const hTitle = document.getElementById('hud-scramble-title');
      if (hTitle) runTextScramble(hTitle, "INSTRUMENTATION COCKPIT ACTIVE");

      startHudSimulators();
    } else {
      appContainer.style.display = 'flex';
      document.body.style.overflow = 'auto';
      
      stopHudSimulators();
    }
  }
}

function runTextScramble(element, text) {
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  let frame = 0;
  const queue = [];
  for (let i = 0; i < text.length; i++) {
    const from = '';
    const to = text[i];
    const start = Math.floor(Math.random() * 15);
    const end = start + Math.floor(Math.random() * 15);
    queue.push({ from, to, start, end, char: '' });
  }
  
  let animationFrame;
  function update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < queue.length; i++) {
      let { from, to, start, end, char } = queue[i];
      if (frame >= end) {
        complete++;
        output += to;
      } else if (frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = chars[Math.floor(Math.random() * chars.length)];
          queue[i].char = char;
        }
        output += `<span style="color:var(--primary); font-weight:bold;">${char}</span>`;
      } else {
        output += from;
      }
    }
    element.innerHTML = output;
    if (complete === queue.length) {
      cancelAnimationFrame(animationFrame);
    } else {
      frame++;
      animationFrame = requestAnimationFrame(update);
    }
  }
  update();
}

function startHudSimulators() {
  if (hudInterval) clearInterval(hudInterval);
  hudInterval = setInterval(() => {
    // 1. Telemetry updates
    const speed = 45 + Math.round(Math.random() * 45);
    const headingVal = Math.round(Math.random() * 360);
    let cardinal = "N";
    if (headingVal >= 337.5 || headingVal < 22.5) cardinal = "N";
    else if (headingVal >= 22.5 && headingVal < 67.5) cardinal = "NE";
    else if (headingVal >= 67.5 && headingVal < 112.5) cardinal = "E";
    else if (headingVal >= 112.5 && headingVal < 157.5) cardinal = "SE";
    else if (headingVal >= 157.5 && headingVal < 202.5) cardinal = "S";
    else if (headingVal >= 202.5 && headingVal < 247.5) cardinal = "SW";
    else if (headingVal >= 247.5 && headingVal < 292.5) cardinal = "W";
    else if (headingVal >= 292.5 && headingVal < 337.5) cardinal = "NW";

    const speedEl = document.getElementById('hud-speed');
    const headingEl = document.getElementById('hud-heading');
    const altitudeEl = document.getElementById('hud-altitude');
    const dialPointer = document.getElementById('hud-circular-pointer');

    if (speedEl) speedEl.textContent = `${speed} km/h`;
    if (headingEl) headingEl.textContent = `${cardinal} ${headingVal}°`;
    if (dialPointer) dialPointer.style.transform = `rotate(${headingVal}deg)`;
    
    const altEl = document.getElementById('metric-altitude');
    if (altEl && altitudeEl) {
      altitudeEl.textContent = altEl.textContent;
    }

    // 2. Stress Control Level Indicator
    const lean = -25 + Math.round(Math.random() * 50);
    const leanBar = document.getElementById('hud-lean-bar');
    const leanText = document.getElementById('hud-lean-text');
    if (leanBar) {
      leanBar.style.width = `${50 + (lean / 50) * 50}%`;
    }
    if (leanText) leanText.textContent = `${Math.abs(lean)}° ${lean >= 0 ? 'R' : 'L'}`;

    // Lean Angle alert thresholds & vibration simulation
    const stressPanel = document.getElementById('hud-stress-panel');
    if (Math.abs(lean) > 42) {
      if (stressPanel) {
        stressPanel.style.borderColor = '#EA4335';
        stressPanel.style.boxShadow = '0 0 20px rgba(234,67,53,0.3)';
        stressPanel.style.background = 'rgba(234,67,53,0.06)';
      }
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      if (stressPanel) {
        stressPanel.style.borderColor = 'var(--border-color)';
        stressPanel.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
        stressPanel.style.background = 'rgba(255,255,255,0.02)';
      }
    }

    const gforce = (0.9 + Math.random() * 0.3).toFixed(2);
    const gforceEl = document.getElementById('hud-gforce');
    if (gforceEl) gforceEl.textContent = `${gforce} G`;

    const brake = speed > 70 ? "0.0" : (Math.random() * 3.5).toFixed(1);
    const brakeEl = document.getElementById('hud-brake');
    if (brakeEl) brakeEl.textContent = `${brake} bar`;

    // 3. Rain updates (Hygrometer dial)
    const humEl = document.getElementById('weather-humidity');
    const rainEl = document.getElementById('weather-rain-prob');
    const hudHumEl = document.getElementById('hud-humidity');
    const hudPrecipEl = document.getElementById('hud-precip');

    if (humEl && rainEl && hudHumEl && hudPrecipEl) {
      const humText = humEl.textContent;
      const rainText = rainEl.textContent;
      hudHumEl.textContent = humText;
      hudPrecipEl.textContent = rainText;

      const rainProb = parseInt(rainText.replace('%', '')) || 0;
      const rainPanel = document.getElementById('hud-rain-panel');
      const rainTitle = document.getElementById('hud-rain-title');
      const friction = document.getElementById('hud-friction');

      if (rainProb > 40) {
        if (rainPanel) {
          rainPanel.style.background = 'rgba(234,67,53,0.05)';
          rainPanel.style.borderColor = '#EA4335';
          rainPanel.style.boxShadow = '0 0 15px rgba(234,67,53,0.15)';
        }
        if (rainTitle) {
          rainTitle.textContent = '🌧️ RAIN STATUS: ALERT_RED';
          rainTitle.style.color = '#EA4335';
          rainTitle.style.borderColor = 'rgba(234,67,53,0.2)';
        }
        if (friction) {
          friction.textContent = 'LOW (ALERT_RED)';
          friction.style.color = '#EA4335';
        }
      } else {
        if (rainPanel) {
          rainPanel.style.background = 'rgba(34,168,83,0.05)';
          rainPanel.style.borderColor = '#34A853';
          rainPanel.style.boxShadow = '0 0 15px rgba(34,168,83,0.15)';
        }
        if (rainTitle) {
          rainTitle.textContent = '🌧️ RAIN STATUS: OK_GREEN';
          rainTitle.style.color = '#34A853';
          rainTitle.style.borderColor = 'rgba(34,168,83,0.2)';
        }
        if (friction) {
          friction.textContent = 'HIGH (OK_GREEN)';
          friction.style.color = '#34A853';
        }
      }
    }
  }, 1000);
}

function stopHudSimulators() {
  if (hudInterval) {
    clearInterval(hudInterval);
    hudInterval = null;
  }
}

window.toggleCockpitView = toggleCockpitView;
window.toggleInstrumentHud = toggleCockpitView;
