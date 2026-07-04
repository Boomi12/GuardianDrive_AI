// Time calculations and validation helper
import { mockDestinations, defaultMockDestination } from './mockData.js';
import { MOCK_PLACES, searchPlaces } from './googleMaps.js';

// Convert "09:00 AM" to minutes from midnight
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Convert minutes from midnight to "09:00 AM"
export function minutesToTime(minutes) {
  let mins = minutes % 1440;
  if (mins < 0) mins += 1440;
  let hours = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const padM = m < 10 ? '0' + m : m;
  const padH = hours < 10 ? '0' + hours : hours;
  return `${padH}:${padM} ${ampm}`;
}

// Parse a date string (supporting YYYY-MM-DD and DD-MM-YYYY) manually in the local timezone
export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  
  const cleaned = dateStr.trim();
  let parts = cleaned.split('-');
  if (parts.length !== 3) {
    parts = cleaned.split('/');
  }
  
  if (parts.length === 3) {
    let year, month, day;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      // Fallback
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  
  const d = new Date(cleaned);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Check if a date string is today's date in local time
export function isToday(dateStr, relativeTo = new Date()) {
  if (!dateStr) return false;
  const selectedDate = parseLocalDate(dateStr);
  const today = relativeTo;
  return selectedDate.getFullYear() === today.getFullYear() &&
         selectedDate.getMonth() === today.getMonth() &&
         selectedDate.getDate() === today.getDate();
}

// Check if a date string is in the past
export function isPastDate(dateStr, relativeTo = new Date()) {
  if (!dateStr) return false;
  const selectedDate = parseLocalDate(dateStr);
  const today = new Date(relativeTo);
  today.setHours(0, 0, 0, 0);
  return selectedDate.getTime() < today.getTime();
}

// Check if a time string is in the past for today's date
export function isPastTimeToday(dateStr, timeStr, relativeTo = new Date()) {
  if (!dateStr || !timeStr) return false;
  if (!isToday(dateStr, relativeTo)) return false;
  
  const selectedMins = timeToMinutes(timeStr);
  const now = relativeTo;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  return selectedMins < currentMins;
}

// Predefined places database with open, close, visitDuration, type, popularity, coordinates, etc.
export const PLACE_DATABASE = {
  // Mysore Attractions
  "mysore palace": { open: "10:00 AM", close: "05:30 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 10, lat: 12.3051, lng: 76.6551, tags: ["Heritage", "Palace", "Royal", "History"] },
  "chamundi hill temple": { open: "07:30 AM", close: "09:00 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 9, lat: 12.2748, lng: 76.6710, tags: ["Spiritual", "Temple", "Views", "Heritage"] },
  "brindavan gardens": { open: "06:00 AM", close: "08:00 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 8, lat: 12.4278, lng: 76.5728, tags: ["Nature", "Gardens", "Fountains", "Views"] },
  "karanji lake": { open: "08:30 AM", close: "05:30 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 7, lat: 12.3025, lng: 76.6744, tags: ["Nature", "Lake", "Boating"] },
  "mysore zoo": { open: "08:30 AM", close: "05:30 PM", duration: 180, minDuration: 90, type: "attraction", popularity: 7, lat: 12.3018, lng: 76.6644, tags: ["Nature", "Wildlife", "Zoo", "Family"] },
  "jaganmohan palace art gallery": { open: "10:00 AM", close: "05:00 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 6, lat: 12.3061, lng: 76.6496, tags: ["Heritage", "Art", "Gallery", "History"] },
  "st. philomena's church": { open: "08:00 AM", close: "06:00 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 5, lat: 12.3208, lng: 76.6586, tags: ["Heritage", "Church", "Spiritual"] },
  "railway museum": { open: "09:30 AM", close: "05:30 PM", duration: 75, minDuration: 45, type: "attraction", popularity: 4, lat: 12.3168, lng: 76.6429, tags: ["Educational", "Museum", "Family"] },
  "grs fantasy park": { open: "10:30 AM", close: "06:00 PM", duration: 240, minDuration: 120, type: "attraction", popularity: 3, lat: 12.3481, lng: 76.6210, tags: ["Adventure", "Theme Park", "Family"] },
  "lalitha mahal palace": { open: "10:00 AM", close: "06:00 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 2, lat: 12.3005, lng: 76.6908, tags: ["Heritage", "Palace", "Luxury"] },

  // Mysore Restaurants
  "hotel mylari": { open: "07:00 AM", close: "10:00 PM", duration: 45, minDuration: 30, type: "restaurant", popularity: 8, lat: 12.3090, lng: 76.6610, tags: ["Food", "Breakfast", "Dosa", "Iconic"] },
  "gufha restaurant": { open: "12:00 PM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant", popularity: 7, lat: 12.3060, lng: 76.6530, tags: ["Food", "Dinner", "Multi-cuisine", "Ambience"] },
  "the olive garden": { open: "11:00 AM", close: "10:30 PM", duration: 90, minDuration: 45, type: "restaurant", popularity: 7, lat: 12.3011, lng: 76.6890, tags: ["Food", "Fine Dining", "Italian"] },
  "oyster bay": { open: "11:30 AM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant", popularity: 6, lat: 12.3245, lng: 76.6210, tags: ["Food", "Seafood"] },
  "mahesh prasad": { open: "07:00 AM", close: "09:30 PM", duration: 45, minDuration: 30, type: "restaurant", popularity: 6, lat: 12.3015, lng: 76.6430, tags: ["Food", "Vegetarian", "South Indian"] },
  "parklane hotel restaurant": { open: "11:00 AM", close: "11:30 PM", duration: 75, minDuration: 45, type: "restaurant", popularity: 5, lat: 12.3110, lng: 76.6570, tags: ["Food", "Beer", "Open Air"] },
  "sizzler bistro": { open: "12:00 PM", close: "10:30 PM", duration: 60, minDuration: 40, type: "restaurant", popularity: 5, lat: 12.3256, lng: 76.6190, tags: ["Food", "Cafe", "Pasta"] },
  "spring at radisson blu": { open: "06:30 AM", close: "11:30 PM", duration: 90, minDuration: 60, type: "restaurant", popularity: 7, lat: 12.2980, lng: 76.6660, tags: ["Food", "Buffet", "Fine Dining"] },
  "poojari's fish land": { open: "11:30 AM", close: "10:30 PM", duration: 75, minDuration: 45, type: "restaurant", popularity: 6, lat: 12.3550, lng: 76.7110, tags: ["Food", "Highway Diner", "Seafood"] },
  "depth n green": { open: "08:00 AM", close: "08:30 PM", duration: 60, minDuration: 30, type: "restaurant", popularity: 7, lat: 12.3270, lng: 76.6220, tags: ["Food", "Cafe", "Healthy", "Vegan"] },

  // Mysore Rest Stops
  "highway nest food plaza": { open: "07:00 AM", close: "11:00 PM", duration: 45, minDuration: 20, type: "restStop", popularity: 5, lat: 12.5510, lng: 76.9910, tags: ["Rest", "Expressway Stop", "Food Court"] },
  "cafe coffee day - highway stop": { open: "24 hours", duration: 30, minDuration: 15, type: "restStop", popularity: 6, lat: 12.6120, lng: 77.0120, tags: ["Rest", "24/7", "Coffee"] },
  "kamath lokaruchi": { open: "06:00 AM", close: "10:00 PM", duration: 60, minDuration: 30, type: "restStop", popularity: 8, lat: 12.7210, lng: 77.2910, tags: ["Rest", "Traditional breakfast", "Vegetarian"] },
  "empire restaurant - expressway halt": { open: "24 hours", duration: 45, minDuration: 30, type: "restStop", popularity: 7, lat: 12.5890, lng: 77.0420, tags: ["Rest", "24/7", "Non-veg"] },
  "maddur tiffany's": { open: "06:30 AM", close: "09:30 PM", duration: 35, minDuration: 20, type: "restStop", popularity: 6, lat: 12.5850, lng: 77.0410, tags: ["Rest", "Local Snacks"] },
  "shell select fuel & convenience": { open: "24 hours", duration: 25, minDuration: 10, type: "restStop", popularity: 5, lat: 12.7910, lng: 77.4120, tags: ["Rest", "24/7", "Convenience"] },
  "shivalli restaurant stop": { open: "07:00 AM", close: "10:30 PM", duration: 45, minDuration: 25, type: "restStop", popularity: 6, lat: 12.6510, lng: 77.1210, tags: ["Rest", "Pure Veg"] },
  "adyar ananda bhavan (a2b) - ramanagara": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 25, type: "restStop", popularity: 7, lat: 12.7110, lng: 77.2810, tags: ["Rest", "Veg", "Sweets"] },
  "polar bear ice cream sundaes": { open: "11:00 AM", close: "11:00 PM", duration: 40, minDuration: 20, type: "restStop", popularity: 5, lat: 12.6100, lng: 77.0100, tags: ["Rest", "Dessert", "AC"] },
  "highway chai point": { open: "06:00 AM", close: "11:00 PM", duration: 30, minDuration: 15, type: "restStop", popularity: 6, lat: 12.3850, lng: 76.7310, tags: ["Rest", "Tea", "Quick Stop"] },

  // Mysore Lodging
  "the windflower resort & spa": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 12.2995, lng: 76.6811, tags: ["Resort", "Spa", "Luxury"] },
  "radisson blu plaza hotel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 12.2980, lng: 76.6660, tags: ["Luxury", "Hotel", "Pool"] },
  "grand mercure mysore": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 12.3290, lng: 76.6510, tags: ["Premium", "Rooftop Pool"] },
  "silent shores resort & spa": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 12.3411, lng: 76.5821, tags: ["Resort", "Lakeview", "Quiet"] },
  "fortune jp palace": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 7, lat: 12.3210, lng: 76.6690, tags: ["Heritage", "Hotel", "Luxury"] },
  "southern star mysore": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 7, lat: 12.3115, lng: 76.6415, tags: ["Premium", "Location", "Garden"] },
  "roost guesthouse": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 5, lat: 12.3390, lng: 76.5910, tags: ["Budget", "Guesthouse"] },
  "country inn & suites by radisson": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 7, lat: 12.3551, lng: 76.6110, tags: ["Suites", "Family", "Pool"] },
  "ginger mysore": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 6, lat: 12.3190, lng: 76.6710, tags: ["Budget", "Clean", "Business"] },
  "lalitha mahal palace hotel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 12.3005, lng: 76.6908, tags: ["Heritage", "Luxury", "Royal Experience"] },

  // Mysore Fuel / EV Charging
  "tata power ev fast charger": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel", popularity: 8, lat: 12.2980, lng: 76.6660, tags: ["EV", "Fast Charger"] },
  "hp cl petrol pump - mysore road": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel", popularity: 7, lat: 12.3610, lng: 76.7210, tags: ["Fuel", "Petrol", "Diesel"] },
  "zeon ev charging station - mall of mysore": { open: "10:00 AM", close: "10:00 PM", duration: 45, minDuration: 20, type: "refuel", popularity: 7, lat: 12.2990, lng: 76.6640, tags: ["EV", "Zeon", "Fast Charger"] },
  "jio-bp pulse ev station": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel", popularity: 6, lat: 12.3510, lng: 76.6190, tags: ["EV", "DC Fast Charger"] },
  "shell fuel station - ring road": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel", popularity: 7, lat: 12.3312, lng: 76.6990, tags: ["Fuel", "Shell", "Nitrogen Air"] },
  "indian oil petrol pump - city center": { open: "06:00 AM", close: "11:30 PM", duration: 15, minDuration: 5, type: "refuel", popularity: 6, lat: 12.3099, lng: 76.6570, tags: ["Fuel", "IOCL", "City Center"] },
  "bharat petroleum fast ev station": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel", popularity: 7, lat: 12.3650, lng: 76.7180, tags: ["EV", "BPCL", "24/7"] },
  "ather grid fast charger - gokulam": { open: "08:00 AM", close: "10:00 PM", duration: 30, minDuration: 15, type: "refuel", popularity: 6, lat: 12.3310, lng: 76.6210, tags: ["EV", "Two-wheeler"] },
  "nayara energy fuel station": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel", popularity: 5, lat: 12.3780, lng: 76.6790, tags: ["Fuel", "Bypass"] },
  "relux ev charging hub": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel", popularity: 7, lat: 12.3411, lng: 76.5821, tags: ["EV", "Relux"] },

  // Chennai Attractions
  "marina beach": { open: "24 hours", duration: 90, minDuration: 45, type: "attraction", popularity: 10, lat: 13.0500, lng: 80.2824, tags: ["Nature", "Beach", "Sea", "Scenic"] },
  "kapaleeshwarar temple": { open: "06:00 AM", close: "09:00 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 9, lat: 13.0335, lng: 80.2697, tags: ["Spiritual", "Temple", "Heritage"] },
  "fort st. george": { open: "09:00 AM", close: "05:00 PM", duration: 90, minDuration: 60, type: "attraction", popularity: 8, lat: 13.0792, lng: 80.2882, tags: ["Heritage", "Museum", "History"] },
  "government museum chennai": { open: "09:30 AM", close: "05:00 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 8, lat: 13.0717, lng: 80.2582, tags: ["Educational", "Museum", "History", "Gallery"] },
  "santhome basilica": { open: "06:00 AM", close: "09:00 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 7, lat: 13.0338, lng: 80.2778, tags: ["Heritage", "Church", "Spiritual"] },
  "valluvar kottam": { open: "08:30 AM", close: "05:30 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 6, lat: 13.0583, lng: 80.2422, tags: ["Heritage", "Monument"] },
  "guindy national park": { open: "09:00 AM", close: "05:30 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 7, lat: 13.0067, lng: 80.2206, tags: ["Nature", "Park", "Wildlife"] },
  "besant nagar beach": { open: "24 hours", duration: 90, minDuration: 45, type: "attraction", popularity: 8, lat: 13.0003, lng: 80.2755, tags: ["Nature", "Beach", "Sea", "Sunset"] },
  "dakshinachitra": { open: "10:00 AM", close: "06:00 PM", duration: 180, minDuration: 90, type: "attraction", popularity: 7, lat: 12.8136, lng: 80.2417, tags: ["Culture", "Museum", "Bazaar"] },
  "arignar anna zoological park": { open: "09:00 AM", close: "05:00 PM", duration: 240, minDuration: 120, type: "attraction", popularity: 8, lat: 12.8797, lng: 80.0822, tags: ["Nature", "Zoo", "Wildlife", "Family", "Kids"] },

  // Chennai Restaurants
  "murugan idli shop": { open: "07:00 AM", close: "11:00 PM", duration: 45, minDuration: 30, type: "restaurant", popularity: 9, lat: 13.0326, lng: 80.2355, tags: ["Breakfast", "Idli", "Vegetarian", "Pure Veg", "South Indian"] },
  "ratna cafe": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 30, type: "restaurant", popularity: 8, lat: 13.0573, lng: 80.2745, tags: ["Breakfast", "Sambar", "Vegetarian", "Pure Veg", "South Indian"] },
  "mathsya": { open: "07:00 AM", close: "11:30 PM", duration: 60, minDuration: 30, type: "restaurant", popularity: 7, lat: 13.0732, lng: 80.2601, tags: ["Vegetarian", "Pure Veg", "Dinner"] },
  "sangeetha veg restaurant": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 30, type: "restaurant", popularity: 8, lat: 13.0331, lng: 80.2687, tags: ["Breakfast", "Vegetarian", "Pure Veg", "South Indian"] },
  "annalakshmi": { open: "12:00 PM", close: "09:30 PM", duration: 90, minDuration: 60, type: "restaurant", popularity: 9, lat: 13.0641, lng: 80.2562, tags: ["Fine Dining", "Vegetarian", "Pure Veg"] },
  "southern spice": { open: "12:30 PM", close: "11:30 PM", duration: 90, minDuration: 60, type: "restaurant", popularity: 9, lat: 13.0617, lng: 80.2407, tags: ["Fine Dining", "Heritage", "Luxury"] },
  "ponnusamy hotel": { open: "11:30 AM", close: "11:00 PM", duration: 60, minDuration: 40, type: "restaurant", popularity: 6, lat: 13.0592, lng: 80.2435, tags: ["Chettinad", "Spicy", "Non-veg"] },
  "the marina": { open: "12:00 PM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant", popularity: 7, lat: 13.0581, lng: 80.2458, tags: ["Seafood", "Fine Dining"] },
  "buhari": { open: "11:00 AM", close: "11:30 PM", duration: 60, minDuration: 40, type: "restaurant", popularity: 7, lat: 13.0628, lng: 80.2635, tags: ["Biryani", "Chicken 65"] },
  "adyar ananda bhavan": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 25, type: "restaurant", popularity: 8, lat: 13.0062, lng: 80.2560, tags: ["Sweets", "Vegetarian", "Pure Veg", "South Indian"] },

  // Chennai Rest Stops
  "cafe coffee day": { open: "24 hours", duration: 30, minDuration: 15, type: "restStop", popularity: 7, lat: 12.8532, lng: 80.2260, tags: ["Coffee", "24/7", "Washrooms"] },
  "writer’s cafe": { open: "09:00 AM", close: "10:00 PM", duration: 45, minDuration: 20, type: "restStop", popularity: 8, lat: 13.0526, lng: 80.2587, tags: ["Cafe", "Bakery"] },
  "amethyst cafe": { open: "07:30 AM", close: "11:00 PM", duration: 60, minDuration: 30, type: "restStop", popularity: 8, lat: 13.0558, lng: 80.2612, tags: ["Premium Lounge", "GardenSetting"] },
  "sandy’s chocolate laboratory": { open: "11:00 AM", close: "11:00 PM", duration: 45, minDuration: 25, type: "restStop", popularity: 7, lat: 13.0601, lng: 80.2452, tags: ["Dessert", "Chocolate"] },
  "a2b highway stop": { open: "06:00 AM", close: "11:00 PM", duration: 40, minDuration: 20, type: "restStop", popularity: 8, lat: 12.8252, lng: 80.2241, tags: ["Veg", "Restrooms"] },

  // Chennai Lodging
  "taj coromandel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 13.0617, lng: 80.2407, tags: ["Luxury", "Hotel", "Pool"] },
  "itc grand chola": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 10, lat: 13.0101, lng: 80.2206, tags: ["Luxury", "Hotel", "Spa"] },
  "radisson blu chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 12.9961, lng: 80.1982, tags: ["Premium", "Airport Hotel"] },
  "the park chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 13.0524, lng: 80.2498, tags: ["Premium", "Boutique"] },
  "hyatt regency chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 13.0436, lng: 80.2475, tags: ["Luxury", "Hotel"] },
  "ginger chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 7, lat: 12.9892, lng: 80.2468, tags: ["Budget", "Business"] },
  "fabhotel options": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 6, lat: 13.0450, lng: 80.2500, tags: ["Budget", "Guesthouse"] },

  // Chennai EV/Fuel
  "tata power ev charging": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel", popularity: 8, lat: 13.0100, lng: 80.2210, tags: ["EV", "Tata Power", "Fast Charger"] },
  "statiq ev charging": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel", popularity: 8, lat: 13.0430, lng: 80.2480, tags: ["EV", "Statiq"] },
  "ather grid chennai": { open: "08:00 AM", close: "10:00 PM", duration: 30, minDuration: 15, type: "refuel", popularity: 7, lat: 13.0600, lng: 80.2460, tags: ["EV", "Two-wheeler"] },
  "indianoil": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel", popularity: 7, lat: 13.0700, lng: 80.2600, tags: ["Fuel", "IOCL"] },
  "bharat petroleum": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel", popularity: 7, lat: 12.8300, lng: 80.2250, tags: ["Fuel", "BPCL"] },
  "hp petrol pump": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel", popularity: 7, lat: 13.0620, lng: 80.2620, tags: ["Fuel", "HPCL"] },

  // Coorg Attractions
  "abbey falls": { open: "09:00 AM", close: "05:00 PM", duration: 60, minDuration: 45, type: "attraction", popularity: 9, lat: 12.4578, lng: 75.7210, tags: ["Nature", "Waterfall"] },
  "raja's seat": { open: "06:00 AM", close: "08:00 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 8, lat: 12.4190, lng: 75.7390, tags: ["Scenic", "Sunset", "Gardens"] },
  "namdroling golden temple": { open: "09:00 AM", close: "06:00 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 10, lat: 12.4280, lng: 75.9690, tags: ["Spiritual", "Temple", "Heritage"] },

  // Delhi
  "red fort": { open: "09:30 AM", close: "04:30 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 10, lat: 28.6562, lng: 77.2410, tags: ["Heritage", "Fort", "History"] },
  "qutub minar": { open: "07:00 AM", close: "09:00 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 9, lat: 28.5244, lng: 77.1855, tags: ["Heritage", "History"] },
  "lotus temple": { open: "09:00 AM", close: "06:00 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 8, lat: 28.5535, lng: 77.2588, tags: ["Spiritual", "Temple"] },
  "india gate": { open: "24 hours", duration: 45, minDuration: 20, type: "attraction", popularity: 7, lat: 28.6129, lng: 77.2295, tags: ["Heritage", "Memorial"] },
  "bukhara restaurant": { open: "12:30 PM", close: "11:45 PM", duration: 75, minDuration: 45, type: "restaurant", popularity: 8, lat: 28.5975, lng: 77.1722, tags: ["Food", "North Indian"] },
  "haldirams delhi": { open: "09:00 AM", close: "10:30 PM", duration: 40, minDuration: 20, type: "restaurant", popularity: 7, lat: 28.6304, lng: 77.2177, tags: ["Food", "Vegetarian", "Snacks"] },
  "the taj mahal hotel delhi": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 28.6044, lng: 77.2215, tags: ["Luxury", "Hotel"] },

  // Agra
  "taj mahal": { open: "06:00 AM", close: "07:00 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 10, lat: 27.1751, lng: 78.0421, tags: ["Heritage", "Palace", "Architecture", "Spiritual"] },
  "agra fort": { open: "06:00 AM", close: "06:00 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 9, lat: 27.1795, lng: 78.0211, tags: ["Heritage", "Fort", "History"] },
  "mehtab bagh": { open: "06:00 AM", close: "06:00 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 8, lat: 27.1798, lng: 78.0435, tags: ["Nature", "Gardens", "Views"] },
  "pinch of spice": { open: "12:00 PM", close: "11:00 PM", duration: 60, minDuration: 45, type: "restaurant", popularity: 8, lat: 27.1991, lng: 78.0152, tags: ["Food", "Multi-cuisine"] },
  "dasaprakash agra": { open: "11:00 AM", close: "10:30 PM", duration: 45, minDuration: 30, type: "restaurant", popularity: 7, lat: 27.1611, lng: 78.0121, tags: ["Food", "South Indian"] },
  "oberoi amarvilas": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 27.1712, lng: 78.0411, tags: ["Luxury", "Hotel"] },
  "itc mughal agra": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 8, lat: 27.1615, lng: 78.0289, tags: ["Luxury", "Hotel"] },

  // Paris
  "eiffel tower": { open: "09:00 AM", close: "11:45 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 10, lat: 48.8584, lng: 2.2945, tags: ["Heritage", "Views"] },
  "louvre museum": { open: "09:00 AM", close: "06:00 PM", duration: 180, minDuration: 90, type: "attraction", popularity: 9, lat: 48.8606, lng: 2.3376, tags: ["Heritage", "Art", "Museum"] },
  "notre dame cathedral": { open: "08:00 AM", close: "06:45 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 8, lat: 48.8530, lng: 2.3499, tags: ["Spiritual", "Heritage", "Church"] },
  "le jules verne": { open: "12:00 PM", close: "10:30 PM", duration: 90, minDuration: 60, type: "restaurant", popularity: 8, lat: 48.8584, lng: 2.2945, tags: ["Food", "Fine Dining", "French"] },
  "l'avenue": { open: "12:00 PM", close: "11:00 PM", duration: 60, minDuration: 40, type: "restaurant", popularity: 7, lat: 48.8665, lng: 2.3023, tags: ["Food", "Cafe"] },
  "the ritz paris": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 48.8682, lng: 2.3292, tags: ["Luxury", "Hotel"] },

  // London
  "british museum": { open: "10:00 AM", close: "05:00 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 10, lat: 51.5194, lng: -0.1270, tags: ["Educational", "Museum", "History"] },
  "london eye": { open: "10:00 AM", close: "08:30 PM", duration: 60, minDuration: 30, type: "attraction", popularity: 9, lat: 51.5033, lng: -0.1195, tags: ["Scenic", "Views"] },
  "tower of london": { open: "09:00 AM", close: "05:30 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 8, lat: 51.5081, lng: -0.0759, tags: ["Heritage", "Castle", "History"] },
  "rules restaurant": { open: "12:00 PM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant", popularity: 8, lat: 51.5108, lng: -0.1235, tags: ["Food", "British"] },
  "the savoy": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 51.5098, lng: -0.1200, tags: ["Luxury", "Hotel"] },

  // New York
  "statue of liberty": { open: "08:30 AM", close: "04:00 PM", duration: 150, minDuration: 90, type: "attraction", popularity: 10, lat: 40.6892, lng: -74.0445, tags: ["Heritage", "Scenic"] },
  "central park": { open: "06:00 AM", close: "11:00 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 9, lat: 40.7829, lng: -73.9654, tags: ["Nature", "Gardens"] },
  "empire state building": { open: "09:00 AM", close: "12:00 AM", duration: 90, minDuration: 45, type: "attraction", popularity: 8, lat: 40.7484, lng: -73.9857, tags: ["Scenic", "Views"] },
  "eleven madison park": { open: "05:30 PM", close: "10:30 PM", duration: 120, minDuration: 90, type: "restaurant", popularity: 9, lat: 40.7416, lng: -73.9872, tags: ["Food", "Fine Dining", "Vegetarian"] },
  "the plaza hotel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 40.7644, lng: -73.9744, tags: ["Luxury", "Hotel"] },

  // Washington
  "lincoln memorial": { open: "24 hours", duration: 45, minDuration: 20, type: "attraction", popularity: 10, lat: 38.8893, lng: -77.0502, tags: ["Heritage", "History"] },
  "smithsonian museum": { open: "10:00 AM", close: "05:30 PM", duration: 120, minDuration: 60, type: "attraction", popularity: 9, lat: 38.8913, lng: -77.0260, tags: ["Educational", "Museum", "History"] },
  "united states capitol": { open: "08:30 AM", close: "04:30 PM", duration: 90, minDuration: 45, type: "attraction", popularity: 8, lat: 38.8899, lng: -77.0090, tags: ["Heritage", "Government"] },
  "the hay-adams": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging", popularity: 9, lat: 38.9002, lng: -77.0368, tags: ["Luxury", "Hotel"] }
};

// Retrieve place specs or return defaults
export function getPlaceSpecs(name) {
  if (!name) return { open: "24 hours", duration: 60, type: "general" };
  const key = name.toLowerCase().trim();
  
  if (PLACE_DATABASE[key]) {
    return PLACE_DATABASE[key];
  }

  // Dynamic keyword checking
  if (key.includes("arrive in") || key.includes("arrive at")) {
    return { open: "24 hours", duration: 0, type: "arrival" };
  }
  if (key.includes("palace") || key.includes("temple") || key.includes("garden") || key.includes("lake") || key.includes("falls") || key.includes("peak") || key.includes("hills") || key.includes("viewpoint")) {
    return { open: "09:00 AM", close: "06:00 PM", duration: 90, type: "attraction" };
  }
  if (key.includes("restaurant") || key.includes("hotel") || key.includes("diner") || key.includes("cafe") || key.includes("bhavan") || key.includes("brewpub") || key.includes("food") || key.includes("mylari") || key.includes("gufha")) {
    return { open: "07:00 AM", close: "11:00 PM", duration: 45, type: "restaurant" };
  }
  if (key.includes("charging") || key.includes("charger") || key.includes("station") || key.includes("pump") || key.includes("petrol")) {
    return { open: "24 hours", duration: 20, type: "refuel" };
  }
  if (key.includes("resort") || key.includes("inn") || key.includes("stay") || key.includes("villa")) {
    return { open: "24 hours", duration: 480, type: "lodging" };
  }
  return { open: "08:00 AM", close: "09:00 PM", duration: 60, type: "attraction" };
}

// Worldwide destination records mapped for autocomplete and multi-day routing
export const WORLDWIDE_DESTINATIONS = {
  delhi: {
    name: "Delhi",
    attractions: [
      { name: "Red Fort", type: "Heritage", description: "Grand Mughal-era fort with historical museum.", tags: ["Heritage", "Fort", "History"] },
      { name: "Qutub Minar", type: "Heritage", description: "Ancient victory tower and world heritage site.", tags: ["Heritage", "History"] },
      { name: "Lotus Temple", type: "Spiritual", description: "Flowerlike Bahai temple known for quiet meditation.", tags: ["Spiritual", "Temple"] },
      { name: "India Gate", type: "Heritage", description: "War memorial arch dedicated to soldiers.", tags: ["Heritage", "Memorial"] }
    ],
    restaurants: [
      { name: "Bukhara Restaurant", cuisine: "North Indian", budget: "High", description: "Highly acclaimed tandoor grill dinner.", tags: ["Food", "North Indian"] },
      { name: "Haldirams Delhi", cuisine: "Vegetarian Snacks", budget: "Low", description: "Popular vegetarian fast snacks and sweets.", tags: ["Food", "Vegetarian", "Snacks"] }
    ],
    haltingPlaces: [
      { name: "The Taj Mahal Hotel Delhi", pricePerNight: "₹15,000/night", tags: ["Luxury", "Hotel"] }
    ],
    fuelChargingStops: [
      { name: "City EV Grid Hub", type: "EV", tags: ["EV", "Fast Charger"] }
    ]
  },
  agra: {
    name: "Agra",
    attractions: [
      { name: "Taj Mahal", type: "Heritage", description: "One of the Seven Wonders of the World, majestic white marble mausoleum.", tags: ["Heritage", "Palace", "Architecture"] },
      { name: "Agra Fort", type: "Heritage", description: "Red sandstone fortress containing imperial palaces.", tags: ["Heritage", "Fort", "History"] },
      { name: "Mehtab Bagh", type: "Nature", description: "Moonlight garden aligning directly across from the Taj Mahal.", tags: ["Nature", "Gardens", "Views"] }
    ],
    restaurants: [
      { name: "Pinch of Spice", cuisine: "Multi-cuisine", budget: "Medium", description: "Popular fine-dining curry house.", tags: ["Food", "Multi-cuisine"] },
      { name: "Dasaprakash Agra", cuisine: "South Indian", budget: "Low", description: "Delicious traditional vegetarian thalis.", tags: ["Food", "South Indian"] }
    ],
    haltingPlaces: [
      { name: "Oberoi Amarvilas", pricePerNight: "₹28,000/night", tags: ["Luxury", "Hotel"] },
      { name: "ITC Mughal Agra", pricePerNight: "₹11,000/night", tags: ["Luxury", "Hotel"] }
    ],
    fuelChargingStops: [
      { name: "HP Fuel Station - Bypass", type: "Fuel", tags: ["Fuel", "Petrol"] }
    ]
  },
  paris: {
    name: "Paris",
    attractions: [
      { name: "Eiffel Tower", type: "Heritage", description: "Iconic tower overlooking Champ de Mars.", tags: ["Heritage", "Views"] },
      { name: "Louvre Museum", type: "Heritage", description: "World's largest art museum holding the Mona Lisa.", tags: ["Heritage", "Art", "Museum"] },
      { name: "Notre Dame Cathedral", type: "Spiritual", description: "Gothic cathedral located on the Seine.", tags: ["Spiritual", "Heritage", "Church"] }
    ],
    restaurants: [
      { name: "Le Jules Verne", cuisine: "French Fine Dining", budget: "High", description: "Michelin-starred restaurant inside the Eiffel Tower.", tags: ["Food", "Fine Dining", "French"] },
      { name: "L'Avenue", cuisine: "Cafe", budget: "Medium", description: "Trendy Paris bistro with terrace seating.", tags: ["Food", "Cafe"] }
    ],
    haltingPlaces: [
      { name: "The Ritz Paris", pricePerNight: "€1200/night", tags: ["Luxury", "Hotel"] }
    ],
    fuelChargingStops: [
      { name: "Voltaic EV Charging Station", type: "EV", tags: ["EV", "Fast Charger"] }
    ]
  },
  london: {
    name: "London",
    attractions: [
      { name: "British Museum", type: "Educational", description: "Human history, art, and culture museum.", tags: ["Educational", "Museum", "History"] },
      { name: "London Eye", type: "Scenic Viewpoint", description: "Giant observation wheel on the South Bank.", tags: ["Scenic", "Views"] },
      { name: "Tower of London", type: "Heritage", description: "Historic castle housing the Crown Jewels.", tags: ["Heritage", "Castle", "History"] }
    ],
    restaurants: [
      { name: "Rules Restaurant", cuisine: "British", budget: "High", description: "London's oldest restaurant serving classic game.", tags: ["Food", "British"] }
    ],
    haltingPlaces: [
      { name: "The Savoy", pricePerNight: "£650/night", tags: ["Luxury", "Hotel"] }
    ],
    fuelChargingStops: [
      { name: "Voltaic EV Charging Station", type: "EV", tags: ["EV", "Fast Charger"] }
    ]
  },
  "new york": {
    name: "New York",
    attractions: [
      { name: "Statue of Liberty", type: "Heritage", description: "Famous copper sculpture on Liberty Island.", tags: ["Heritage", "Scenic"] },
      { name: "Central Park", type: "Nature", description: "Massive urban park with lakes and fields.", tags: ["Nature", "Gardens"] },
      { name: "Empire State Building", type: "Scenic Viewpoint", description: "Famous Art Deco tower with skyline viewpoints.", tags: ["Scenic", "Views"] }
    ],
    restaurants: [
      { name: "Eleven Madison Park", cuisine: "Vegetarian Fine Dining", budget: "High", description: "Luxury plant-based gourmet menu.", tags: ["Food", "Fine Dining", "Vegetarian"] }
    ],
    haltingPlaces: [
      { name: "The Plaza Hotel", pricePerNight: "$950/night", tags: ["Luxury", "Hotel"] }
    ],
    fuelChargingStops: [
      { name: "Voltaic EV Charging Station", type: "EV", tags: ["EV", "Fast Charger"] }
    ]
  },
  washington: {
    name: "Washington",
    attractions: [
      { name: "Lincoln Memorial", type: "Heritage", description: "Neoclassical temple honoring Abraham Lincoln.", tags: ["Heritage", "History"] },
      { name: "Smithsonian Museum", type: "Educational", description: "World's largest museum and research complex.", tags: ["Educational", "Museum", "History"] },
      { name: "United States Capitol", type: "Heritage", description: "Historic government dome building.", tags: ["Heritage", "Government"] }
    ],
    restaurants: [
      { name: "Highway Diner", cuisine: "Multi-cuisine", budget: "Medium", description: "Classic retro american diner.", tags: ["Diner", "24/7", "Burger"] }
    ],
    haltingPlaces: [
      { name: "The Hay-Adams", pricePerNight: "$550/night", tags: ["Luxury", "Hotel"] }
    ],
    fuelChargingStops: [
      { name: "Voltaic EV Charging Station", type: "EV", tags: ["EV", "Fast Charger"] }
    ]
  }
};

// Calculate travel time between two waypoints
export function getTravelTime(fromPlace, toPlace, source, destination) {
  const f = fromPlace?.toLowerCase().trim();
  const t = toPlace?.toLowerCase().trim();
  const src = source?.toLowerCase().trim() || "bangalore";
  const dst = destination?.toLowerCase().trim() || "mysore";

  if (!f || !t) return 0;
  if (f === t) return 0;

  const isFromSrc = f === src || f.includes("start from");
  const isToDst = t === dst || t.includes("arrive at") || t.includes("arrive in");

  // Major highway routes
  if (isFromSrc && isToDst) {
    if (src.includes("bangalore") && dst.includes("mysore")) return 195; // 3h 15m
    if (src.includes("bangalore") && dst.includes("coorg")) return 330; // 5h 30m
    if (src.includes("bangalore") && dst.includes("ooty")) return 375; // 6h 15m
    if (src.includes("bangalore") && dst.includes("chikkamagaluru")) return 285; // 4h 45m
    if (src.includes("bangalore") && dst.includes("chennai")) return 360; // 6h 0m
    if (src.includes("delhi") && dst.includes("agra")) return 240;
    if (src.includes("paris") && dst.includes("london")) return 360;
    if (src.includes("new york") && dst.includes("washington")) return 270;
    return 180; // default 3h
  }

  // Highway stop checks
  const isHighwayStop = (name) => {
    return name.includes("highway") || name.includes("plaza") || name.includes("food court") || name.includes("coffee day") || name.includes("spices hub") || name.includes("shell select") || name.includes("a2b") || name.includes("rest area");
  };

  if (isFromSrc && isHighwayStop(t)) {
    if (src.includes("bangalore") && dst.includes("mysore")) return 90; 
    if (src.includes("bangalore") && dst.includes("coorg")) return 150;
    if (src.includes("bangalore") && dst.includes("ooty")) return 180;
    if (src.includes("bangalore") && dst.includes("chikkamagaluru")) return 130;
    if (src.includes("bangalore") && dst.includes("chennai")) return 160;
    return 90;
  }

  if (isHighwayStop(f) && isToDst) {
    if (src.includes("bangalore") && dst.includes("mysore")) return 105; 
    if (src.includes("bangalore") && dst.includes("coorg")) return 180;
    if (src.includes("bangalore") && dst.includes("ooty")) return 195;
    if (src.includes("bangalore") && dst.includes("chikkamagaluru")) return 155;
    if (src.includes("bangalore") && dst.includes("chennai")) return 200;
    return 90;
  }

  // Travel within destination local network
  let hash = 0;
  const key = [f, t].sort().join('-');
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 15 + (Math.abs(hash) % 21); // 15 to 35 mins
}

// Haversine formula helper for coordinate distance fallback
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Travel time calculation utilizing absolute coordinates if present
export function getTravelTimeWithCoords(fromPlace, toPlace, source, destination, fromCoords, toCoords) {
  if (fromCoords && toCoords && fromCoords.lat !== undefined && fromCoords.lng !== undefined && toCoords.lat !== undefined && toCoords.lng !== undefined) {
    const dist = getHaversineDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
    const isHighway = fromPlace.toLowerCase().includes("start") || fromPlace.toLowerCase().includes("highway") || fromPlace.toLowerCase().includes("rest") || toPlace.toLowerCase().includes("highway") || toPlace.toLowerCase().includes("rest") || toPlace.toLowerCase().includes("arrive");
    const speed = isHighway ? 75 : 45; // average speed in km/h
    const mins = (dist / speed) * 60;
    return Math.max(10, Math.round(mins)); // minimum 10 minutes transit
  }
  return getTravelTime(fromPlace, toPlace, source, destination);
}

// Format duration to string
export function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins === 0 ? `${hrs}h` : `${hrs}h ${remainingMins}m`;
}

export function getPlaceTimeStatus(placeName, arrivalTime) {
  const specs = getPlaceSpecs(placeName);
  const openTime = specs.open || specs.openTime;
  const closeTime = specs.close || specs.closeTime;
  const minDur = specs.minDuration || specs.minimumVisitDuration || 60;
  const recDur = specs.duration || specs.recommendedVisitDuration || 90;

  if (openTime === "24 hours" || openTime === "24 Hours" || !closeTime) {
    return "OPEN";
  }

  const arrivalMins = timeToMinutes(arrivalTime);
  const openMins = timeToMinutes(openTime);
  const closeMins = timeToMinutes(closeTime);

  if (arrivalMins < openMins || arrivalMins >= closeMins) {
    return "CLOSED";
  }

  const availableMins = closeMins - arrivalMins;
  if (availableMins < minDur) {
    return "NOT ENOUGH TIME";
  }
  if (availableMins < recDur) {
    return "LIMITED";
  }
  return "OPEN";
}

// Check if a place is open at arrival time and stays open throughout duration
export function checkOpeningHours(placeName, arrivalTime, durationMinutes) {
  const status = getPlaceTimeStatus(placeName, arrivalTime);
  return status === "OPEN" || status === "LIMITED";
}

// Calculate earliest possible arrival
export function calculateEarliestArrival(prevPlace, currentPlace, prevEndTime, source, destination, prevCoords, currentCoords) {
  const transit = getTravelTimeWithCoords(prevPlace, currentPlace, source, destination, prevCoords, currentCoords);
  const prevEndMins = timeToMinutes(prevEndTime);
  return minutesToTime(prevEndMins + transit);
}

// Detect overlaps in the timeline
export function detectOverlaps(timeline, source, destination) {
  let prevEnd = 0;
  let prevPlace = null;
  for (let i = 0; i < timeline.length; i++) {
    const item = timeline[i];
    const arrival = timeToMinutes(item.time);
    if (i > 0) {
      const prevCoords = timeline[i-1] ? { lat: timeline[i-1].lat, lng: timeline[i-1].lng } : null;
      const currentCoords = { lat: item.lat, lng: item.lng };
      const travel = getTravelTimeWithCoords(prevPlace, item.place, source, destination, prevCoords, currentCoords);
      if (arrival < prevEnd + travel) {
        return { overlap: true, index: i, place: item.place };
      }
    }
    const specs = getPlaceSpecs(item.place);
    const duration = specs.duration || 60;
    prevEnd = arrival + duration;
    prevPlace = item.place;
  }
  return { overlap: false };
}

// Suggest next available slot if place is closed
export function suggestNextAvailableSlot(placeName, currentMinutes) {
  const specs = getPlaceSpecs(placeName);
  if (specs.open === "24 hours") return "any time (24 hours)";
  const openMins = timeToMinutes(specs.open);
  
  if (currentMinutes < openMins) {
    return `today at ${specs.open}`;
  } else {
    return `tomorrow at ${specs.open}`;
  }
}

// Validate individual waypoint edit parameters
export function validateWaypointEdit(input) {
  const { waypoint, previousWaypoint, nextWaypoint, tripDate, tripStartTime, source, destination } = input;
  const arrivalTime = waypoint.time;
  const arrivalMins = timeToMinutes(arrivalTime);

  // 1. Check trip start limits
  const startMins = timeToMinutes(tripStartTime);
  if (arrivalMins < startMins) {
    return { valid: false, reason: "BEFORE_TRIP_START", message: `Invalid timing: Stop cannot be scheduled before trip start (${tripStartTime}).` };
  }

  // 2. Check past time today
  if (isPastTimeToday(tripDate, arrivalTime)) {
    return { valid: false, reason: "PAST_TIME", message: "Invalid time: Start time cannot be earlier than current time today." };
  }

  // 3. Check preceding offset constraints
  if (previousWaypoint) {
    const prevCoords = previousWaypoint.lat !== undefined ? { lat: previousWaypoint.lat, lng: previousWaypoint.lng } : null;
    const waypointCoords = waypoint.lat !== undefined ? { lat: waypoint.lat, lng: waypoint.lng } : null;
    const travelTime = getTravelTimeWithCoords(previousWaypoint.place, waypoint.place, source, destination, prevCoords, waypointCoords);
    const earliestArrivalStr = calculateEarliestArrival(previousWaypoint.place, waypoint.place, previousWaypoint.endTime || previousWaypoint.time, source, destination, prevCoords, waypointCoords);
    const earliestArrivalMins = timeToMinutes(earliestArrivalStr);
    
    if (arrivalMins < earliestArrivalMins) {
      return { 
        valid: false, 
        reason: "TRAVEL_TIME_CONFLICT", 
        message: `Invalid timing: ${waypoint.place} cannot be scheduled at ${arrivalTime} because estimated arrival from ${previousWaypoint.place} is ${earliestArrivalStr} (including travel time).` 
      };
    }
  }

  // 4. Check following offset constraints
  if (nextWaypoint) {
    const specs = getPlaceSpecs(waypoint.place);
    const duration = specs.duration || 60;
    const endMins = arrivalMins + duration;
    const waypointCoords = waypoint.lat !== undefined ? { lat: waypoint.lat, lng: waypoint.lng } : null;
    const nextCoords = nextWaypoint.lat !== undefined ? { lat: nextWaypoint.lat, lng: nextWaypoint.lng } : null;
    const travelToNext = getTravelTimeWithCoords(waypoint.place, nextWaypoint.place, source, destination, waypointCoords, nextCoords);
    const nextArrivalMins = timeToMinutes(nextWaypoint.time);

    if (endMins + travelToNext > nextArrivalMins) {
      return {
        valid: false,
        reason: "OVERLAP_NEXT",
        message: `Invalid timing: This stop overlaps with your next waypoint (${nextWaypoint.place}) which is scheduled at ${nextWaypoint.time}.`
      };
    }
  }

  // 5. Check opening hours (skip if it is the starting city, i.e., previousWaypoint is null)
  if (previousWaypoint !== null && previousWaypoint !== undefined) {
    const status = getPlaceTimeStatus(waypoint.place, arrivalTime);
    if (status === "CLOSED" || status === "NOT ENOUGH TIME") {
      const specs = getPlaceSpecs(waypoint.place);
      const openTime = specs.open || specs.openTime || "09:00 AM";
      const closeTime = specs.close || specs.closeTime || "06:00 PM";
      const minDur = specs.minDuration || specs.minimumVisitDuration || 60;
      if (status === "CLOSED") {
        const nextSlot = suggestNextAvailableSlot(waypoint.place, arrivalMins);
        return {
          valid: false,
          reason: "PLACE_CLOSED",
          message: `${waypoint.place} is closed at ${arrivalTime}. Opening hours: ${openTime} - ${closeTime}. Suggested next opening: ${nextSlot}.`
        };
      } else {
        const closeMins = timeToMinutes(closeTime);
        const availableMins = closeMins - arrivalMins;
        return {
          valid: false,
          reason: "NOT_ENOUGH_TIME",
          message: `${waypoint.place} does not have enough visit time at ${arrivalTime}. Minimum required: ${minDur} mins, available: ${availableMins} mins.`
        };
      }
    }
  }

  return { valid: true };
}

// Generate accurate multi-day itinerary
export async function generateAccurateItinerary(input) {
  const {
    source,
    destination,
    tripDate,
    startTime = "09:00 AM",
    tripType,
    foodPreference,
    budget,
    vehicleType,
    fuelOrBatteryLevel = 85,
    mileageOrRange = 340,
    durationDays = 1,
    tripStyle = 'Balanced',
    interests = [],
    sourceCoords,
    destinationCoords,
    sourcePlaceId,
    destinationPlaceId,
    sourceAddress,
    destinationAddress,
    tripMode = 'One Way',
    needStay = false
  } = input;

  const key = destination.toLowerCase().trim();
  const allDestData = { ...mockDestinations, ...WORLDWIDE_DESTINATIONS };
  
  let destData = defaultMockDestination;
  let matchKey = Object.keys(allDestData).find(k => key.includes(k) || k.includes(key));
  if (!matchKey && (key.includes('mysore') || key.includes('mysuru'))) {
    matchKey = 'mysore';
  }
  if (matchKey) {
    destData = allDestData[matchKey];
  }

  // Google Places Dynamic Sourcing
  if (process.env.GOOGLE_MAPS_API_KEY && destinationCoords && destinationCoords.lat) {
    try {
      const gQuery = (queryType) => `${destination} ${queryType}`;
      const searchG = async (queryType, typeTag) => {
        const results = await searchPlaces(gQuery(queryType), destinationCoords.lat, destinationCoords.lng);
        return results.map(r => ({
          name: r.name,
          type: typeTag,
          location: r.address || destination,
          rating: r.rating || 4.2,
          description: `Highly rated spot in ${destination}.`,
          openTime: typeTag === 'lodging' || typeTag === 'refuel' ? "24 hours" : "09:00 AM",
          closeTime: typeTag === 'lodging' || typeTag === 'refuel' ? "24 hours" : "08:00 PM",
          minimumVisitDuration: typeTag === 'lodging' ? 360 : 45,
          recommendedVisitDuration: typeTag === 'lodging' ? 720 : 90,
          tags: r.tags || [],
          lat: r.lat,
          lng: r.lng,
          placeId: r.placeId,
          address: r.address
        }));
      };

      const gAttractions = await searchG("attractions", "attraction");
      const gRestaurants = await searchG("restaurants", "restaurant");
      const gHotels = await searchG("hotels", "lodging");
      const gCharging = await searchG(vehicleType === 'EV' ? "ev charging station" : "gas station", "refuel");

      if (gAttractions.length > 0) {
        destData = {
          name: destination,
          attractions: gAttractions,
          restaurants: gRestaurants.length > 0 ? gRestaurants : destData.restaurants,
          haltingPlaces: gHotels.length > 0 ? gHotels : destData.haltingPlaces,
          fuelChargingStops: gCharging.length > 0 ? gCharging : destData.fuelChargingStops,
          restStops: destData.restStops
        };
      }
    } catch (err) {
      console.error("Failed dynamically fetching Google Places for itinerary generation:", err);
    }
  }

  const timeline = [];
  const infeasible = [];
  const isEV = vehicleType?.toUpperCase() === 'EV';
  let activeRange = mileageOrRange * (fuelOrBatteryLevel / 100);

  // 1. Determine daily sightseeing curation limits
  let maxPerDay = 3;
  if (tripStyle?.toLowerCase() === 'relaxed') maxPerDay = 2;
  else if (tripStyle?.toLowerCase() === 'packed') maxPerDay = 4;

  // 2. Select & sort attractions matching interests
  let attractionPool = [...(destData.attractions || [])];
  if (interests && interests.length > 0) {
    attractionPool.sort((a, b) => {
      const aMatch = (a.tags || []).some(t => interests.some(i => i.toLowerCase() === t.toLowerCase()));
      const bMatch = (b.tags || []).some(t => interests.some(i => i.toLowerCase() === t.toLowerCase()));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      const aPop = getPlaceSpecs(a.name).popularity || a.rating || 0;
      const bPop = getPlaceSpecs(b.name).popularity || b.rating || 0;
      return bPop - aPop;
    });
  } else {
    attractionPool.sort((a, b) => {
      const aPop = getPlaceSpecs(a.name).popularity || a.rating || 0;
      const bPop = getPlaceSpecs(b.name).popularity || b.rating || 0;
      return bPop - aPop;
    });
  }

  // 3. Generate Daily Timeline Schedules
  for (let day = 1; day <= durationDays; day++) {
    if (day === 1) {
      let currentTime = timeToMinutes(startTime);

      // Start from Source
      timeline.push({
        day: 1,
        time: startTime,
        endTime: minutesToTime(currentTime),
        place: source.startsWith("Start from") ? source : `Start from ${source}`,
        purpose: "Departure",
        reason: "Begin your road trip journey with optimized twin safety route mapping.",
        travelTimeFromPrevious: "0m",
        isOpen: true,
        warning: null,
        lat: sourceCoords?.lat,
        lng: sourceCoords?.lng,
        placeId: sourcePlaceId,
        address: sourceAddress || source
      });

      // Travel to destination with a rest stop halfway
      const restStopName = destData.restStops?.[0]?.name || "Highway Nest Food Plaza";
      const restStopSpecs = getPlaceSpecs(restStopName);
      
      const prevCoords = sourceCoords;
      const restCoords = { lat: restStopSpecs.lat, lng: restStopSpecs.lng };
      const travelToRest = getTravelTimeWithCoords(source, restStopName, source, destination, prevCoords, restCoords);
      
      currentTime += travelToRest;
      activeRange -= (travelToRest / 60) * 60;

      timeline.push({
        day: 1,
        time: minutesToTime(currentTime),
        endTime: minutesToTime(currentTime + restStopSpecs.duration),
        place: restStopName,
        purpose: "Rest & Coffee",
        reason: `Stop for refreshments and clean amenities. Essential for safety to prevent fatigue after ${formatMinutes(travelToRest)} driving.`,
        travelTimeFromPrevious: formatMinutes(travelToRest),
        isOpen: checkOpeningHours(restStopName, minutesToTime(currentTime), restStopSpecs.duration),
        warning: null,
        lat: restStopSpecs.lat,
        lng: restStopSpecs.lng,
        placeId: restStopSpecs.placeId || `mock_rest_${restStopName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        address: restStopSpecs.address || `${restStopName}, Highway`
      });

      currentTime += restStopSpecs.duration;

      // Fuel recharging stop if needed
      if (activeRange < 80) {
        const charger = destData.fuelChargingStops?.[0] || { name: isEV ? "Tata Power EV Fast Charger" : "HP Fuel Station" };
        const chargerSpecs = getPlaceSpecs(charger.name);
        const travelToCharge = 15;
        currentTime += travelToCharge;
        timeline.push({
          day: 1,
          time: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + 25),
          place: charger.name,
          purpose: isEV ? "EV Charging" : "Refuel Stop",
          reason: `Warning: Range is low (${Math.round(activeRange)}km). Top up energy level to prevent route breakdown risks.`,
          travelTimeFromPrevious: formatMinutes(travelToCharge),
          isOpen: true,
          warning: null,
          lat: chargerSpecs.lat || destinationCoords?.lat,
          lng: chargerSpecs.lng || destinationCoords?.lng,
          placeId: chargerSpecs.placeId || `mock_charger_${charger.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: chargerSpecs.address || charger.name
        });
        currentTime += 25;
        activeRange = mileageOrRange * 0.9;
      }

      // Arrive at destination
      const lastStop = timeline[timeline.length - 1];
      const lastStopCoords = { lat: lastStop.lat, lng: lastStop.lng };
      const travelToDest = getTravelTimeWithCoords(lastStop.place, destination, source, destination, lastStopCoords, destinationCoords);
      currentTime += travelToDest;
      activeRange -= (travelToDest / 60) * 60;

      timeline.push({
        day: 1,
        time: minutesToTime(currentTime),
        endTime: minutesToTime(currentTime),
        place: `Arrive at ${destination}`,
        purpose: "Arrival",
        reason: `Arrive safely at your destination city ${destination} after driving.`,
        travelTimeFromPrevious: formatMinutes(travelToDest),
        isOpen: true,
        warning: null,
        lat: destinationCoords?.lat,
        lng: destinationCoords?.lng,
        placeId: destinationPlaceId,
        address: destinationAddress || destination
      });

      // Lunch break inside destination (only if arriving before 2:30 PM)
      let currentLoc = `Arrive at ${destination}`;
      let currentCoords = destinationCoords;

      if (currentTime < timeToMinutes("02:30 PM")) {
        const preferredRestaurant = destData.restaurants?.[0]?.name || "Local Dine";
        const restaurantSpecs = getPlaceSpecs(preferredRestaurant);
        const restCoords = { lat: restaurantSpecs.lat, lng: restaurantSpecs.lng };
        const restaurantTransit = getTravelTimeWithCoords(currentLoc, preferredRestaurant, source, destination, currentCoords, restCoords);
        currentTime += restaurantTransit;

        timeline.push({
          day: 1,
          time: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + restaurantSpecs.duration),
          place: preferredRestaurant,
          purpose: "Lunch Break",
          reason: `Enjoy local cuisine at highly recommended place in ${destination}.`,
          travelTimeFromPrevious: formatMinutes(restaurantTransit),
          isOpen: checkOpeningHours(preferredRestaurant, minutesToTime(currentTime), restaurantSpecs.duration),
          warning: null,
          lat: restaurantSpecs.lat || destinationCoords?.lat,
          lng: restaurantSpecs.lng || destinationCoords?.lng,
          placeId: restaurantSpecs.placeId || `mock_rest_${preferredRestaurant.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: restaurantSpecs.address || `${preferredRestaurant}, ${destination}`
        });

        currentTime += restaurantSpecs.duration;
        currentLoc = preferredRestaurant;
        currentCoords = restCoords;
      }

      // Day 1 attractions
      let day1AttractionsScheduled = 0;
      for (let i = 0; i < attractionPool.length; i++) {
        if (day1AttractionsScheduled >= maxPerDay) break;

        const att = attractionPool[i];
        const specs = getPlaceSpecs(att.name);
        const attCoords = { lat: specs.lat, lng: specs.lng };
        const transit = getTravelTimeWithCoords(currentLoc, att.name, source, destination, currentCoords, attCoords);
        const arrivalTime = currentTime + transit;
        const arrivalTimeStr = minutesToTime(arrivalTime);

        // Check if it fits before end of day for a 1-day trip
        const travelToDest = getTravelTimeWithCoords(att.name, destination, source, destination, attCoords, destinationCoords);
        const endDayTime = arrivalTime + specs.duration + travelToDest;

        if (durationDays === 1 && endDayTime > timeToMinutes("09:30 PM")) {
          infeasible.push({
            place: att.name,
            reason: `${att.name} cannot fit: too far for a 1-day trip (would extend past 09:30 PM).`
          });
          attractionPool.splice(i, 1);
          i--;
          continue;
        }

        const status = getPlaceTimeStatus(att.name, arrivalTimeStr);
        if (status === 'OPEN' || status === 'LIMITED') {
          timeline.push({
            day: 1,
            time: arrivalTimeStr,
            endTime: minutesToTime(arrivalTime + specs.duration),
            place: att.name,
            purpose: "Sightseeing",
            reason: att.description || "Top rated local sight.",
            travelTimeFromPrevious: formatMinutes(transit),
            isOpen: true,
            warning: null,
            lat: specs.lat,
            lng: specs.lng,
            placeId: specs.placeId || `mock_att_${att.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            address: specs.address || `${att.name}, ${destination}`
          });

          currentTime = arrivalTime + specs.duration;
          currentLoc = att.name;
          currentCoords = attCoords;
          day1AttractionsScheduled++;

          attractionPool.splice(i, 1);
          i--;
        } else {
          let reasonMsg = `${att.name} is closed at ${arrivalTimeStr}.`;
          const openTime = specs.open || specs.openTime || "09:00 AM";
          const closeTime = specs.close || specs.closeTime || "06:00 PM";
          if (status === 'CLOSED') {
            reasonMsg = `${att.name} is closed at ${arrivalTimeStr}. Opening hours: ${openTime} - ${closeTime}.`;
          } else if (status === 'NOT ENOUGH TIME') {
            reasonMsg = `${att.name} has insufficient visit time at ${arrivalTimeStr}. Minimum: ${specs.minDuration || 60}m. Closes at ${closeTime}.`;
          }
          infeasible.push({
            place: att.name,
            reason: reasonMsg
          });
        }
      }

      // Optional Dinner
      if (currentTime < timeToMinutes("09:30 PM")) {
        const preferredRestaurant = destData.restaurants?.[1]?.name || destData.restaurants?.[0]?.name || "Local Dine";
        const restaurantSpecs = getPlaceSpecs(preferredRestaurant);
        const restCoords = { lat: restaurantSpecs.lat, lng: restaurantSpecs.lng };
        const transit = getTravelTimeWithCoords(currentLoc, preferredRestaurant, source, destination, currentCoords, restCoords);
        currentTime += transit;
        
        timeline.push({
          day: 1,
          time: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + restaurantSpecs.duration),
          place: preferredRestaurant,
          purpose: "Dinner Break",
          reason: `Enjoy evening dinner at highly recommended place ${preferredRestaurant} in ${destination}.`,
          travelTimeFromPrevious: formatMinutes(transit),
          isOpen: checkOpeningHours(preferredRestaurant, minutesToTime(currentTime), restaurantSpecs.duration),
          warning: null,
          lat: restaurantSpecs.lat || destinationCoords?.lat,
          lng: restaurantSpecs.lng || destinationCoords?.lng,
          placeId: restaurantSpecs.placeId || `mock_rest_${preferredRestaurant.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: restaurantSpecs.address || `${preferredRestaurant}, ${destination}`
        });

        currentTime += restaurantSpecs.duration;
        currentLoc = preferredRestaurant;
        currentCoords = restCoords;
      }

      // Day 1 Wrap Up (Lodging or Return)
      const needStayBool = (needStay === true || needStay === 'Yes');
      if (durationDays > 1 || needStayBool) {
        const hotel = destData.haltingPlaces?.[0]?.name || "Resort & Spa";
        const hotelSpecs = getPlaceSpecs(hotel);
        const hotelCoords = { lat: hotelSpecs.lat, lng: hotelSpecs.lng };
        const hotelTransit = getTravelTimeWithCoords(currentLoc, hotel, source, destination, currentCoords, hotelCoords);
        currentTime += hotelTransit;

        timeline.push({
          day: 1,
          time: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + 600),
          place: hotel,
          purpose: "Resort Check-in",
          reason: "Unpack, refresh, and settle down at your overnight stay lodging.",
          travelTimeFromPrevious: formatMinutes(hotelTransit),
          isOpen: true,
          warning: null,
          lat: hotelSpecs.lat,
          lng: hotelSpecs.lng,
          placeId: hotelSpecs.placeId || `mock_stay_${hotel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: hotelSpecs.address || `${hotel}, ${destination}`
        });
      } else {
        if (tripMode === 'Round Trip') {
          const returnTransit = getTravelTimeWithCoords(currentLoc, source, source, destination, currentCoords, sourceCoords);
          currentTime += returnTransit;
          timeline.push({
            day: 1,
            time: minutesToTime(currentTime),
            endTime: minutesToTime(currentTime),
            place: `Arrive at ${source}`,
            purpose: "Arrival",
            reason: "Complete your road trip and safely arrive back home.",
            travelTimeFromPrevious: formatMinutes(returnTransit),
            isOpen: true,
            warning: null,
            lat: sourceCoords?.lat,
            lng: sourceCoords?.lng,
            placeId: sourcePlaceId,
            address: sourceAddress || source
          });
        } else {
          timeline.push({
            day: 1,
            time: minutesToTime(currentTime),
            endTime: minutesToTime(currentTime),
            place: `End of Day at ${destination}`,
            purpose: "Arrival",
            reason: "Arrive at destination city. Your one-way road trip is successfully completed.",
            travelTimeFromPrevious: "0m",
            isOpen: true,
            warning: null,
            lat: destinationCoords?.lat,
            lng: destinationCoords?.lng,
            placeId: destinationPlaceId,
            address: destinationAddress || destination
          });
        }
      }
    } 
    else {
      // INTERMEDIATE & FINAL DAYS
      const isFinalDay = (day === durationDays);
      const hotel = destData.haltingPlaces?.[0]?.name || "Resort & Spa";
      const hotelSpecs = getPlaceSpecs(hotel);
      const hotelCoords = { lat: hotelSpecs.lat, lng: hotelSpecs.lng };

      let currentTime = timeToMinutes("09:00 AM");
      let currentLoc = hotel;
      let currentCoords = hotelCoords;

      if (isFinalDay) {
        timeline.push({
          day,
          time: "09:00 AM",
          endTime: "09:00 AM",
          place: `Check out from ${hotel}`,
          purpose: "Hotel Checkout",
          reason: "Check out of lodging and prepare for the final sights and return journey.",
          travelTimeFromPrevious: "0m",
          isOpen: true,
          warning: null,
          lat: hotelSpecs.lat,
          lng: hotelSpecs.lng,
          placeId: hotelSpecs.placeId || `mock_stay_${hotel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: hotelSpecs.address || `${hotel}, ${destination}`
        });
      } else {
        timeline.push({
          day,
          time: "09:00 AM",
          endTime: "09:00 AM",
          place: `Depart from ${hotel}`,
          purpose: "Hotel Departure",
          reason: "Begin your day's itinerary exploring local sights.",
          travelTimeFromPrevious: "0m",
          isOpen: true,
          warning: null,
          lat: hotelSpecs.lat,
          lng: hotelSpecs.lng,
          placeId: hotelSpecs.placeId || `mock_stay_${hotel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: hotelSpecs.address || `${hotel}, ${destination}`
        });
      }

      // Schedule Attractions
      let attractionsScheduled = 0;
      for (let i = 0; i < attractionPool.length; i++) {
        if (attractionsScheduled >= maxPerDay) break;

        // Lunch break midpoint
        if (attractionsScheduled === 1 && currentTime < timeToMinutes("02:30 PM")) {
          const preferredRestaurant = destData.restaurants?.[day % destData.restaurants.length]?.name || destData.restaurants[0]?.name;
          const restaurantSpecs = getPlaceSpecs(preferredRestaurant);
          const restCoords = { lat: restaurantSpecs.lat, lng: restaurantSpecs.lng };
          const transit = getTravelTimeWithCoords(currentLoc, preferredRestaurant, source, destination, currentCoords, restCoords);
          currentTime += transit;

          timeline.push({
            day,
            time: minutesToTime(currentTime),
            endTime: minutesToTime(currentTime + restaurantSpecs.duration),
            place: preferredRestaurant,
            purpose: "Lunch Break",
            reason: "Lunch stop for regional delicacies.",
            travelTimeFromPrevious: formatMinutes(transit),
            isOpen: checkOpeningHours(preferredRestaurant, minutesToTime(currentTime), restaurantSpecs.duration),
            warning: null,
            lat: restaurantSpecs.lat,
            lng: restaurantSpecs.lng,
            placeId: restaurantSpecs.placeId || `mock_rest_${preferredRestaurant.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            address: restaurantSpecs.address || `${preferredRestaurant}, ${destination}`
          });

          currentTime += restaurantSpecs.duration;
          currentLoc = preferredRestaurant;
          currentCoords = restCoords;
        }

        const att = attractionPool[i];
        const specs = getPlaceSpecs(att.name);
        const attCoords = { lat: specs.lat, lng: specs.lng };
        const transit = getTravelTimeWithCoords(currentLoc, att.name, source, destination, currentCoords, attCoords);
        const arrivalTime = currentTime + transit;
        const arrivalTimeStr = minutesToTime(arrivalTime);

        const status = getPlaceTimeStatus(att.name, arrivalTimeStr);
        if (status === 'OPEN' || status === 'LIMITED') {
          timeline.push({
            day,
            time: arrivalTimeStr,
            endTime: minutesToTime(arrivalTime + specs.duration),
            place: att.name,
            purpose: "Sightseeing",
            reason: att.description || "Top rated local sight.",
            travelTimeFromPrevious: formatMinutes(transit),
            isOpen: true,
            warning: null,
            lat: specs.lat,
            lng: specs.lng,
            placeId: specs.placeId || `mock_att_${att.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            address: specs.address || `${att.name}, ${destination}`
          });

          currentTime = arrivalTime + specs.duration;
          currentLoc = att.name;
          currentCoords = attCoords;
          attractionsScheduled++;

          attractionPool.splice(i, 1);
          i--;
        } else {
          let reasonMsg = `${att.name} is closed at ${arrivalTimeStr}.`;
          const openTime = specs.open || specs.openTime || "09:00 AM";
          const closeTime = specs.close || specs.closeTime || "06:00 PM";
          if (status === 'CLOSED') {
            reasonMsg = `${att.name} is closed at ${arrivalTimeStr}. Opening hours: ${openTime} - ${closeTime}.`;
          } else if (status === 'NOT ENOUGH TIME') {
            reasonMsg = `${att.name} has insufficient visit time at ${arrivalTimeStr}. Minimum: ${specs.minDuration || 60}m. Closes at ${closeTime}.`;
          }
          infeasible.push({
            place: att.name,
            reason: reasonMsg
          });
        }
      }

      // Optional Dinner
      if (currentTime < timeToMinutes("09:30 PM")) {
        const preferredRestaurant = destData.restaurants?.[(day + 1) % destData.restaurants.length]?.name || destData.restaurants[0]?.name;
        const restaurantSpecs = getPlaceSpecs(preferredRestaurant);
        const restCoords = { lat: restaurantSpecs.lat, lng: restaurantSpecs.lng };
        const transit = getTravelTimeWithCoords(currentLoc, preferredRestaurant, source, destination, currentCoords, restCoords);
        currentTime += transit;

        timeline.push({
          day,
          time: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + restaurantSpecs.duration),
          place: preferredRestaurant,
          purpose: "Dinner Break",
          reason: "Relaxing dinner at a recommended local restaurant.",
          travelTimeFromPrevious: formatMinutes(transit),
          isOpen: checkOpeningHours(preferredRestaurant, minutesToTime(currentTime), restaurantSpecs.duration),
          warning: null,
          lat: restaurantSpecs.lat,
          lng: restaurantSpecs.lng,
          placeId: restaurantSpecs.placeId || `mock_rest_${preferredRestaurant.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: restaurantSpecs.address || `${preferredRestaurant}, ${destination}`
        });

        currentTime += restaurantSpecs.duration;
        currentLoc = preferredRestaurant;
        currentCoords = restCoords;
      }

      // End of day
      if (!isFinalDay) {
        const hotelTransit = getTravelTimeWithCoords(currentLoc, hotel, source, destination, currentCoords, hotelCoords);
        currentTime += hotelTransit;

        timeline.push({
          day,
          time: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + 600),
          place: hotel,
          purpose: "Return to Lodging",
          reason: "Return to your hotel for overnight rest and recovery.",
          travelTimeFromPrevious: formatMinutes(hotelTransit),
          isOpen: true,
          warning: null,
          lat: hotelSpecs.lat,
          lng: hotelSpecs.lng,
          placeId: hotelSpecs.placeId || `mock_stay_${hotel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          address: hotelSpecs.address || `${hotel}, ${destination}`
        });
      } else {
        if (tripMode === 'Round Trip') {
          const returnTransit = getTravelTimeWithCoords(currentLoc, source, source, destination, currentCoords, sourceCoords);
          currentTime += returnTransit;
          timeline.push({
            day,
            time: minutesToTime(currentTime),
            endTime: minutesToTime(currentTime),
            place: `Arrive at ${source}`,
            purpose: "Arrival",
            reason: "Complete your road trip and safely arrive back home.",
            travelTimeFromPrevious: formatMinutes(returnTransit),
            isOpen: true,
            warning: null,
            lat: sourceCoords?.lat,
            lng: sourceCoords?.lng,
            placeId: sourcePlaceId,
            address: sourceAddress || source
          });
        } else {
          const hotelTransit = getTravelTimeWithCoords(currentLoc, hotel, source, destination, currentCoords, hotelCoords);
          currentTime += hotelTransit;

          timeline.push({
            day,
            time: minutesToTime(currentTime),
            endTime: minutesToTime(currentTime),
            place: `End of Journey at ${hotel}`,
            purpose: "Stay & Rest",
            reason: "Check into your destination lodging. Your one-way road trip is successfully completed.",
            travelTimeFromPrevious: formatMinutes(hotelTransit),
            isOpen: true,
            warning: null,
            lat: hotelSpecs.lat,
            lng: hotelSpecs.lng,
            placeId: hotelSpecs.placeId || `mock_stay_${hotel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            address: hotelSpecs.address || `${hotel}, ${destination}`
          });
        }
      }
    }
  }

  // Append leftover attractions that did not fit in the capacity
  for (const att of attractionPool) {
    let reasonMsg = "Could not fit into this plan: ";
    if (durationDays === 1) {
      reasonMsg += "schedule capacity limit reached or too far for a 1-day trip.";
    } else {
      reasonMsg += "schedule capacity limit reached for this trip style.";
    }
    infeasible.push({
      place: att.name,
      reason: reasonMsg
    });
  }

  // Attach the infeasible suggestions to the returned array object so it can be extracted
  timeline.infeasible = infeasible;
  return timeline;
}

// Auto-repair Timeline schedules
export function autoRepairTimeline(timeline, tripDetails) {
  const { source, destination, startTime = "09:00 AM" } = tripDetails;
  
  const initialValidation = validateTimeline(timeline, tripDetails);
  if (initialValidation.success) {
    return { success: true, timeline: initialValidation.timeline, autoApplied: false };
  }

  // Find the first index with timing warning (excluding fatigue warning)
  const badIndex = initialValidation.timeline.findIndex(item => 
    item.warning && (item.warning.includes("closed") || item.warning.includes("visit time") || item.warning.includes("cannot be visited"))
  );

  if (badIndex === -1) {
    return { success: false, timeline: initialValidation.timeline, autoApplied: false };
  }

  const options = [];

  // OPTION A: Shift earlier
  for (let newIdx = badIndex - 1; newIdx >= 1; newIdx--) {
    const newTimeline = [...timeline.map(item => ({ ...item }))];
    const [target] = newTimeline.splice(badIndex, 1);
    newTimeline.splice(newIdx, 0, target);
    
    const testVal = validateTimeline(newTimeline, tripDetails);
    if (testVal.success) {
      options.push({
        option: 'A',
        description: `Move ${target.place} earlier in the timeline (before ${newTimeline[newIdx + 1].place})`,
        timeline: testVal.timeline
      });
      break;
    }
  }

  // OPTION B: Swap with neighbors
  if (badIndex > 1) {
    const newTimeline = [...timeline.map(item => ({ ...item }))];
    
    // Swap elements
    const temp = newTimeline[badIndex];
    newTimeline[badIndex] = newTimeline[badIndex - 1];
    newTimeline[badIndex - 1] = temp;

    // Also swap their scheduled times!
    const tempTime = newTimeline[badIndex].time;
    newTimeline[badIndex].time = newTimeline[badIndex - 1].time;
    newTimeline[badIndex - 1].time = tempTime;

    const testVal = validateTimeline(newTimeline, tripDetails);
    if (testVal.success) {
      options.push({
        option: 'B',
        description: `Swap ${temp.place} with ${newTimeline[badIndex].place}`,
        timeline: testVal.timeline
      });
    }
  }
  if (badIndex < timeline.length - 1) {
    const newTimeline = [...timeline.map(item => ({ ...item }))];
    
    // Swap elements
    const temp = newTimeline[badIndex];
    newTimeline[badIndex] = newTimeline[badIndex + 1];
    newTimeline[badIndex + 1] = temp;

    // Also swap their scheduled times!
    const tempTime = newTimeline[badIndex].time;
    newTimeline[badIndex].time = newTimeline[badIndex + 1].time;
    newTimeline[badIndex + 1].time = tempTime;

    const testVal = validateTimeline(newTimeline, tripDetails);
    if (testVal.success) {
      options.push({
        option: 'B',
        description: `Swap ${temp.place} with ${newTimeline[badIndex].place}`,
        timeline: testVal.timeline
      });
    }
  }

  // OPTION C: Move to next day
  const currentDay = timeline[badIndex].day || 1;
  const maxDays = tripDetails.durationDays || 1;
  if (maxDays > 1 && currentDay < maxDays) {
    const newTimeline = [...timeline.map(item => ({ ...item }))];
    const target = newTimeline[badIndex];
    target.day = currentDay + 1;
    
    let insertIdx = newTimeline.findIndex(item => item.day === currentDay + 1);
    if (insertIdx !== -1) {
      if (newTimeline[insertIdx].purpose?.toLowerCase().includes("hotel") || newTimeline[insertIdx].purpose?.toLowerCase().includes("lodging")) {
        insertIdx += 1;
      }
      newTimeline.splice(badIndex, 1);
      const adjustedInsertIdx = insertIdx > badIndex ? insertIdx - 1 : insertIdx;
      newTimeline.splice(adjustedInsertIdx, 0, target);
    } else {
      newTimeline.splice(badIndex, 1);
      newTimeline.push(target);
    }

    const testVal = validateTimeline(newTimeline, tripDetails);
    if (testVal.success) {
      options.push({
        option: 'C',
        description: `Move ${target.place} to Day ${currentDay + 1}`,
        timeline: testVal.timeline
      });
    }
  }

  // Decision logic
  if (options.length === 1) {
    const opt = options[0];
    const updatedTimeline = opt.timeline.map(item => {
      if (item.place === timeline[badIndex].place) {
        return {
          ...item,
          autoFixed: true,
          autoFixMessage: `[Auto-Fixed] ${opt.description}`
        };
      }
      return item;
    });

    const finalVal = validateTimeline(updatedTimeline, tripDetails);
    return {
      success: true,
      timeline: finalVal.timeline,
      autoApplied: true,
      autoFixMessage: opt.description
    };
  } else if (options.length > 1) {
    return {
      success: false,
      timeline: initialValidation.timeline,
      autoApplied: false,
      suggestions: options.map(opt => ({
        option: opt.option,
        description: opt.description,
        timeline: opt.timeline
      }))
    };
  }

  return {
    success: false,
    timeline: initialValidation.timeline,
    autoApplied: false
  };
}

// Validate entire itinerary
export function validateItinerary(itinerary) {
  const { timeline, source, destination, startTime, tripDate, durationDays = 1 } = itinerary;
  
  if (isPastDate(tripDate)) {
    return { success: false, reason: "PAST_DATE", message: "Invalid date: Trip date cannot be in the past." };
  }
  
  if (startTime && isPastTimeToday(tripDate, startTime)) {
    return { success: false, reason: "PAST_TIME", message: "Invalid time: Start time cannot be earlier than the current time." };
  }

  const validation = validateTimeline(timeline, { 
    source, 
    destination, 
    startTime,
    sourceCoords: itinerary.sourceCoords,
    destinationCoords: itinerary.destinationCoords,
    sourcePlaceId: itinerary.sourcePlaceId,
    destinationPlaceId: itinerary.destinationPlaceId,
    sourceAddress: itinerary.sourceAddress,
    destinationAddress: itinerary.destinationAddress,
    durationDays
  });
  return {
    success: validation.success,
    timeline: validation.timeline,
    overallWarning: validation.overallWarning
  };
}

// Validate timeline sequence
export function validateTimeline(timeline, tripDetails) {
  const { 
    source, 
    destination, 
    startTime = "09:00 AM",
    sourceCoords,
    destinationCoords,
    sourcePlaceId,
    destinationPlaceId,
    sourceAddress,
    destinationAddress
  } = tripDetails;
  
  if (!timeline || timeline.length === 0) {
    return { success: true, timeline: [], overallWarning: null };
  }

  const validated = [];
  let currentTime = timeToMinutes(startTime);
  let previousPlace = source;
  let totalDrivingTime = 0;
  let timeSinceLastBreak = 0;
  let overallWarning = null;

  for (let i = 0; i < timeline.length; i++) {
    const item = { ...timeline[i] };
    const specs = getPlaceSpecs(item.place);
    
    // Check if day changed to reset scheduling start time
    const day = item.day || 1;
    const prevDay = i > 0 ? (timeline[i - 1].day || 1) : 1;
    if (i > 0 && day !== prevDay) {
      currentTime = timeToMinutes("09:00 AM");
      timeSinceLastBreak = 0;
    }

    // Resolve coordinates for this item
    if (i === 0) {
      item.lat = sourceCoords?.lat || item.lat;
      item.lng = sourceCoords?.lng || item.lng;
      item.placeId = sourcePlaceId || item.placeId;
      item.address = sourceAddress || item.address || source;
    } else if (item.place.includes("Arrive in") || item.place.includes("Arrive at")) {
      item.lat = destinationCoords?.lat || item.lat;
      item.lng = destinationCoords?.lng || item.lng;
      item.placeId = destinationPlaceId || item.placeId;
      item.address = destinationAddress || item.address || destination;
    } else {
      const dbSpecs = getPlaceSpecs(item.place);
      if (dbSpecs && dbSpecs.lat) {
        item.lat = dbSpecs.lat;
        item.lng = dbSpecs.lng;
        item.placeId = dbSpecs.placeId || item.placeId || `mock_${item.place.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        item.address = dbSpecs.address || item.address || `${item.place}, ${destination}`;
      } else {
        item.lat = item.lat || destinationCoords?.lat;
        item.lng = item.lng || destinationCoords?.lng;
        item.placeId = item.placeId || `mock_${item.place.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        item.address = item.address || `${item.place}, ${destination}`;
      }
    }

    let transit = 0;
    if (i > 0) {
      const prevItemCoords = validated[i - 1] ? { lat: validated[i - 1].lat, lng: validated[i - 1].lng } : null;
      const currentItemCoords = { lat: item.lat, lng: item.lng };
      transit = getTravelTimeWithCoords(previousPlace, item.place, source, destination, prevItemCoords, currentItemCoords);
      currentTime += transit;
      totalDrivingTime += transit;
      timeSinceLastBreak += transit;
    }

    item.travelTimeFromPrevious = formatMinutes(transit);
    const arrivalTimeStr = minutesToTime(currentTime);
    
    if (item.time) {
      const userTime = timeToMinutes(item.time);
      if (userTime < currentTime) {
        item.warning = `Invalid timing: ${item.place} cannot be visited at ${item.time} because estimated arrival from ${previousPlace} is ${arrivalTimeStr} (including travel time).`;
        currentTime = userTime; 
      } else {
        currentTime = userTime;
        item.warning = null;
      }
    } else {
      item.time = arrivalTimeStr;
    }

    const duration = i === 0 ? 0 : (specs.duration !== undefined ? specs.duration : 60);
    const departureTime = currentTime + duration;
    item.endTime = minutesToTime(departureTime);

    const status = i === 0 ? "OPEN" : getPlaceTimeStatus(item.place, item.time);
    item.isOpen = (status === "OPEN" || status === "LIMITED");

    if (i > 0 && (status === "CLOSED" || status === "NOT ENOUGH TIME") && !item.warning) {
      if (status === "CLOSED") {
        const nextSlot = suggestNextAvailableSlot(item.place, currentTime);
        item.warning = `${item.place} is closed at ${item.time}. Opening hours: ${specs.open || specs.openTime} - ${specs.close || specs.closeTime}. Suggested next open: ${nextSlot}.`;
      } else {
        const arrivalMins = currentTime;
        const closeMins = timeToMinutes(specs.close || specs.closeTime);
        const availableMins = closeMins - arrivalMins;
        const minDur = specs.minDuration || specs.minimumVisitDuration || 60;
        item.warning = `${item.place} does not have enough visit time at ${item.time}. Minimum required: ${minDur} mins, available: ${availableMins} mins.`;
      }
    }

    if (item.purpose === "Rest & Coffee" || item.purpose === "Lunch Break") {
      timeSinceLastBreak = 0;
    }

    if (timeSinceLastBreak > 180) {
      item.warning = (item.warning ? item.warning + " " : "") + "Add rest break before continuing: driving time exceeds 3 hours without rest.";
      overallWarning = "Driver fatigue warning detected. Please add a rest break.";
    }

    validated.push(item);
    currentTime = departureTime;
    previousPlace = item.place;
  }

  const success = !validated.some(v => v.warning?.includes("Invalid timing") || v.warning?.includes("closed") || v.warning?.includes("enough visit time"));
  return {
    success,
    timeline: validated,
    overallWarning
  };
}

// Chronologically reschedule timeline to resolve overlaps
export function rescheduleTimeline(timeline, tripDetails) {
  const { source, destination, startTime = "09:00 AM" } = tripDetails;
  
  if (!timeline || timeline.length === 0) {
    return [];
  }
  
  const rescheduled = [];
  let currentTime = timeToMinutes(startTime);
  let previousPlace = source;
  let prevCoords = tripDetails.sourceCoords;
  
  for (let i = 0; i < timeline.length; i++) {
    const item = { ...timeline[i] };
    const specs = getPlaceSpecs(item.place);
    
    const day = item.day || 1;
    const prevDay = i > 0 ? (rescheduled[i - 1].day || 1) : 1;
    if (i > 0 && day !== prevDay) {
      currentTime = timeToMinutes("09:00 AM");
    }
    
    let itemCoords = { lat: item.lat || specs.lat, lng: item.lng || specs.lng };
    if (!itemCoords.lat && item.place.includes(destination)) {
      itemCoords = tripDetails.destinationCoords;
    }
    if (!itemCoords.lat && item.place.includes(source)) {
      itemCoords = tripDetails.sourceCoords;
    }
    
    let transit = 0;
    if (i > 0) {
      transit = getTravelTimeWithCoords(previousPlace, item.place, source, destination, prevCoords, itemCoords);
      currentTime += transit;
    }
    
    item.time = minutesToTime(currentTime);
    item.travelTimeFromPrevious = formatMinutes(transit);
    
    let duration = 60;
    if (i === 0) {
      duration = 0;
    } else if (item.place.includes("Arrive at") || item.place.includes("Arrive in") || item.place.includes("Check out from") || item.place.includes("End of Journey") || item.place.includes("End of Day")) {
      duration = 0;
    } else if (specs && specs.duration !== undefined) {
      duration = specs.duration;
    }
    
    currentTime += duration;
    item.endTime = minutesToTime(currentTime);
    
    const status = getPlaceTimeStatus(item.place, item.time);
    item.isOpen = (status === "OPEN" || status === "LIMITED");
    
    if (status === "CLOSED" && !item.place.includes("End of Day") && !item.place.includes("Arrive at") && !item.place.includes("Start from")) {
      item.warning = `${item.place} is closed at ${item.time}. Opening hours: ${specs.open || specs.openTime || "09:00 AM"} - ${specs.close || specs.closeTime || "06:00 PM"}.`;
    } else {
      item.warning = null;
    }
    
    rescheduled.push(item);
    previousPlace = item.place;
    prevCoords = itemCoords;
  }
  
  return rescheduled;
}
