import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, ArrowRight, Loader2, UtensilsCrossed, CalendarRange, Car, DollarSign, Plus, Trash2, Check, Search, PlusCircle, Sparkles, ShieldAlert, Info } from 'lucide-react';
import { 
  generateItinerary, 
  recommendPlaces, 
  updateItineraryTimeline, 
  getItinerary, 
  getVehicle,
  getActiveItinerary,
  applyItineraryFix,
  getAutocompletePredictions,
  getPlaceDetails,
  getCurrentWeather,
  validateItinerary
} from '../services/api';
import { 
  getCurrentDate, 
  getCurrentTimeRounded, 
  validateTripStart, 
  timeToMinutes, 
  minutesToTime,
  isPlaceOpen, 
  getLocalSpecs, 
  getLocalTravelOffset, 
  getEarliestArrival,
  isPastTimeToday,
  getLocalPlaceTimeStatus
} from '../utils/timeValidation';

const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const JourneyCompanion = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('gd_user') || '{}');
  
  const [formData, setFormData] = useState({
    source: 'Bangalore',
    destination: 'Mysore',
    tripType: 'Family',
    foodPreference: 'Any',
    budget: 'Medium',
    vehicleType: 'EV',
    tripDate: getCurrentDate(),
    startTime: getCurrentTimeRounded(),
    fuelOrBatteryLevel: 85,
    mileageOrRange: 340,
    durationDays: 1,
    tripStyle: 'Balanced',
    interests: [],
    sourcePlaceId: '',
    destinationPlaceId: '',
    tripMode: 'One Way'
  });

  const [vehicle, setVehicle] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [activeTab, setActiveTab] = useState('attractions');

  // Autocomplete prediction states
  const [sourceInput, setSourceInput] = useState(formData.source);
  const [destInput, setDestInput] = useState(formData.destination);
  const [sourcePredictions, setSourcePredictions] = useState([]);
  const [destPredictions, setDestPredictions] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  // Active Trip Persistence & suggestions
  const [activeTrip, setActiveTrip] = useState(null);
  const [suggestedFixes, setSuggestedFixes] = useState([]);
  const [selectedTimelineDay, setSelectedTimelineDay] = useState(1);
  const [customDays, setCustomDays] = useState(1);
  const [weather, setWeather] = useState(null);
  const [infeasible, setInfeasible] = useState([]);

  const fetchedUserIdRef = React.useRef(null);

  // Load Active Trip on mount
  useEffect(() => {
    if (user.id && fetchedUserIdRef.current !== user.id) {
      fetchedUserIdRef.current = user.id;
      getActiveItinerary(user.id)
        .then(res => {
          if (res.success && res.data) {
            setActiveTrip(res.data);
          } else {
            setActiveTrip(null);
          }
        })
        .catch(err => {
          // Normal empty/404 state handled silently
          setActiveTrip(null);
        });
    }
  }, [user.id]);

  // Fetch Vehicle Profile
  useEffect(() => {
    const fetchVehicleProfile = async () => {
      setVehicleLoading(true);
      const localVehicle = localStorage.getItem('gd_vehicle');
      if (localVehicle) {
        try {
          const parsed = JSON.parse(localVehicle);
          setVehicle(parsed);
          setFormData(prev => ({
            ...prev,
            vehicleType: parsed.type,
            fuelOrBatteryLevel: parsed.type === 'EV' ? parsed.batteryPercentage : parsed.fuelPercentage,
            mileageOrRange: parsed.range
          }));
        } catch (e) {
          console.error(e);
        }
      }

      if (!user.id) {
        setVehicleLoading(false);
        return;
      }

      try {
        const res = await getVehicle(user.id);
        if (res.success && res.data) {
          setVehicle(res.data);
          localStorage.setItem('gd_vehicle', JSON.stringify(res.data));
          setFormData(prev => ({
            ...prev,
            vehicleType: res.data.type,
            fuelOrBatteryLevel: res.data.type === 'EV' ? res.data.batteryPercentage : res.data.fuelPercentage,
            mileageOrRange: res.data.range
          }));
        }
      } catch (err) {
        console.error('Error fetching vehicle profile from API:', err);
      } finally {
        setVehicleLoading(false);
      }
    };
    fetchVehicleProfile();
  }, [user.id]);

  // Real-time trip validation hook
  useEffect(() => {
    const startCheck = validateTripStart(formData.tripDate, formData.startTime);
    const errors = {};
    if (!startCheck.valid) {
      if (startCheck.reason === 'PAST_DATE') {
        errors.tripDate = startCheck.message;
      } else if (startCheck.reason === 'PAST_TIME') {
        errors.startTime = startCheck.message;
      }
    }
    
    if (vehicle) {
      if (formData.fuelOrBatteryLevel < 0 || formData.fuelOrBatteryLevel > 100) {
        errors.fuelOrBatteryLevel = "Battery/Fuel level must be between 0% and 100%.";
      }
      if (formData.mileageOrRange < 50 || formData.mileageOrRange > 1500) {
        errors.mileageOrRange = "Range must be between 50km and 1500km.";
      }
    }

    setFormErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }, [formData, vehicle]);
  
  // Custom interactive itinerary states
  const [tripId, setTripId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom place inputs
  const [customPlace, setCustomPlace] = useState({
    name: '',
    time: '04:00 PM',
    purpose: 'Sightseeing',
    reason: 'Custom preferred attraction added by traveler.'
  });

  // Selected time for each recommended card
  const [selectedTimes, setSelectedTimes] = useState({});
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [expandedState, setExpandedState] = useState({
    attractions: false,
    restaurants: false,
    restStops: false,
    lodging: false,
    refuel: false
  });

  // Autocomplete handlers
  const handleSourceInputChange = async (e) => {
    const value = e.target.value;
    setSourceInput(value);
    setFormData(prev => ({ ...prev, source: value }));
    if (value.trim().length > 2) {
      setSourceLoading(true);
      try {
        const res = await getAutocompletePredictions(value);
        if (res.success) {
          setSourcePredictions(res.predictions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSourceLoading(false);
      }
    } else {
      setSourcePredictions([]);
    }
  };

  const handleSelectSourcePrediction = async (prediction) => {
    setSourceInput(prediction.description);
    setSourcePredictions([]);
    setFormData(prev => ({
      ...prev,
      source: prediction.description,
      sourcePlaceId: prediction.placeId
    }));
  };

  const handleDestInputChange = async (e) => {
    const value = e.target.value;
    setDestInput(value);
    setFormData(prev => ({ ...prev, destination: value }));
    if (value.trim().length > 2) {
      setDestLoading(true);
      try {
        const res = await getAutocompletePredictions(value);
        if (res.success) {
          setDestPredictions(res.predictions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDestLoading(false);
      }
    } else {
      setDestPredictions([]);
    }
  };

  const handleSelectDestPrediction = async (prediction) => {
    setDestInput(prediction.description);
    setDestPredictions([]);
    setFormData(prev => ({
      ...prev,
      destination: prediction.description,
      destinationPlaceId: prediction.placeId
    }));
  };

  const handleResumeTrip = async (trip) => {
    setFormData({
      source: trip.source,
      destination: trip.destination,
      tripType: trip.tripType || 'Family',
      foodPreference: trip.foodPreference || 'Any',
      budget: trip.budget || 'Medium',
      vehicleType: trip.vehicleType || 'EV',
      tripDate: trip.tripDate,
      startTime: trip.startTime || '09:00 AM',
      fuelOrBatteryLevel: trip.fuelOrBatteryLevel || 85,
      mileageOrRange: trip.mileageOrRange || 340,
      durationDays: trip.durationDays || 1,
      tripStyle: trip.tripStyle || 'Balanced',
      interests: trip.interests || [],
      sourcePlaceId: trip.sourcePlaceId,
      destinationPlaceId: trip.destinationPlaceId,
      sourceCoords: trip.sourceCoords,
      destinationCoords: trip.destinationCoords,
      sourceAddress: trip.sourceAddress,
      destinationAddress: trip.destinationAddress,
      tripMode: trip.tripMode || 'One Way'
    });
    setSourceInput(trip.source);
    setDestInput(trip.destination);
    setTripId(trip.tripId);
    setTimeline(trip.timeline || []);
    setInfeasible(trip.infeasible || []);
    localStorage.setItem('gd_infeasible', JSON.stringify(trip.infeasible || []));
    setActiveTrip(null); // Clear banner
    if (trip.weatherData) {
      setWeather(trip.weatherData);
    }

    localStorage.setItem('gd_tripId', trip.tripId);
    localStorage.setItem('gd_timeline', JSON.stringify(trip.timeline || []));

    setLoading(true);
    try {
      const recsRes = await recommendPlaces({
        destination: trip.destination,
        foodPreference: trip.foodPreference,
        budget: trip.budget,
        vehicleType: trip.vehicleType,
        tripId: trip.tripId
      });
      if (recsRes.success) {
        setRecommendations(recsRes.data);
        localStorage.setItem('gd_recommendations', JSON.stringify(recsRes.data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Time conversion helper for chronological sorting
  const parseTime = (timeStr, day = 1) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(' ');
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    const timeParts = time.split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    let rawMins = hours * 60 + minutes;
    const dayStartMins = (day === 1) 
      ? timeToMinutes(formData.startTime || '09:00 AM')
      : 540; // 09:00 AM

    if (rawMins < dayStartMins) {
      rawMins += 1440; // Past midnight adjustment
    }
    return rawMins;
  };

  // Sort timeline chronologically
  const sortTimeline = (list) => {
    return [...list].sort((a, b) => {
      if (a.day !== b.day) return (a.day || 1) - (b.day || 1);
      return parseTime(a.time, a.day) - parseTime(b.time, b.day);
    });
  };

  // Sync timeline with backend and local storage
  const syncTimeline = async (newTimeline) => {
    const sorted = sortTimeline(newTimeline);
    setTimeline(sorted);
    localStorage.setItem('gd_timeline', JSON.stringify(sorted));

    if (tripId) {
      setSyncing(true);
      try {
        const valRes = await validateItinerary(sorted, {
          source: formData.source,
          destination: formData.destination,
          startTime: formData.startTime,
          tripDate: formData.tripDate,
          sourceCoords: formData.sourceCoords,
          destinationCoords: formData.destinationCoords,
          sourcePlaceId: formData.sourcePlaceId,
          destinationPlaceId: formData.destinationPlaceId,
          sourceAddress: formData.sourceAddress,
          destinationAddress: formData.destinationAddress,
          durationDays: formData.durationDays
        });

        if (valRes.suggestions && valRes.suggestions.length > 0) {
          setSuggestedFixes(valRes.suggestions);
        } else {
          setSuggestedFixes([]);
        }

        await updateItineraryTimeline(tripId, sorted);
      } catch (err) {
        console.error('Failed to sync timeline with server, using local fallback:', err);
      } finally {
        setSyncing(false);
      }
    }
  };

  // Load existing recommendations & timeline from localStorage on mount
  useEffect(() => {
    const savedRecs = localStorage.getItem('gd_recommendations');
    const savedForm = localStorage.getItem('gd_form');
    const savedTripId = localStorage.getItem('gd_tripId');
    const savedTimeline = localStorage.getItem('gd_timeline');
    const savedInfeasible = localStorage.getItem('gd_infeasible');

    if (savedTripId) setTripId(savedTripId);
    if (savedRecs) setRecommendations(JSON.parse(savedRecs));
    if (savedInfeasible) setInfeasible(JSON.parse(savedInfeasible));
    if (savedForm) {
      const parsedForm = JSON.parse(savedForm);
      setFormData(parsedForm);
      setSourceInput(parsedForm.source);
      setDestInput(parsedForm.destination);
    }
    
    if (savedTimeline) {
      setTimeline(JSON.parse(savedTimeline));
    } else if (savedTripId) {
      const loadTimeline = async () => {
        try {
          const res = await getItinerary(savedTripId);
          if (res.success && res.data.timeline) {
            setTimeline(sortTimeline(res.data.timeline));
            localStorage.setItem('gd_timeline', JSON.stringify(res.data.timeline));
            if (res.data.infeasible) {
              setInfeasible(res.data.infeasible);
              localStorage.setItem('gd_infeasible', JSON.stringify(res.data.infeasible));
            }
            if (res.data.weatherData) {
              setWeather(res.data.weatherData);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadTimeline();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'vehicleType') {
        updated.mileageOrRange = value === 'EV' ? 340 : 580;
      }
      return updated;
    });
  };

  const handleCustomPlaceChange = (e) => {
    const { name, value } = e.target;
    setCustomPlace((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTimeline([]);
    setSuggestedFixes([]);
    setRecommendations(null);
    setWeather(null);
    setInfeasible([]);
    localStorage.removeItem('gd_timeline');
    localStorage.removeItem('gd_recommendations');
    localStorage.removeItem('gd_tripId');
    localStorage.removeItem('gd_infeasible');

    const generatedTripId = 'trip_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setTripId(generatedTripId);

    try {
      // 1. Generate Itinerary (initializes the Digital Twin and Agent recommendations)
      const itinRes = await generateItinerary({
        ...formData,
        tripId: generatedTripId,
        userId: user.id
      });

      if (itinRes.success && itinRes.data.weatherData) {
        setWeather(itinRes.data.weatherData);
      }

      // 2. Fetch Place Recommendations
      const recsRes = await recommendPlaces({
        destination: formData.destination,
        foodPreference: formData.foodPreference,
        budget: formData.budget,
        vehicleType: formData.vehicleType,
        tripId: generatedTripId
      });

      if (recsRes.success) {
        setRecommendations(recsRes.data);
        const generatedTimeline = sortTimeline(itinRes.data.timeline || []);
        setTimeline(generatedTimeline);
        const generatedInfeasible = itinRes.data.infeasible || [];
        setInfeasible(generatedInfeasible);

        // Save states in localStorage
        localStorage.setItem('gd_tripId', generatedTripId);
        localStorage.setItem('gd_form', JSON.stringify(formData));
        localStorage.setItem('gd_recommendations', JSON.stringify(recsRes.data));
        localStorage.setItem('gd_timeline', JSON.stringify(generatedTimeline));
        localStorage.setItem('gd_infeasible', JSON.stringify(generatedInfeasible));
      } else {
        throw new Error('Failed to retrieve places recommendations');
      }
    } catch (err) {
      setError(err.error || err.message || 'An unexpected error occurred. Make sure your backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ADD Recommended Place to Itinerary
  const handleAddRecommendation = (item, type) => {
    const defaultTimes = {
      restaurant: '01:30 PM',
      restStop: '11:30 AM',
      lodging: '09:00 PM',
      attraction: '04:00 PM'
    };
    const eventTime = selectedTimes[item.name] || defaultTimes[type] || '04:00 PM';

    const purposeMap = {
      restaurant: 'Meal Break',
      restStop: 'Rest Stop',
      lodging: 'Overnight Stay',
      attraction: 'Sightseeing'
    };

    const reasonMap = {
      restaurant: `Dine at highly-rated local restaurant serving ${item.cuisine || 'local'} cuisine.`,
      restStop: `Rest stop with facilities: ${item.facilities?.join(', ') || 'basic amenities'}.`,
      lodging: `Stay at ${item.type || 'lodging'} — ${item.name}. Price: ${item.pricePerNight || 'N/A'}.`,
      attraction: `Visit recommended tourist attraction: ${item.description?.substring(0, 50) || 'Scenic view'}...`
    };

    const newEvent = {
      day: selectedTimelineDay,
      place: item.name,
      time: eventTime,
      purpose: purposeMap[type] || 'Sightseeing',
      reason: reasonMap[type] || 'Added by traveler.'
    };

    // Check if already present to avoid duplicates
    if (timeline.some(e => e.place.toLowerCase() === item.name.toLowerCase())) {
      return;
    }

    const updatedTimeline = [...timeline, newEvent];
    syncTimeline(updatedTimeline);
  };

  const getDayDrivingMinutes = (dayNum) => {
    return timeline
      .filter(t => (t.day || 1) === dayNum)
      .reduce((acc, t) => {
        if (!t.travelTimeFromPrevious) return acc;
        const matchH = t.travelTimeFromPrevious.match(/(\d+)h/);
        const matchM = t.travelTimeFromPrevious.match(/(\d+)m/);
        const hrs = matchH ? parseInt(matchH[1], 10) : 0;
        const mins = matchM ? parseInt(matchM[1], 10) : 0;
        return acc + (hrs * 60 + mins);
      }, 0);
  };

  const filteredTimeline = timeline.filter(event => (event.day || 1) === selectedTimelineDay);
  const dayMins = getDayDrivingMinutes(selectedTimelineDay);
  const dayDistance = dayMins; // 1 km per min average
  const energyDecrease = Math.round(dayDistance / 4);

  // DELETE Place from Itinerary
  const handleRemovePlace = (placeName) => {
    const updatedTimeline = timeline.filter(event => event.place.toLowerCase() !== placeName.toLowerCase());
    syncTimeline(updatedTimeline);
  };

  // ADD Custom Place
  const handleAddCustomPlace = (e) => {
    e.preventDefault();
    if (!customPlace.name.trim()) return;

    const newEvent = {
      day: selectedTimelineDay,
      place: customPlace.name,
      time: customPlace.time,
      purpose: customPlace.purpose,
      reason: customPlace.reason
    };

    // Check for duplicates
    if (timeline.some(e => e.place.toLowerCase() === customPlace.name.toLowerCase())) {
      alert('This place is already in your itinerary.');
      return;
    }

    const updatedTimeline = [...timeline, newEvent];
    syncTimeline(updatedTimeline);

    // Reset input
    setCustomPlace({
      name: '',
      time: '04:00 PM',
      purpose: 'Sightseeing',
      reason: 'Custom preferred attraction added by traveler.'
    });
  };

  const isPlaceInTimeline = (placeName) => {
    if (!placeName) return false;
    return timeline.some(event => (event.place || "").toLowerCase() === placeName.toLowerCase());
  };

  const checkCardFeasibility = (item, type) => {
    if (!item || !item.name) return { valid: false, reason: "Missing place name" };
    const defaultTimes = {
      restaurant: '01:30 PM',
      restStop: '11:30 AM',
      lodging: '09:00 PM',
      attraction: '04:00 PM',
      refuel: '10:00 AM'
    };
    const timeVal = selectedTimes[item.name] || defaultTimes[type] || '04:00 PM';
    const tripStartTime = formData.startTime;
    const tripDate = formData.tripDate;
    
    // Check opening hours first
    const specs = getLocalSpecs(item.name);
    const duration = specs.duration !== undefined ? specs.duration : 60;
    const status = getLocalPlaceTimeStatus(item.name, timeVal);
    if (status === 'CLOSED') {
      const openTime = specs.open || specs.openTime || "09:00 AM";
      const closeTime = specs.close || specs.closeTime || "06:00 PM";
      return { valid: false, reason: `Closed (Opens: ${openTime} - ${closeTime})` };
    }
    if (status === 'NOT ENOUGH TIME') {
      return { valid: false, reason: 'Not enough visit time' };
    }

    // Check start time limits
    if (timeToMinutes(timeVal) < timeToMinutes(tripStartTime)) {
      return { valid: false, reason: `Before departure (${tripStartTime})` };
    }

    // Check past time today
    const startCheck = validateTripStart(tripDate, timeVal);
    if (!startCheck.valid) {
      return { valid: false, reason: "Time is in the past today." };
    }

    // Timeline travel checks
    if (timeline.length > 0) {
      const source = timeline[0].place;
      const destination = formData.destination;
      
      const newItem = {
        day: selectedTimelineDay,
        place: item.name,
        time: timeVal,
        purpose: type === 'restaurant' ? 'Meal Break' : (type === 'restStop' ? 'Rest Stop' : (type === 'lodging' ? 'Overnight Stay' : 'Sightseeing'))
      };

      // Exclude item by name if already temporarily added, then sort
      const filteredTimeline = timeline.filter(e => (e.place || "").toLowerCase() !== item.name.toLowerCase());
      const simulatedTimeline = [...filteredTimeline, newItem].sort((a, b) => {
        if (a.day !== b.day) return (a.day || 1) - (b.day || 1);
        return parseTime(a.time, a.day) - parseTime(b.time, b.day);
      });
      
      const idx = simulatedTimeline.findIndex(e => (e.place || "").toLowerCase() === item.name.toLowerCase());
      
      // 1. Check preceding waypoint constraints
      if (idx > 0) {
        const predecessor = simulatedTimeline[idx - 1];
        const transit = getLocalTravelOffset(predecessor.place, newItem.place, source, destination);
        const earliestArrivalStr = getEarliestArrival(predecessor, transit);
        const earliestArrivalMins = timeToMinutes(earliestArrivalStr);
        if (timeToMinutes(timeVal) < earliestArrivalMins) {
          return { 
            valid: false, 
            reason: `Unavailable: Earliest arrival after ${predecessor.place} is ${earliestArrivalStr} (transit: ${transit}m)` 
          };
        }
      }

      // 2. Check succeeding waypoint constraints
      if (idx < simulatedTimeline.length - 1) {
        const successor = simulatedTimeline[idx + 1];
        const transitToSuccessor = getLocalTravelOffset(newItem.place, successor.place, source, destination);
        const endTimeMins = timeToMinutes(timeVal) + duration;
        const earliestSuccessorArrivalMins = endTimeMins + transitToSuccessor;
        const successorScheduledMins = timeToMinutes(successor.time);
        
        if (successorScheduledMins < earliestSuccessorArrivalMins) {
          return { 
            valid: false, 
            reason: `Overlap conflict: ${successor.place} starts at ${successor.time}, but you can only reach it at ${minutesToTime(earliestSuccessorArrivalMins)} (duration: ${duration}m, transit: ${transitToSuccessor}m)` 
          };
        }
      }
    }

    return { valid: true };
  };

  const handleCardTimeChange = (placeName, timeVal) => {
    setSelectedTimes(prev => ({
      ...prev,
      [placeName]: timeVal
    }));
  };

  // Filter recommendations based on search query
  const getFilteredItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return items;
    return items.filter(item => {
      if (!item) return false;
      const matchName = (item.name || "").toLowerCase().includes(query);
      const matchType = (item.type || "").toLowerCase().includes(query);
      const matchTags = (item.tags || []).some(tag => (tag || "").toLowerCase().includes(query));
      const matchLocation = (item.location || "").toLowerCase().includes(query);
      const matchCuisine = (item.cuisine || "").toLowerCase().includes(query);
      const matchDesc = (item.description || "").toLowerCase().includes(query);
      const matchBudget = (item.budget || "").toLowerCase().includes(query);
      
      return matchName || matchType || matchTags || matchLocation || matchCuisine || matchDesc || matchBudget;
    });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHours = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        const padH = String(displayHours).padStart(2, '0');
        const padM = String(m).padStart(2, '0');
        options.push(`${padH}:${padM} ${ampm}`);
      }
    }
    return options;
  };
  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Active Trip Resume Banner */}
      {activeTrip && (
        <div className="bg-gradient-to-r from-purple-950/80 to-blue-950/80 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-scale-up">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-300">
              <Compass className="h-5 w-5 animate-spin-slow text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Active Saved Trip Found</h4>
              <p className="text-xs text-slate-300">
                You have an active itinerary from <span className="font-bold text-purple-300">{activeTrip.source}</span> to <span className="font-bold text-blue-300">{activeTrip.destination}</span> ({activeTrip.durationDays} Days).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setActiveTrip(null)}
              className="px-3 py-1.5 bg-slate-900/50 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={() => handleResumeTrip(activeTrip)}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Resume Journey
            </button>
          </div>
        </div>
      )}

      {/* Auto-Repair Suggestions Modal */}
      {suggestedFixes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl">
                <ShieldAlert className="h-6 w-6 animate-pulse text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Suggested Improvement Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Our AI Scheduler detected closing time or travel overlaps in your waypoints. Choose a recommended optimization path below to repair your trip timeline:
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {suggestedFixes.map((fix, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 bg-slate-950/80 border border-slate-850 hover:border-purple-500/30 rounded-xl transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border inline-block mb-1 tracking-wider ${
                      fix.option === 'A' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      fix.option === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      Option {fix.option}: {fix.option === 'A' ? 'Move Earlier' : fix.option === 'B' ? 'Swap Stops' : 'Shift to Tomorrow'}
                    </span>
                    <p className="text-xs font-semibold text-white leading-relaxed">{fix.description}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (tripId) {
                        try {
                          const res = await applyItineraryFix(tripId, fix.timeline);
                          if (res.success) {
                            setTimeline(sortTimeline(res.data.timeline));
                            localStorage.setItem('gd_timeline', JSON.stringify(res.data.timeline));
                            setSuggestedFixes([]);
                          }
                        } catch (err) {
                          console.error(err);
                          alert('Failed to apply itinerary fix.');
                        }
                      }
                    }}
                    className="self-end px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-md cursor-pointer"
                  >
                    Apply Reschedule
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSuggestedFixes([])}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-450 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Keep Original
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Journey Companion
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Configure trip parameters, search, add, and build your digital-twin monitored itinerary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form + Active Timeline Preview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Trip settings form */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 shadow-xl relative">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Compass className="text-purple-400 h-5 w-5" />
              Trip Configuration
            </h2>

            {vehicleLoading ? (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950/40 border border-slate-850 rounded-xl mb-4">
                <Loader2 className="animate-spin h-5 w-5 text-purple-500 mb-2" />
                <span className="text-[10px] text-slate-500">Retrieving vehicle profile...</span>
              </div>
            ) : vehicle ? (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-4 relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">{vehicle.model}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-bold rounded border border-purple-500/20">
                    {vehicle.type}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                    <span className="text-slate-500 block text-[9px] font-semibold uppercase">Charge / Fuel</span>
                    <span className="text-slate-200 font-bold">
                      {vehicle.type === 'EV' ? `${vehicle.batteryPercentage}%` : `${vehicle.fuelPercentage}%`}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-850">
                    <span className="text-slate-500 block text-[9px] font-semibold uppercase">Current Range</span>
                    <span className="text-slate-200 font-bold">{vehicle.range} km</span>
                  </div>
                  {vehicle.type !== 'EV' && (
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-850 col-span-2">
                      <span className="text-slate-500 block text-[9px] font-semibold uppercase">Mileage</span>
                      <span className="text-slate-200 font-bold">{vehicle.mileage} km/l</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/vehicle-setup')}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/30 text-purple-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center"
                >
                  Edit Vehicle Profile
                </button>
              </div>
            ) : (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 mb-4 text-center">
                <ShieldAlert className="h-8 w-8 text-rose-400 mx-auto mb-2 animate-pulse" />
                <h4 className="text-xs font-bold text-white mb-1">Vehicle Setup Required</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Complete Vehicle Setup before planning a trip.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/vehicle-setup')}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Go to Vehicle Setup
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Source Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    value={sourceInput}
                    onChange={handleSourceInputChange}
                    required
                    placeholder="Search source city (e.g. Bangalore)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors"
                  />
                  {sourceLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-500 animate-spin" />
                  )}
                </div>
                {sourcePredictions.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-slate-950 border border-slate-850 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1">
                    {sourcePredictions.map((pred, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSourcePrediction(pred)}
                        className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                      >
                        {pred.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 h-4 w-4" />
                  <input
                    type="text"
                    value={destInput}
                    onChange={handleDestInputChange}
                    required
                    placeholder="Search destination city (e.g. Mysore)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors"
                  />
                  {destLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-500 animate-spin" />
                  )}
                </div>
                {destPredictions.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-slate-950 border border-slate-850 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1">
                    {destPredictions.map((pred, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectDestPrediction(pred)}
                        className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                      >
                        {pred.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Trip Type
                  </label>
                  <select
                    name="tripType"
                    value={formData.tripType}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Solo">Solo</option>
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Trip Mode
                  </label>
                  <select
                    name="tripMode"
                    value={formData.tripMode || 'One Way'}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="One Way">One Way</option>
                    <option value="Round Trip">Round Trip</option>
                  </select>
                </div>
              </div>

              {/* Trip Date & Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Trip Date
                  </label>
                  <input
                    type="date"
                    name="tripDate"
                    value={formData.tripDate}
                    onChange={handleChange}
                    required
                    className={`w-full bg-slate-950 border rounded-lg py-1.5 px-3 text-white text-xs focus:outline-none transition-colors ${
                      formErrors.tripDate 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-emerald-500/30 focus:border-purple-500/80'
                    }`}
                  />
                  {formErrors.tripDate && (
                    <span className="text-[9px] text-red-400 mt-1 block font-medium">{formErrors.tripDate}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Start Time
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-white text-xs focus:outline-none transition-colors appearance-none cursor-pointer ${
                      formErrors.startTime
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-emerald-500/30 focus:border-purple-500/80'
                    }`}
                  >
                    {timeOptions.map((time, idx) => {
                      const isDisabled = isPastTimeToday(formData.tripDate, time);
                      return (
                        <option key={idx} value={time} disabled={isDisabled}>
                          {time} {isDisabled ? '(Past)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {formErrors.startTime && (
                    <span className="text-[9px] text-red-400 mt-1 block font-medium">{formErrors.startTime}</span>
                  )}
                </div>
              </div>

              {/* Trip Duration, Trip Style, and Interests Preferences */}
              <div className="space-y-3 pt-1 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Trip Duration
                    </label>
                    <select
                      name="durationDaysSelect"
                      value={[1, 2, 3, 4, 5].includes(formData?.durationDays || 1) ? formData.durationDays : 'Custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Custom') {
                          setFormData(prev => ({ ...prev, durationDays: customDays }));
                        } else {
                          setFormData(prev => ({ ...prev, durationDays: Number(val) }));
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none cursor-pointer"
                    >
                      <option value={1}>1 Day</option>
                      <option value={2}>2 Days</option>
                      <option value={3}>3 Days</option>
                      <option value={4}>4 Days</option>
                      <option value={5}>5 Days</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {![1, 2, 3, 4, 5].includes(formData?.durationDays || 1) && (
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formData.durationDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomDays(val);
                          setFormData(prev => ({ ...prev, durationDays: val }));
                        }}
                        className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80"
                        placeholder="Enter number of days"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Trip Style
                    </label>
                    <select
                      name="tripStyle"
                      value={formData.tripStyle}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Relaxed">Relaxed (Slow-paced)</option>
                      <option value="Balanced">Balanced (Standard)</option>
                      <option value="Packed">Packed (Full-itinerary)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Travel Interests
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {['Nature', 'Food', 'Heritage', 'Adventure', 'Family', 'Spiritual'].map((interest) => {
                      const selected = (formData?.interests || []).includes(interest);
                      return (
                        <button
                          type="button"
                          key={interest}
                          onClick={() => {
                            setFormData(prev => {
                              const interests = (prev.interests || []).includes(interest)
                                ? (prev.interests || []).filter(i => i !== interest)
                                : [...(prev.interests || []), interest];
                              return { ...prev, interests };
                            });
                          }}
                          className={`py-1.5 px-1.5 rounded border text-[9px] font-bold transition-all cursor-pointer text-center ${
                            selected
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-250'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Food Preference
                  </label>
                  <select
                    name="foodPreference"
                    value={formData.foodPreference}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Any">Any</option>
                    <option value="Veg">Veg Only</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Budget
                  </label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Live validation summary status bar */}
              <div className={`mt-2 py-1.5 px-3 rounded-lg border text-[10px] font-semibold flex items-center justify-between transition-all ${
                isFormValid 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/5 border-rose-500/20 text-rose-400 animate-pulse'
              }`}>
                <span>System Validation:</span>
                <span>
                  {isFormValid 
                    ? '✓ Trip timing configuration looks valid.' 
                    : `⚠️ Fix ${Object.keys(formErrors).length} issues before generating itinerary.`}
                </span>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading || !vehicle}
                className={`w-full text-white rounded-lg py-2.5 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 mt-3 shadow-md ${
                  (!isFormValid || !vehicle)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-700'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 cursor-pointer hover:shadow-purple-500/15'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                    Synchronizing Twin...
                  </>
                ) : (
                  <>
                    Generate Itinerary
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-3 p-2.5 bg-red-950/40 border border-red-500/20 rounded-lg text-red-300 text-[11px] leading-relaxed">
                {error}
              </div>
            )}
          </div>

          {/* Timeline preview list */}
          {timeline.length > 0 && (
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl animate-scale-up">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2.5">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <CalendarRange className="h-4.5 w-4.5 text-purple-400" />
                  Active Waypoints ({timeline.length})
                </h3>
                {syncing && <span className="text-[10px] text-purple-400 font-semibold animate-pulse">Saving changes...</span>}
              </div>

              {/* Daywise tabs inside Waypoints list */}
              {formData.durationDays > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-3.5 border-b border-slate-850 pb-2">
                  {Array.from({ length: formData.durationDays }).map((_, idx) => {
                    const d = idx + 1;
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setSelectedTimelineDay(d)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedTimelineDay === d
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Day {d}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Daywise stats bar */}
              <div className="grid grid-cols-3 gap-2 text-[10px] mb-3.5 bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                <div className="text-center">
                  <span className="text-slate-550 block text-[8px] font-bold uppercase tracking-wider">Driving Time</span>
                  <span className="text-slate-200 font-bold font-mono">
                    {dayMins < 60 ? `${dayMins}m` : `${Math.floor(dayMins / 60)}h ${dayMins % 60}m`}
                  </span>
                </div>
                <div className="text-center border-x border-slate-850">
                  <span className="text-slate-550 block text-[8px] font-bold uppercase tracking-wider">Est. Distance</span>
                  <span className="text-slate-200 font-bold font-mono">{dayDistance} km</span>
                </div>
                <div className="text-center">
                  <span className="text-slate-550 block text-[8px] font-bold uppercase tracking-wider">{formData.vehicleType === 'EV' ? 'Battery Use' : 'Fuel Use'}</span>
                  <span className="text-slate-200 font-bold font-mono">~{energyDecrease}%</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                {filteredTimeline.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-850 rounded-lg group hover:border-purple-500/20 transition-all">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-purple-300 font-mono bg-purple-500/10 px-1 rounded flex-shrink-0">
                          {event.time}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{event.place}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{event.purpose}</p>
                      {event.warning && (
                        <p className="text-[9px] text-rose-400 leading-tight mt-1 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5 whitespace-pre-wrap max-w-[200px]">{event.warning}</p>
                      )}
                      {event.autoFixed && (
                        <p className="text-[9px] text-emerald-400 leading-tight mt-1 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 whitespace-pre-wrap max-w-[200px]">{event.autoFixMessage || '[Auto-Fixed Slot]'}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemovePlace(event.place)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors cursor-pointer opacity-30 group-hover:opacity-100 flex-shrink-0"
                      title="Delete waypoint"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Not Added due to Timing Section */}
              {infeasible && infeasible.length > 0 && (
                <div className="mt-4 p-4 bg-slate-950/60 border border-amber-500/20 rounded-xl shadow-inner">
                  <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Not Added due to Timing
                  </h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {infeasible.map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/50 border border-slate-850 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-350">{item.place}</span>
                          <span className="text-[9px] text-amber-500/80 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Infeasible</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal mt-1">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Search + Recommendations Tabs */}
        <div className="lg:col-span-8 flex flex-col min-h-[480px]">
          {recommendations ? (
            <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl animate-scale-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-4 mb-4 gap-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-yellow-400" />
                  Recommendations for {recommendations.destination}
                </h3>
                <button
                  onClick={() => navigate('/itinerary')}
                  className="px-3.5 py-1.5 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 hover:translate-x-1 cursor-pointer"
                >
                  View Itinerary
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Weather Forecast Widget */}
              {weather && (
                <div className="bg-slate-950/60 border border-purple-500/20 rounded-xl p-3 mb-4 flex items-center justify-between text-xs animate-scale-up">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {weather.condition === 'thunderstorm' ? '⛈️' :
                       weather.condition === 'rain' ? '🌧️' :
                       weather.condition === 'clear' ? '☀️' :
                       weather.condition === 'clouds' ? '☁️' : '🌫️'}
                    </span>
                    <div>
                      <span className="text-slate-300 font-bold">Weather at {formData.destination}: </span>
                      <span className="text-purple-300 font-semibold capitalize">{weather.description || weather.condition}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-200 font-bold">{Math.round(weather.temperature)}°C</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">Wind: {weather.windSpeed} km/h</span>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              {['attractions', 'restaurants', 'restStops', 'lodging'].includes(activeTab) && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search within ${activeTab}...`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                  />
                </div>
              )}

              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5 mb-4 border-b border-slate-850 pb-2">
                {[
                  { id: 'attractions', label: 'Attractions' },
                  { id: 'restaurants', label: 'Restaurants' },
                  { id: 'restStops', label: 'Rest Stops' },
                  { id: 'lodging', label: 'Lodging (Halts)' },
                  { id: 'refuel', label: formData.vehicleType === 'EV' ? 'EV Charging' : 'Fuel Stations' },
                  { id: 'custom', label: '+ Add Custom Stop' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery(''); // reset search
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3.5 pr-1.5 custom-scrollbar">
                
                {/* ATTRACTIONS TAB */}
                {activeTab === 'attractions' && (() => {
                  const filtered = getFilteredItems(recommendations.attractions || []);
                  const visible = expandedState.attractions ? filtered : filtered.slice(0, 5);
                  return (
                    visible.length > 0 ? (
                      <div className="space-y-3.5">
                        {visible.map((item, i) => {
                          const added = isPlaceInTimeline(item.name);
                          const timeVal = selectedTimes[item.name] || '04:00 PM';
                          const status = getLocalPlaceTimeStatus(item.name, timeVal);
                          return (
                            <div 
                              key={i} 
                              onClick={() => setSelectedPlace({ item, type: 'attraction' })}
                              className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 relative group"
                            >
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Info className="h-3.5 w-3.5 text-purple-400" />
                              </div>
                              <div className="space-y-1 sm:max-w-[70%]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                  <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-semibold rounded border border-purple-500/15">{item.type}</span>
                                  {status === 'OPEN' && <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">● Open</span>}
                                  {status === 'LIMITED' && <span className="text-[10px] text-yellow-500 font-semibold flex items-center gap-1">● Limited</span>}
                                  {status === 'NOT ENOUGH TIME' && <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">● Short Time</span>}
                                  {status === 'CLOSED' && <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">● Closed</span>}
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                                  <span>📍 {item.location}</span>
                                  <span className="text-yellow-500/90 font-semibold">★ {item.rating}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                {!added && (
                                  <select
                                    value={timeVal}
                                    onChange={(e) => handleCardTimeChange(item.name, e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                                  >
                                    {timeOptions.map((time, idx) => (
                                      <option key={idx} value={time}>{time}</option>
                                    ))}
                                  </select>
                                )}

                                {added ? (
                                  <button
                                    onClick={() => handleRemovePlace(item.name)}
                                    className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                    Added
                                  </button>
                                ) : (() => {
                                  const feasibility = checkCardFeasibility(item, 'attraction');
                                  return !feasibility.valid ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <button
                                        disabled
                                        className="px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50"
                                      >
                                        Add
                                      </button>
                                      <span className="text-[9px] text-rose-400 font-semibold text-right max-w-[130px] leading-tight">
                                        {feasibility.reason}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddRecommendation(item, 'attraction')}
                                      className="px-3 py-1 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                        {filtered.length > 5 && (
                          <button
                            onClick={() => setExpandedState(prev => ({ ...prev, attractions: !prev.attractions }))}
                            className="mt-2 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all cursor-pointer text-center w-full py-2 bg-slate-950/30 border border-slate-850 rounded-lg hover:bg-slate-900/50"
                          >
                            {expandedState.attractions ? 'Show Less' : `Show More (${filtered.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">No matching attractions found.</div>
                    )
                  );
                })()}

                {/* RESTAURANTS TAB */}
                {activeTab === 'restaurants' && (() => {
                  const filtered = getFilteredItems(recommendations.restaurants || []);
                  const visible = expandedState.restaurants ? filtered : filtered.slice(0, 5);
                  return (
                    visible.length > 0 ? (
                      <div className="space-y-3.5">
                        {visible.map((item, i) => {
                          const added = isPlaceInTimeline(item.name);
                          const timeVal = selectedTimes[item.name] || '01:30 PM';
                          const status = getLocalPlaceTimeStatus(item.name, timeVal);
                          return (
                            <div 
                              key={i} 
                              onClick={() => setSelectedPlace({ item, type: 'restaurant' })}
                              className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 relative group"
                            >
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Info className="h-3.5 w-3.5 text-purple-400" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-semibold rounded border border-blue-500/15">{item.cuisine}</span>
                                  {status === 'OPEN' && <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">● Open</span>}
                                  {status === 'LIMITED' && <span className="text-[10px] text-yellow-500 font-semibold flex items-center gap-1">● Limited</span>}
                                  {status === 'NOT ENOUGH TIME' && <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">● Short Time</span>}
                                  {status === 'CLOSED' && <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">● Closed</span>}
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                                  <span>📍 {item.location}</span>
                                  <span>Budget: {item.budget}</span>
                                  <span className="text-yellow-500/90 font-semibold">★ {item.rating}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                {!added && (
                                  <select
                                    value={timeVal}
                                    onChange={(e) => handleCardTimeChange(item.name, e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                                  >
                                    {timeOptions.map((time, idx) => (
                                      <option key={idx} value={time}>{time}</option>
                                    ))}
                                  </select>
                                )}

                                {added ? (
                                  <button
                                    onClick={() => handleRemovePlace(item.name)}
                                    className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                    Added
                                  </button>
                                ) : (() => {
                                  const feasibility = checkCardFeasibility(item, 'restaurant');
                                  return !feasibility.valid ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <button
                                        disabled
                                        className="px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50"
                                      >
                                        Add
                                      </button>
                                      <span className="text-[9px] text-rose-400 font-semibold text-right max-w-[130px] leading-tight">
                                        {feasibility.reason}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddRecommendation(item, 'restaurant')}
                                      className="px-3 py-1 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                        {filtered.length > 5 && (
                          <button
                            onClick={() => setExpandedState(prev => ({ ...prev, restaurants: !prev.restaurants }))}
                            className="mt-2 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all cursor-pointer text-center w-full py-2 bg-slate-950/30 border border-slate-850 rounded-lg hover:bg-slate-900/50"
                          >
                            {expandedState.restaurants ? 'Show Less' : `Show More (${filtered.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">No matching restaurants found.</div>
                    )
                  );
                })()}

                {/* REST STOPS TAB */}
                {activeTab === 'restStops' && (() => {
                  const filtered = getFilteredItems(recommendations.restStops || []);
                  const visible = expandedState.restStops ? filtered : filtered.slice(0, 5);
                  return (
                    visible.length > 0 ? (
                      <div className="space-y-3.5">
                        {visible.map((item, i) => {
                          const added = isPlaceInTimeline(item.name);
                          const timeVal = selectedTimes[item.name] || '11:30 AM';
                          const status = getLocalPlaceTimeStatus(item.name, timeVal);
                          return (
                            <div 
                              key={i} 
                              onClick={() => setSelectedPlace({ item, type: 'restStop' })}
                              className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 relative group"
                            >
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Info className="h-3.5 w-3.5 text-purple-400" />
                              </div>
                              <div className="space-y-1.5 sm:max-w-[70%]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded border border-emerald-500/15 font-semibold">{item.type}</span>
                                  {status === 'OPEN' && <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">● Open</span>}
                                  {status === 'LIMITED' && <span className="text-[10px] text-yellow-500 font-semibold flex items-center gap-1">● Limited</span>}
                                  {status === 'NOT ENOUGH TIME' && <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">● Short Time</span>}
                                  {status === 'CLOSED' && <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">● Closed</span>}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.facilities?.map((f, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded text-slate-400 text-[9px]">
                                      ✓ {f}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-500">📍 {item.location}</span>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                {!added && (
                                  <select
                                    value={timeVal}
                                    onChange={(e) => handleCardTimeChange(item.name, e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                                  >
                                    {timeOptions.map((time, idx) => (
                                      <option key={idx} value={time}>{time}</option>
                                    ))}
                                  </select>
                                )}

                                {added ? (
                                  <button
                                    onClick={() => handleRemovePlace(item.name)}
                                    className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                    Added
                                  </button>
                                ) : (() => {
                                  const feasibility = checkCardFeasibility(item, 'restStop');
                                  return !feasibility.valid ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <button
                                        disabled
                                        className="px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50"
                                      >
                                        Add
                                      </button>
                                      <span className="text-[9px] text-rose-400 font-semibold text-right max-w-[130px] leading-tight">
                                        {feasibility.reason}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddRecommendation(item, 'restStop')}
                                      className="px-3 py-1 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                        {filtered.length > 5 && (
                          <button
                            onClick={() => setExpandedState(prev => ({ ...prev, restStops: !prev.restStops }))}
                            className="mt-2 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all cursor-pointer text-center w-full py-2 bg-slate-950/30 border border-slate-850 rounded-lg hover:bg-slate-900/50"
                          >
                            {expandedState.restStops ? 'Show Less' : `Show More (${filtered.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">No matching rest stops found.</div>
                    )
                  );
                })()}

                {/* LODGING TAB */}
                {activeTab === 'lodging' && (() => {
                  const filtered = getFilteredItems(recommendations.haltingPlaces || []);
                  const visible = expandedState.lodging ? filtered : filtered.slice(0, 5);
                  return (
                    visible.length > 0 ? (
                      <div className="space-y-3.5">
                        {visible.map((item, i) => {
                          const added = isPlaceInTimeline(item.name);
                          const timeVal = selectedTimes[item.name] || '09:00 PM';
                          const status = getLocalPlaceTimeStatus(item.name, timeVal);
                          return (
                            <div 
                              key={i} 
                              onClick={() => setSelectedPlace({ item, type: 'lodging' })}
                              className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 relative group"
                            >
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Info className="h-3.5 w-3.5 text-purple-400" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded border border-amber-500/20">{item.type}</span>
                                  {status === 'OPEN' && <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">● Open</span>}
                                  {status === 'LIMITED' && <span className="text-[10px] text-yellow-500 font-semibold flex items-center gap-1">● Limited</span>}
                                  {status === 'NOT ENOUGH TIME' && <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">● Short Time</span>}
                                  {status === 'CLOSED' && <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">● Closed</span>}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                                  <span className="text-yellow-500/90 font-semibold">★ {item.rating}</span>
                                  <span className="text-emerald-400 font-bold font-mono">{item.pricePerNight}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                {!added && (
                                  <select
                                    value={timeVal}
                                    onChange={(e) => handleCardTimeChange(item.name, e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                                  >
                                    {timeOptions.map((time, idx) => (
                                      <option key={idx} value={time}>{time}</option>
                                    ))}
                                  </select>
                                )}

                                {added ? (
                                  <button
                                    onClick={() => handleRemovePlace(item.name)}
                                    className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                    Added
                                  </button>
                                ) : (() => {
                                  const feasibility = checkCardFeasibility(item, 'lodging');
                                  return !feasibility.valid ? (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <button
                                        disabled
                                        className="px-3 py-1 bg-slate-800 text-slate-500 border border-slate-700 rounded-lg text-xs font-semibold cursor-not-allowed opacity-50"
                                      >
                                        Add
                                      </button>
                                      <span className="text-[9px] text-rose-400 font-semibold text-right max-w-[130px] leading-tight">
                                        {feasibility.reason}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddRecommendation(item, 'lodging')}
                                      className="px-3 py-1 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                        {filtered.length > 5 && (
                          <button
                            onClick={() => setExpandedState(prev => ({ ...prev, lodging: !prev.lodging }))}
                            className="mt-2 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all cursor-pointer text-center w-full py-2 bg-slate-950/30 border border-slate-850 rounded-lg hover:bg-slate-900/50"
                          >
                            {expandedState.lodging ? 'Show Less' : `Show More (${filtered.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">No matching lodging options found.</div>
                    )
                  );
                })()}

                {/* REFUEL TAB */}
                {activeTab === 'refuel' && (() => {
                  const filtered = getFilteredItems(recommendations.fuelChargingStops || []);
                  const visible = expandedState.refuel ? filtered : filtered.slice(0, 5);
                  return (
                    visible.length > 0 ? (
                      <div className="space-y-3.5">
                        {visible.map((item, i) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedPlace({ item, type: 'refuel' })}
                            className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex justify-between items-center cursor-pointer hover:bg-slate-900/40 relative group"
                          >
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Info className="h-3.5 w-3.5 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm">{item.name}</h4>
                              <span className="text-[10px] text-slate-500">📍 {item.location}</span>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border inline-block mb-1 ${
                                item.type === 'EV' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              }`}>
                                {item.type}
                              </span>
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end font-semibold">
                                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {filtered.length > 5 && (
                          <button
                            onClick={() => setExpandedState(prev => ({ ...prev, refuel: !prev.refuel }))}
                            className="mt-2 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all cursor-pointer text-center w-full py-2 bg-slate-950/30 border border-slate-850 rounded-lg hover:bg-slate-900/50"
                          >
                            {expandedState.refuel ? 'Show Less' : `Show More (${filtered.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">No matching stations found.</div>
                    )
                  );
                })()}

                {/* CUSTOM ADD FORM TAB */}
                {activeTab === 'custom' && (
                  <form onSubmit={handleAddCustomPlace} className="p-5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <PlusCircle className="text-purple-400 h-4.5 w-4.5" />
                      Add Custom Waypoint Stop
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Place Name</label>
                        <input
                          type="text"
                          name="name"
                          value={customPlace.name}
                          onChange={handleCustomPlaceChange}
                          required
                          placeholder="e.g. Lalitha Mahal Palace"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500/60"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Arrival Time</label>
                        <select
                          name="time"
                          value={customPlace.time}
                          onChange={handleCustomPlaceChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500/60 cursor-pointer"
                        >
                          {timeOptions.map((time, idx) => (
                            <option key={idx} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Purpose / Type</label>
                        <input
                          type="text"
                          name="purpose"
                          value={customPlace.purpose}
                          onChange={handleCustomPlaceChange}
                          required
                          placeholder="e.g. Dinner, Tea Break, Sightseeing"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500/60"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Recommendation / Note</label>
                        <input
                          type="text"
                          name="reason"
                          value={customPlace.reason}
                          onChange={handleCustomPlaceChange}
                          placeholder="e.g. Scenic resort view with high local ratings."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500/60"
                        />
                      </div>
                    </div>

                    {(() => {
                      const customFeasibility = checkCardFeasibility({ name: customPlace.name }, 'attraction');
                      const isBtnDisabled = !customPlace.name.trim() || !customFeasibility.valid;
                      return (
                        <div className="space-y-1.5">
                          <button
                            type="submit"
                            disabled={isBtnDisabled}
                            className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-1 ${
                              isBtnDisabled
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white cursor-pointer shadow-md'
                            }`}
                          >
                            <Plus className="h-4 w-4" />
                            Add to Itinerary
                          </button>
                          {customPlace.name.trim() && !customFeasibility.valid && (
                            <span className="text-[10px] text-rose-400 block font-medium">
                              ⚠️ {customFeasibility.reason}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-900/10">
              <Compass className="h-12 w-12 text-slate-700 mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-400 mb-1">No Active Journey Twin</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Enter your start and target destination on the left, then click "Generate Itinerary" to load attractions and stops.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Google Maps-style Side Panel / Inspect Modal */}
      {selectedPlace && (() => {
        const { item, type } = selectedPlace;
        const added = isPlaceInTimeline(item.name);
        const defaultTimes = {
          restaurant: '01:30 PM',
          restStop: '11:30 AM',
          lodging: '09:00 PM',
          attraction: '04:00 PM',
          refuel: '10:00 AM'
        };
        const timeVal = selectedTimes[item.name] || defaultTimes[type] || '04:00 PM';
        const status = getLocalPlaceTimeStatus(item.name, timeVal);
        const specs = getLocalSpecs(item.name);
        const feasibility = checkCardFeasibility(item, type);
        const openTime = specs.open || specs.openTime || "09:00 AM";
        const closeTime = specs.close || specs.closeTime || "06:00 PM";
        const minDur = specs.minDuration || specs.minimumVisitDuration || 60;
        const recDur = specs.duration || specs.recommendedVisitDuration || 90;

        // Calculate available time
        let availableText = "N/A";
        if (openTime === "24 hours" || !closeTime) {
          availableText = "Open 24 hours";
        } else {
          const arrivalMins = timeToMinutes(timeVal);
          const closeMins = timeToMinutes(closeTime);
          const diff = closeMins - arrivalMins;
          if (diff < 0) {
            availableText = "Closed at this time";
          } else {
            const hrs = Math.floor(diff / 60);
            const mins = diff % 60;
            availableText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-sm transition-opacity duration-300">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedPlace(null)}></div>
            
            {/* Panel */}
            <div className="relative w-full max-w-md bg-slate-900/95 border-l border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-slide-in overflow-hidden">
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
              
              {/* Header */}
              <div className="p-6 border-b border-slate-850 flex items-start justify-between mt-1.5">
                <div className="space-y-1">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border tracking-wider ${
                    type === 'attraction' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    type === 'restaurant' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    type === 'restStop' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    type === 'lodging' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {type === 'lodging' ? 'Lodging' : type}
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight leading-tight">{item.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                    {item.rating && (
                      <span className="flex items-center gap-1 font-semibold text-yellow-500">
                        ★ {item.rating}
                      </span>
                    )}
                    {item.budget && (
                      <span>Budget: <span className="text-emerald-400 font-bold">{item.budget}</span></span>
                    )}
                    {item.pricePerNight && (
                      <span className="text-emerald-400 font-mono font-bold">{item.pricePerNight}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <span className="text-sm font-semibold px-1">✕</span>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Description & Location */}
                <div className="space-y-3">
                  {item.description && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">About</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                    </div>
                  )}
                  {item.location && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</h4>
                      <p className="text-xs text-slate-300 flex items-center gap-1">
                        📍 {item.location}
                      </p>
                    </div>
                  )}
                  {item.cuisine && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuisine</h4>
                      <p className="text-xs text-slate-300">{item.cuisine}</p>
                    </div>
                  )}
                  {item.facilities && item.facilities.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facilities</h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.facilities.map((f, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-slate-300 text-[10px]">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags</h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-950 text-slate-400 text-[9px] rounded-full border border-slate-850">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-slate-850" />

                {/* Opening Hours & Best time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opening Hours</h4>
                    <p className="text-xs text-white font-semibold">
                      🕒 {openTime === "24 hours" ? "24 Hours" : `${openTime} - ${closeTime}`}
                    </p>
                  </div>
                  {item.tags && item.tags.includes("Evening") ? (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Time to Visit</h4>
                      <p className="text-xs text-yellow-400 font-semibold">🌅 Evening</p>
                    </div>
                  ) : item.tags && item.tags.includes("Breakfast") ? (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Time to Visit</h4>
                      <p className="text-xs text-orange-400 font-semibold">🍳 Morning / Breakfast</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Time to Visit</h4>
                      <p className="text-xs text-slate-400">Flexible hours</p>
                    </div>
                  )}
                </div>

                <hr className="border-slate-850" />

                {/* Visit Window Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visit Duration details</h4>
                  <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Available time at arrival:</span>
                      <span className={`font-semibold font-mono ${
                        availableText.includes("Closed") ? "text-rose-400" : "text-white"
                      }`}>{availableText}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Minimum required visit:</span>
                      <span className="text-white font-semibold font-mono">{minDur} mins</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Recommended visit:</span>
                      <span className="text-white font-semibold font-mono">{recDur} mins</span>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-850" />

                {/* Feasibility Status Check */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feasibility Status</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Timing Status:</span>
                    {status === 'OPEN' && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg flex items-center gap-1 animate-pulse">
                        ● Open (Enough Time)
                      </span>
                    )}
                    {status === 'LIMITED' && (
                      <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold rounded-lg flex items-center gap-1">
                        ● Limited Visit Window
                      </span>
                    )}
                    {status === 'NOT ENOUGH TIME' && (
                      <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg flex items-center gap-1">
                        ⚠️ Not Enough Time
                      </span>
                    )}
                    {status === 'CLOSED' && (
                      <span className="px-2.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-1">
                        🚫 Closed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action footer */}
              <div className="p-6 border-t border-slate-850 bg-slate-950/40 flex flex-col gap-3">
                {added ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <Check className="h-4.5 w-4.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full p-0.5" />
                      Added to your itinerary
                    </div>
                    <button
                      onClick={() => {
                        handleRemovePlace(item.name);
                        // don't close modal, just update
                      }}
                      className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Remove Stop
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Time Select */}
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Arrival Time</label>
                      <select
                        value={timeVal}
                        onChange={(e) => handleCardTimeChange(item.name, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 cursor-pointer"
                      >
                        {timeOptions.map((time, idx) => (
                          <option key={idx} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    {/* Add Button */}
                    {!feasibility.valid ? (
                      <div className="space-y-2">
                        <button
                          disabled
                          className="w-full py-2.5 bg-slate-800 text-slate-500 border border-slate-700 rounded-xl text-xs font-bold cursor-not-allowed opacity-50 flex items-center justify-center gap-1.5"
                        >
                          Add to Itinerary
                        </button>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                          <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-red-400 leading-tight font-medium">
                            {feasibility.reason}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          handleAddRecommendation(item, type);
                          setSelectedPlace(null); // close panel after add
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/20 hover:scale-[1.02] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Itinerary
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default JourneyCompanion;
