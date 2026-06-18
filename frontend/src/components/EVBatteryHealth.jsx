import React from 'react';
import { Battery, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

const EVBatteryHealth = ({ healthScore, healthStatus, usagePattern, chargingNeed, batteryPercentage }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'Good':
        return 'text-teal-400 border-teal-500/20 bg-teal-500/5';
      case 'Moderate':
        return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      case 'Needs Attention':
        return 'text-red-400 border-red-500/20 bg-red-500/5 animate-pulse';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/40';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Excellent':
      case 'Good':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'Moderate':
        return <AlertTriangle className="h-5 w-5" />;
      case 'Needs Attention':
        return <ShieldAlert className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
      <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -ml-5 -mt-5"></div>
      
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Battery className="text-purple-400 h-4.5 w-4.5" />
            Battery Health Intelligence
          </h3>
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-900">
            SOH Predictor
          </span>
        </div>

        <div className="space-y-5">
          {/* Radial score / visual indicator */}
          <div className="flex items-center gap-5 p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl">
            <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
              <span className="text-sm font-black text-white font-mono">{healthScore}%</span>
            </div>
            <div className="flex-1">
              <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">STATE OF HEALTH (SOH)</span>
              <span className="block text-sm font-extrabold text-white mt-0.5">{healthStatus} Condition</span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-850/60 text-xs">
              <span className="text-slate-500 font-medium">Usage Pattern Stress</span>
              <span className={`font-bold ${usagePattern === 'Sport' ? 'text-red-400' : usagePattern === 'Normal' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {usagePattern === 'Sport' ? 'High Load (Sport)' : usagePattern === 'Normal' ? 'Moderate (Normal)' : 'Low Load (Eco)'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-850/60 text-xs">
              <span className="text-slate-500 font-medium">Charging Degradation</span>
              <span className={`font-bold ${chargingNeed === 'Frequent Fast Charging' ? 'text-red-400' : chargingNeed === 'Balanced' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {chargingNeed === 'Frequent Fast Charging' ? 'Fast Charging (Heavy)' : chargingNeed === 'Balanced' ? 'Balanced' : 'Slow AC (Optimal)'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Extreme State Stress</span>
              <span className={`font-bold ${(batteryPercentage < 15 || batteryPercentage > 95) ? 'text-red-400' : 'text-emerald-400'}`}>
                {(batteryPercentage < 15 || batteryPercentage > 95) ? 'Active Stress (Extreme SoC)' : 'Minimal (Healthy SoC)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-5 p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${getStatusColor(healthStatus)}`}>
        {getStatusIcon(healthStatus)}
        <span className="uppercase tracking-wider font-extrabold text-[10px]">
          {healthStatus === 'Excellent' && '✓ Battery is in peak operating status'}
          {healthStatus === 'Good' && '✓ Nominal degradation detected'}
          {healthStatus === 'Moderate' && '⚠️ Balanced charge cycles recommended'}
          {healthStatus === 'Needs Attention' && '⚠️ Immediate battery inspection advised'}
        </span>
      </div>
    </div>
  );
};

export default EVBatteryHealth;
