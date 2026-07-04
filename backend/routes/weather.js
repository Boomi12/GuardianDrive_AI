import express from 'express';
import { getWeatherData } from '../utils/weather.js';

const router = express.Router();

// GET /api/weather/current
router.get('/current', async (req, res) => {
  try {
    const { lat, lng, cityName } = req.query;
    
    let parsedLat, parsedLng;
    if (lat !== undefined && lng !== undefined) {
      parsedLat = Number(lat);
      parsedLng = Number(lng);
    }

    const weather = await getWeatherData(parsedLat, parsedLng, cityName);
    res.status(200).json({ success: true, data: weather });
  } catch (err) {
    console.error('Error in /weather/current:', err);
    res.status(500).json({ error: 'Server error retrieving current weather' });
  }
});

export default router;
