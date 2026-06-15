import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Sparkles, Navigation, ChevronRight, AlertCircle, ArrowRight, Edit3, Check, X, Info } from 'lucide-react';
import { getItinerary, updateWaypoint } from '../services/api';
import { validateWaypointTime } from '../utils/timeValidation';

const Itinerary = () => {
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time editing states
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTime, setEditingTime] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState(null);

  const timeOptions = [
    '06:00 AM', '07:00 AM', '07:30 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '01:00 PM', '01:30 PM', '02:30 PM', '03:30 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'
  ];

  // Time parser for offline fallback calculations
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

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const fetchItinerary = async () => {
    const tripId = localStorage.getItem('gd_tripId');
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getItinerary(tripId);
      if (res.success) {
        setItinerary(res.data);
      } else {
        throw new Error('Failed to retrieve itinerary');
      }
    } catch (err) {
      console.error('Error fetching itinerary from DB, using fallback:', err);
      // Fallback to localStorage data if DB isn't running or has error
      const savedForm = localStorage.getItem('gd_form');
      const savedTimeline = localStorage.getItem('gd_timeline');
      if (savedForm && savedTimeline) {
        const form = JSON.parse(savedForm);
        setItinerary({
          tripId,
          source: form.source,
          destination: form.destination,
          tripType: form.tripType,
          vehicleType: form.vehicleType,
          tripDate: form.tripDate,
          startTime: form.startTime,
          timeline: JSON.parse(savedTimeline)
        });
      } else {
        setError('Could not connect to database and no offline itinerary was found.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItinerary();
  }, []);

  const handleEditTime = (index, currentTime) => {
    setEditingIndex(index);
    setEditingTime(currentTime);
    setEditError(null);
  };

  const handleSaveTime = async (index, waypointId) => {
    const tripId = localStorage.getItem('gd_tripId');
    if (!tripId) return;

    setUpdating(true);
    setEditError(null);

    try {
      // 1. Try to sync with backend
      const res = await updateWaypoint(tripId, waypointId || index, { time: editingTime });
      if (res.success) {
        setItinerary(res.data);
        localStorage.setItem('gd_timeline', JSON.stringify(res.data.timeline));
        setEditingIndex(null);
        // Dispatch local twin updated event to refresh agents dashboard
        window.dispatchEvent(new Event('twin-updated'));
      }
    } catch (err) {
      console.warn('Backend sync failed, saving waypoint change locally:', err);
      
      // 2. Local fallback calculation logic
      const updatedTimeline = [...itinerary.timeline];
      updatedTimeline[index].time = editingTime;

      // Basic local validation logic to prevent breaking UI
      let currentTimeVal = parseTime(itinerary.startTime || '09:00 AM');
      const validatedTimeline = updatedTimeline.map((item, idx) => {
        const copy = { ...item };
        let transit = idx === 0 ? 0 : (idx === 1 ? 90 : 25);
        currentTimeVal += transit;
        
        const earliestStr = formatMinutes(currentTimeVal);
        const userTimeVal = parseTime(copy.time);
        
        if (userTimeVal < currentTimeVal) {
          copy.warning = `Invalid timing: Reachable at earliest ${earliestStr} due to driving travel times.`;
          currentTimeVal = userTimeVal; // preserve choice but warn
        } else {
          currentTimeVal = userTimeVal;
          copy.warning = null;
        }
        
        // Duration offset
        currentTimeVal += 60;
        copy.endTime = formatMinutes(currentTimeVal);
        copy.travelTimeFromPrevious = transit > 0 ? (transit >= 60 ? `${Math.floor(transit/60)}h ${transit%60}m` : `${transit}m`) : '0m';
        return copy;
      });

      setItinerary(prev => ({
        ...prev,
        timeline: validatedTimeline
      }));
      localStorage.setItem('gd_timeline', JSON.stringify(validatedTimeline));
      setEditingIndex(null);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-sm">Synthesizing itinerary timeline...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
        <AlertCircle className="h-12 w-12 text-slate-600 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-400 mb-1">No Active Itinerary Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          To view your journey timeline, you first need to plan a trip with your companion.
        </p>
        <button
          onClick={() => navigate('/journey')}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
        >
          Plan a Trip
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Trip Itinerary
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base flex items-center flex-wrap gap-2">
            <span>Route: </span>
            <span className="text-purple-300 font-semibold">{itinerary.source}</span>
            <ChevronRight className="h-3 w-3 text-slate-600 font-bold" />
            <span className="text-blue-300 font-semibold">{itinerary.destination}</span>
            <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] uppercase font-bold tracking-wider rounded">
              {itinerary.tripType}
            </span>
            {itinerary.tripDate && (
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold uppercase rounded">
                📅 {itinerary.tripDate}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/digital-twin')}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:shadow-purple-500/15 cursor-pointer"
        >
          View Twin Studio
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-950/30 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex gap-3 items-center">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold">Offline Sync Mode: </span>
            {error} Local fallback database loaded successfully.
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="relative pl-2 md:pl-10 space-y-1">
        {itinerary.timeline.map((event, idx) => {
          const isDeparture = event.purpose === 'Departure';
          const isLodging = event.purpose === 'Resort Check-in' || event.purpose === 'Overnight Stay';
          
          return (
            <div key={idx} className="relative">
              
              {/* Travel Time Offset Arrow Indicator */}
              {idx > 0 && event.travelTimeFromPrevious && event.travelTimeFromPrevious !== '0m' && (
                <div className="flex items-center gap-3 pl-8 py-3 my-1 border-l-2 border-dashed border-slate-800 ml-3">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-900 border border-slate-800 text-purple-400 animate-pulse">
                    <Navigation className="h-3 w-3 rotate-90" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-900/60 border border-slate-850 px-2 py-0.5 rounded-lg">
                    Transit Drive: <strong className="text-slate-300 font-semibold">{event.travelTimeFromPrevious}</strong>
                  </span>
                </div>
              )}

              {/* Event Card Container */}
              <div className="relative pl-8 border-l-2 border-slate-800 ml-3 py-2">
                
                {/* Timeline Bullet Badge */}
                <div className={`absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2 bg-slate-950 z-10 ${
                  event.isOpen ? 'border-purple-500' : 'border-rose-500 animate-pulse'
                }`}></div>

                {/* Event Card */}
                <div className={`p-5 bg-slate-900/40 hover:bg-slate-900/70 border rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 group ${
                  event.warning ? 'border-rose-500/30' : 'border-slate-800 hover:border-purple-500/20'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    
                    {/* Time & Title */}
                    <div className="flex flex-wrap items-center gap-2">
                      {editingIndex === idx ? (
                        <div className="flex flex-col gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800 animate-scale-up">
                          <div className="flex items-center gap-1">
                            <select
                              value={editingTime}
                              onChange={(e) => setEditingTime(e.target.value)}
                              className="bg-slate-900 text-xs text-white outline-none font-bold py-1 px-1.5 rounded cursor-pointer border border-slate-850"
                            >
                              {timeOptions.map((opt, i) => {
                                const tempWaypoint = { place: event.place, time: opt };
                                const previousWaypoint = idx > 0 ? itinerary.timeline[idx - 1] : null;
                                const nextWaypoint = idx < itinerary.timeline.length - 1 ? itinerary.timeline[idx + 1] : null;
                                
                                const check = validateWaypointTime(
                                  tempWaypoint,
                                  previousWaypoint,
                                  nextWaypoint,
                                  itinerary.tripDate,
                                  itinerary.startTime
                                );

                                return (
                                  <option 
                                    key={i} 
                                    value={opt}
                                    disabled={!check.valid}
                                    title={!check.valid ? check.message : ''}
                                    className={!check.valid ? 'text-slate-600 bg-slate-950' : 'text-white bg-slate-900'}
                                  >
                                    {opt} {!check.valid ? '(Blocked)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            
                            {(() => {
                              const check = validateWaypointTime(
                                { place: event.place, time: editingTime },
                                idx > 0 ? itinerary.timeline[idx - 1] : null,
                                idx < itinerary.timeline.length - 1 ? itinerary.timeline[idx + 1] : null,
                                itinerary.tripDate,
                                itinerary.startTime
                              );
                              return (
                                <>
                                  <button
                                    onClick={() => handleSaveTime(idx, event._id)}
                                    disabled={!check.valid || updating}
                                    className={`p-1 rounded transition-colors ${
                                      !check.valid 
                                        ? 'text-slate-700 cursor-not-allowed opacity-50' 
                                        : 'hover:bg-slate-800 text-emerald-400'
                                    }`}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingIndex(null)}
                                    className="p-1 hover:bg-slate-800 text-rose-400 rounded transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                          
                          {(() => {
                            const check = validateWaypointTime(
                              { place: event.place, time: editingTime },
                              idx > 0 ? itinerary.timeline[idx - 1] : null,
                              idx < itinerary.timeline.length - 1 ? itinerary.timeline[idx + 1] : null,
                              itinerary.tripDate,
                              itinerary.startTime
                            );
                            return !check.valid && (
                              <span className="text-[9px] text-rose-400 block max-w-[200px] whitespace-normal leading-tight font-semibold">
                                ⚠️ {check.message}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10">
                            <Clock className="h-3 w-3" />
                            {event.time} {event.endTime && `– ${event.endTime}`}
                          </span>
                          <button
                            onClick={() => handleEditTime(idx, event.time)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
                            title="Edit arrival time"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {event.place}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                        event.isOpen 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {event.isOpen ? 'Open' : 'Closed'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] rounded font-bold uppercase tracking-wider">
                        {event.purpose}
                      </span>
                    </div>

                  </div>

                  <div className="flex items-start gap-2.5 text-slate-400 text-xs leading-relaxed">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p>{event.reason}</p>
                  </div>

                  {/* Warning Messages Alert Banner */}
                  {event.warning && (
                    <div className="mt-3 p-3 bg-rose-950/20 border border-rose-500/25 rounded-xl text-rose-300 text-[11px] leading-relaxed flex items-start gap-2 animate-pulse">
                      <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="font-bold">Timing Warning: </strong>
                        {event.warning}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Nav */}
      <div className="flex justify-between items-center pt-8">
        <button
          onClick={() => navigate('/journey')}
          className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
        >
          Modify Preferences
        </button>
        <button
          onClick={() => navigate('/agents')}
          className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm font-bold transition-all cursor-pointer"
        >
          Open AI Agent Panel
        </button>
      </div>
    </div>
  );
};

export default Itinerary;
