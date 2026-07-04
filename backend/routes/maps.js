import express from 'express';
import { getAutocompletePredictions, getPlaceDetails, getRouteDistanceMatrix, searchPlaces } from '../utils/googleMaps.js';

const router = express.Router();

// GET /api/maps/autocomplete
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) {
      return res.status(200).json({ success: true, predictions: [] });
    }
    const predictions = await getAutocompletePredictions(input);
    res.status(200).json({ success: true, predictions });
  } catch (err) {
    console.error('Error in /maps/autocomplete:', err);
    res.status(500).json({ error: 'Server error querying place autocomplete' });
  }
});

// GET /api/maps/place-details
router.get('/place-details', async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({ error: 'placeId query parameter is required' });
    }
    const details = await getPlaceDetails(placeId);
    if (!details) {
      return res.status(404).json({ error: 'Place details not found' });
    }
    res.status(200).json({ success: true, data: details });
  } catch (err) {
    console.error('Error in /maps/place-details:', err);
    res.status(500).json({ error: 'Server error retrieving place details' });
  }
});

// POST /api/maps/distance
router.post('/distance', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination strings are required' });
    }
    const route = await getRouteDistanceMatrix(origin, destination);
    res.status(200).json({ success: true, data: route });
  } catch (err) {
    console.error('Error in /maps/distance:', err);
    res.status(500).json({ error: 'Server error calculating driving distance' });
  }
});

// GET /api/maps/search
router.get('/search', async (req, res) => {
  try {
    const { query, lat, lng } = req.query;
    if (!query) {
      return res.status(450).json({ error: 'query parameter is required' });
    }
    const results = await searchPlaces(query, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('Error in /maps/search:', err);
    res.status(500).json({ error: 'Server error searching places' });
  }
});

export default router;
