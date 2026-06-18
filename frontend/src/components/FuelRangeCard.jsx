import React from 'react';
import { Fuel, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

const FuelRangeCard = ({ vehicleType, fuelLevel, mileage, tripDistance, estimatedRange, isTripPossible, stopsRequired, remainingFuel }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
      <div className="absolute top-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -ml-5 -mt-5"></div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Fuel className="text-orange-400 h-4.5 w-4.5" />
            {vehicleType} Fuel Intelligence
          </h3>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-900">
            Range Calc
          </span>
        </div>

        <div className="space-y-6">
          {/* Neon range indicator */}
          <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">ESTIMATED DRIVING RANGE</span>
              <span className="inline-flex items-center gap-1.5 text-2xl font-black text-orange-400 mt-1 tracking-tight">
                <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
                {estimatedRange} km
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">FUEL TANK LEVEL</span>
              <span className="block text-sm font-extrabold text-white mt-1">{fuelLevel} Litres</span>
            </div>
          </div>

          {/* Visual fuel level progression */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-semibold">
              <span>ESTIMATED FUEL AFTER TRIP</span>
              <span className={`font-mono font-bold ${remainingFuel > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                {remainingFuel} L
              </span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  remainingFuel === 0 
                    ? 'bg-red-500' 
                    : remainingFuel < 10 
                      ? 'bg-gradient-to-r from-red-500 to-amber-500' 
                      : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                }`}
                style={{ width: `${Math.min(100, (remainingFuel / (fuelLevel || 50)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Table breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-lg">
              <span className="block text-[9px] text-slate-500 uppercase font-semibold">TRIP DISTANCE</span>
              <span className="block text-sm font-bold text-white mt-0.5">{tripDistance} km</span>
            </div>
            <div className="p-2.5 bg-slate-950/40 border border-slate-850 rounded-lg">
              <span className="block text-[9px] text-slate-500 uppercase font-semibold">RECIRCULATING MILEAGE</span>
              <span className="block text-sm font-bold text-white mt-0.5">{mileage} km/l</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-5 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
        isTripPossible 
          ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' 
          : 'text-red-400 border-red-500/20 bg-red-500/5'
      }`}>
        {isTripPossible ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span className="uppercase tracking-wider font-extrabold text-[10px]">SAFE TO GO: TRIP FEASIBLE WITHOUT STOPS</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            <span className="uppercase tracking-wider font-extrabold text-[10px]">STOPS REQUIRED: MIN. {stopsRequired} REFUEL STOP(S)</span>
          </>
        )}
      </div>
    </div>
  );
};

export default FuelRangeCard;
