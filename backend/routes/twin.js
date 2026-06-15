import express from 'express';
import DigitalTwin from '../models/DigitalTwin.js';
import Itinerary from '../models/Itinerary.js';
import AgentRecommendation from '../models/AgentRecommendation.js';
import { evaluateAgents } from '../utils/aiEngine.js';

const router = express.Router();

// GET /api/twin/:tripId
router.get('/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const twin = await DigitalTwin.findOne({ tripId });

    if (!twin) {
      return res.status(404).json({ error: 'Digital Twin state not found for this tripId' });
    }

    res.status(200).json({
      success: true,
      data: twin
    });
  } catch (error) {
    console.error('Error in GET /api/twin/:tripId:', error);
    res.status(500).json({ error: 'Server error fetching digital twin state' });
  }
});

// POST /api/twin/update
router.post('/update', async (req, res) => {
  try {
    const { tripId, driverTwin, vehicleTwin, journeyTwin } = req.body;

    if (!tripId) {
      return res.status(400).json({ error: 'tripId is required for digital twin update' });
    }

    // Find the existing twin state
    let twin = await DigitalTwin.findOne({ tripId });
    if (!twin) {
      return res.status(404).json({ error: 'Digital Twin not found for this tripId. Generate an itinerary first.' });
    }

    // Merge/update the twin fields
    if (driverTwin) {
      twin.driverTwin = { ...twin.driverTwin.toObject(), ...driverTwin };
    }
    if (vehicleTwin) {
      twin.vehicleTwin = { ...twin.vehicleTwin.toObject(), ...vehicleTwin };
    }
    if (journeyTwin) {
      twin.journeyTwin = { ...twin.journeyTwin.toObject(), ...journeyTwin };
    }

    // Save the updated twin state
    await twin.save();

    // Fetch the itinerary preference to perform intelligent agent evaluations
    const itinerary = await Itinerary.findOne({ tripId });

    // Recalculate AI agent recommendations based on updated twin
    const updatedAgents = evaluateAgents(twin, itinerary);

    // Save recalculated agent recommendations
    const agentRecRecord = await AgentRecommendation.findOneAndUpdate(
      { tripId },
      {
        tripId,
        agents: updatedAgents
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        twin,
        agents: agentRecRecord.agents
      }
    });
  } catch (error) {
    console.error('Error in POST /api/twin/update:', error);
    res.status(500).json({ error: 'Server error updating digital twin state' });
  }
});

export default router;
