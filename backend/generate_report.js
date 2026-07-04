import { generateAccurateItinerary, getTravelTime, getPlaceSpecs, minutesToTime, timeToMinutes } from './utils/timePlanner.js';
import fs from 'fs';

function generateReport() {
  const source = 'Bangalore';
  const destination = 'Mysore';
  const startTime = '06:00 AM';
  const tripDate = '2026-06-24';

  const itin = generateAccurateItinerary({
    source,
    destination,
    startTime,
    tripDate,
    tripType: 'Family',
    foodPreference: 'Any',
    budget: 'Medium',
    vehicleType: 'EV',
    fuelOrBatteryLevel: 85,
    mileageOrRange: 340
  });

  // Calculate destination arrival time
  const arrivalStop = itin.find(item => item.purpose === 'Arrival' || item.place.startsWith('Arrive in'));
  const destinationArrival = arrivalStop ? arrivalStop.time : 'N/A';

  // Driving duration
  const travelToRest = getTravelTime(source, 'Highway Nest Food Plaza', source, destination);
  const travelToDest = getTravelTime('Highway Nest Food Plaza', destination, source, destination);
  const totalDrivingDuration = travelToRest + travelToDest;
  const totalDrivingStr = `${Math.floor(totalDrivingDuration / 60)}h ${totalDrivingDuration % 60}m`;

  // Restaurant Arrival Window
  const preferredRestaurant = 'Hotel Mylari';
  const restaurantSpecs = getPlaceSpecs(preferredRestaurant);
  const transitToRestaurant = getTravelTime(destination, preferredRestaurant, source, destination);
  
  // Earliest arrival is destination arrival time + transit to restaurant
  const destinationArrivalMins = timeToMinutes(destinationArrival);
  const earliestArrivalMins = destinationArrivalMins + transitToRestaurant;
  const earliestArrivalStr = minutesToTime(earliestArrivalMins);
  
  // Latest arrival is restaurant closing time
  const latestArrivalStr = restaurantSpecs.close || '10:00 PM';

  const report = `=== GUARDIANDRIVE AI ITINERARY SCHEDULING REPORT ===
Trip Route:         ${source} -> ${destination}
Start Time:         ${startTime}
Travel Duration:    ${totalDrivingStr} (${totalDrivingDuration} mins driving)
Destination Arrival:${destinationArrival}

--- Restaurant Selection Details ---
Preferred Restaurant: ${preferredRestaurant}
Restaurant Closing:   ${latestArrivalStr}
Transit to Restaurant: ${transitToRestaurant} mins
Restaurant Arrival Window: ${earliestArrivalStr} to ${latestArrivalStr}
====================================================
`;

  console.log(report);
  fs.writeFileSync('itinerary_test_report.txt', report);
  console.log('Report written to itinerary_test_report.txt');
}

generateReport();
