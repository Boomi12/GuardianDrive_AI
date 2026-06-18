import mongoose from 'mongoose';

const VehicleDataSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: false
  },
  vehicleType: {
    type: String,
    enum: ['EV', 'Petrol', 'Diesel'],
    required: true
  },
  inputs: {
    // EV Specific Inputs
    batteryPercentage: { type: Number },
    batteryCapacity: { type: Number },
    vehicleEfficiency: { type: Number },
    // Petrol/Diesel Specific Inputs
    fuelLevel: { type: Number },
    mileage: { type: Number },
    // Common Inputs
    tripDistance: { type: Number, required: true },
    // Battery Health Inputs
    usagePattern: { type: String },
    chargingNeed: { type: String }
  },
  results: {
    estimatedRange: { type: Number, required: true },
    isTripPossible: { type: Boolean, required: true },
    stopsRequired: { type: Number, required: true },
    batteryHealthScore: { type: Number },
    batteryHealthStatus: { type: String },
    mileagePerformance: { type: String, required: true },
    mileageSuggestions: [{ type: String }],
    remainingFuelOrBattery: { type: Number },
    suggestedStops: [{
      name: { type: String },
      distance: { type: Number },
      type: { type: String }
    }],
    tripSafetyStatus: { type: String, required: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('VehicleData', VehicleDataSchema);
