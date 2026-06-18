import React from 'react';
import { Zap, Fuel, Activity } from 'lucide-react';

const VehicleTypeSelector = ({ selectedType, onChange }) => {
  const options = [
    { id: 'EV', label: 'Electric (EV)', icon: Zap, gradient: 'from-purple-600 to-blue-600', shadow: 'shadow-purple-500/10' },
    { id: 'Petrol', label: 'Petrol', icon: Fuel, gradient: 'from-amber-600 to-orange-600', shadow: 'shadow-orange-500/10' },
    { id: 'Diesel', label: 'Diesel', icon: Activity, gradient: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/10' }
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -ml-5 -mt-5"></div>
      
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Select Drivetrain Technology
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = selectedType === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all border group cursor-pointer active:scale-[0.98] ${
                isActive
                  ? `bg-slate-950 text-white border-purple-500/40 shadow-md ${option.shadow}`
                  : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                isActive 
                  ? `bg-gradient-to-tr ${option.gradient} text-white shadow` 
                  : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'
              }`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              
              <div className="flex flex-col items-start text-left">
                <span className={`text-xs font-bold leading-none ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {option.label}
                </span>
                <span className="text-[9px] text-slate-500 mt-1 font-medium">
                  {option.id === 'EV' ? 'Battery & Range Engine' : 'Internal Combustion Engine'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleTypeSelector;
