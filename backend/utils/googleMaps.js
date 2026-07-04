import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Mock Places Database for local fallbacks
export const MOCK_PLACES = {
  "bangalore": {
    name: "Bangalore, Karnataka, India",
    placeId: "mock_bangalore",
    lat: 12.9716,
    lng: 77.5946,
    address: "Bangalore, Karnataka, India",
    rating: 4.5,
    user_ratings_total: 1250,
    opening_hours: "24 hours"
  },
  "mysore": {
    name: "Mysore, Karnataka, India",
    placeId: "mock_mysore",
    lat: 12.2958,
    lng: 76.6394,
    address: "Mysore, Karnataka, India",
    rating: 4.6,
    user_ratings_total: 980,
    opening_hours: "24 hours"
  },
  "coorg": {
    name: "Coorg, Karnataka, India",
    placeId: "mock_coorg",
    lat: 12.3375,
    lng: 75.8069,
    address: "Coorg, Karnataka, India",
    rating: 4.7,
    user_ratings_total: 820,
    opening_hours: "24 hours"
  },
  "delhi": {
    name: "Delhi, India",
    placeId: "mock_delhi",
    lat: 28.6139,
    lng: 77.2090,
    address: "Delhi, India",
    rating: 4.4,
    user_ratings_total: 4500,
    opening_hours: "24 hours"
  },
  "agra": {
    name: "Agra, Uttar Pradesh, India",
    placeId: "mock_agra",
    lat: 27.1767,
    lng: 78.0081,
    address: "Agra, Uttar Pradesh, India",
    rating: 4.8,
    user_ratings_total: 6200,
    opening_hours: "24 hours"
  },
  "paris": {
    name: "Paris, France",
    placeId: "mock_paris",
    lat: 48.8566,
    lng: 2.3522,
    address: "Paris, France",
    rating: 4.7,
    user_ratings_total: 8900,
    opening_hours: "24 hours"
  },
  "london": {
    name: "London, UK",
    placeId: "mock_london",
    lat: 51.5074,
    lng: -0.1278,
    address: "London, UK",
    rating: 4.6,
    user_ratings_total: 10400,
    opening_hours: "24 hours"
  },
  "new york": {
    name: "New York, NY, USA",
    placeId: "mock_newyork",
    lat: 40.7128,
    lng: -74.0060,
    address: "New York, NY, USA",
    rating: 4.8,
    user_ratings_total: 15400,
    opening_hours: "24 hours"
  },
  "washington": {
    name: "Washington, DC, USA",
    placeId: "mock_washington",
    lat: 38.9072,
    lng: -77.0369,
    address: "Washington, DC, USA",
    rating: 4.7,
    user_ratings_total: 5100,
    opening_hours: "24 hours"
  },
  "chennai": {
    name: "Chennai, Tamil Nadu, India",
    placeId: "mock_chennai",
    lat: 13.0827,
    lng: 80.2707,
    address: "Chennai, Tamil Nadu, India",
    rating: 4.6,
    user_ratings_total: 3200,
    opening_hours: "24 hours"
  }
};

// Autocomplete Places API Wrapper
export async function getAutocompletePredictions(input) {
  if (!input) return [];

  if (!GOOGLE_MAPS_API_KEY) {
    // Return mock results matching query
    const query = input.toLowerCase().trim();
    const matches = Object.keys(MOCK_PLACES).filter(key => key.includes(query) || query.includes(key));
    
    return matches.map(key => ({
      description: MOCK_PLACES[key].name,
      placeId: MOCK_PLACES[key].placeId,
      reference: MOCK_PLACES[key].placeId
    }));
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK') {
      return data.predictions.map(p => ({
        description: p.description,
        placeId: p.place_id,
        reference: p.reference
      }));
    }
    console.error('Google Autocomplete API Error:', data.status, data.error_message || '');
    return [];
  } catch (err) {
    console.error('Failed to contact Google Autocomplete:', err);
    return [];
  }
}

