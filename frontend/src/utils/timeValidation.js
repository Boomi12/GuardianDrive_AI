// Frontend Time Validation Utility for GuardianDrive AI

// Retrieve current date in YYYY-MM-DD format
export function getCurrentDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Get current local time rounded up to the next 15-minute mark (e.g., 08:37 PM -> 08:45 PM)
export function getCurrentTimeRounded() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  
  // Round up to next 15 minutes
  const remainder = minutes % 15;
  if (remainder !== 0) {
    minutes += (15 - remainder);
  }
  
  if (minutes >= 60) {
    minutes = 0;
    hours += 1;
  }
  if (hours >= 24) {
    hours = 0;
  }
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  const padH = String(displayHours).padStart(2, '0');
  const padM = String(minutes).padStart(2, '0');
  return `${padH}:${padM} ${ampm}`;
}

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

// Convert minutes to "09:00 AM"
export function minutesToTime(minutes) {
  let mins = minutes % 1440;
  if (mins < 0) mins += 1440;
  let hours = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const padM = String(m).padStart(2, '0');
  const padH = String(hours).padStart(2, '0');
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

// Add minutes to a time string
export function addMinutes(timeStr, minutes) {
  const mins = timeToMinutes(timeStr) + minutes;
  return minutesToTime(mins);
}

// Compare two times: returns -1 if t1 < t2, 1 if t1 > t2, 0 if equal
export function compareTimes(time1, time2) {
  const m1 = timeToMinutes(time1);
  const m2 = timeToMinutes(time2);
  if (m1 < m2) return -1;
  if (m1 > m2) return 1;
  return 0;
}

// Validate trip date and start time
export function validateTripStart(date, time) {
  if (isPastDate(date)) {
    return { valid: false, reason: "PAST_DATE", message: "Invalid date: Trip date cannot be in the past." };
  }
  if (isPastTimeToday(date, time)) {
    return { valid: false, reason: "PAST_TIME", message: "Invalid time: Start time cannot be earlier than the current time." };
  }
  return { valid: true };
}

// Static places database for instant client-side lookup
export const PLACE_SPECS_DB = {
  // Mysore Attractions
  "mysore palace": { open: "10:00 AM", close: "05:30 PM", duration: 120, minDuration: 60, type: "attraction" },
  "chamundi hill temple": { open: "07:30 AM", close: "09:00 PM", duration: 90, minDuration: 45, type: "attraction" },
  "brindavan gardens": { open: "06:00 AM", close: "08:00 PM", duration: 120, minDuration: 60, type: "attraction", bestTime: "evening" },
  "karanji lake": { open: "08:30 AM", close: "05:30 PM", duration: 90, minDuration: 45, type: "attraction" },
  "mysore zoo": { open: "08:30 AM", close: "05:30 PM", duration: 180, minDuration: 90, type: "attraction" },
  "jaganmohan palace art gallery": { open: "10:00 AM", close: "05:00 PM", duration: 90, minDuration: 45, type: "attraction" },
  "st. philomena's church": { open: "08:00 AM", close: "06:00 PM", duration: 60, minDuration: 30, type: "attraction" },
  "railway museum": { open: "09:30 AM", close: "05:30 PM", duration: 75, minDuration: 45, type: "attraction" },
  "grs fantasy park": { open: "10:30 AM", close: "06:00 PM", duration: 240, minDuration: 120, type: "attraction" },
  "lalitha mahal palace": { open: "10:00 AM", close: "06:00 PM", duration: 90, minDuration: 45, type: "attraction" },

  // Mysore Restaurants
  "hotel mylari": { open: "07:00 AM", close: "10:00 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "gufha restaurant": { open: "12:00 PM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant" },
  "the olive garden": { open: "11:00 AM", close: "10:30 PM", duration: 90, minDuration: 45, type: "restaurant" },
  "oyster bay": { open: "11:30 AM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant" },
  "mahesh prasad": { open: "07:00 AM", close: "09:30 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "parklane hotel restaurant": { open: "11:00 AM", close: "11:30 PM", duration: 75, minDuration: 45, type: "restaurant" },
  "sizzler bistro": { open: "12:00 PM", close: "10:30 PM", duration: 60, minDuration: 40, type: "restaurant" },
  "spring at radisson blu": { open: "06:30 AM", close: "11:30 PM", duration: 90, minDuration: 60, type: "restaurant" },
  "poojari's fish land": { open: "11:30 AM", close: "10:30 PM", duration: 75, minDuration: 45, type: "restaurant" },
  "depth n green": { open: "08:00 AM", close: "08:30 PM", duration: 60, minDuration: 30, type: "restaurant" },

  // Mysore Rest Stops
  "highway nest food plaza": { open: "07:00 AM", close: "11:00 PM", duration: 45, minDuration: 20, type: "restStop" },
  "cafe coffee day - highway stop": { open: "24 hours", duration: 30, minDuration: 15, type: "restStop" },
  "kamath lokaruchi": { open: "06:00 AM", close: "10:00 PM", duration: 60, minDuration: 30, type: "restStop" },
  "empire restaurant - expressway halt": { open: "24 hours", duration: 45, minDuration: 30, type: "restStop" },
  "maddur tiffany's": { open: "06:30 AM", close: "09:30 PM", duration: 35, minDuration: 20, type: "restStop" },
  "shell select fuel & convenience": { open: "24 hours", duration: 25, minDuration: 10, type: "restStop" },
  "shivalli restaurant stop": { open: "07:00 AM", close: "10:30 PM", duration: 45, minDuration: 25, type: "restStop" },
  "adyar ananda bhavan (a2b) - ramanagara": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 25, type: "restStop" },
  "polar bear ice cream sundaes": { open: "11:00 AM", close: "11:00 PM", duration: 40, minDuration: 20, type: "restStop" },
  "highway chai point": { open: "06:00 AM", close: "11:00 PM", duration: 30, minDuration: 15, type: "restStop" },

  // Mysore Lodging
  "the windflower resort & spa": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "radisson blu plaza hotel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "grand mercure mysore": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "silent shores resort & spa": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "fortune jp palace": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "southern star mysore": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "roost guesthouse": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "country inn & suites by radisson": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "ginger mysore": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "lalitha mahal palace hotel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },

  // Mysore Fuel / EV Charging
  "tata power ev fast charger": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "hp cl petrol pump - mysore road": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "zeon ev charging station - mall of mysore": { open: "10:00 AM", close: "10:00 PM", duration: 45, minDuration: 20, type: "refuel" },
  "jio-bp pulse ev station": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "shell fuel station - ring road": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "indian oil petrol pump - city center": { open: "06:00 AM", close: "11:30 PM", duration: 15, minDuration: 5, type: "refuel" },
  "bharat petroleum fast ev station": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "ather grid fast charger - gokulam": { open: "08:00 AM", close: "10:00 PM", duration: 30, minDuration: 15, type: "refuel" },
  "nayara energy fuel station": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "relux ev charging hub": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },

  // Coorg
  "abbey falls": { open: "09:00 AM", close: "05:00 PM", duration: 60, minDuration: 45, type: "attraction" },
  "raja's seat": { open: "06:00 AM", close: "08:00 PM", duration: 60, minDuration: 30, type: "attraction", bestTime: "evening" },
  "namdroling golden temple": { open: "09:00 AM", close: "06:00 PM", duration: 90, minDuration: 45, type: "attraction" },
  "coorg cuisine": { open: "12:00 PM", close: "10:00 PM", duration: 50, minDuration: 30, type: "restaurant" },
  "raintree restaurant": { open: "12:00 PM", close: "10:30 PM", duration: 60, minDuration: 45, type: "restaurant" },
  "east end hotel": { open: "11:30 AM", close: "10:00 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "coorg spices hub & cafe": { open: "08:00 AM", close: "08:00 PM", duration: 45, minDuration: 20, type: "restStop" },
  "cafe coffee day": { open: "24 hours", duration: 30, minDuration: 15, type: "restStop" },
  "the tamara coorg": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "club mahindra madikeri": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "zeon ev charging station": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "indian oil petrol station": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },

  // Bangalore
  "lalbagh botanical garden": { open: "06:00 AM", close: "07:00 PM", duration: 90, minDuration: 60, type: "attraction" },
  "bangalore palace": { open: "10:00 AM", close: "05:30 PM", duration: 90, minDuration: 60, type: "attraction" },
  "nandi hills": { open: "06:00 AM", close: "06:00 PM", duration: 120, minDuration: 90, type: "attraction", bestTime: "morning" },
  "vidyarthi bhavan": { open: "06:30 AM", close: "11:30 AM", duration: 45, minDuration: 30, type: "restaurant" },
  "toit brewpub": { open: "12:00 PM", close: "11:30 PM", duration: 90, minDuration: 60, type: "restaurant" },
  "nagarjuna restaurant": { open: "12:00 PM", close: "04:00 PM", duration: 60, minDuration: 40, type: "restaurant" },
  "shell select lounge": { open: "24 hours", duration: 20, minDuration: 10, type: "restStop" },
  "a2b adyar ananda bhavan": { open: "06:30 AM", close: "10:30 PM", duration: 35, minDuration: 20, type: "restStop" },
  "taj west end": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "itc gardenia": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "bescom fast ev charger": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "shell fuel station - indiranagar": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },

  // Chikkamagaluru
  "mullayanagiri peak": { open: "06:00 AM", close: "06:00 PM", duration: 90, minDuration: 60, type: "attraction", bestTime: "morning" },
  "hebbe falls": { open: "08:00 AM", close: "04:00 PM", duration: 120, minDuration: 90, type: "attraction" },
  "baba budangiri": { open: "08:00 AM", close: "05:00 PM", duration: 90, minDuration: 60, type: "attraction" },
  "town house restaurant": { open: "07:00 AM", close: "10:00 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "the peeriot": { open: "11:00 AM", close: "10:30 PM", duration: 60, minDuration: 45, type: "restaurant" },
  "odyssey restaurant": { open: "12:00 PM", close: "10:30 PM", duration: 60, minDuration: 45, type: "restaurant" },
  "ccd - global village road": { open: "07:00 AM", close: "11:00 PM", duration: 30, minDuration: 20, type: "restStop" },
  "hassan highway food plaza": { open: "06:00 AM", close: "11:00 PM", duration: 35, minDuration: 25, type: "restStop" },
  "the serai chikkamagaluru": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "trivik hotels & resorts": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "ather grid ev charger": { open: "24 hours", duration: 30, minDuration: 15, type: "refuel" },
  "hp petrol pump": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },

  // Ooty
  "ooty botanical gardens": { open: "07:00 AM", close: "06:30 PM", duration: 90, minDuration: 60, type: "attraction" },
  "doddabetta peak": { open: "09:00 AM", close: "06:00 PM", duration: 60, minDuration: 45, type: "attraction" },
  "ooty lake": { open: "09:00 AM", close: "06:00 PM", duration: 90, minDuration: 60, type: "attraction" },
  "shinkows chinese restaurant": { open: "11:30 AM", close: "10:00 PM", duration: 60, minDuration: 45, type: "restaurant" },
  "place to bee": { open: "11:00 AM", close: "09:30 PM", duration: 50, minDuration: 40, type: "restaurant" },
  "earl's secret": { open: "12:00 PM", close: "10:00 PM", duration: 75, minDuration: 60, type: "restaurant" },
  "hill view tea stop": { open: "07:00 AM", close: "07:00 PM", duration: 25, minDuration: 15, type: "restStop" },
  "nilgiri highway nest": { open: "06:00 AM", close: "10:00 PM", duration: 30, minDuration: 20, type: "restStop" },
  "savoy - ihcl seleqtions": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "destiny the farmstay": { open: "24 hours", duration: 480, minDuration: 360, type: "lodging" },
  "tata power fast ev charger": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "bharat petroleum pump": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },

  // Chennai Attractions
  "marina beach": { open: "24 hours", duration: 90, minDuration: 45, type: "attraction" },
  "kapaleeshwarar temple": { open: "06:00 AM", close: "09:00 PM", duration: 60, minDuration: 30, type: "attraction" },
  "fort st. george": { open: "09:00 AM", close: "05:00 PM", duration: 90, minDuration: 60, type: "attraction" },
  "government museum chennai": { open: "09:30 AM", close: "05:00 PM", duration: 120, minDuration: 60, type: "attraction" },
  "santhome basilica": { open: "06:00 AM", close: "09:00 PM", duration: 60, minDuration: 30, type: "attraction" },
  "valluvar kottam": { open: "08:30 AM", close: "05:30 PM", duration: 60, minDuration: 30, type: "attraction" },
  "guindy national park": { open: "09:00 AM", close: "05:30 PM", duration: 120, minDuration: 60, type: "attraction" },
  "besant nagar beach": { open: "24 hours", duration: 90, minDuration: 45, type: "attraction" },
  "dakshinachitra": { open: "10:00 AM", close: "06:00 PM", duration: 180, minDuration: 90, type: "attraction" },
  "arignar anna zoological park": { open: "09:00 AM", close: "05:00 PM", duration: 240, minDuration: 120, type: "attraction" },

  // Chennai Restaurants
  "murugan idli shop": { open: "07:00 AM", close: "11:00 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "ratna cafe": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "mathsya": { open: "07:00 AM", close: "11:30 PM", duration: 60, minDuration: 30, type: "restaurant" },
  "sangeetha veg restaurant": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "annalakshmi": { open: "12:00 PM", close: "09:30 PM", duration: 90, minDuration: 60, type: "restaurant" },
  "southern spice": { open: "12:30 PM", close: "11:30 PM", duration: 90, minDuration: 60, type: "restaurant" },
  "ponnusamy hotel": { open: "11:30 AM", close: "11:00 PM", duration: 60, minDuration: 40, type: "restaurant" },
  "the marina": { open: "12:00 PM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant" },
  "buhari": { open: "11:00 AM", close: "11:30 PM", duration: 60, minDuration: 40, type: "restaurant" },
  "adyar ananda bhavan": { open: "06:30 AM", close: "10:30 PM", duration: 45, minDuration: 25, type: "restaurant" },

  // Chennai Rest Stops
  "cafe coffee day": { open: "24 hours", duration: 30, minDuration: 15, type: "restStop" },
  "writer’s cafe": { open: "09:00 AM", close: "10:00 PM", duration: 45, minDuration: 20, type: "restStop" },
  "amethyst cafe": { open: "07:30 AM", close: "11:00 PM", duration: 60, minDuration: 30, type: "restStop" },
  "sandy’s chocolate laboratory": { open: "11:00 AM", close: "11:00 PM", duration: 45, minDuration: 25, type: "restStop" },
  "a2b highway stop": { open: "06:00 AM", close: "11:00 PM", duration: 40, minDuration: 20, type: "restStop" },

  // Chennai Lodging
  "taj coromandel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "itc grand chola": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "radisson blu chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "the park chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "hyatt regency chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "ginger chennai": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "fabhotel options": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },

  // Chennai EV/Fuel
  "tata power ev charging": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "statiq ev charging": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "ather grid chennai": { open: "08:00 AM", close: "10:00 PM", duration: 30, minDuration: 15, type: "refuel" },
  "indianoil": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "bharat petroleum": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "hp petrol pump": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },

  // General/Default Destination
  "scenic city viewpoint": { open: "06:00 AM", close: "09:00 PM", duration: 60, minDuration: 30, type: "attraction" },
  "public historic park": { open: "06:00 AM", close: "08:00 PM", duration: 90, minDuration: 45, type: "attraction" },
  "central science museum": { open: "10:00 AM", close: "05:00 PM", duration: 120, minDuration: 60, type: "attraction" },
  "national art gallery": { open: "10:00 AM", close: "05:00 PM", duration: 90, minDuration: 45, type: "attraction" },
  "botanical conservatory": { open: "09:00 AM", close: "06:00 PM", duration: 75, minDuration: 45, type: "attraction" },
  "sunset hill fort": { open: "06:00 AM", close: "07:00 PM", duration: 120, minDuration: 60, type: "attraction" },
  "crafts village bazaar": { open: "11:00 AM", close: "08:00 PM", duration: 90, minDuration: 45, type: "attraction" },
  "aquarium world": { open: "09:30 AM", close: "06:00 PM", duration: 90, minDuration: 60, type: "attraction" },
  "war memorial arch": { open: "24 hours", duration: 30, minDuration: 15, type: "attraction" },
  "amusement pier": { open: "12:00 PM", close: "10:00 PM", duration: 180, minDuration: 90, type: "attraction" },

  "highway diner": { open: "24 hours", duration: 45, minDuration: 30, type: "restaurant" },
  "central veg plaza": { open: "07:00 AM", close: "10:00 PM", duration: 45, minDuration: 30, type: "restaurant" },
  "royal tandoori house": { open: "12:00 PM", close: "11:00 PM", duration: 60, minDuration: 40, type: "restaurant" },
  "cafe bistro": { open: "10:00 AM", close: "10:00 PM", duration: 60, minDuration: 30, type: "restaurant" },
  "spice route seafood": { open: "12:00 PM", close: "11:00 PM", duration: 75, minDuration: 45, type: "restaurant" },
  "noodle wok": { open: "11:00 AM", close: "10:00 PM", duration: 35, minDuration: 20, type: "restaurant" },
  "green leaf organics": { open: "08:00 AM", close: "09:00 PM", duration: 50, minDuration: 30, type: "restaurant" },
  "the steakhouse": { open: "05:00 PM", close: "11:30 PM", duration: 90, minDuration: 60, type: "restaurant" },
  "local sweet house": { open: "08:00 AM", close: "09:30 PM", duration: 35, minDuration: 20, type: "restaurant" },
  "blue lagoon lounge": { open: "04:00 PM", close: "12:00 AM", duration: 120, minDuration: 60, type: "restaurant" },

  "expressway rest area": { open: "24 hours", duration: 25, minDuration: 10, type: "restStop" },
  "highway food plaza": { open: "24 hours", duration: 40, minDuration: 20, type: "restStop" },
  "green canopy cafe stop": { open: "07:00 AM", close: "09:00 PM", duration: 30, minDuration: 15, type: "restStop" },
  "star highway lounge": { open: "24 hours", duration: 30, minDuration: 15, type: "restStop" },
  "refresh & fuel hub": { open: "24 hours", duration: 25, minDuration: 10, type: "restStop" },
  "highway chai point": { open: "06:00 AM", close: "11:00 PM", duration: 30, minDuration: 15, type: "restStop" },
  "munch & go": { open: "24 hours", duration: 30, minDuration: 15, type: "restStop" },
  "milestone food court": { open: "07:00 AM", close: "10:30 PM", duration: 45, minDuration: 25, type: "restStop" },
  "truckers oasis": { open: "24 hours", duration: 45, minDuration: 20, type: "restStop" },
  "traveler's pitstop": { open: "06:00 AM", close: "10:00 PM", duration: 30, minDuration: 15, type: "restStop" },

  "guardian inn hotel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "grand vista resort": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "traveler's cozy lodge": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "the emerald suites": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "heritage haveli": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "riverside cabins": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "transit palace hotel": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "pinewood homestay": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "golden oasis villas": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },
  "backpackers central dome": { open: "24 hours", duration: 720, minDuration: 360, type: "lodging" },

  "national highway charging point": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "iocl petrol pump": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "super ev charge center": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "bpcl petrol pump & ev": { open: "24 hours", duration: 30, minDuration: 15, type: "refuel" },
  "city ev grid hub": { open: "08:00 AM", close: "10:00 PM", duration: 45, minDuration: 20, type: "refuel" },
  "hp fuel station - bypass": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "voltaic ev charging station": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" },
  "reliance petrol pump": { open: "24 hours", duration: 20, minDuration: 10, type: "refuel" },
  "ather grid charger hub": { open: "07:00 AM", close: "11:00 PM", duration: 30, minDuration: 15, type: "refuel" },
  "expressway eco charger": { open: "24 hours", duration: 45, minDuration: 20, type: "refuel" }
};

