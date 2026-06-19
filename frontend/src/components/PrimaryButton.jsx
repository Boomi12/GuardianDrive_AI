import React from 'react';
import { Loader2 } from 'lucide-react';

const PrimaryButton = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  variant = 'primary', // 'primary', 'secondary', 'danger'
  ...props
}) => {
  const baseStyle = "w-full text-white font-semibold text-sm rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md";
  
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:shadow-lg hover:shadow-purple-500/20 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none disabled:border disabled:border-slate-700 disabled:opacity-50",
    secondary: "bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 hover:text-white text-slate-300 disabled:border-slate-850 disabled:bg-slate-950 disabled:text-slate-650 disabled:cursor-not-allowed",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-500/20 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin h-4 w-4" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default PrimaryButton;
