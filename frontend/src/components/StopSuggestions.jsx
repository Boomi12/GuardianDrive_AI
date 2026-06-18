import React from 'react';
import { MapPin, AlertOctagon, CheckCircle2, ShieldAlert, Zap, Fuel } from 'lucide-react';

const StopSuggestions = ({ vehicleType, isTripPossible, estimatedRange, tripDistance, stops }) => {
  return (
    <div className="space-y-6">
      {/* Trip Safety Banner */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${isTripPossible
          ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
          : 'bg-rose-500/5 border-rose-500/20 shadow-lg shadow-rose-500/5 animate-pulse'
        }`}>
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl -ml-10 -mt-10 opacity-30 bg-emerald-500"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-md ${isTripPossible
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
              {isTripPossible ? <CheckCircle2 className="h-6 w-6" /> : <AlertOctagon className="h-6 w-6" />}
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">ROUTE FEASIBILITY STATE</span>
              <h4 className={`text-lg font-black mt-0.5 tracking-tight ${isTripPossible ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isTripPossible ? 'SAFE TO CONTINUE' : 'STOPS REQUIRED'}
              </h4>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">RANGE VS. DISTANCE</span>
            <p className="text-xs text-slate-300 mt-1 font-semibold">
              Estimated Range: <span className="text-white font-bold font-mono">{estimatedRange} km</span> | Trip Distance: <span className="text-white font-bold font-mono">{tripDistance} km</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mt-4 pt-4 border-t border-slate-800/60 relative z-10">
          {isTripPossible
            ? `Your vehicle's active range is ${estimatedRange}km, which satisfies the target trip destination distance of ${tripDistance}km. No stops are mandatory for range requirements.`
            : `Warning: The target trip distance of ${tripDistance}km exceeds your current calculated range of ${estimatedRange}km. You must stop at refueling/charging facilities along the highway route.`}
        </p>
      </div>

      {/* Suggested Stations Timeline */}
      {!isTripPossible && stops && stops.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -ml-5 -mt-5"></div>

          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <MapPin className="text-purple-400 h-4.5 w-4.5" />
            Recommended Stops Timeline ({stops.length})
          </h3>

          <div className="relative border-l border-slate-800/80 ml-3 pl-6 space-y-6">
            {stops.map((stop, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline node icon */}
                <span className="absolute -left-[35px] top-0 h-[18px] w-[18px] rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {vehicleType === 'EV'
                    ? <Zap className="h-2 w-2 text-purple-400 fill-purple-400/10" />
                    : <Fuel className="h-2 w-2 text-orange-400" />
                  }
                </span>

                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-purple-500/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-xs tracking-wide">{stop.name}</h4>
                    <span className="inline-block text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{stop.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto px-2 py-1 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                    <MapPin className="h-3 w-3 text-purple-400" />
                    <span className="text-[10px] text-purple-300 font-bold font-mono">Marker: {stop.distance} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StopSuggestions;