// Retrieve details for local specs or resolve dynamically
export function getLocalSpecs(name) {
  if (!name) return { open: "24 hours", duration: 60, type: "general" };
  const key = name.toLowerCase().trim();
  if (PLACE_SPECS_DB[key]) return PLACE_SPECS_DB[key];

  if (key.includes("arrive in") || key.includes("arrive at")) {
    return { open: "24 hours", duration: 0, type: "arrival" };
  }
  if (key.includes("palace") || key.includes("temple") || key.includes("garden") || key.includes("lake") || key.includes("falls") || key.includes("peak") || key.includes("hills")) {
    return { open: "09:00 AM", close: "06:00 PM", duration: 90, type: "attraction" };
  }
  if (key.includes("restaurant") || key.includes("hotel") || key.includes("diner") || key.includes("cafe") || key.includes("bhavan") || key.includes("brewpub") || key.includes("food") || key.includes("mylari")) {
    return { open: "07:00 AM", close: "11:00 PM", duration: 45, type: "restaurant" };
  }
  return { open: "24 hours", duration: 60, type: "general" };
}

// Calculate transit offset minutes
export function getLocalTravelOffset(fromPlace, toPlace, source, destination) {
  const f = fromPlace?.toLowerCase().trim();
  const t = toPlace?.toLowerCase().trim();
  const src = source?.toLowerCase().trim() || "bangalore";
  const dst = destination?.toLowerCase().trim() || "mysore";

  if (!f || !t) return 0;
  if (f === t) return 0;

  const isFromSrc = f === src || f.includes("start from");
  const isToDst = t === dst || t.includes("arrive at") || t.includes("arrive in");

  // Route drives
  if (isFromSrc && isToDst) {
    if (src.includes("bangalore") && dst.includes("mysore")) return 195;
    if (src.includes("bangalore") && dst.includes("coorg")) return 330;
    if (src.includes("bangalore") && dst.includes("ooty")) return 375;
    if (src.includes("bangalore") && dst.includes("chikkamagaluru")) return 285;
    return 180;
  }

  const isHighwayStop = (name) => {
    return name.includes("highway") || name.includes("plaza") || name.includes("food court") || name.includes("coffee day") || name.includes("spices hub") || name.includes("shell select") || name.includes("a2b");
  };

  if (isFromSrc && isHighwayStop(t)) return src.includes("bangalore") && dst.includes("mysore") ? 90 : 120;
  if (isHighwayStop(f) && isToDst) return src.includes("bangalore") && dst.includes("mysore") ? 105 : 120;

  // Local destination transitions
  let hash = 0;
  const key = [f, t].sort().join('-');
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 15 + (Math.abs(hash) % 21); // 15-35 minutes
}

