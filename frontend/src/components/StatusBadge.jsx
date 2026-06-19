import React from 'react';

const StatusBadge = ({ status = 'low', className = '', ...props }) => {
  const normStatus = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['low', 'optimal', 'good', 'clear', 'light', 'normal', 'standby', 'ready', 'active'].includes(normStatus)) {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (['medium', 'warning', 'rain', 'heavy', 'busy'].includes(normStatus)) {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (['high', 'critical', 'danger', 'fog', 'snow', 'sos', 'emergency'].includes(normStatus)) {
    styles = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (['ev', 'electric'].includes(normStatus)) {
    styles = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  } else if (['petrol', 'diesel', 'hybrid'].includes(normStatus)) {
    styles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  return (
    <span
      className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${styles} ${className}`}
      {...props}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
