import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicle, getTwinState } from '../services/api';
import { Shield, ShieldAlert, Zap, Fuel, Activity, Navigation, Eye, User, Sparkles, MapPin, PhoneCall, AlertOctagon } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import AlertCard from '../components/AlertCard';
import VehicleInfoCard from '../components/VehicleInfoCard';
import PrimaryButton from '../components/PrimaryButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosActive, setSosActive] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('gd_user') || '{}');
  const tripId = localStorage.getItem('gd_tripId');

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Vehicle Profile
      if (user.id) {
        const vehicleRes = await getVehicle(user.id);
        if (vehicleRes.success && vehicleRes.data) {
          setVehicle(vehicleRes.data);
          localStorage.setItem('gd_vehicle', JSON.stringify(vehicleRes.data));
        }
      }
    } catch (err) {
      console.log('Unable to fetch vehicle from DB, checking local storage.');
      const localVehicle = localStorage.getItem('gd_vehicle');
      if (localVehicle) {
        setVehicle(JSON.parse(localVehicle));
      }
    }

    try {
      // 2. Fetch Active Twin Telemetry if tripId exists
      if (tripId) {
        const twinRes = await getTwinState(tripId);
        if (twinRes.success && twinRes.data) {
          setTwin(twinRes.data);
        }
      }
    } catch (err) {
      console.log('Unable to fetch twin state from DB, using fallback defaults.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to twin updates from simulations
    const handleTwinUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('twin-updated', handleTwinUpdate);
    return () => {
      window.removeEventListener('twin-updated', handleTwinUpdate);
    };
  }, [tripId]);

  // Handle SOS emergency action trigger
  const handleSosTrigger = () => {
    setSosActive(!sosActive);
  };

  // Toggle Emergency High Response Mode
  const handleEmergencyModeToggle = () => {
    setEmergencyMode(!emergencyMode);
  };

  // Calculate dynamic driver risk score
  const calculateRisk = () => {
    let score = 15; // base risk score
    const details = [];

    // Fuel/Battery level impact
    const fuelOrBat = vehicle ? (vehicle.type === 'EV' ? vehicle.batteryPercentage : vehicle.fuelPercentage) : 80;
    if (fuelOrBat < 25) {
      score += 40;
      details.push('Critical fuel/battery level');
    } else if (fuelOrBat < 50) {
      score += 15;
      details.push('Low fuel/battery warning');
    }

    // Weather impact
    const weather = twin?.journeyTwin?.weather || 'clear';
    if (['rain', 'snow'].includes(weather)) {
      score += 25;
      details.push('Adverse weather condition (Precipitation)');
    } else if (weather === 'fog') {
      score += 20;
      details.push('Low visibility (Fog Alert)');
    }

    // Fatigue impact
    const fatigue = twin?.driverTwin?.fatigueLevel || 15;
    if (fatigue > 70) {
      score += 30;
      details.push('High driver fatigue detected');
    } else if (fatigue > 40) {
      score += 15;
      details.push('Mild driver fatigue detected');
    }

    // Traffic impact
    const traffic = twin?.journeyTwin?.traffic || 'normal';
    if (traffic === 'heavy') {
      score += 15;
      details.push('Heavy traffic congestion');
    }

    // Safety SOS impact
    if (sosActive) {
      score = 98;
      details.push('Active SOS Distress Beacon');
    }

    // Limit score to 100
    score = Math.min(score, 100);

    let level = 'Low';
    let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (score > 70) {
      level = 'High';
      badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
    } else if (score > 40) {
      level = 'Medium';
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }

    return { score, level, badgeColor, details };
  };

  const riskAnalysis = calculateRisk();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-sm">Accessing vehicle diagnostics dashboard...</p>
      </div>
    );
  }

  // If no vehicle setup exists, prompt user to register one
  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl animate-fade-in max-w-lg mx-auto mt-10">
        <ShieldAlert className="h-12 w-12 text-purple-400 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-2">Initialize Vehicle Diagnostics</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          GuardianDrive AI requires basic vehicle telemetry (battery specs, fuel type, and range ratings) to compute live driver risk indices.
        </p>
        <PrimaryButton onClick={() => navigate('/vehicle-setup')} className="w-auto px-6">
          Set Up Vehicle Profile
        </PrimaryButton>
      </div>
    );
  }

  const isEV = vehicle.type === 'EV';
  const currentFuelOrBattery = isEV ? vehicle.batteryPercentage : vehicle.fuelPercentage;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcoming Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/80 to-purple-950/20 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[10px] uppercase font-bold tracking-widest">
                Active Telemetry
              </span>
              {emergencyMode && (
                <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/35 rounded-md text-[10px] uppercase font-bold tracking-widest animate-pulse">
                  Emergency Mode Active
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{user.name || 'Driver'}</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm">
              Your digital routing companion is monitoring all drivetrain and attention telemetry.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/vehicle-setup')}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-900"
            >
              Vehicle Parameters
            </button>
            <button
              onClick={handleEmergencyModeToggle}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                emergencyMode
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/35'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-md'
              }`}
            >
              {emergencyMode ? 'Disable Emergency Mode' : 'Enable Emergency Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* SOS Alert Section */}
      {sosActive && (
        <AlertCard
          type="danger"
          title="EMERGENCY DISTRESS BEACON EMITTING"
          message={`SOS signal broadcasted with telemetry payload. Emergency response teams have been dispatched to your current coordinate estimates. Emergency Contact: ${vehicle.emergencyContact}`}
          actionText="Cancel distress beacon"
          onActionClick={handleSosTrigger}
        />
      )}

      {/* Grid Layout: Primary Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Vehicle Telemetry */}
        <VehicleInfoCard vehicle={vehicle} onEditClick={() => navigate('/vehicle-setup')} />

        {/* Card 2: Driver Risk Analysis */}
        <DashboardCard
          title="Driver Risk Index"
          icon={Activity}
          iconColorClass="text-purple-400"
          headerAction={
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${riskAnalysis.badgeColor}`}>
              {riskAnalysis.level.toUpperCase()}
            </span>
          }
        >
          <div className="space-y-4">
            <div className="text-center py-2 relative">
              <div className="inline-flex flex-col items-center justify-center h-24 w-24 rounded-full border-4 border-slate-950 bg-slate-900/60 shadow-lg relative">
                <span className={`text-3xl font-black ${
                  riskAnalysis.score > 70 ? 'text-red-400' : (riskAnalysis.score > 40 ? 'text-amber-400' : 'text-emerald-400')
                }`}>{riskAnalysis.score}</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Score</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Risk Factors</span>
              {riskAnalysis.details.length > 0 ? (
                <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-1 custom-scrollbar">
                  {riskAnalysis.details.map((reason, index) => (
                    <div key={index} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 text-center">
                  ✓ Safe driving parameters, no active warnings.
                </p>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* Card 3: Route Telemetry & Weather Alert */}
        <DashboardCard
          title="Twin Environmental Context"
          icon={Eye}
          iconColorClass="text-blue-400"
          headerAction={
            <span className="text-[9px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-850">
              Contextual
            </span>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="block text-[9px] text-slate-500 uppercase font-semibold">WEATHER STATE</span>
                <span className="block text-white font-extrabold mt-1 capitalize">
                  {twin?.journeyTwin?.weather || 'Clear Skies'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="block text-[9px] text-slate-500 uppercase font-semibold">TRAFFIC FLOW</span>
                <span className="block text-white font-extrabold mt-1 capitalize">
                  {twin?.journeyTwin?.traffic || 'Normal'}
                </span>
              </div>
            </div>

            {/* Smart Station Suggestions */}
            <div className="p-3.5 bg-slate-950 border border-slate-850/80 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-10 w-10 bg-purple-500/5 rounded-full blur-xl"></div>
              <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-yellow-400" />
                {isEV ? 'Recommended EV Charging Halt' : 'Recommended Refuel Stop'}
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                {isEV ? (
                  currentFuelOrBattery < 50
                    ? `Tata Power Hypercharger Suggestion in 18km. Current battery is ${currentFuelOrBattery}%. Estimated charge time to 80%: 25m.`
                    : 'Battery charge level optimal. Next charging suggestor updates on route changes.'
                ) : (
                  currentFuelOrBattery < 50
                    ? `Shell Super Premium Fuel Station located in 35km. Average mileage is ${vehicle.mileage} km/l.`
                    : 'Fuel level sufficient. No refuel stops recommended currently.'
                )}
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* SOS Button Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -ml-10 -mt-10"></div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertOctagon className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Emergency Panic Action</h3>
            <p className="text-slate-400 text-xs mt-0.5">Instant trigger to send location telemetry and coordinate assistance</p>
          </div>
        </div>
        <button
          onClick={handleSosTrigger}
          className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-black tracking-widest text-xs uppercase transition-all duration-300 transform cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-lg ${
            sosActive
              ? 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-red-600/30'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          {sosActive ? 'Deactivate SOS Alarm' : 'Activate Live SOS Alert'}
        </button>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4">Quick Diagnostic Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              name: 'Plan Trip',
              desc: 'Configure parameters & twins',
              path: '/journey',
              icon: Navigation,
              color: 'from-purple-500/15 to-indigo-500/5 text-purple-300 hover:border-purple-500/30'
            },
            {
              name: 'View Itinerary',
              desc: 'Check waypoint validation warnings',
              path: '/itinerary',
              icon: MapPin,
              color: 'from-blue-500/15 to-cyan-500/5 text-blue-300 hover:border-blue-500/30'
            },
            {
              name: 'Twin Studio',
              desc: 'Simulate telemetry twin updates',
              path: '/digital-twin',
              icon: Activity,
              color: 'from-emerald-500/15 to-teal-500/5 text-emerald-300 hover:border-emerald-500/30'
            },
            {
              name: 'Vehicle Health',
              desc: 'Inspect diagnostics & parameters',
              path: '/vehicle-setup',
              icon: Shield,
              color: 'from-yellow-500/15 to-amber-500/5 text-yellow-300 hover:border-yellow-500/30'
            }
          ].map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`p-4 bg-slate-950/70 border border-slate-900 rounded-2xl text-left transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between gap-6 hover:shadow-lg ${action.color}`}
              >
                <div className="p-2 rounded-xl bg-slate-900/80 w-10 h-10 flex items-center justify-center">
                  <ActionIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{action.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
