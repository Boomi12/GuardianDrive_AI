import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  number: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['EV', 'Petrol', 'Diesel']
  },
  batteryPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  fuelPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  mileage: {
    type: Number,
    min: 0
  },
  range: {
    type: Number,
    required: true,
    min: 0
  },
  emergencyContact: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Vehicle', VehicleSchema);
