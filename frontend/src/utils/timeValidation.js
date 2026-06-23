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

// Check if a date string is in the past
export function isPastDate(dateStr) {
  if (!dateStr) return false;
  const selected = new Date(dateStr + 'T00:00:00');
  const today = new Date(getCurrentDate() + 'T00:00:00');
  return selected < today;
}

// Check if a time string is in the past for today's date
export function isPastTimeToday(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  if (dateStr !== getCurrentDate()) return false;
  
  const selectedMins = timeToMinutes(timeStr);
  const now = new Date();
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
  // Attractions
  "mysore palace": { open: "10:00 AM", close: "05:30 PM", duration: 90, type: "attraction" },
  "chamundi hill temple": { open: "07:30 AM", close: "09:00 PM", duration: 60, type: "attraction" },
  "brindavan gardens": { open: "06:00 AM", close: "08:00 PM", duration: 90, type: "attraction", bestTime: "evening" },
  "karanji lake": { open: "08:30 AM", close: "05:30 PM", duration: 60, type: "attraction" },
  "abbey falls": { open: "09:00 AM", close: "05:00 PM", duration: 60, type: "attraction" },
  "raja's seat": { open: "06:00 AM", close: "08:00 PM", duration: 60, type: "attraction", bestTime: "evening" },
  "namdroling golden temple": { open: "09:00 AM", close: "06:00 PM", duration: 90, type: "attraction" },
  "lalbagh botanical garden": { open: "06:00 AM", close: "07:00 PM", duration: 90, type: "attraction" },
  "bangalore palace": { open: "10:00 AM", close: "05:30 PM", duration: 90, type: "attraction" },
  "nandi hills": { open: "06:00 AM", close: "06:00 PM", duration: 120, type: "attraction" },
  "mullayanagiri peak": { open: "06:00 AM", close: "06:00 PM", duration: 90, type: "attraction" },
  "hebbe falls": { open: "08:00 AM", close: "04:00 PM", duration: 120, type: "attraction" },
  "baba budangiri": { open: "08:00 AM", close: "05:00 PM", duration: 90, type: "attraction" },
  "ooty botanical gardens": { open: "07:00 AM", close: "06:30 PM", duration: 90, type: "attraction" },
  "doddabetta peak": { open: "09:00 AM", close: "06:00 PM", duration: 60, type: "attraction" },
  "ooty lake": { open: "09:00 AM", close: "06:00 PM", duration: 90, type: "attraction" },

  // Restaurants
  "hotel mylari": { open: "07:00 AM", close: "10:00 PM", duration: 45, type: "restaurant" },
  "gufha restaurant": { open: "12:00 PM", close: "11:00 PM", duration: 60, type: "restaurant" },
  "the olive garden": { open: "11:00 AM", close: "10:30 PM", duration: 60, type: "restaurant" },
  "coorg cuisine": { open: "12:00 PM", close: "10:00 PM", duration: 50, type: "restaurant" },
  "raintree restaurant": { open: "12:00 PM", close: "10:30 PM", duration: 60, type: "restaurant" },
  "east end hotel": { open: "11:30 AM", close: "10:00 PM", duration: 45, type: "restaurant" },
  "vidyarthi bhavan": { open: "06:30 AM", close: "11:30 AM", duration: 45, type: "restaurant" },
  "toit brewpub": { open: "12:00 PM", close: "11:30 PM", duration: 90, type: "restaurant" },
  "nagarjuna restaurant": { open: "12:00 PM", close: "04:00 PM", duration: 60, type: "restaurant" },
  "town house restaurant": { open: "07:00 AM", close: "10:00 PM", duration: 45, type: "restaurant" },
  "the peeriot": { open: "11:00 AM", close: "10:30 PM", duration: 60, type: "restaurant" },
  "odyssey restaurant": { open: "12:00 PM", close: "10:30 PM", duration: 60, type: "restaurant" },
  "shinkows chinese restaurant": { open: "11:30 AM", close: "10:00 PM", duration: 60, type: "restaurant" },
  "place to bee": { open: "11:00 AM", close: "09:30 PM", duration: 50, type: "restaurant" },
  "earl's secret": { open: "12:00 PM", close: "10:00 PM", duration: 75, type: "restaurant" },

  // Rest Stops
  "highway nest food plaza": { open: "07:00 AM", close: "11:00 PM", duration: 30, type: "restStop" },
  "cafe coffee day - highway stop": { open: "24 hours", duration: 30, type: "restStop" },
  "coorg spices hub & cafe": { open: "08:00 AM", close: "08:00 PM", duration: 45, type: "restStop" },
  "cafe coffee day": { open: "24 hours", duration: 30, type: "restStop" },
  "shell select lounge": { open: "24 hours", duration: 20, type: "restStop" },
  "a2b adyar ananda bhavan": { open: "06:30 AM", close: "10:30 PM", duration: 35, type: "restStop" },
  "ccd - global village road": { open: "07:00 AM", close: "11:00 PM", duration: 30, type: "restStop" },
  "hassan highway food plaza": { open: "06:00 AM", close: "11:00 PM", duration: 35, type: "restStop" },
  "hill view tea stop": { open: "07:00 AM", close: "07:00 PM", duration: 25, type: "restStop" },
  "nilgiri highway nest": { open: "06:00 AM", close: "10:00 PM", duration: 30, type: "restStop" }
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

// Check if a place is open at arrival time and stays open throughout duration
export function isPlaceOpen(placeName, arrivalTime, durationMinutes) {
  const specs = getLocalSpecs(placeName);
  if (specs.open === "24 hours") return true;

  const arrivalMins = timeToMinutes(arrivalTime);
  const departureMins = arrivalMins + durationMinutes;

  const openMins = timeToMinutes(specs.open);
  const closeMins = timeToMinutes(specs.close);

  return arrivalMins >= openMins && departureMins <= closeMins;
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
    const specs = getLocalSpecs(waypoint.place);
    const duration = specs.duration !== undefined ? specs.duration : 60;
    const openVal = isPlaceOpen(waypoint.place, arrivalTime, duration);
    if (!openVal) {
      return {
        valid: false,
        reason: "PLACE_CLOSED",
        message: `${waypoint.place} is closed at ${arrivalTime}. Opening hours: ${specs.open} - ${specs.close}.`
      };
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
    "PLACE_CLOSED": "Target destination is closed at selected timing."
  };
  return messages[reason] || "Schedule validation conflict.";
}
