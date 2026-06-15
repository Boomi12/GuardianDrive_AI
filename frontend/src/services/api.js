import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Journey Itinerary API calls
export const generateItinerary = async (tripData) => {
  try {
    const response = await api.post('/itinerary/generate', tripData);
    return response.data;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error.response?.data || error.message;
  }
};

export const getItinerary = async (tripId) => {
  try {
    const response = await api.get(`/itinerary/${tripId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching itinerary for tripId ${tripId}:`, error);
    throw error.response?.data || error.message;
  }
};

export const updateItineraryTimeline = async (tripId, timeline) => {
  try {
    const response = await api.post('/itinerary/update-timeline', { tripId, timeline });
    return response.data;
  } catch (error) {
    console.error(`Error updating timeline for tripId ${tripId}:`, error);
    throw error.response?.data || error.message;
  }
};

export const validateItinerary = async (timeline, tripDetails) => {
  try {
    const response = await api.post('/itinerary/validate', { timeline, tripDetails });
    return response.data;
  } catch (error) {
    console.error('Error validating itinerary:', error);
    throw error.response?.data || error.message;
  }
};

export const updateWaypoint = async (tripId, waypointId, data) => {
  try {
    const response = await api.patch(`/itinerary/${tripId}/waypoint/${waypointId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error patching waypoint ${waypointId}:`, error);
    throw error.response?.data || error.message;
  }
};

export const checkPlaceFeasibility = async (tripId, place, time) => {
  try {
    const response = await api.post('/itinerary/check-place', { tripId, place, time });
    return response.data;
  } catch (error) {
    console.error('Error checking place feasibility:', error);
    throw error.response?.data || error.message;
  }
};

// Place Recommendations API calls
export const recommendPlaces = async (preferences) => {
  try {
    const response = await api.post('/places/recommend', preferences);
    return response.data;
  } catch (error) {
    console.error('Error fetching place recommendations:', error);
    throw error.response?.data || error.message;
  }
};

// Digital Twin API calls
export const getTwinState = async (tripId) => {
  try {
    const response = await api.get(`/twin/${tripId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching digital twin for tripId ${tripId}:`, error);
    throw error.response?.data || error.message;
  }
};

export const updateTwinState = async (updateData) => {
  try {
    const response = await api.post('/twin/update', updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating digital twin:', error);
    throw error.response?.data || error.message;
  }
};

// Agent Recommendations API calls
export const getAgentRecommendations = async (tripId) => {
  try {
    const response = await api.post('/agents/recommend', { tripId });
    return response.data;
  } catch (error) {
    console.error(`Error fetching agent recommendations for tripId ${tripId}:`, error);
    throw error.response?.data || error.message;
  }
};

export default api;