// Compute earliest possible arrival at a place from a preceding waypoint
export function getEarliestArrival(previousWaypoint, travelTimeMinutes) {
  if (!previousWaypoint) return "09:00 AM";
  const prevEndTime = previousWaypoint.endTime || previousWaypoint.time;
  return addMinutes(prevEndTime, travelTimeMinutes);
}

export function getLocalPlaceTimeStatus(placeName, arrivalTime) {
  const specs = getLocalSpecs(placeName);
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
export function isPlaceOpen(placeName, arrivalTime, durationMinutes) {
  const status = getLocalPlaceTimeStatus(placeName, arrivalTime);
  return status === "OPEN" || status === "LIMITED";
}

// Check if a waypoint time is valid in context
export function validateWaypointTime(waypoint, previousWaypoint, nextWaypoint, tripDate, tripStartTime) {
  const source = previousWaypoint ? previousWaypoint.place : waypoint.place;
  const destination = nextWaypoint ? nextWaypoint.place : waypoint.place;
  
  const arrivalTime = waypoint.time;
  const arrivalMins = timeToMinutes(arrivalTime);

  // 1. Check if start time limit
  const tripStartMins = timeToMinutes(tripStartTime);
  if (arrivalMins < tripStartMins) {
    return { valid: false, reason: "BEFORE_TRIP_START", message: `Invalid timing: Spot cannot be scheduled before trip start (${tripStartTime}).` };
  }

  // 2. Check if past time today
  if (isPastTimeToday(tripDate, arrivalTime)) {
    return { valid: false, reason: "PAST_TIME", message: "Invalid time: Start time cannot be earlier than current time today." };
  }

  // 3. Check if unreachable from previous stop
  if (previousWaypoint) {
    const travelTime = getLocalTravelOffset(previousWaypoint.place, waypoint.place, source, destination);
    const earliestArrivalStr = getEarliestArrival(previousWaypoint, travelTime);
    const earliestArrivalMins = timeToMinutes(earliestArrivalStr);
    
    if (arrivalMins < earliestArrivalMins) {
      return { 
        valid: false, 
        reason: "TRAVEL_TIME_CONFLICT", 
        message: `Invalid timing: ${waypoint.place} cannot be scheduled at ${arrivalTime} because estimated arrival from ${previousWaypoint.place} is ${earliestArrivalStr} (including travel time).` 
      };
    }
  }

  // 4. Check if overlaps with next stop
  if (nextWaypoint) {
    const specs = getLocalSpecs(waypoint.place);
    const duration = specs.duration !== undefined ? specs.duration : 60;
    const endTime = addMinutes(arrivalTime, duration);
    const endMins = timeToMinutes(endTime);

    const travelToNext = getLocalTravelOffset(waypoint.place, nextWaypoint.place, source, destination);
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
    const status = getLocalPlaceTimeStatus(waypoint.place, arrivalTime);
    if (status === "CLOSED" || status === "NOT ENOUGH TIME") {
      const specs = getLocalSpecs(waypoint.place);
      const openTime = specs.open || specs.openTime || "09:00 AM";
      const closeTime = specs.close || specs.closeTime || "06:00 PM";
      const minDur = specs.minDuration || specs.minimumVisitDuration || 60;
      if (status === "CLOSED") {
        return {
          valid: false,
          reason: "PLACE_CLOSED",
          message: `${waypoint.place} is closed at ${arrivalTime}. Opening hours: ${openTime} - ${closeTime}.`
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

// Generate user-friendly feedback text
export function getValidationMessage(reason) {
  const messages = {
    "PAST_DATE": "Fix 1 issue: Trip date cannot be in the past.",
    "PAST_TIME": "Fix 1 issue: Start time cannot be earlier than the current time.",
    "TRAVEL_TIME_CONFLICT": "Travel time conflict: waypoints must account for transit offsets.",
    "OVERLAP_NEXT": "Timing overlap with the following stop.",
    "PLACE_CLOSED": "Target destination is closed at selected timing.",
    "NOT_ENOUGH_TIME": "Not enough visit time remaining before closing."
  };
  return messages[reason] || "Schedule validation conflict.";
}
