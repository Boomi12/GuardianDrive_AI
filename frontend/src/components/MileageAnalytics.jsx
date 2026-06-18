import React from 'react';
import { Gauge, Info, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

const MileageAnalytics = ({ vehicleType, performance, suggestions }) => {
  const getPerfColor = (perf) => {
    switch (perf) {
      case 'Excellent':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Good':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'Average':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Poor':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-950 text-slate-400 border-slate-800';
    }
  };

  // Helper to extract titles from suggestions if needed, or format them beautifully
  const formatSuggestion = (text) => {
    const parts = text.split(':');
    if (parts.length > 1) {
      return (
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white font-bold block mb-0.5">{parts[0]}</strong>
          {parts.slice(1).join(':').trim()}
        </p>
      );
    }
    return <p className="text-xs text-slate-300 leading-relaxed">{text}</p>;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
      <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -ml-5 -mt-5"></div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Gauge className="text-purple-400 h-4.5 w-4.5" />
            Mileage Performance Analytics
          </h3>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-900">
            Drivetrain Eco
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Gauge className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">EFFICIENCY CLASSIFICATION</span>
                <span className="block text-sm font-bold text-white mt-0.5">{vehicleType === 'EV' ? 'Electric efficiency' : 'Fuel economy'} rank</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getPerfColor(performance)}`}>
              {performance.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info className="h-3 w-3 text-purple-400" />
              Actionable Efficiency Tips
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions && suggestions.map((sug, idx) => (
                <div key={idx} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-start gap-2.5 hover:border-purple-500/10 transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></span>
                  <div className="flex-1">
                    {formatSuggestion(sug)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MileageAnalytics;