// Place Details API Wrapper
export async function getPlaceDetails(placeId) {
  if (!placeId) return null;

  if (!GOOGLE_MAPS_API_KEY || placeId.startsWith('mock_')) {
    // Return mock details matching placeId
    const key = Object.keys(MOCK_PLACES).find(k => MOCK_PLACES[k].placeId === placeId);
    if (key) {
      return MOCK_PLACES[key];
    }
    // Dynamic fallback for unrecognized mock IDs
    return {
      name: "Custom Location",
      placeId,
      lat: 12.97,
      lng: 77.59,
      address: "Custom Coordinates Address",
      rating: 4.0,
      user_ratings_total: 50,
      opening_hours: "24 hours"
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.result) {
      const res = data.result;
      const hours = res.opening_hours ? (res.opening_hours.weekday_text ? res.opening_hours.weekday_text.join('\n') : 'open') : '24 hours';
      return {
        name: res.name,
        placeId,
        lat: res.geometry.location.lat,
        lng: res.geometry.location.lng,
        address: res.formatted_address,
        rating: res.rating || 4.2,
        user_ratings_total: res.user_ratings_total || 10,
        opening_hours: hours,
        photos: res.photos ? res.photos.slice(0, 3).map(p => p.photo_reference) : []
      };
    }
    console.error('Google Place Details API Error:', data.status, data.error_message || '');
    return null;
  } catch (err) {
    console.error('Failed to contact Google Place Details:', err);
    return null;
  }
}

// Haversine formula helper for coordinate distance fallback
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

// Distance Matrix API Wrapper
export async function getRouteDistanceMatrix(origin, destination) {
  if (!origin || !destination) return { distance: 0, duration: 0 };

  // Static well-known route estimates for local fallbacks
  const originStr = origin.toLowerCase().trim();
  const destStr = destination.toLowerCase().trim();

  const mockPairs = [
    { o: 'bangalore', d: 'mysore', dist: 145000, dur: 11700 }, // 145 km, 195 mins (3h 15m)
    { o: 'bangalore', d: 'coorg', dist: 250000, dur: 19800 },   // 250 km, 330 mins (5h 30m)
    { o: 'bangalore', d: 'ooty', dist: 275000, dur: 22500 },    // 275 km, 375 mins (6h 15m)
    { o: 'bangalore', d: 'chikkamagaluru', dist: 240000, dur: 17100 }, // 240 km, 285 mins
    { o: 'delhi', d: 'agra', dist: 230000, dur: 14400 },        // 230 km, 240 mins (4h)
    { o: 'paris', d: 'london', dist: 450000, dur: 21600 },      // 450 km, 360 mins (6h)
    { o: 'new york', d: 'washington', dist: 360000, dur: 16200 } // 360 km, 270 mins (4h 30m)
  ];

  const matchedPair = mockPairs.find(p => 
    (originStr.includes(p.o) && destStr.includes(p.d)) ||
    (destStr.includes(p.o) && originStr.includes(p.d))
  );

  if (matchedPair) {
    return {
      distance: matchedPair.dist,
      duration: matchedPair.dur
    };
  }

  if (!GOOGLE_MAPS_API_KEY) {
    // Dynamic coordinate-based calculation fallback
    // Try to resolve coordinates if they match our Mock Places
    const oPlaceKey = Object.keys(MOCK_PLACES).find(k => originStr.includes(k));
    const dPlaceKey = Object.keys(MOCK_PLACES).find(k => destStr.includes(k));

    if (oPlaceKey && dPlaceKey) {
      const o = MOCK_PLACES[oPlaceKey];
      const d = MOCK_PLACES[dPlaceKey];
      const km = getHaversineDistance(o.lat, o.lng, d.lat, d.lng) * 1.25; // 1.25 route curvature factor
      return {
        distance: Math.round(km * 1000),
        duration: Math.round(km * 60) // approx 1 min per km (60 km/h)
      };
    }

    // Default dynamic estimate (e.g. 100 km, 90 mins)
    return { distance: 100000, duration: 5400 };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.rows && data.rows[0].elements && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.value, // in meters
        duration: element.duration.value  // in seconds
      };
    }
    console.error('Google Distance Matrix API Error:', data.status);
    return { distance: 100000, duration: 5400 };
  } catch (err) {
    console.error('Failed to contact Google Distance Matrix:', err);
    return { distance: 100000, duration: 5400 };
  }
}

// Text Search Google Places API Wrapper
export async function searchPlaces(query, lat, lng) {
  if (!query) return [];

  if (!GOOGLE_MAPS_API_KEY) {
    return [];
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    if (lat !== undefined && lng !== undefined) {
      url += `&location=${lat},${lng}&radius=20000`; // 20km radius
    }
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results) {
      return data.results.slice(0, 10).map(r => ({
        name: r.name,
        placeId: r.place_id,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
        address: r.formatted_address,
        rating: r.rating || 4.2,
        user_ratings_total: r.user_ratings_total || 0,
        tags: r.types || [],
        description: r.business_status || "Google Places Search result"
      }));
    }
    console.error('Google Place Text Search API Error:', data.status, data.error_message || '');
    return [];
  } catch (err) {
    console.error('Failed to contact Google Place Text Search:', err);
    return [];
  }
}
