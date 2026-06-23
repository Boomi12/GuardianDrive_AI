// Time calculations and validation helper
import { mockDestinations, defaultMockDestination } from './mockData.js';

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

// Predefined places database with open, close, visitDuration, type, etc.
export const PLACE_DATABASE = {
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
  "nandi hills": { open: "06:00 AM", close: "06:00 PM", duration: 120, type: "attraction", bestTime: "morning" },
  
  "mullayanagiri peak": { open: "06:00 AM", close: "06:00 PM", duration: 90, type: "attraction", bestTime: "morning" },
  "hebbe falls": { open: "08:00 AM", close: "04:00 PM", duration: 120, type: "attraction" },
  "baba budangiri": { open: "08:00 AM", close: "05:00 PM", duration: 90, type: "attraction" },
  
  "ooty botanical gardens": { open: "07:00 AM", close: "06:30 PM", duration: 90, type: "attraction" },
  "doddabetta peak": { open: "09:00 AM", close: "06:00 PM", duration: 60, type: "attraction" },
  "ooty lake": { open: "09:00 AM", close: "06:00 PM", duration: 90, type: "attraction" },

  // Restaurants
  "hotel mylari": { open: "07:00 AM", close: "10:00 PM", duration: 45, type: "restaurant", mealType: "breakfast/lunch/dinner" },
  "gufha restaurant": { open: "12:00 PM", close: "11:00 PM", duration: 60, type: "restaurant", mealType: "lunch/dinner" },
  "the olive garden": { open: "11:00 AM", close: "10:30 PM", duration: 60, type: "restaurant", mealType: "lunch/dinner" },
  "coorg cuisine": { open: "12:00 PM", close: "10:00 PM", duration: 50, type: "restaurant", mealType: "lunch/dinner" },
  "raintree restaurant": { open: "12:00 PM", close: "10:30 PM", duration: 60, type: "restaurant", mealType: "lunch/dinner" },
  "east end hotel": { open: "11:30 AM", close: "10:00 PM", duration: 45, type: "restaurant", mealType: "lunch/dinner" },
  "vidyarthi bhavan": { open: "06:30 AM", close: "11:30 AM", duration: 45, type: "restaurant", mealType: "breakfast" },
  "toit brewpub": { open: "12:00 PM", close: "11:30 PM", duration: 90, type: "restaurant", mealType: "dinner" },
  "nagarjuna restaurant": { open: "12:00 PM", close: "04:00 PM", duration: 60, type: "restaurant", mealType: "lunch" },
  "town house restaurant": { open: "07:00 AM", close: "10:00 PM", duration: 45, type: "restaurant", mealType: "breakfast/lunch/dinner" },
  "the peeriot": { open: "11:00 AM", close: "10:30 PM", duration: 60, type: "restaurant", mealType: "lunch/dinner" },
  "odyssey restaurant": { open: "12:00 PM", close: "10:30 PM", duration: 60, type: "restaurant", mealType: "lunch/dinner" },
  "shinkows chinese restaurant": { open: "11:30 AM", close: "10:00 PM", duration: 60, type: "restaurant", mealType: "lunch/dinner" },
  "place to bee": { open: "11:00 AM", close: "09:30 PM", duration: 50, type: "restaurant", mealType: "lunch/dinner" },
  "earl's secret": { open: "12:00 PM", close: "10:00 PM", duration: 75, type: "restaurant", mealType: "lunch/dinner" },

  // Rest Stops
  "highway nest food plaza": { open: "07:00 AM", close: "11:00 PM", duration: 30, type: "restStop", mealType: "breakfast/snack" },
  "cafe coffee day - highway stop": { open: "24 hours", duration: 30, type: "restStop" },
  "coorg spices hub & cafe": { open: "08:00 AM", close: "08:00 PM", duration: 45, type: "restStop" },
  "cafe coffee day": { open: "24 hours", duration: 30, type: "restStop" },
  "shell select lounge": { open: "24 hours", duration: 20, type: "restStop" },
  "a2b adyar ananda bhavan": { open: "06:30 AM", close: "10:30 PM", duration: 35, type: "restStop" },
  "ccd - global village road": { open: "07:00 AM", close: "11:00 PM", duration: 30, type: "restStop" },
  "hassan highway food plaza": { open: "06:00 AM", close: "11:00 PM", duration: 35, type: "restStop" },
  "hill view tea stop": { open: "07:00 AM", close: "07:00 PM", duration: 25, type: "restStop" },
  "nilgiri highway nest": { open: "06:00 AM", close: "10:00 PM", duration: 30, type: "restStop" },

  // Halts
  "the windflower resort & spa": { open: "24 hours", duration: 480, type: "lodging" },
  "radisson blu plaza hotel": { open: "24 hours", duration: 480, type: "lodging" },
  "the tamara coorg": { open: "24 hours", duration: 480, type: "lodging" },
  "club mahindra madikeri": { open: "24 hours", duration: 480, type: "lodging" },
  "taj west end": { open: "24 hours", duration: 480, type: "lodging" },
  "itc gardenia": { open: "24 hours", duration: 480, type: "lodging" },
  "the serai chikkamagaluru": { open: "24 hours", duration: 480, type: "lodging" },
  "trivik hotels & resorts": { open: "24 hours", duration: 480, type: "lodging" },
  "savoy - ihcl seleqtions": { open: "24 hours", duration: 480, type: "lodging" },
  "destiny the farmstay": { open: "24 hours", duration: 480, type: "lodging" }
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
    return 180; // default 3h
  }

  // Highway stop checks
  const isHighwayStop = (name) => {
    return name.includes("highway") || name.includes("plaza") || name.includes("food court") || name.includes("coffee day") || name.includes("spices hub") || name.includes("shell select") || name.includes("a2b");
  };

  if (isFromSrc && isHighwayStop(t)) {
    if (src.includes("bangalore") && dst.includes("mysore")) return 90; 
    if (src.includes("bangalore") && dst.includes("coorg")) return 150;
    if (src.includes("bangalore") && dst.includes("ooty")) return 180;
    if (src.includes("bangalore") && dst.includes("chikkamagaluru")) return 130;
    return 90;
  }

  if (isHighwayStop(f) && isToDst) {
    if (src.includes("bangalore") && dst.includes("mysore")) return 105; 
    if (src.includes("bangalore") && dst.includes("coorg")) return 180;
    if (src.includes("bangalore") && dst.includes("ooty")) return 195;
    if (src.includes("bangalore") && dst.includes("chikkamagaluru")) return 155;
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

// Format duration to string
export function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins === 0 ? `${hrs}h` : `${hrs}h ${remainingMins}m`;
}

