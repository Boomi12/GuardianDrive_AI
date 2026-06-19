import React from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';

const AlertCard = ({
  type = 'info', // 'danger', 'warning', 'info', 'success'
  title,
  message,
  actionText,
  onActionClick,
  className = '',
  icon: CustomIcon
}) => {
  const styles = {
    danger: {
      bg: 'bg-red-500/5 border-red-500/20 text-red-300',
      iconColor: 'text-red-400',
      icon: AlertOctagon
    },
    warning: {
      bg: 'bg-amber-500/5 border-amber-500/20 text-amber-300',
      iconColor: 'text-amber-400',
      icon: AlertTriangle
    },
    success: {
      bg: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300',
      iconColor: 'text-emerald-400',
      icon: CheckCircle2
    },
    info: {
      bg: 'bg-blue-500/5 border-blue-500/20 text-blue-300',
      iconColor: 'text-blue-400',
      icon: Info
    }
  };

  const currentStyle = styles[type] || styles.info;
  const IconComponent = CustomIcon || currentStyle.icon;

  return (
    <div className={`p-4 border rounded-2xl flex gap-3.5 shadow-md items-start ${currentStyle.bg} ${className}`}>
      <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${currentStyle.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold text-white text-sm mb-1">{title}</h4>}
        <p className="text-xs leading-relaxed">{message}</p>
        {actionText && onActionClick && (
          <button
            onClick={onActionClick}
            className="mt-2.5 text-xs font-bold underline hover:no-underline cursor-pointer focus:outline-none"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
