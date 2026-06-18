import VehicleData from '../models/VehicleData.js';

// 1. Calculate driving range and trip feasibility
export const calculateRange = async (req, res) => {
  try {
    const { vehicleType, tripDistance, batteryPercentage, batteryCapacity, vehicleEfficiency, fuelLevel, mileage, tripId } = req.body;

    // Basic common validations
    if (!vehicleType || !['EV', 'Petrol', 'Diesel'].includes(vehicleType)) {
      return res.status(400).json({ error: 'Valid vehicleType is required ("EV", "Petrol", "Diesel")' });
    }
    if (tripDistance === undefined || tripDistance <= 0) {
      return res.status(400).json({ error: 'Trip distance must be greater than 0' });
    }

    let estimatedRange = 0;
    let remainingFuelOrBattery = 0;

    if (vehicleType === 'EV') {
      // Validate EV parameters
      if (batteryPercentage === undefined || batteryPercentage < 0 || batteryPercentage > 100) {
        return res.status(400).json({ error: 'Battery percentage must be between 0 and 100' });
      }
      if (!batteryCapacity || batteryCapacity <= 0) {
        return res.status(400).json({ error: 'Battery capacity must be greater than 0' });
      }
      if (!vehicleEfficiency || vehicleEfficiency <= 0) {
        return res.status(400).json({ error: 'Vehicle efficiency must be greater than 0' });
      }

      // Energy (kWh) = (battery percentage / 100) * battery capacity
      const energyAvailable = (batteryPercentage / 100) * batteryCapacity;
      estimatedRange = energyAvailable * vehicleEfficiency;

      // Remaining battery % = batteryPercentage - (tripDistance / (batteryCapacity * vehicleEfficiency)) * 100
      remainingFuelOrBattery = Math.max(0, batteryPercentage - (tripDistance / (batteryCapacity * vehicleEfficiency)) * 100);
    } else {
      // Validate Petrol/Diesel parameters
      if (fuelLevel === undefined || fuelLevel <= 0) {
        return res.status(400).json({ error: 'Fuel level must be greater than 0' });
      }
      if (!mileage || mileage <= 0) {
        return res.status(400).json({ error: 'Mileage must be greater than 0' });
      }

      estimatedRange = fuelLevel * mileage;
      // Remaining fuel (L) = fuelLevel - (tripDistance / mileage)
      remainingFuelOrBattery = Math.max(0, fuelLevel - (tripDistance / mileage));
    }

    const isTripPossible = estimatedRange >= tripDistance;
    let stopsRequired = 0;

    if (!isTripPossible) {
      if (vehicleType === 'EV') {
        // Assume each stop charges back to 80% of capacity
        const fullRange = batteryCapacity * vehicleEfficiency;
        const deficit = tripDistance - estimatedRange;
        stopsRequired = Math.ceil(deficit / (fullRange * 0.8));
      } else {
        // Assume standard refuel capacity of 40 Litres at each station stop
        const fullFuelStopRange = 40 * mileage;
        const deficit = tripDistance - estimatedRange;
        stopsRequired = Math.ceil(deficit / fullFuelStopRange);
      }
    }

    const tripSafetyStatus = isTripPossible ? 'SAFE TO CONTINUE' : 'STOPS REQUIRED';

    const results = {
      estimatedRange: Math.round(estimatedRange * 100) / 100,
      isTripPossible,
      stopsRequired,
      remainingFuelOrBattery: Math.round(remainingFuelOrBattery * 100) / 100,
      tripSafetyStatus
    };

    // Attempt database persistence (runs in background, errors caught gracefully)
    try {
      const dbEntry = new VehicleData({
        tripId,
        vehicleType,
        inputs: {
          batteryPercentage,
          batteryCapacity,
          vehicleEfficiency,
          fuelLevel,
          mileage,
          tripDistance
        },
        results: {
          estimatedRange: results.estimatedRange,
          isTripPossible: results.isTripPossible,
          stopsRequired: results.stopsRequired,
          remainingFuelOrBattery: results.remainingFuelOrBattery,
          tripSafetyStatus: results.tripSafetyStatus,
          mileagePerformance: 'Pending Diagnostics'
        }
      });
      await dbEntry.save();
    } catch (dbErr) {
      console.warn('Degraded Database State: Could not write telemetry calculation log to MongoDB:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in calculateRange backend controller:', error);
    return res.status(500).json({ error: 'Server error calculating vehicle range capabilities' });
  }
};

// 2. Predict EV battery health
export const predictBatteryHealth = async (req, res) => {
  try {
    const { batteryPercentage, usagePattern, rangeEfficiency, chargingNeed } = req.body;

    if (batteryPercentage === undefined || batteryPercentage < 0 || batteryPercentage > 100) {
      return res.status(400).json({ error: 'Battery percentage must be between 0 and 100' });
    }

    let score = 100;

    // Usage pattern impact on battery longevity
    if (usagePattern === 'Sport') {
      score -= 12;
    } else if (usagePattern === 'Normal') {
      score -= 3;
    }

    // Range efficiency impact (low efficiency indicates high battery stress)
    if (rangeEfficiency !== undefined && rangeEfficiency > 0) {
      if (rangeEfficiency < 4) {
        score -= 15;
      } else if (rangeEfficiency < 5.5) {
        score -= 8;
      }
    }

    // Charging behavior impact
    if (chargingNeed === 'Frequent Fast Charging') {
      score -= 10;
    } else if (chargingNeed === 'Balanced') {
      score -= 2;
    }

    // Deep discharge or overcharging stress
    if (batteryPercentage < 15 || batteryPercentage > 95) {
      score -= 5;
    }

    // Ensure score is bounded properly
    score = Math.max(0, Math.min(100, score));

    let status = 'Excellent';
    if (score >= 90) status = 'Excellent';
    else if (score >= 75) status = 'Good';
    else if (score >= 50) status = 'Moderate';
    else status = 'Needs Attention';

    return res.status(200).json({
      success: true,
      data: {
        batteryHealthScore: score,
        batteryHealthStatus: status
      }
    });
  } catch (error) {
    console.error('Error in predictBatteryHealth backend controller:', error);
    return res.status(500).json({ error: 'Server error processing battery health predictions' });
  }
};

// 3. Diagnose Mileage Performance & return efficiency recommendations
export const diagnoseMileage = async (req, res) => {
  try {
    const { vehicleType, mileage } = req.body;

    if (!vehicleType || !['EV', 'Petrol', 'Diesel'].includes(vehicleType)) {
      return res.status(400).json({ error: 'Valid vehicleType is required ("EV", "Petrol", "Diesel")' });
    }
    if (mileage === undefined || mileage <= 0) {
      return res.status(400).json({ error: 'Mileage / efficiency value must be greater than 0' });
    }

    let performance = 'Average';
    if (vehicleType === 'EV') {
      if (mileage >= 7) performance = 'Excellent';
      else if (mileage >= 5.5) performance = 'Good';
      else if (mileage >= 4) performance = 'Average';
      else performance = 'Poor';
    } else {
      // Petrol/Diesel
      if (mileage >= 18) performance = 'Excellent';
      else if (mileage >= 14) performance = 'Good';
      else if (mileage >= 10) performance = 'Average';
      else performance = 'Poor';
    }

    const suggestions = [
      'Maintain Tyre Pressure: Keep tyres inflated to the recommended pressure (typically 32-35 PSI). Under-inflated tyres can increase rolling resistance by 10%, cutting down your range.',
      'Avoid Harsh Acceleration: Aggressive throttling and sudden braking burn fuel and battery power rapidly. Smooth accelerations can increase efficiency by up to 20%.',
      'Regular Vehicle Servicing: Ensure clean air filters, properly tuned spark plugs, and fresh lubricants (or EV cooling checks) to keep mechanical drag minimal.',
      'Reduce Overload & Roof Racks: Drag and weight are exponential efficiency killers. Remove cargo roof-carriers and heavy trunk clutter when not actively needed.'
    ];

    return res.status(200).json({
      success: true,
      data: {
        mileagePerformance: performance,
        mileageSuggestions: suggestions
      }
    });
  } catch (error) {
    console.error('Error in diagnoseMileage backend controller:', error);
    return res.status(500).json({ error: 'Server error diagnosing mileage analytics' });
  }
};

// 4. Return mock charging/refuel stops along the way
export const suggestStops = async (req, res) => {
  try {
    const { vehicleType, tripDistance, estimatedRange } = req.body;

    if (!vehicleType || !['EV', 'Petrol', 'Diesel'].includes(vehicleType)) {
      return res.status(400).json({ error: 'Valid vehicleType is required' });
    }

    const stops = [];
    const isPossible = estimatedRange >= tripDistance;

    if (!isPossible && estimatedRange > 0) {
      // Generate mock locations spaced at 80% of current estimated range intervals
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

    return res.status(200).json({
      success: true,
      data: {
        suggestedStops: stops
      }
    });
  } catch (error) {
    console.error('Error in suggestStops backend controller:', error);
    return res.status(500).json({ error: 'Server error generating refueling stop recommendations' });
  }
};
