import React from 'react';
import { Car, Zap, Fuel, Compass } from 'lucide-react';
import StatusBadge from './StatusBadge';

const VehicleInfoCard = ({ vehicle, className = '', onEditClick }) => {
  if (!vehicle) {
    return (
      <div className={`p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center text-slate-500 text-sm ${className}`}>
        No vehicle registered. Set up your profile.
      </div>
    );
  }

  const { ownerName, model, number, type, batteryPercentage, fuelPercentage, mileage, range, emergencyContact } = vehicle;
  const isEV = type === 'EV';

  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-850 ${isEV ? 'text-purple-400' : 'text-blue-400'}`}>
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{model}</h3>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">{number.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={type} />
            {onEditClick && (
              <button
                onClick={onEditClick}
                className="text-[10px] text-purple-400 font-bold hover:underline cursor-pointer bg-transparent border-0"
              >
                Edit Setup
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Progress Indicator */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>{isEV ? 'BATTERY CHARGE' : 'FUEL LEVEL'}</span>
              <span className="font-bold">{isEV ? batteryPercentage : fuelPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  (isEV ? batteryPercentage : fuelPercentage) < 25
                    ? 'bg-gradient-to-r from-red-500 to-rose-500'
                    : isEV
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${isEV ? batteryPercentage : fuelPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3 bg-slate-950 border border-slate-850/80 rounded-xl">
              <span className="block text-[9px] text-slate-500 uppercase font-semibold">REMAINING RANGE</span>
              <span className={`inline-flex items-center gap-1 mt-1 text-sm font-extrabold ${isEV ? 'text-purple-300' : 'text-blue-300'}`}>
                {isEV ? <Zap className="h-3.5 w-3.5 text-yellow-400" /> : <Fuel className="h-3.5 w-3.5 text-slate-400" />}
                {range} km
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850/80 rounded-xl">
              <span className="block text-[9px] text-slate-500 uppercase font-semibold">{isEV ? 'DRIVETRAIN' : 'MILEAGE'}</span>
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-slate-300">
                {isEV ? 'Pure Electric' : `${mileage} km/l`}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-850/60 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Owner Name:</span>
              <span className="text-slate-300 font-medium">{ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SOS Emergency:</span>
              <span className="text-red-400 font-mono font-semibold">{emergencyContact}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleInfoCard;
