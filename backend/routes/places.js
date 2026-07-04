import express from 'express';
import PlaceRecommendation from '../models/PlaceRecommendation.js';
import { mockDestinations, defaultMockDestination } from '../utils/mockData.js';
import { searchPlaces } from '../utils/googleMaps.js';

const router = express.Router();

// POST /api/places/recommend
router.post('/recommend', async (req, res) => {
  try {
    const { destination, foodPreference, budget, vehicleType, tripId } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const key = destination.toLowerCase().trim();
    let matchKey = Object.keys(mockDestinations).find(k => key.includes(k) || k.includes(key));
    if (!matchKey && (key.includes('mysore') || key.includes('mysuru'))) {
      matchKey = 'mysore';
    }
    let destData = matchKey ? mockDestinations[matchKey] : defaultMockDestination;

    // Google Places Sourcing if API key exists
    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        console.log(`Places Sourcing: Fetching Google Places for: ${destination}`);
        const searchG = async (queryType, typeTag) => {
          const results = await searchPlaces(`${destination} ${queryType}`);
          return results.map(r => ({
            name: r.name,
            type: typeTag,
            location: r.address || destination,
            rating: r.rating || 4.2,
            description: `Highly rated spot in ${destination}.`,
            openTime: typeTag === 'lodging' || typeTag === 'refuel' ? "24 hours" : "09:00 AM",
            closeTime: typeTag === 'lodging' || typeTag === 'refuel' ? "24 hours" : "08:00 PM",
            minimumVisitDuration: typeTag === 'lodging' ? 360 : 45,
            recommendedVisitDuration: typeTag === 'lodging' ? 720 : 90,
            tags: r.tags || [],
            lat: r.lat,
            lng: r.lng,
            placeId: r.placeId,
            address: r.address
          }));
        };

        const gAttractions = await searchG("attractions", "attraction");
        if (gAttractions.length > 0) {
          const gRestaurants = await searchG("restaurants", "restaurant");
          const gHotels = await searchG("hotels", "lodging");
          const gCharging = await searchG(vehicleType === 'EV' ? "ev charging station" : "gas station", "refuel");

          destData = {
            name: destination,
            attractions: gAttractions,
            restaurants: gRestaurants.length > 0 ? gRestaurants : destData.restaurants,
            haltingPlaces: gHotels.length > 0 ? gHotels : destData.haltingPlaces,
            fuelChargingStops: gCharging.length > 0 ? gCharging : destData.fuelChargingStops,
            restStops: destData.restStops
          };
        }
      } catch (err) {
        console.error("Failed to source places from Google Places API:", err);
      }
    }

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
