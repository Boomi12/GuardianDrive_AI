import express from 'express';
import Itinerary from '../models/Itinerary.js';
import DigitalTwin from '../models/DigitalTwin.js';
import AgentRecommendation from '../models/AgentRecommendation.js';
import { evaluateAgents } from '../utils/aiEngine.js';
import { 
  generateAccurateItinerary, 
  validateTimeline, 
  validateWaypointEdit, 
  timeToMinutes 
} from '../utils/timePlanner.js';

const router = express.Router();

// Helper to sync itinerary changes to digital twin & agents
async function syncItineraryTwin(tripId, itinerary) {
  let twinState = await DigitalTwin.findOne({ tripId });
  if (!twinState) return null;

  const timeline = itinerary.timeline;
  
  // Find the next stop (first stop that isn't the source)
  const nextStop = timeline.length > 1 ? timeline[1].place : 'None';
  twinState.journeyTwin.nextStop = nextStop;

  // Run timing validations
  const validation = validateTimeline(timeline, {
    source: itinerary.source,
    destination: itinerary.destination,
    startTime: itinerary.startTime || "09:00 AM"
  });

  // Risk updates: if validation warnings or driving warning is present
  const hasWarnings = validation.overallWarning || timeline.some(item => item.warning);
  if (hasWarnings) {
    twinState.journeyTwin.riskLevel = 'medium';
    if (validation.overallWarning?.includes("fatigue") || timeline.some(t => t.warning?.includes("rest break"))) {
      twinState.driverTwin.breakNeeded = true;
      twinState.driverTwin.fatigueLevel = Math.max(twinState.driverTwin.fatigueLevel, 75);
    }
  } else {
    twinState.journeyTwin.riskLevel = 'low';
    twinState.driverTwin.breakNeeded = false;
  }

  await twinState.save();

  // Recompute agent recommendations
  const agentRecommendations = evaluateAgents(twinState, itinerary);

  await AgentRecommendation.findOneAndUpdate(
    { tripId },
    {
      tripId,
      agents: agentRecommendations
    },
    { new: true, upsert: true }
  );

  return { twinState, agentRecommendations };
}

