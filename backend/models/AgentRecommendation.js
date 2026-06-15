import mongoose from 'mongoose';

const AgentDetailSchema = new mongoose.Schema({
  status: { type: String, required: true },
  recommendation: { type: String, required: true },
  confidenceScore: { type: Number, required: true }
});

const AgentRecommendationSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true
  },
  agents: {
    safetyAgent: { type: AgentDetailSchema, required: true },
    routeAgent: { type: AgentDetailSchema, required: true },
    fuelEvAgent: { type: AgentDetailSchema, required: true },
    journeyAgent: { type: AgentDetailSchema, required: true },
    emergencyAgent: { type: AgentDetailSchema, required: true }
  },
  updatedAt: { type: Date, default: Date.now }
});

AgentRecommendationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AgentRecommendation', AgentRecommendationSchema);
