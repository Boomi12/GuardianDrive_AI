import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, ArrowRight, Loader2, UtensilsCrossed, CalendarRange, Car, DollarSign, Plus, Trash2, Check, Search, PlusCircle, Sparkles, ShieldAlert } from 'lucide-react';
import { generateItinerary, recommendPlaces, updateItineraryTimeline, getItinerary, getVehicle } from '../services/api';
import { 
  getCurrentDate, 
  getCurrentTimeRounded, 
  validateTripStart, 
  timeToMinutes, 
  isPlaceOpen, 
  getLocalSpecs, 
  getLocalTravelOffset, 
  getEarliestArrival 
} from '../utils/timeValidation';

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
    mileageOrRange: 340
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

  // Fetch Vehicle Profile
  useEffect(() => {
    const fetchVehicleProfile = async () => {
      setVehicleLoading(true);
      // Try local storage first to be responsive
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

  // Time conversion helper for chronological sorting
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(' ');
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    const timeParts = time.split(':');
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts.length > 1 ? parseInt(timeParts[1], 10) : 0;
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Sort timeline chronologically
  const sortTimeline = (list) => {
    return [...list].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  };

  // Sync timeline with backend and local storage
  const syncTimeline = async (newTimeline) => {
    const sorted = sortTimeline(newTimeline);
    setTimeline(sorted);
    
    // Save locally
    localStorage.setItem('gd_timeline', JSON.stringify(sorted));

    if (tripId) {
      setSyncing(true);
      try {
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

    if (savedTripId) setTripId(savedTripId);
    if (savedRecs) setRecommendations(JSON.parse(savedRecs));
    if (savedForm) setFormData(JSON.parse(savedForm));
    
    if (savedTimeline) {
      setTimeline(JSON.parse(savedTimeline));
    } else if (savedTripId) {
      // Fetch timeline from server
      const loadTimeline = async () => {
        try {
          const res = await getItinerary(savedTripId);
          if (res.success && res.data.timeline) {
            setTimeline(sortTimeline(res.data.timeline));
            localStorage.setItem('gd_timeline', JSON.stringify(res.data.timeline));
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

    const generatedTripId = 'trip_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setTripId(generatedTripId);

    try {
      // 1. Generate Itinerary (initializes the Digital Twin and Agent recommendations)
      const itinRes = await generateItinerary({
        ...formData,
        tripId: generatedTripId
      });

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

        // Save states in localStorage
        localStorage.setItem('gd_tripId', generatedTripId);
        localStorage.setItem('gd_form', JSON.stringify(formData));
        localStorage.setItem('gd_recommendations', JSON.stringify(recsRes.data));
        localStorage.setItem('gd_timeline', JSON.stringify(generatedTimeline));
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
    return timeline.some(event => event.place.toLowerCase() === placeName.toLowerCase());
  };

  const checkCardFeasibility = (item, type) => {
    const defaultTimes = {
      restaurant: '01:30 PM',
      restStop: '11:30 AM',
      lodging: '09:00 PM',
      attraction: '04:00 PM'
    };
    const timeVal = selectedTimes[item.name] || defaultTimes[type] || '04:00 PM';
    const tripStartTime = formData.startTime;
    const tripDate = formData.tripDate;
    
    // Check opening hours first
    const specs = getLocalSpecs(item.name);
    const duration = specs.duration !== undefined ? specs.duration : 60;
    const isOpen = isPlaceOpen(item.name, timeVal, duration);
    if (!isOpen) {
      return { valid: false, reason: `Closed (Opens: ${specs.open} - ${specs.close})` };
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
        place: item.name,
        time: timeVal,
        purpose: type === 'restaurant' ? 'Meal Break' : (type === 'restStop' ? 'Rest Stop' : (type === 'lodging' ? 'Overnight Stay' : 'Sightseeing'))
      };

      // Exclude item by name if already temporarily added, then sort
      const filteredTimeline = timeline.filter(e => e.place.toLowerCase() !== item.name.toLowerCase());
      const simulatedTimeline = [...filteredTimeline, newItem].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
      
      const idx = simulatedTimeline.findIndex(e => e.place.toLowerCase() === item.name.toLowerCase());
      
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
    if (!items) return [];
    return items.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const timeOptions = [
    '06:00 AM', '07:30 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:30 AM',
    '12:00 PM', '01:00 PM', '01:30 PM', '02:30 PM', '03:30 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
  ];

  return (
    <div className="space-y-8 animate-fade-in">
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
          <div className="bg-slate-900/60 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
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
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Bangalore"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 h-4 w-4" />
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none"
                  >
                    <option value="Mysore">Mysore</option>
                    <option value="Coorg">Coorg (Madikeri)</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Chikkamagaluru">Chikkamagaluru</option>
                    <option value="Ooty">Ooty</option>
                  </select>
                </div>
              </div>

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
                    {timeOptions.map((time, idx) => (
                      <option key={idx} value={time}>{time}</option>
                    ))}
                  </select>
                  {formErrors.startTime && (
                    <span className="text-[9px] text-red-400 mt-1 block font-medium">{formErrors.startTime}</span>
                  )}
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

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                {timeline.map((event, index) => (
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
                {activeTab === 'attractions' && (
                  getFilteredItems(recommendations.attractions).length > 0 ? (
                    getFilteredItems(recommendations.attractions).map((item, i) => {
                      const added = isPlaceInTimeline(item.name);
                      return (
                        <div key={i} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 sm:max-w-[70%]">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{item.name}</h4>
                              <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-semibold rounded border border-purple-500/15">{item.type}</span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                              <span>📍 {item.location}</span>
                              <span className="text-yellow-500/90 font-semibold">★ {item.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {!added && (
                              <select
                                value={selectedTimes[item.name] || '04:00 PM'}
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
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">No matching attractions found.</div>
                  )
                )}

                {/* RESTAURANTS TAB */}
                {activeTab === 'restaurants' && (
                  getFilteredItems(recommendations.restaurants).length > 0 ? (
                    getFilteredItems(recommendations.restaurants).map((item, i) => {
                      const added = isPlaceInTimeline(item.name);
                      return (
                        <div key={i} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{item.name}</h4>
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-semibold rounded border border-blue-500/15">{item.cuisine}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                              <span>📍 {item.location}</span>
                              <span>Budget: {item.budget}</span>
                              <span className="text-yellow-500/90 font-semibold">★ {item.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {!added && (
                              <select
                                value={selectedTimes[item.name] || '01:30 PM'}
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
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">No matching restaurants found.</div>
                  )
                )}

                {/* REST STOPS TAB */}
                {activeTab === 'restStops' && (
                  getFilteredItems(recommendations.restStops).length > 0 ? (
                    getFilteredItems(recommendations.restStops).map((item, i) => {
                      const added = isPlaceInTimeline(item.name);
                      return (
                        <div key={i} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 sm:max-w-[70%]">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{item.name}</h4>
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded border border-emerald-500/15 font-semibold">{item.type}</span>
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

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {!added && (
                              <select
                                value={selectedTimes[item.name] || '11:30 AM'}
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
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">No matching rest stops found.</div>
                  )
                )}

                {/* LODGING TAB */}
                {activeTab === 'lodging' && (
                  getFilteredItems(recommendations.haltingPlaces).length > 0 ? (
                    getFilteredItems(recommendations.haltingPlaces).map((item, i) => {
                      const added = isPlaceInTimeline(item.name);
                      return (
                        <div key={i} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{item.name}</h4>
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded border border-amber-500/20">{item.type}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                              <span className="text-yellow-500/90 font-semibold">★ {item.rating}</span>
                              <span className="text-emerald-400 font-bold font-mono">{item.pricePerNight}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {!added && (
                              <select
                                value={selectedTimes[item.name] || '09:00 PM'}
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
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">No matching lodging options found.</div>
                  )
                )}

                {/* REFUEL TAB */}
                {activeTab === 'refuel' && (
                  recommendations.fuelChargingStops?.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/20 transition-all flex justify-between items-center">
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
                  ))
                )}

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
    </div>
  );
};

export default JourneyCompanion;