// Check if a place is open at arrival time and stays open throughout duration
export function checkOpeningHours(placeName, arrivalTime, durationMinutes) {
  const specs = getPlaceSpecs(placeName);
  if (specs.open === "24 hours") return true;

  const arrivalMins = timeToMinutes(arrivalTime);
  const departureMins = arrivalMins + durationMinutes;

  const openMins = timeToMinutes(specs.open);
  const closeMins = timeToMinutes(specs.close);

  return arrivalMins >= openMins && departureMins <= closeMins;
}

// Calculate earliest possible arrival
export function calculateEarliestArrival(prevPlace, currentPlace, prevEndTime, source, destination) {
  const transit = getTravelTime(prevPlace, currentPlace, source, destination);
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
      const travel = getTravelTime(prevPlace, item.place, source, destination);
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
    const travelTime = getTravelTime(previousWaypoint.place, waypoint.place, source, destination);
    const earliestArrivalStr = calculateEarliestArrival(previousWaypoint.place, waypoint.place, previousWaypoint.endTime || previousWaypoint.time, source, destination);
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
    const travelToNext = getTravelTime(waypoint.place, nextWaypoint.place, source, destination);
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
    const specs = getPlaceSpecs(waypoint.place);
    const duration = specs.duration !== undefined ? specs.duration : 60;
    const isOpen = checkOpeningHours(waypoint.place, arrivalTime, duration);
    if (!isOpen) {
      const nextSlot = suggestNextAvailableSlot(waypoint.place, arrivalMins);
      return {
        valid: false,
        reason: "PLACE_CLOSED",
        message: `${waypoint.place} is closed at ${arrivalTime}. Opening hours: ${specs.open} - ${specs.close}. Suggested next opening: ${nextSlot}.`
      };
    }
  }

  return { valid: true };
}

