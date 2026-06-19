import React from 'react';

const DashboardCard = ({
  title,
  icon: IconComponent,
  headerAction,
  children,
  className = '',
  iconColorClass = 'text-purple-400',
  ...props
}) => {
  return (
    <div
      className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between ${className}`}
      {...props}
    >
      <div>
        {(title || IconComponent || headerAction) && (
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-850">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              {IconComponent && <IconComponent className={`h-4.5 w-4.5 ${iconColorClass}`} />}
              {title}
            </h3>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        )}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
