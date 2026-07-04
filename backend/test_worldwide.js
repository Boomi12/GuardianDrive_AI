import { generateAccurateItinerary, validateTimeline, autoRepairTimeline } from './utils/timePlanner.js';
import { getPlaceDetails, getRouteDistanceMatrix } from './utils/googleMaps.js';
import { getWeatherData } from './utils/weather.js';

async function runWorldwideTests() {
  console.log('==================================================');
  console.log('   Worldwide travel Curation & Curation agent Tests');
  console.log('==================================================');

  // Test 1: Autocomplete details and weather seed fallback for London
  console.log('\n--- 1. Testing Place Details & Weather for London ---');
  const details = await getPlaceDetails('mock_london');
  console.log('Resolved details for London:', {
    name: details?.name,
    coords: { lat: details?.lat, lng: details?.lng },
    rating: details?.rating,
    hours: details?.opening_hours
  });

  const weather = await getWeatherData(details?.lat, details?.lng, 'London');
  console.log('Resolved Weather for London:', {
    temp: weather.temperature,
    condition: weather.condition,
    description: weather.description,
    wind: weather.windSpeed
  });

  // Test 2: Multi-day Travel Curation (Bangalore -> Mysore, 3 Days, Balanced Style)
  console.log('\n--- 2. Testing 3-Day Itinerary Curation (Bangalore -> Mysore) ---');
  const multiDayItin = generateAccurateItinerary({
    source: 'Bangalore',
    destination: 'Mysore',
    tripDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toLocaleDateString('en-CA'),
    startTime: '09:00 AM',
    tripType: 'Family',
    foodPreference: 'Any',
    budget: 'Medium',
    vehicleType: 'EV',
    durationDays: 3,
    tripStyle: 'Balanced',
    interests: ['Heritage', 'Nature'],
    sourceCoords: { lat: 12.9716, lng: 77.5946 },
    destinationCoords: { lat: 12.2958, lng: 76.6394 }
  });

  console.log(`Generated timeline waypoints count: ${multiDayItin.length}`);
  const daysInTimeline = [...new Set(multiDayItin.map(t => t.day || 1))];
  console.log('Days distributed in timeline:', daysInTimeline);
  
  // Print some events from each day
  for (const d of daysInTimeline) {
    const dayEvents = multiDayItin.filter(t => (t.day || 1) === d);
    console.log(`Day ${d} has ${dayEvents.length} events:`);
    dayEvents.forEach(e => {
      console.log(`  - [${e.time} - ${e.endTime}] ${e.place} (${e.purpose})`);
    });
  }

  // Test 3: Auto-Repair timeline validation & reschedule options
  console.log('\n--- 3. Testing Auto-Repair Timeline (Closing Hours Conflict) ---');
  // Create a timeline where:
  // 1. Depart source at 09:00 AM
  // 2. Mysore Palace at 11:00 AM (Open, closes 5:30 PM)
  // 3. Karanji Lake at 07:00 PM (Closed! Closes at 5:30 PM)
  // 4. Chamundi Hill Temple at 03:00 PM (Open, closes 9:00 PM)
  // Swapping Karanji Lake (07:00 PM) and Chamundi Hill Temple (03:00 PM) makes both valid!
  const conflictedTimeline = [
    {
      day: 1,
      time: '06:00 AM',
      endTime: '06:00 AM',
      place: 'Start from Bangalore',
      purpose: 'Departure',
      reason: 'Begin trip.',
      lat: 12.9716,
      lng: 77.5946
    },
    {
      day: 1,
      time: '11:00 AM',
      endTime: '01:00 PM',
      place: 'Mysore Palace',
      purpose: 'Sightseeing',
      reason: 'Majestic heritage spot.',
      lat: 12.3051,
      lng: 76.6551
    },
    {
      day: 1,
      time: '03:00 PM',
      endTime: '04:30 PM',
      place: 'Chamundi Hill Temple',
      purpose: 'Sightseeing',
      reason: 'Beautiful views.',
      lat: 12.2748,
      lng: 76.6710
    },
    {
      day: 1,
      time: '07:00 PM', // Conflicted: Karanji Lake closes at 5:30 PM!
      place: 'Karanji Lake',
      purpose: 'Sightseeing',
      reason: 'Serene lake view.',
      lat: 12.3025,
      lng: 76.6744
    }
  ];

  const tripDetails = {
    source: 'Bangalore',
    destination: 'Mysore',
    startTime: '06:00 AM',
    tripDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toLocaleDateString('en-CA'),
    sourceCoords: { lat: 12.9716, lng: 77.5946 },
    destinationCoords: { lat: 12.2958, lng: 76.6394 },
    durationDays: 3
  };

  const validationResult = validateTimeline(conflictedTimeline, tripDetails);
  console.log('Initial validation success (Should be false):', validationResult.success);
  console.log('Validation Warning message:', validationResult.timeline[3]?.warning);

  console.log('\nRunning Auto-Repair Solver...');
  
  // Debug swapped timeline validation
  const debugTimeline = [...conflictedTimeline.map(item => ({ ...item }))];
  const temp = debugTimeline[3];
  debugTimeline[3] = debugTimeline[2];
  debugTimeline[2] = temp;
  
  // Also swap their scheduled times!
  const tempTime = debugTimeline[3].time;
  debugTimeline[3].time = debugTimeline[2].time;
  debugTimeline[2].time = tempTime;
  
  const debugVal = validateTimeline(debugTimeline, tripDetails);
  console.log('Swapped timeline validation success:', debugVal.success);
  console.log('Swapped timeline events warnings:');
  debugVal.timeline.forEach(e => {
    console.log(`  - ${e.place} at ${e.time}: warning = ${e.warning}`);
  });

  const repairResult = autoRepairTimeline(conflictedTimeline, tripDetails);
  console.log('Auto-Repair Solver success:', repairResult.success);
  console.log('Is auto-applied directly?', repairResult.autoApplied);
  if (repairResult.suggestions && repairResult.suggestions.length > 0) {
    console.log(`Found ${repairResult.suggestions.length} alternative solutions:`);
    repairResult.suggestions.forEach((s, idx) => {
      console.log(`  Option [${s.option}]: ${s.description}`);
      console.log('    Timeline after fix:');
      s.timeline.forEach(e => {
        console.log(`      - [${e.time}] ${e.place}`);
      });
    });
  } else if (repairResult.autoApplied) {
    console.log('Auto-applied fix description:', repairResult.autoFixMessage);
    console.log('Repaired Timeline:');
    repairResult.timeline.forEach(e => {
      console.log(`  - [${e.time}] ${e.place} ${e.autoFixed ? '(*Fixed*)' : ''}`);
    });
  }

  console.log('\n==================================================');
  console.log('      WORLDWIDE TRAVEL TESTS COMPLETED!');
  console.log('==================================================');
}

runWorldwideTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