// Generate accurate itinerary
export function generateAccurateItinerary(input) {
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
    mileageOrRange = 340
  } = input;

  const key = destination.toLowerCase().trim();
  const destData = mockDestinations[key] || defaultMockDestination;

  const timeline = [];
  let currentTime = timeToMinutes(startTime);

  console.log(`[DEBUG] Selected start time: ${startTime}`);
  console.log(`[DEBUG] Parsed start time: ${currentTime} mins`);

  // 1. Departure from Source
  timeline.push({
    time: startTime,
    endTime: minutesToTime(currentTime),
    place: source.startsWith("Start from") ? source : `Start from ${source}`,
    purpose: "Departure",
    reason: "Begin your road trip journey with optimized twin safety route mapping.",
    travelTimeFromPrevious: "0m",
    isOpen: true,
    warning: null
  });

  const isEV = vehicleType?.toUpperCase() === 'EV';
  let activeRange = mileageOrRange * (fuelOrBatteryLevel / 100);
  let totalTravelMinutes = 0;

  // Let's get route travel time
  const mainTravelTime = getTravelTime(source, destination, source, destination);

  // Midpoint rest stop
  const restStopName = destData.restStops?.[0]?.name || "Highway Nest Food Plaza";
  const restStopSpecs = getPlaceSpecs(restStopName);
  
  const travelToRest = getTravelTime(source, restStopName, source, destination);
  totalTravelMinutes += travelToRest;
  activeRange -= (travelToRest / 60) * 60; 

  currentTime += travelToRest;
  
  // 2. Rest / Coffee stop
  const restStopArrival = currentTime;
  const restStopOpen = checkOpeningHours(restStopName, minutesToTime(restStopArrival), restStopSpecs.duration);
  
  timeline.push({
    time: minutesToTime(restStopArrival),
    endTime: minutesToTime(restStopArrival + restStopSpecs.duration),
    place: restStopName,
    purpose: "Rest & Coffee",
    reason: `Stop for refreshments and clean amenities. Essential for safety to prevent fatigue after ${formatMinutes(travelToRest)} driving.`,
    travelTimeFromPrevious: formatMinutes(travelToRest),
    isOpen: restStopOpen,
    warning: restStopOpen ? null : `${restStopName} is closed at this time (${minutesToTime(restStopArrival)}).`
  });

  currentTime += restStopSpecs.duration;

  // EV charging/refueling stop if battery/fuel is low
  if (activeRange < 80) {
    const charger = destData.fuelChargingStops?.[0] || { name: isEV ? "Tata Power EV Fast Charger" : "HP Fuel Station" };
    const travelToCharge = 15;
    currentTime += travelToCharge;
    timeline.push({
      time: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + 25),
      place: charger.name,
      purpose: isEV ? "EV Charging" : "Refuel Stop",
      reason: `Warning: Range is low (${Math.round(activeRange)}km). Top up energy level to prevent route breakdown risks.`,
      travelTimeFromPrevious: formatMinutes(travelToCharge),
      isOpen: true,
      warning: null
    });
    currentTime += 25;
    activeRange = mileageOrRange * 0.9;
  }

  // 3. Arrive at Destination
  const travelToDest = getTravelTime(restStopName, destination, source, destination);
  totalTravelMinutes += travelToDest;
  currentTime += travelToDest;
  activeRange -= (travelToDest / 60) * 60;

  const preferredRestaurant = destData.restaurants?.[0]?.name || "Local Dine";
  const restaurantSpecs = getPlaceSpecs(preferredRestaurant);
  const isLunchTime = currentTime >= timeToMinutes("12:00 PM") && currentTime <= timeToMinutes("02:30 PM");

  if (isLunchTime) {
    timeline.push({
      time: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + restaurantSpecs.duration),
      place: preferredRestaurant,
      purpose: "Lunch Break",
      reason: `Enjoy local cuisine at highly recommended place in ${destination}.`,
      travelTimeFromPrevious: formatMinutes(travelToDest),
      isOpen: true,
      warning: null
    });
    currentTime += restaurantSpecs.duration;
  } else {
    timeline.push({
      time: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime),
      place: `Arrive in ${destination}`,
      purpose: "Arrival",
      reason: `Successfully arrived in ${destination} following a safe digital-twin monitored drive.`,
      travelTimeFromPrevious: formatMinutes(travelToDest),
      isOpen: true,
      warning: null
    });
  }

  // 4. Attractions Loop
  const attractions = destData.attractions || [];
  let currentLoc = destination;

  attractions.forEach((att) => {
    const specs = getPlaceSpecs(att.name);
    const localTransit = getTravelTime(currentLoc, att.name, source, destination);
    currentTime += localTransit;
    
    const isOpen = checkOpeningHours(att.name, minutesToTime(currentTime), specs.duration || 60);
    
    let warning = null;
    if (!isOpen) {
      const nextSlot = suggestNextAvailableSlot(att.name, currentTime);
      warning = `${att.name} is closed at ${minutesToTime(currentTime)}. Opening hours: ${specs.open} - ${specs.close}. Suggested next open: ${nextSlot}.`;
    }

    timeline.push({
      time: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + specs.duration),
      place: att.name,
      purpose: specs.type === "attraction" ? "Sightseeing" : specs.type,
      reason: att.description || "Top rated local sight.",
      travelTimeFromPrevious: formatMinutes(localTransit),
      isOpen: isOpen,
      warning: warning
    });

    currentTime += specs.duration;
    currentLoc = att.name;
  });

  // 5. Lodging / Hotel Check-in
  const hotel = destData.haltingPlaces?.[0]?.name || "Resort & Spa";
  const hotelTransit = getTravelTime(currentLoc, hotel, source, destination);
  currentTime += hotelTransit;

  timeline.push({
    time: minutesToTime(currentTime),
    endTime: minutesToTime(currentTime + 120),
    place: hotel,
    purpose: "Resort Check-in",
    reason: "Unpack, refresh, and settle down at your overnight stay lodging.",
    travelTimeFromPrevious: formatMinutes(hotelTransit),
    isOpen: true,
    warning: null
  });

  return timeline;
}

