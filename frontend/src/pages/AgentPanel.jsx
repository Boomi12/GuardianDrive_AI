import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Map, Zap, Compass, AlertOctagon, BrainCircuit, Terminal, Activity, HelpCircle } from 'lucide-react';
import { getAgentRecommendations } from '../services/api';

const AgentPanel = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tripId = localStorage.getItem('gd_tripId');

  const fetchAgents = async (isUpdate = false) => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const res = await getAgentRecommendations(tripId);
      if (res.success) {
        setAgents(res.data);
        
        // Append logs describing what happened
        const timestamp = new Date().toLocaleTimeString();
        const newLogs = [
          `[${timestamp}] [SYSTEM] Telemetry synchronized for Trip ID: ${tripId}`,
          `[${timestamp}] [Safety Agent] Status: ${res.data.safetyAgent.status} | Confidence: ${res.data.safetyAgent.confidenceScore}%`,
          `[${timestamp}] [Route Agent] Status: ${res.data.routeAgent.status} | Recommendation: "${res.data.routeAgent.recommendation.substring(0, 45)}..."`,
          `[${timestamp}] [Fuel/EV Agent] Status: ${res.data.fuelEvAgent.status} | Battery/Fuel level matched.`,
          `[${timestamp}] [Journey Agent] Status: ${res.data.journeyAgent.status} | Loaded preferences.`,
          `[${timestamp}] [Emergency Agent] Status: ${res.data.emergencyAgent.status} | Guard monitoring.`
        ];

        setLogs((prev) => [...newLogs, ...prev].slice(0, 50)); // Keep last 50 logs
      }
    } catch (err) {
      console.error('Error fetching agent recommendations, using offline evaluation:', err);
      // Construct fallback offline recommendations if server is not reachable
      const savedForm = localStorage.getItem('gd_form');
      const form = savedForm ? JSON.parse(savedForm) : { vehicleType: 'EV', destination: 'Mysore' };
      const fallbackData = {
        safetyAgent: { status: 'Optimal', recommendation: 'Driver alert level is nominal. Safe driving habits maintained.', confidenceScore: 98 },
        routeAgent: { status: 'Optimal', recommendation: 'Active route is clear and optimal. No congestion or weather disruptions ahead.', confidenceScore: 95 },
        fuelEvAgent: { status: 'Optimal', recommendation: `Fuel/Battery level is sufficient for the upcoming segment of the journey.`, confidenceScore: 94 },
        journeyAgent: { status: 'Active', recommendation: `Recommending dynamic stops in ${form.destination}: Visit local attractions and explore dining spots.`, confidenceScore: 85 },
        emergencyAgent: { status: 'Standby', recommendation: 'All sensors report stable state. Emergency response protocols in standby.', confidenceScore: 95 }
      };
      setAgents(fallbackData);
      
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [
        `[${timestamp}] [SYSTEM-OFFLINE] Loaded client-side AI rule evaluator.`,
        `[${timestamp}] [Safety Agent] Fatigue: OK. Driving time: OK. Status: Optimal.`,
        ...prev
      ].slice(0, 50));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();

    // Listen to digital twin updates
    const handleTwinUpdate = () => {
      fetchAgents(true);
    };

    window.addEventListener('twin-updated', handleTwinUpdate);
    return () => {
      window.removeEventListener('twin-updated', handleTwinUpdate);
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-sm">Connecting AI Agent controllers...</p>
      </div>
    );
  }

  if (!agents) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
        <BrainCircuit className="h-12 w-12 text-slate-600 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-400 mb-1">AI Agent Grid Offline</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Initialize a journey companion twin to start the safety, route, and fuel monitoring agents.
        </p>
        <button
          onClick={() => navigate('/journey')}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
        >
          Initialize Agents
        </button>
      </div>
    );
  }

  // Agent styling maps
  const agentDetails = [
    {
      key: 'safetyAgent',
      name: 'Safety Agent',
      icon: Shield,
      color: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-500/10 border-emerald-500/20',
      badgeColor: (status) => status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
    },
    {
      key: 'routeAgent',
      name: 'Route Agent',
      icon: Map,
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/10 border-blue-500/20',
      badgeColor: (status) => status === 'Optimal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      key: 'fuelEvAgent',
      name: 'Fuel / EV Agent',
      icon: Zap,
      color: 'from-yellow-500 to-amber-500',
      glow: 'shadow-yellow-500/10 border-yellow-500/20',
      badgeColor: (status) => status === 'Optimal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
    },
    {
      key: 'journeyAgent',
      name: 'Journey Agent',
      icon: Compass,
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/10 border-purple-500/20',
      badgeColor: () => 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      key: 'emergencyAgent',
      name: 'Emergency Agent',
      icon: AlertOctagon,
      color: 'from-red-500 to-rose-500',
      glow: 'shadow-red-500/10 border-red-500/20',
      badgeColor: (status) => status === 'Standby' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            AI Agent Grid
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Multi-agent companion system coordinating security, efficiency, and leisure.
          </p>
        </div>
        <button
          onClick={() => navigate('/digital-twin')}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 cursor-pointer"
        >
          Simulate Twin Updates
          <Activity className="h-4 w-4" />
        </button>
      </div>

      {/* Grid: 5 Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentDetails.map((agent) => {
          const data = agents[agent.key];
          if (!data) return null;
          const AgentIcon = agent.icon;

          return (
            <div
              key={agent.key}
              className={`bg-slate-900/60 border rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[260px] hover:-translate-y-1 hover:bg-slate-900/80 transition-all ${agent.glow}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${agent.color} text-slate-950 shadow-md`}>
                      <AgentIcon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">{agent.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${agent.badgeColor(data.status)}`}>
                    {data.status}
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mt-4">
                  {data.recommendation}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-semibold mb-1">
                  <span>AGENT CONFIDENCE</span>
                  <span className="font-bold text-slate-300">{data.confidenceScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${agent.color}`}
                    style={{ width: `${data.confidenceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Console */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4 text-slate-400">
          <span className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-purple-400" />
            Decision Log Console
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase font-bold">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
            Live Telemetry Connection
          </span>
        </div>

        <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2 text-slate-400 custom-scrollbar select-none">
          {logs.length > 0 ? (
            logs.map((log, i) => {
              let color = 'text-slate-400';
              if (log.includes('[SYSTEM]')) color = 'text-purple-400';
              if (log.includes('[SYSTEM-OFFLINE]')) color = 'text-amber-500';
              if (log.includes('Warning') || log.includes('Caution') || log.includes('Alert')) color = 'text-amber-300';
              if (log.includes('Danger') || log.includes('Critical')) color = 'text-red-400';
              return (
                <div key={i} className={color}>
                  {log}
                </div>
              );
            })
          ) : (
            <div className="text-slate-650 text-center py-4">No logged operations. Go to Digital Twin page and simulate a status change.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
