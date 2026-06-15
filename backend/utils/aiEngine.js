import { mockDestinations, defaultMockDestination } from './mockData.js';

export function evaluateAgents(twinState, itinerary) {
  const { driverTwin, vehicleTwin, journeyTwin } = twinState;
  const { destination = '', foodPreference = '', budget = '', vehicleType = 'EV' } = itinerary || {};

  const destKey = destination.toLowerCase().trim();
  const destData = mockDestinations[destKey] || defaultMockDestination;

  // 1. Safety Agent
  let safetyStatus = 'Optimal';
  let safetyRec = 'Driver alert level is nominal. Safe driving habits maintained.';
  let safetyConfidence = 98;

  if (driverTwin.fatigueLevel > 70) {
    safetyStatus = 'Warning';
    safetyRec = `High driver fatigue detected (${driverTwin.fatigueLevel}%). Please pull over at the nearest rest stop immediately for a 20-minute break.`;
    safetyConfidence = 96;
  } else if (driverTwin.distractionStatus === 'distracted') {
    safetyStatus = 'Warning';
    safetyRec = 'Driver distraction detected (lack of forward focus). Eyes off road! Recommending haptic steering alert.';
    safetyConfidence = 90;
  } else if (driverTwin.breakNeeded) {
    safetyStatus = 'Caution';
    safetyRec = 'Continuous driving exceeds 3 hours. Recommending a brief stretch break at the next toll depot.';
    safetyConfidence = 85;
  }

  // 2. Route Agent
  let routeStatus = 'Optimal';
  let routeRec = 'Active route is clear and optimal. No congestion or weather disruptions reported ahead.';
  let routeConfidence = 95;

  if (journeyTwin.traffic === 'heavy') {
    routeStatus = 'Alert';
    routeRec = 'Heavy traffic congestion ahead. Recalculated alternative bypass route to save 18 minutes of transit.';
    routeConfidence = 92;
  } else if (journeyTwin.weather === 'rain' || journeyTwin.weather === 'fog' || journeyTwin.weather === 'snow') {
    routeStatus = 'Caution';
    routeRec = `Adverse weather (${journeyTwin.weather}) detected. Activating low-speed route options avoiding steep slopes and slip hazards.`;
    routeConfidence = 89;
  }

  // 3. Fuel/EV Agent
  let fuelStatus = 'Optimal';
  let fuelRec = `Fuel/Battery level (${vehicleTwin.fuelOrBatteryLevel}%) is sufficient for the upcoming segment of the journey.`;
  let fuelConfidence = 94;

  const isEV = vehicleTwin.vehicleType.toUpperCase() === 'EV';
  if (isEV) {
    if (vehicleTwin.fuelOrBatteryLevel < 30) {
      fuelStatus = 'Critical';
      const evCharger = destData.fuelChargingStops.find(s => s.type === 'EV') || { name: 'Vite Fast Charger' };
      fuelRec = `Battery level low (${vehicleTwin.fuelOrBatteryLevel}%). Recommending fast-charging stop: "${evCharger.name}" located nearby.`;
      fuelConfidence = 97;
    }
  } else {
    // Petrol, Diesel, Hybrid
    if (vehicleTwin.fuelOrBatteryLevel < 20 || vehicleTwin.range < 120) {
      fuelStatus = 'Critical';
      const fuelPump = destData.fuelChargingStops.find(s => s.type === 'Fuel') || { name: 'Highway Fuel Station' };
      fuelRec = `Fuel level critically low (${vehicleTwin.fuelOrBatteryLevel}% / Range: ${vehicleTwin.range}km). Stop at "${fuelPump.name}" in 12km.`;
      fuelConfidence = 95;
    }
  }

  // 4. Journey Agent
  // Customizes based on destination mock data, foodPreference, and budget
  const preferredRestaurant = destData.restaurants.find(r => {
    const isBudgetMatch = budget.toLowerCase() === 'high' ? r.budget === 'High' : (budget.toLowerCase() === 'low' ? r.budget === 'Low' : r.budget !== 'High');
    const isCuisineMatch = foodPreference.toLowerCase() === 'any' || r.cuisine.toLowerCase().includes(foodPreference.toLowerCase());
    return isBudgetMatch || isCuisineMatch;
  }) || destData.restaurants[0];

  const firstAttraction = destData.attractions[0];
  const firstRestStop = destData.restStops[0];

  let journeyStatus = 'Active';
  let journeyRec = `Recommending dynamic stops in ${destData.name}: Visit "${firstAttraction.name}" (${firstAttraction.type}) and dine at "${preferredRestaurant.name}" (${preferredRestaurant.cuisine}).`;
  if (firstRestStop) {
    journeyRec += ` Next rest stop suggestion: "${firstRestStop.name}".`;
  }
  let journeyConfidence = 88;

  // 5. Emergency Agent
  let emergencyStatus = 'Standby';
  let emergencyRec = 'All sensors report stable state. Emergency response protocols are in standby mode.';
  let emergencyConfidence = 95;

  if (journeyTwin.riskLevel === 'critical') {
    emergencyStatus = 'Danger';
    emergencyRec = 'Critical journey risk! SOS triggers armed. Preparing emergency alert dispatch to roadside assistance and selected contacts.';
    emergencyConfidence = 99;
  } else if (vehicleTwin.healthStatus === 'critical') {
    emergencyStatus = 'Danger';
    emergencyRec = 'Critical vehicle engine/battery fault! Pull over safely. Dispatching emergency breakdown service location ping.';
    emergencyConfidence = 98;
  } else if (journeyTwin.riskLevel === 'medium') {
    emergencyStatus = 'Caution';
    emergencyRec = 'Elevated route risks. Automated hazard alerts enabled. emergency hotline speed-dials initialized.';
    emergencyConfidence = 90;
  }

  return {
    safetyAgent: { status: safetyStatus, recommendation: safetyRec, confidenceScore: safetyConfidence },
    routeAgent: { status: routeStatus, recommendation: routeRec, confidenceScore: routeConfidence },
    fuelEvAgent: { status: fuelStatus, recommendation: fuelRec, confidenceScore: fuelConfidence },
    journeyAgent: { status: journeyStatus, recommendation: journeyRec, confidenceScore: journeyConfidence },
    emergencyAgent: { status: emergencyStatus, recommendation: emergencyRec, confidenceScore: emergencyConfidence }
  };
}
