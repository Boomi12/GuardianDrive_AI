import express from 'express';
import PlaceRecommendation from '../models/PlaceRecommendation.js';
import { mockDestinations, defaultMockDestination } from '../utils/mockData.js';

const router = express.Router();

// POST /api/places/recommend
router.post('/recommend', async (req, res) => {
  try {
    const { destination, foodPreference, budget, vehicleType, tripId } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const key = destination.toLowerCase().trim();
    const destData = mockDestinations[key] || defaultMockDestination;

    // Filter restaurants based on food preference and budget
    const filteredRestaurants = destData.restaurants.filter(r => {
      const isBudgetMatch = budget && budget.toLowerCase() === 'high' ? r.budget === 'High' : (budget && budget.toLowerCase() === 'low' ? r.budget === 'Low' : r.budget !== 'High');
      const isCuisineMatch = !foodPreference || foodPreference.toLowerCase() === 'any' || r.cuisine.toLowerCase().includes(foodPreference.toLowerCase());
      return isBudgetMatch || isCuisineMatch;
    });

    const finalRestaurants = filteredRestaurants.length > 0 ? filteredRestaurants : destData.restaurants;

    // Filter fuel/charging stops based on vehicle type
    const isEV = vehicleType && vehicleType.toUpperCase() === 'EV';
    const finalFuelStops = destData.fuelChargingStops.filter(s => {
      if (isEV) return s.type === 'EV';
      return s.type === 'Fuel';
    });

    // Save recommendation to database if tripId is provided
    let recommendationRecord;
    if (tripId) {
      recommendationRecord = await PlaceRecommendation.findOneAndUpdate(
        { tripId },
        {
          tripId,
          destination: destData.name,
          attractions: destData.attractions,
          restaurants: finalRestaurants,
          restStops: destData.restStops,
          haltingPlaces: destData.haltingPlaces,
          fuelChargingStops: finalFuelStops.length > 0 ? finalFuelStops : destData.fuelChargingStops
        },
        { new: true, upsert: true }
      );
    } else {
      recommendationRecord = {
        destination: destData.name,
        attractions: destData.attractions,
        restaurants: finalRestaurants,
        restStops: destData.restStops,
        haltingPlaces: destData.haltingPlaces,
        fuelChargingStops: finalFuelStops.length > 0 ? finalFuelStops : destData.fuelChargingStops
      };
    }

    res.status(200).json({
      success: true,
      data: recommendationRecord
    });
  } catch (error) {
    console.error('Error in /places/recommend:', error);
    res.status(500).json({ error: 'Server error generating recommendations' });
  }
});

export default router;
