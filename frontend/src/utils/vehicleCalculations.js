/**
 * Local vehicle performance calculations to act as a fallback 
 * if the backend server or MongoDB database is unreachable.
 */

// 1. Calculate Range and stops
export const localCalculateRange = (inputs) => {
  const { vehicleType, tripDistance, batteryPercentage, batteryCapacity, vehicleEfficiency, fuelLevel, mileage } = inputs;

  let estimatedRange = 0;
  let remainingFuelOrBattery = 0;

  if (vehicleType === 'EV') {
    const energyAvailable = (batteryPercentage / 100) * batteryCapacity;
    estimatedRange = energyAvailable * vehicleEfficiency;
    remainingFuelOrBattery = Math.max(0, batteryPercentage - (tripDistance / (batteryCapacity * vehicleEfficiency)) * 100);
  } else {
    estimatedRange = fuelLevel * mileage;
    remainingFuelOrBattery = Math.max(0, fuelLevel - (tripDistance / mileage));
  }

  const isTripPossible = estimatedRange >= tripDistance;
  let stopsRequired = 0;

  if (!isTripPossible) {
    if (vehicleType === 'EV') {
      const fullRange = batteryCapacity * vehicleEfficiency;
      const deficit = tripDistance - estimatedRange;
      stopsRequired = Math.ceil(deficit / (fullRange * 0.8));
    } else {
      const fullFuelStopRange = 40 * mileage;
      const deficit = tripDistance - estimatedRange;
      stopsRequired = Math.ceil(deficit / fullFuelStopRange);
    }
  }

  return {
    estimatedRange: Math.round(estimatedRange * 100) / 100,
    isTripPossible,
    stopsRequired,
    remainingFuelOrBattery: Math.round(remainingFuelOrBattery * 100) / 100,
    tripSafetyStatus: isTripPossible ? 'SAFE TO CONTINUE' : 'STOPS REQUIRED'
  };
};

// 2. Predict battery health
export const localPredictBatteryHealth = (inputs) => {
  const { batteryPercentage, usagePattern, rangeEfficiency, chargingNeed } = inputs;

  let score = 100;

  if (usagePattern === 'Sport') {
    score -= 12;
  } else if (usagePattern === 'Normal') {
    score -= 3;
  }

  if (rangeEfficiency !== undefined && rangeEfficiency > 0) {
    if (rangeEfficiency < 4) {
      score -= 15;
    } else if (rangeEfficiency < 5.5) {
      score -= 8;
    }
  }

  if (chargingNeed === 'Frequent Fast Charging') {
    score -= 10;
  } else if (chargingNeed === 'Balanced') {
    score -= 2;
  }

  if (batteryPercentage < 15 || batteryPercentage > 95) {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  let status = 'Excellent';
  if (score >= 90) status = 'Excellent';
  else if (score >= 75) status = 'Good';
  else if (score >= 50) status = 'Moderate';
  else status = 'Needs Attention';

  return {
    batteryHealthScore: score,
    batteryHealthStatus: status
  };
};

// 3. Diagnose Mileage Performance
export const localDiagnoseMileage = (vehicleType, mileage) => {
  let performance = 'Average';
  if (vehicleType === 'EV') {
    if (mileage >= 7) performance = 'Excellent';
    else if (mileage >= 5.5) performance = 'Good';
    else if (mileage >= 4) performance = 'Average';
    else performance = 'Poor';
  } else {
    if (mileage >= 18) performance = 'Excellent';
    else if (mileage >= 14) performance = 'Good';
    else if (mileage >= 10) performance = 'Average';
    else performance = 'Poor';
  }

  const suggestions = [
    'Maintain Tyre Pressure: Keep tyres inflated to the recommended pressure (typically 32-35 PSI). Under-inflated tyres can increase fuel consumption by 10%, cutting down your range.',
    'Avoid Harsh Acceleration: Aggressive throttling and sudden braking burn fuel and battery power rapidly. Smooth accelerations can increase efficiency by up to 20%.',
    'Regular Vehicle Servicing: Ensure clean air filters, properly tuned spark plugs, and fresh lubricants (or EV cooling checks) to keep mechanical drag minimal.',
    'Reduce Overload & Roof Racks: Drag and weight are exponential efficiency killers. Remove cargo roof-carriers and heavy trunk clutter when not actively needed.'
  ];

  return {
    mileagePerformance: performance,
    mileageSuggestions: suggestions
  };
};

// 4. Suggest mock stops
export const localSuggestStops = (vehicleType, tripDistance, estimatedRange) => {
  const stops = [];
  const isPossible = estimatedRange >= tripDistance;

  if (!isPossible && estimatedRange > 0) {
    const interval = Math.round(estimatedRange * 0.8);
    let currentDistance = interval;
    let count = 1;

    while (currentDistance < tripDistance) {
      if (vehicleType === 'EV') {
        stops.push({
          name: `GuardianDrive Charger Hub ${String.fromCharCode(64 + count)}`,
          distance: currentDistance,
          type: 'EV Charging Station (150kW DC Fast)'
        });
      } else {
        stops.push({
          name: `Highway Fuel Stop & Food Plaza ${String.fromCharCode(64 + count)}`,
          distance: currentDistance,
          type: `${vehicleType} Fuel Station & Convenience Store`
        });
      }
      currentDistance += interval;
      count++;
    }
  }

  return {
    suggestedStops: stops
  };
};