// Validate entire itinerary
export function validateItinerary(itinerary) {
  const { timeline, source, destination, startTime, tripDate } = itinerary;
  
  // Trip date check
  if (isPastDate(tripDate)) {
    return { success: false, reason: "PAST_DATE", message: "Invalid date: Trip date cannot be in the past." };
  }
  
  if (startTime && isPastTimeToday(tripDate, startTime)) {
    return { success: false, reason: "PAST_TIME", message: "Invalid time: Start time cannot be earlier than the current time." };
  }

  const validation = validateTimeline(timeline, { source, destination, startTime });
  return {
    success: validation.success,
    timeline: validation.timeline,
    overallWarning: validation.overallWarning
  };
}

// Validate timeline sequence
export function validateTimeline(timeline, tripDetails) {
  const { source, destination, startTime = "09:00 AM" } = tripDetails;
  
  if (!timeline || timeline.length === 0) {
    return { success: true, timeline: [], overallWarning: null };
  }

  console.log(`[DEBUG] Generated first waypoint time: ${timeline[0]?.time}`);

  const validated = [];
  let currentTime = timeToMinutes(startTime);
  let previousPlace = source;
  let totalDrivingTime = 0;
  let timeSinceLastBreak = 0;
  let overallWarning = null;

  for (let i = 0; i < timeline.length; i++) {
    const item = { ...timeline[i] };
    const specs = getPlaceSpecs(item.place);
    
    let transit = 0;
    if (i > 0) {
      transit = getTravelTime(previousPlace, item.place, source, destination);
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

    const isInsideHours = i === 0 ? true : checkOpeningHours(item.place, item.time, duration);
    item.isOpen = isInsideHours;

    if (i > 0 && !isInsideHours && !item.warning) {
      const nextSlot = suggestNextAvailableSlot(item.place, currentTime);
      item.warning = `${item.place} is closed at ${item.time}. Opening hours: ${specs.open} - ${specs.close}. Suggested next open: ${nextSlot}.`;
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

  const success = !validated.some(v => v.warning?.includes("Invalid timing") || v.warning?.includes("closed"));
  return {
    success,
    timeline: validated,
    overallWarning
  };
}
