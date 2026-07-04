import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-900/60 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl max-w-xl mx-auto my-12 text-center space-y-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-red-650 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/10 mx-auto">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white tracking-wide">
              Companion Twin Interrupted
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The Journey Companion encountered a layout rendering conflict. We have safely isolated the twin instance.
            </p>
          </div>
          {this.state.error && (
            <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Diagnostic Trace
              </span>
              <p className="text-[10px] text-red-400 font-mono break-all leading-relaxed whitespace-pre-wrap">
                {this.state.error.toString()}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/10 flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Companion
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
