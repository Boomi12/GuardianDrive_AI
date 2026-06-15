import express from 'express';
import AgentRecommendation from '../models/AgentRecommendation.js';
import DigitalTwin from '../models/DigitalTwin.js';
import Itinerary from '../models/Itinerary.js';
import { evaluateAgents } from '../utils/aiEngine.js';

const router = express.Router();

// POST /api/agents/recommend
router.post('/recommend', async (req, res) => {
  try {
    const { tripId, twinState, itinerary } = req.body;

    if (tripId) {
      // Look up in database
      const twin = await DigitalTwin.findOne({ tripId });
      const activeItinerary = await Itinerary.findOne({ tripId });

      if (!twin) {
        return res.status(404).json({ error: 'Digital Twin state not found for the provided tripId' });
      }

      // Re-evaluate
      const evaluatedAgents = evaluateAgents(twin, activeItinerary);

      // Save
      const agentRecRecord = await AgentRecommendation.findOneAndUpdate(
        { tripId },
        { tripId, agents: evaluatedAgents },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        data: agentRecRecord.agents
      });
    }

    // Direct inputs evaluation (fallback / demo modes)
    if (!twinState) {
      return res.status(400).json({ error: 'Provide either tripId or twinState in the request body' });
    }

    const evaluatedAgents = evaluateAgents(twinState, itinerary || {});
    res.status(200).json({
      success: true,
      data: evaluatedAgents
    });
  } catch (error) {
    console.error('Error in /agents/recommend:', error);
    res.status(500).json({ error: 'Server error processing agent recommendations' });
  }
});

export default router;
