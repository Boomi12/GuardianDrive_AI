import mongoose from 'mongoose';

const ItinerarySchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true
  },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  tripType: { type: String, required: true },
  foodPreference: { type: String, required: true },
  budget: { type: String, required: true },
  vehicleType: { type: String, required: true },
  tripDate: { type: String },
  startTime: { type: String },
  fuelOrBatteryLevel: { type: Number, default: 85 },
  mileageOrRange: { type: Number, default: 340 },
  timeline: [{
    time: { type: String, required: true },
    endTime: { type: String },
    place: { type: String, required: true },
    purpose: { type: String, required: true },
    reason: { type: String, required: true },
    travelTimeFromPrevious: { type: String },
    isOpen: { type: Boolean, default: true },
    warning: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Itinerary', ItinerarySchema);
