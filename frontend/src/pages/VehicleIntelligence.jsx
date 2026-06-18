import React, { useState, useEffect } from 'react';
import { Loader2, Car, Compass, HelpCircle, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import VehicleTypeSelector from '../components/VehicleTypeSelector';
import EVBatteryHealth from '../components/EVBatteryHealth';
import FuelRangeCard from '../components/FuelRangeCard';
import MileageAnalytics from '../components/MileageAnalytics';
import StopSuggestions from '../components/StopSuggestions';

import {
  calculateVehicleRange,
  getEVBatteryHealth,
  getMileageAnalytics,
  getStopSuggestions
} from '../services/api';

import {
  localCalculateRange,
  localPredictBatteryHealth,
  localDiagnoseMileage,
  localSuggestStops
} from '../utils/vehicleCalculations';

const VehicleIntelligence = () => {
  const [vehicleType, setVehicleType] = useState('EV');
  const [tripId, setTripId] = useState('');

  // Form states
  const [evInputs, setEvInputs] = useState({
    batteryPercentage: 80,
    batteryCapacity: 60,
    vehicleEfficiency: 5.5,
    usagePattern: 'Normal',
    chargingNeed: 'Balanced'
  });

  const [fuelInputs, setFuelInputs] = useState({
    fuelLevel: 35,
    mileage: 15
  });

  const [tripDistance, setTripDistance] = useState(120);

  // Error validations state
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);

  // Logic results state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Sync inputs with localStorage trip details if present
  useEffect(() => {
    const savedTripId = localStorage.getItem('gd_tripId');
    if (savedTripId) setTripId(savedTripId);

    const savedFormStr = localStorage.getItem('gd_form');
    if (savedFormStr) {
      try {
        const savedForm = JSON.parse(savedFormStr);
        if (savedForm.vehicleType) {
          setVehicleType(savedForm.vehicleType === 'Hybrid' ? 'EV' : savedForm.vehicleType);
        }
        if (savedForm.fuelOrBatteryLevel) {
          const val = Number(savedForm.fuelOrBatteryLevel);
          if (savedForm.vehicleType === 'EV') {
            setEvInputs(prev => ({ ...prev, batteryPercentage: val }));
          } else {
            setFuelInputs(prev => ({ ...prev, fuelLevel: val }));
          }
        }
        // Pre-fill trip distance from itinerary timeline size if any, or default 120
        const savedTimelineStr = localStorage.getItem('gd_timeline');
        if (savedTimelineStr) {
          const timeline = JSON.parse(savedTimelineStr);
          if (timeline.length > 0) {
            // Estimate based on stops or just default
            setTripDistance(150);
          }
        }
      } catch (e) {
        console.error('Failed to parse localStorage active form:', e);
      }
    }
  }, []);

  // Real-time validations
  useEffect(() => {
    const errs = {};

    if (tripDistance <= 0 || tripDistance === '') {
      errs.tripDistance = 'Trip distance must be greater than 0 km.';
    }

    if (vehicleType === 'EV') {
      if (evInputs.batteryPercentage < 0 || evInputs.batteryPercentage > 100 || evInputs.batteryPercentage === '') {
        errs.batteryPercentage = 'Battery percentage must be between 0 and 100.';
      }
      if (evInputs.batteryCapacity <= 0 || evInputs.batteryCapacity === '') {
        errs.batteryCapacity = 'Capacity must be greater than 0 kWh.';
      }
      if (evInputs.vehicleEfficiency <= 0 || evInputs.vehicleEfficiency === '') {
        errs.vehicleEfficiency = 'Efficiency must be greater than 0 km/kWh.';
      }
    } else {
      if (fuelInputs.fuelLevel <= 0 || fuelInputs.fuelLevel === '') {
        errs.fuelLevel = 'Fuel level must be greater than 0 Litres.';
      }
      if (fuelInputs.mileage <= 0 || fuelInputs.mileage === '') {
        errs.mileage = 'Mileage must be greater than 0 km/L.';
      }
    }

    setErrors(errs);
    setIsFormValid(Object.keys(errs).length === 0);
  }, [vehicleType, evInputs, fuelInputs, tripDistance]);

  const handleEvChange = (e) => {
    const { name, value } = e.target;
    setEvInputs(prev => ({
      ...prev,
      [name]: name === 'usagePattern' || name === 'chargingNeed' ? value : value === '' ? '' : Number(value)
    }));
  };

  const handleFuelChange = (e) => {
    const { name, value } = e.target;
    setFuelInputs(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setErrorStatus(null);
    setResults(null);

    const payload = {
      vehicleType,
      tripDistance,
      tripId,
      ...(vehicleType === 'EV'
        ? {
            batteryPercentage: evInputs.batteryPercentage,
            batteryCapacity: evInputs.batteryCapacity,
            vehicleEfficiency: evInputs.vehicleEfficiency
          }
        : {
            fuelLevel: fuelInputs.fuelLevel,
            mileage: fuelInputs.mileage
          })
    };

    try {
      // 1. Calculate range and feasibility
      const rangeRes = await calculateVehicleRange(payload);
      const calculatedData = rangeRes.data;

      // 2. Fetch Battery health (EV only)
      let healthData = null;
      if (vehicleType === 'EV') {
        const healthRes = await getEVBatteryHealth({
          batteryPercentage: evInputs.batteryPercentage,
          usagePattern: evInputs.usagePattern,
          rangeEfficiency: evInputs.vehicleEfficiency,
          chargingNeed: evInputs.chargingNeed
        });
        healthData = healthRes.data;
      }

      // 3. Diagnose Mileage Performance
      const mileageRes = await getMileageAnalytics({
        vehicleType,
        mileage: vehicleType === 'EV' ? evInputs.vehicleEfficiency : fuelInputs.mileage
      });
      const mileageData = mileageRes.data;

      // 4. Get charging/fuel stops suggestions
      const stopsRes = await getStopSuggestions({
        vehicleType,
        tripDistance,
        estimatedRange: calculatedData.estimatedRange
      });
      const stopsData = stopsRes.data;

      setResults({
        rangeData: calculatedData,
        healthData,
        mileageData,
        stopsData
      });
    } catch (apiErr) {
      console.warn('API error encountered. Executing local engine fallback:', apiErr);
      setErrorStatus('API returned server warning. Loaded local engine calculations.');

      // Perform calculations in frontend client utility (fallback mode)
      const rangeData = localCalculateRange({
        vehicleType,
        tripDistance,
        ...(vehicleType === 'EV'
          ? {
              batteryPercentage: evInputs.batteryPercentage,
              batteryCapacity: evInputs.batteryCapacity,
              vehicleEfficiency: evInputs.vehicleEfficiency
            }
          : {
              fuelLevel: fuelInputs.fuelLevel,
              mileage: fuelInputs.mileage
            })
      });

      let healthData = null;
      if (vehicleType === 'EV') {
        healthData = localPredictBatteryHealth({
          batteryPercentage: evInputs.batteryPercentage,
          usagePattern: evInputs.usagePattern,
          rangeEfficiency: evInputs.vehicleEfficiency,
          chargingNeed: evInputs.chargingNeed
        });
      }

      const mileageData = localDiagnoseMileage(
        vehicleType,
        vehicleType === 'EV' ? evInputs.vehicleEfficiency : fuelInputs.mileage
      );

      const stopsData = localSuggestStops(vehicleType, tripDistance, rangeData.estimatedRange);

      setResults({
        rangeData,
        healthData,
        mileageData,
        stopsData
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEvInputs({
      batteryPercentage: 80,
      batteryCapacity: 60,
      vehicleEfficiency: 5.5,
      usagePattern: 'Normal',
      chargingNeed: 'Balanced'
    });
    setFuelInputs({
      fuelLevel: 35,
      mileage: 15
    });
    setTripDistance(120);
    setResults(null);
    setErrorStatus(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Vehicle Intelligence
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Drive smart. Run range telemetry checks, diagnose mileage efficiency, and forecast battery state of health.
          </p>
        </div>
        {results && (
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Parameters
          </button>
        )}
      </div>

      {errorStatus && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          {errorStatus}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Section: Inputs & Drivetrain Selection */}
        <div className="lg:col-span-5 space-y-6">
          {/* Segmented Selector */}
          <VehicleTypeSelector selectedType={vehicleType} onChange={setVehicleType} />

          {/* Configuration Form */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Car className="text-purple-400 h-4.5 w-4.5" />
              Telemetry Diagnostics
            </h3>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {/* Trip ID Indicator */}
              {tripId && (
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Linked Telemetry ID</span>
                  <span className="text-[10px] text-purple-400 font-mono font-bold">{tripId}</span>
                </div>
              )}

              {/* EV Fields */}
              {vehicleType === 'EV' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Battery Level (%)
                      </label>
                      <input
                        type="number"
                        name="batteryPercentage"
                        min="0"
                        max="100"
                        value={evInputs.batteryPercentage}
                        onChange={handleEvChange}
                        className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-white text-xs focus:outline-none transition-colors ${
                          errors.batteryPercentage ? 'border-red-500' : 'border-slate-800 focus:border-purple-500/80'
                        }`}
                      />
                      {errors.batteryPercentage && (
                        <span className="text-[9px] text-red-400 mt-1 block font-medium">{errors.batteryPercentage}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Capacity (kWh)
                      </label>
                      <input
                        type="number"
                        name="batteryCapacity"
                        min="1"
                        value={evInputs.batteryCapacity}
                        onChange={handleEvChange}
                        className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-white text-xs focus:outline-none transition-colors ${
                          errors.batteryCapacity ? 'border-red-500' : 'border-slate-800 focus:border-purple-500/80'
                        }`}
                      />
                      {errors.batteryCapacity && (
                        <span className="text-[9px] text-red-400 mt-1 block font-medium">{errors.batteryCapacity}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Vehicle Efficiency (km/kWh)
                    </label>
                    <input
                      type="number"
                      name="vehicleEfficiency"
                      step="0.1"
                      min="0.1"
                      value={evInputs.vehicleEfficiency}
                      onChange={handleEvChange}
                      className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-white text-xs focus:outline-none transition-colors ${
                        errors.vehicleEfficiency ? 'border-red-500' : 'border-slate-800 focus:border-purple-500/80'
                      }`}
                    />
                    {errors.vehicleEfficiency && (
                      <span className="text-[9px] text-red-400 mt-1 block font-medium">{errors.vehicleEfficiency}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Usage Pattern
                      </label>
                      <select
                        name="usagePattern"
                        value={evInputs.usagePattern}
                        onChange={handleEvChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none"
                      >
                        <option value="Eco">Eco Mode</option>
                        <option value="Normal">Normal Mode</option>
                        <option value="Sport">Sport Mode</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Charging Cycles
                      </label>
                      <select
                        name="chargingNeed"
                        value={evInputs.chargingNeed}
                        onChange={handleEvChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-xs focus:outline-none focus:border-purple-500/80 transition-colors appearance-none"
                      >
                        <option value="Slow AC">Slow AC (Overnight)</option>
                        <option value="Balanced">Balanced Mix</option>
                        <option value="Frequent Fast Charging">Frequent Fast DC</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Fuel Fields */}
              {vehicleType !== 'EV' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Fuel Level (Litres)
                    </label>
                    <input
                      type="number"
                      name="fuelLevel"
                      min="1"
                      value={fuelInputs.fuelLevel}
                      onChange={handleFuelChange}
                      className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-white text-xs focus:outline-none transition-colors ${
                        errors.fuelLevel ? 'border-red-500' : 'border-slate-800 focus:border-purple-500/80'
                      }`}
                    />
                    {errors.fuelLevel && (
                      <span className="text-[9px] text-red-400 mt-1 block font-medium">{errors.fuelLevel}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Mileage (km/l)
                    </label>
                    <input
                      type="number"
                      name="mileage"
                      min="1"
                      value={fuelInputs.mileage}
                      onChange={handleFuelChange}
                      className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-white text-xs focus:outline-none transition-colors ${
                        errors.mileage ? 'border-red-500' : 'border-slate-800 focus:border-purple-500/80'
                      }`}
                    />
                    {errors.mileage && (
                      <span className="text-[9px] text-red-400 mt-1 block font-medium">{errors.mileage}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Common Fields */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Trip Distance (km)
                </label>
                <input
                  type="number"
                  name="tripDistance"
                  min="1"
                  value={tripDistance}
                  onChange={(e) => setTripDistance(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-white text-xs focus:outline-none transition-colors ${
                    errors.tripDistance ? 'border-red-500' : 'border-slate-800 focus:border-purple-500/80'
                  }`}
                />
                {errors.tripDistance && (
                  <span className="text-[9px] text-red-400 mt-1 block font-medium">{errors.tripDistance}</span>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={!isFormValid || loading}
                onClick={handleCalculate}
                className={`w-full text-white rounded-lg py-2.5 font-bold text-xs transition-all flex items-center justify-center gap-1.5 mt-4 shadow-md ${
                  !isFormValid
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-700'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:shadow-purple-500/15 cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                    Calculating Vehicle Range...
                  </>
                ) : (
                  <>
                    Analyze Performance Telemetry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Section: Diagnostics Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          {!results && !loading && (
            <div className="flex flex-col items-center justify-center min-h-[350px] text-center p-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
              <Car className="h-12 w-12 text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-400 mb-1">Intelligence Module Idle</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Enter your vehicle's current levels, capacities, and target distance on the left to calculate metrics, diagnose SOH, and map stops.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
              <Loader2 className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4" />
              <p className="text-sm font-semibold tracking-wide">Syncing drivetrain diagnostics...</p>
            </div>
          )}

          {results && !loading && (
            <div className="space-y-6 animate-scale-up">
              {/* Dynamic Stop Suggestions & feasibility alerts */}
              <StopSuggestions
                vehicleType={vehicleType}
                isTripPossible={results.rangeData.isTripPossible}
                estimatedRange={results.rangeData.estimatedRange}
                tripDistance={tripDistance}
                stops={results.stopsData.suggestedStops}
              />

              {/* Performance Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicleType === 'EV' ? (
                  <EVBatteryHealth
                    healthScore={results.healthData.batteryHealthScore}
                    healthStatus={results.healthData.batteryHealthStatus}
                    usagePattern={evInputs.usagePattern}
                    chargingNeed={evInputs.chargingNeed}
                    batteryPercentage={evInputs.batteryPercentage}
                  />
                ) : (
                  <FuelRangeCard
                    vehicleType={vehicleType}
                    fuelLevel={fuelInputs.fuelLevel}
                    mileage={fuelInputs.mileage}
                    tripDistance={tripDistance}
                    estimatedRange={results.rangeData.estimatedRange}
                    isTripPossible={results.rangeData.isTripPossible}
                    stopsRequired={results.rangeData.stopsRequired}
                    remainingFuel={results.rangeData.remainingFuelOrBattery}
                  />
                )}

                <MileageAnalytics
                  vehicleType={vehicleType}
                  performance={results.mileageData.mileagePerformance}
                  suggestions={results.mileageData.mileageSuggestions}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleIntelligence;
