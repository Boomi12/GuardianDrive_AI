import mongoose from 'mongoose';

const DigitalTwinSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true
  },
  driverTwin: {
    fatigueLevel: { type: Number, default: 20 },
    distractionStatus: { type: String, default: 'focused' }, // 'focused', 'distracted'
    breakNeeded: { type: Boolean, default: false }
  },
  vehicleTwin: {
    vehicleType: { type: String, default: 'EV' }, // 'EV', 'Petrol', 'Diesel', 'Hybrid'
    fuelOrBatteryLevel: { type: Number, default: 80 }, // 0 to 100
    range: { type: Number, default: 350 }, // km
    healthStatus: { type: String, default: 'good' } // 'good', 'warning', 'critical'
  },
  journeyTwin: {
    weather: { type: String, default: 'clear' }, // 'clear', 'rain', 'fog', 'snow'
    traffic: { type: String, default: 'normal' }, // 'normal', 'heavy', 'light'
    riskLevel: { type: String, default: 'low' }, // 'low', 'medium', 'critical'
    nextStop: { type: String, default: 'None' }
  },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
DigitalTwinSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('DigitalTwin', DigitalTwinSchema);
