import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Activity, User, Car, CloudSun, Zap, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Loader2 } from 'lucide-react';
import { getTwinState, updateTwinState } from '../services/api';

const DigitalTwin = () => {
  const navigate = useNavigate();
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [activeScenario, setActiveScenario] = useState('Clear Skies');

  const tripId = localStorage.getItem('gd_tripId');

  const fetchTwin = async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getTwinState(tripId);
      if (res.success) {
        setTwin(res.data);
      }
    } catch (err) {
      console.error('Error fetching digital twin, using offline state:', err);
      // Construct a mock default twin if database connection fails
      const savedForm = localStorage.getItem('gd_form');
      const vehicleType = savedForm ? JSON.parse(savedForm).vehicleType : 'EV';
      setTwin({
        tripId,
        driverTwin: { fatigueLevel: 15, distractionStatus: 'focused', breakNeeded: false },
        vehicleTwin: { vehicleType, fuelOrBatteryLevel: 85, range: vehicleType === 'EV' ? 340 : 580, healthStatus: 'good' },
        journeyTwin: { weather: 'clear', traffic: 'normal', riskLevel: 'low', nextStop: 'Highway Rest Area' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, [tripId]);

  const handleSimulateUpdate = async (scenario) => {
    if (!tripId) return;
    setUpdating(true);
    setError(null);
    setActiveScenario(scenario.name);

    try {
      const res = await updateTwinState({
        tripId,
        driverTwin: scenario.driverTwin,
        vehicleTwin: scenario.vehicleTwin,
        journeyTwin: scenario.journeyTwin
      });

      if (res.success) {
        setTwin(res.data.twin);
        // Dispatch event to notify other pages of updated recommendations
        window.dispatchEvent(new Event('twin-updated'));
      }
    } catch (err) {
      setError(err.error || err.message || 'Simulation update failed.');
      // Local demo update if server is not responding
      setTwin((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          driverTwin: { ...prev.driverTwin, ...scenario.driverTwin },
          vehicleTwin: { ...prev.vehicleTwin, ...scenario.vehicleTwin },
          journeyTwin: { ...prev.journeyTwin, ...scenario.journeyTwin }
        };
      });
    } finally {
      setUpdating(false);
    }
  };

  // Predefined simulation scenarios
  const scenarios = [
    {
      name: 'Clear Skies (Normal)',
      driverTwin: { fatigueLevel: 15, distractionStatus: 'focused', breakNeeded: false },
      vehicleTwin: { fuelOrBatteryLevel: 80, range: 320, healthStatus: 'good' },
      journeyTwin: { weather: 'clear', traffic: 'normal', riskLevel: 'low' }
    },
    {
      name: 'Heavy Rain & Congestion',
      driverTwin: { fatigueLevel: 30, distractionStatus: 'focused', breakNeeded: false },
      vehicleTwin: { fuelOrBatteryLevel: 65, range: 240, healthStatus: 'good' },
      journeyTwin: { weather: 'rain', traffic: 'heavy', riskLevel: 'medium' }
    },
    {
      name: 'Driver Fatigue Alert',
      driverTwin: { fatigueLevel: 82, distractionStatus: 'distracted', breakNeeded: true },
      vehicleTwin: { fuelOrBatteryLevel: 55, range: 200, healthStatus: 'good' },
      journeyTwin: { weather: 'clear', traffic: 'normal', riskLevel: 'medium' }
    },
    {
      name: 'Critical EV Battery / Fuel',
      driverTwin: { fatigueLevel: 40, distractionStatus: 'focused', breakNeeded: false },
      vehicleTwin: { fuelOrBatteryLevel: 18, range: 45, healthStatus: 'warning' },
      journeyTwin: { weather: 'clear', traffic: 'normal', riskLevel: 'medium' }
    },
    {
      name: 'Emergency SOS Alert',
      driverTwin: { fatigueLevel: 85, distractionStatus: 'distracted', breakNeeded: true },
      vehicleTwin: { fuelOrBatteryLevel: 12, range: 25, healthStatus: 'critical' },
      journeyTwin: { weather: 'fog', traffic: 'heavy', riskLevel: 'critical' }
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-sm">Initiating telemetry twin connections...</p>
      </div>
    );
  }

  if (!twin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
        <ShieldAlert className="h-12 w-12 text-slate-600 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-400 mb-1">Digital Twin Offline</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          You must create an active trip to initialize and link the vehicle, driver, and journey digital twins.
        </p>
        <button
          onClick={() => navigate('/journey')}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
        >
          Initialize Trip
        </button>
      </div>
    );
  }

  const getFatigueColor = (level) => {
    if (level > 70) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (level > 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  const getHealthColor = (status) => {
    if (status === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (status === 'warning') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Digital Twin Studio
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Real-time synchronized visualization models of your journey parameters.
          </p>
        </div>
        <button
          onClick={() => navigate('/agents')}
          className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-purple-500/5"
        >
          Open AI Agent Panel
          <Activity className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Grid: 3 Twin Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Driver Twin */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="text-purple-400 h-5 w-5" />
                Driver Twin
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-900">
                Telemetry
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                  <span>FATIGUE MONITOR</span>
                  <span className="font-bold">{twin.driverTwin.fatigueLevel}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      twin.driverTwin.fatigueLevel > 70 
                        ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                        : twin.driverTwin.fatigueLevel > 40 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${twin.driverTwin.fatigueLevel}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">ATTENTION STATUS</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 ${
                    twin.driverTwin.distractionStatus === 'focused' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      twin.driverTwin.distractionStatus === 'focused' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400 animate-bounce'
                    }`}></span>
                    {twin.driverTwin.distractionStatus.toUpperCase()}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">BREAK SUGGESTED</span>
                  <span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold ${
                    twin.driverTwin.breakNeeded ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {twin.driverTwin.breakNeeded ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    {twin.driverTwin.breakNeeded ? 'IMMEDIATE' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-6 p-2.5 rounded-lg border text-[11px] font-semibold text-center uppercase tracking-wider ${getFatigueColor(twin.driverTwin.fatigueLevel)}`}>
            {twin.driverTwin.fatigueLevel > 70 ? '⚠️ High Fatigue Level' : '✓ Driver Condition Normal'}
          </div>
        </div>

        {/* Card 2: Vehicle Twin */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="text-blue-400 h-5 w-5" />
                Vehicle Twin
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-900">
                OBD-II
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                  <span>{twin.vehicleTwin.vehicleType.toUpperCase()} {twin.vehicleTwin.vehicleType.toUpperCase() === 'EV' ? 'BATTERY CHARGE' : 'FUEL TANK'}</span>
                  <span className="font-bold">{twin.vehicleTwin.fuelOrBatteryLevel}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      twin.vehicleTwin.fuelOrBatteryLevel < 30 
                        ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${twin.vehicleTwin.fuelOrBatteryLevel}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">REMAINING RANGE</span>
                  <span className="inline-flex items-center gap-1 mt-1 text-sm font-extrabold text-blue-300">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    {twin.vehicleTwin.range} km
                  </span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">SYSTEMS HEALTH</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 px-2 py-0.5 rounded border ${getHealthColor(twin.vehicleTwin.healthStatus)}`}>
                    {twin.vehicleTwin.healthStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-2.5 rounded-lg border border-slate-800 text-[11px] font-semibold text-center uppercase tracking-wider bg-slate-950 text-slate-400">
            Drivetrain: {twin.vehicleTwin.vehicleType}
          </div>
        </div>

        {/* Card 3: Journey Twin */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CloudSun className="text-yellow-400 h-5 w-5" />
                Journey Twin
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-900">
                Context
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-xs text-slate-500 uppercase font-semibold">WEATHER CONDITIONS</span>
                <span className="text-sm text-white font-bold capitalize">{twin.journeyTwin.weather}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-xs text-slate-500 uppercase font-semibold">TRAFFIC CONGESTION</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  twin.journeyTwin.traffic === 'heavy' 
                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {twin.journeyTwin.traffic.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-xs text-slate-500 uppercase font-semibold">JOURNEY RISK INDEX</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  twin.journeyTwin.riskLevel === 'critical' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : twin.journeyTwin.riskLevel === 'medium'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {twin.journeyTwin.riskLevel === 'critical' ? (
                    <AlertOctagon className="h-3.5 w-3.5" />
                  ) : twin.journeyTwin.riskLevel === 'medium' ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {twin.journeyTwin.riskLevel.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">UPCOMING WAYPOINT</span>
                <span className="text-xs text-purple-300 font-bold max-w-[120px] truncate" title={twin.journeyTwin.nextStop}>
                  {twin.journeyTwin.nextStop}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-2.5 rounded-lg border border-slate-800 text-[11px] font-semibold text-center uppercase tracking-wider bg-slate-950 text-slate-400">
            Route Guard: Connected
          </div>
        </div>
      </div>

      {/* Simulator Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-10 -mt-10"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mb-10"></div>

        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Activity className="text-purple-400 h-5 w-5" />
          Twin Simulator Console
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Trigger simulated environmental and vehicle risks to force instantaneous re-routing and agent alerts.
        </p>

        <div className="flex flex-wrap gap-3">
          {scenarios.map((scen, idx) => (
            <button
              key={idx}
              disabled={updating}
              onClick={() => handleSimulateUpdate(scen)}
              className={`px-4 py-3 border rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 ${
                activeScenario === scen.name
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/5'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {updating && activeScenario === scen.name ? (
                <Loader2 className="animate-spin h-3.5 w-3.5 text-purple-400" />
              ) : (
                <span className={`h-2 w-2 rounded-full ${
                  scen.journeyTwin.riskLevel === 'critical' 
                    ? 'bg-red-500 animate-pulse' 
                    : scen.journeyTwin.riskLevel === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}></span>
              )}
              {scen.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