// POST /api/itinerary/generate
router.post('/generate', async (req, res) => {
  try {
    const {
      source,
      destination,
      tripDate,
      startTime,
      tripType,
      foodPreference,
      budget,
      vehicleType,
      fuelOrBatteryLevel,
      mileageOrRange,
      tripId
    } = req.body;

    if (!source || !destination || !tripId) {
      return res.status(400).json({ error: 'Missing source, destination, or tripId' });
    }

    const tDate = tripDate || new Date().toISOString().split('T')[0];
    const tStartTime = startTime || '09:00 AM';
    const fuelVal = fuelOrBatteryLevel !== undefined ? Number(fuelOrBatteryLevel) : 85;
    const rangeVal = mileageOrRange !== undefined ? Number(mileageOrRange) : (vehicleType?.toUpperCase() === 'EV' ? 340 : 580);

    // Enforce past date check strictly
    const todayStr = new Date().toISOString().split('T')[0];
    if (tDate < todayStr) {
      return res.status(400).json({
        valid: false,
        reason: "PAST_DATE",
        message: "Invalid date: Trip date cannot be in the past."
      });
    }

    // Enforce past time check strictly
    if (tDate === todayStr) {
      const selectedMins = timeToMinutes(tStartTime);
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (selectedMins < currentMins) {
        return res.status(400).json({
          valid: false,
          reason: "PAST_TIME",
          message: "Invalid time: Start time cannot be earlier than the current time."
        });
      }
    }

    // Generate accurate timeline using new timePlanner scheduling engine
    const rawTimeline = generateAccurateItinerary({
      source,
      destination,
      tripDate: tDate,
      startTime: tStartTime,
      tripType,
      foodPreference,
      budget,
      vehicleType,
      fuelOrBatteryLevel: fuelVal,
      mileageOrRange: rangeVal
    });

    // Run first validation check to populate isOpen and warnings
    const validation = validateTimeline(rawTimeline, { source, destination, startTime: tStartTime });

    // Save Itinerary
    const itinerary = await Itinerary.findOneAndUpdate(
      { tripId },
      {
        tripId,
        source,
        destination,
        tripType,
        foodPreference,
        budget,
        vehicleType,
        tripDate: tDate,
        startTime: tStartTime,
        fuelOrBatteryLevel: fuelVal,
        mileageOrRange: rangeVal,
        timeline: validation.timeline
      },
      { new: true, upsert: true }
    );

    // Find or initialize Digital Twin
    let twinState = await DigitalTwin.findOne({ tripId });
    if (!twinState) {
      twinState = new DigitalTwin({
        tripId,
        driverTwin: {
          fatigueLevel: 15,
          distractionStatus: 'focused',
          breakNeeded: false
        },
        vehicleTwin: {
          vehicleType,
          fuelOrBatteryLevel: fuelVal,
          range: rangeVal,
          healthStatus: 'good'
        },
        journeyTwin: {
          weather: 'clear',
          traffic: 'normal',
          riskLevel: 'low',
          nextStop: validation.timeline[1] ? validation.timeline[1].place : 'None'
        }
      });
      await twinState.save();
    } else {
      twinState.vehicleTwin.vehicleType = vehicleType;
      twinState.vehicleTwin.fuelOrBatteryLevel = fuelVal;
      twinState.vehicleTwin.range = rangeVal;
      await twinState.save();
    }

    // Evaluate AI agent recommendations based on initial state
    const agentRecommendations = evaluateAgents(twinState, itinerary);
    await AgentRecommendation.findOneAndUpdate(
      { tripId },
      { tripId, agents: agentRecommendations },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Error in /itinerary/generate:', error);
    res.status(500).json({ error: 'Server error generating itinerary' });
  }
});

// POST /api/itinerary/validate
router.post('/validate', async (req, res) => {
  try {
    const { timeline, tripDetails } = req.body;
    if (!timeline || !tripDetails) {
      return res.status(400).json({ error: 'Missing timeline or tripDetails' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (tripDetails.tripDate && tripDetails.tripDate < todayStr) {
      return res.status(400).json({
        valid: false,
        reason: "PAST_DATE",
        message: "Invalid date: Trip date cannot be in the past."
      });
    }

    if (tripDetails.tripDate === todayStr && tripDetails.startTime) {
      const selectedMins = timeToMinutes(tripDetails.startTime);
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (selectedMins < currentMins) {
        return res.status(400).json({
          valid: false,
          reason: "PAST_TIME",
          message: "Invalid time: Start time cannot be earlier than the current time."
        });
      }
    }

    const validation = validateTimeline(timeline, tripDetails);
    res.status(200).json({
      success: true,
      valid: validation.success,
      timeline: validation.timeline,
      overallWarning: validation.overallWarning
    });
  } catch (error) {
    console.error('Error in /itinerary/validate:', error);
    res.status(500).json({ error: 'Server error validating timeline' });
  }
});

// POST /api/itinerary/check-place
router.post('/check-place', async (req, res) => {
  try {
    const { tripId, place, time } = req.body;
    if (!tripId || !place || !time) {
      return res.status(400).json({ error: 'tripId, place, and time are required' });
    }

    const itinerary = await Itinerary.findOne({ tripId });
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Construct a context-accurate waypoint object to validate
    const dummyWaypoint = { place, time };
    
    // Find neighbors in itinerary
    const timeline = itinerary.timeline;
    let previousWaypoint = null;
    let nextWaypoint = null;

    // Estimate position by sorting chronologically
    const targetMins = timeToMinutes(time);
    for (let i = 0; i < timeline.length; i++) {
      const currentMins = timeToMinutes(timeline[i].time);
      if (currentMins < targetMins) {
        previousWaypoint = timeline[i];
      }
      if (currentMins > targetMins && !nextWaypoint) {
        nextWaypoint = timeline[i];
      }
    }

    const editInput = {
      waypoint: dummyWaypoint,
      previousWaypoint,
      nextWaypoint,
      tripDate: itinerary.tripDate,
      tripStartTime: itinerary.startTime,
      source: itinerary.source,
      destination: itinerary.destination
    };

    const result = validateWaypointEdit(editInput);
    res.status(200).json({
      success: true,
      valid: result.valid,
      reason: result.reason,
      message: result.message
    });
  } catch (error) {
    console.error('Error in /itinerary/check-place:', error);
    res.status(500).json({ error: 'Server error checking place' });
  }
});

// PATCH /api/itinerary/:tripId/waypoint/:waypointId
router.patch('/:tripId/waypoint/:waypointId', async (req, res) => {
  try {
    const { tripId, waypointId } = req.params;
    const { time, place, purpose, reason } = req.body;

    const itinerary = await Itinerary.findOne({ tripId });
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Locate the waypoint
    let index = -1;
    let waypoint = itinerary.timeline.id(waypointId);
    if (waypoint) {
      index = itinerary.timeline.indexOf(waypoint);
    } else {
      const idx = parseInt(waypointId, 10);
      if (!isNaN(idx) && itinerary.timeline[idx]) {
        waypoint = itinerary.timeline[idx];
        index = idx;
      }
    }

    if (!waypoint || index === -1) {
      return res.status(404).json({ error: 'Waypoint not found in timeline' });
    }

    const previousWaypoint = index > 0 ? itinerary.timeline[index - 1] : null;
    const nextWaypoint = index < itinerary.timeline.length - 1 ? itinerary.timeline[index + 1] : null;

    // Run waypoint edit validation
    const tempWaypoint = {
      place: place !== undefined ? place : waypoint.place,
      time: time !== undefined ? time : waypoint.time
    };

    const validationCheck = validateWaypointEdit({
      waypoint: tempWaypoint,
      previousWaypoint,
      nextWaypoint,
      tripDate: itinerary.tripDate,
      tripStartTime: itinerary.startTime,
      source: itinerary.source,
      destination: itinerary.destination
    });

    if (!validationCheck.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        reason: validationCheck.reason,
        message: validationCheck.message
      });
    }

    // Apply edits
    if (time !== undefined) waypoint.time = time;
    if (place !== undefined) waypoint.place = place;
    if (purpose !== undefined) waypoint.purpose = purpose;
    if (reason !== undefined) waypoint.reason = reason;

    // Re-validate and recalculate timeline dependencies
    const validation = validateTimeline(itinerary.timeline, {
      source: itinerary.source,
      destination: itinerary.destination,
      startTime: itinerary.startTime || "09:00 AM"
    });

    itinerary.timeline = validation.timeline;
    await itinerary.save();

    // Sync with digital twin
    await syncItineraryTwin(tripId, itinerary);

    res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Error in PATCH waypoint:', error);
    res.status(500).json({ error: 'Server error updating waypoint' });
  }
});

// GET /api/itinerary/:tripId
router.get('/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const itinerary = await Itinerary.findOne({ tripId });
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Error in GET /api/itinerary/:tripId:', error);
    res.status(500).json({ error: 'Server error retrieving itinerary' });
  }
});

// POST /api/itinerary/update-timeline
router.post('/update-timeline', async (req, res) => {
  try {
    const { tripId, timeline } = req.body;
    if (!tripId || !timeline) {
      return res.status(400).json({ error: 'tripId and timeline are required' });
    }

    const itinerary = await Itinerary.findOne({ tripId });
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Run schedule validation checks
    const validation = validateTimeline(timeline, {
      source: itinerary.source,
      destination: itinerary.destination,
      startTime: itinerary.startTime || "09:00 AM"
    });

    itinerary.timeline = validation.timeline;
    await itinerary.save();

    // Sync state
    await syncItineraryTwin(tripId, itinerary);

    res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Error in POST /api/itinerary/update-timeline:', error);
    res.status(500).json({ error: 'Server error updating itinerary timeline' });
  }
});

export default router;
