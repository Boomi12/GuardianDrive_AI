import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Calendar, Activity, BrainCircuit, ShieldAlert, Shield, Menu, X, ArrowUpRight, LayoutDashboard, Sliders, LogOut } from 'lucide-react';

// Import Pages
import JourneyCompanion from './pages/JourneyCompanion';
import Itinerary from './pages/Itinerary';
import DigitalTwin from './pages/DigitalTwin';
import AgentPanel from './pages/AgentPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VehicleSetup from './pages/VehicleSetup';
import Dashboard from './pages/Dashboard';

// Import Protected Route Guard
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

// Dashboard layout component that wraps routes
const DashboardLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTripId, setActiveTripId] = useState(null);
    const [user, setUser] = useState(null);

    // Poll localStorage occasionally to show active trip status and auth state in the navbar/sidebar
    const checkState = () => {
        const tripId = localStorage.getItem('gd_tripId');
        setActiveTripId(tripId);

        const loggedUser = localStorage.getItem('gd_user');
        if (loggedUser) {
            setUser(JSON.parse(loggedUser));
        } else {
            setUser(null);
        }
    };

    useEffect(() => {
        checkState();
        window.addEventListener('storage', checkState);
        window.addEventListener('twin-updated', checkState);
        window.addEventListener('auth-change', checkState);

        // Custom interval to keep active trip ID in sync
        const interval = setInterval(checkState, 2000);

        return () => {
            window.removeEventListener('storage', checkState);
            window.removeEventListener('twin-updated', checkState);
            window.removeEventListener('auth-change', checkState);
            clearInterval(interval);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('gd_token');
        localStorage.removeItem('gd_user');
        localStorage.removeItem('gd_vehicle');
        localStorage.removeItem('gd_tripId');
        localStorage.removeItem('gd_timeline');
        localStorage.removeItem('gd_recommendations');

        // Dispatch auth state change locally
        window.dispatchEvent(new Event('auth-change'));

        // Redirect to login
        navigate('/login');
    };

    const isPublicPage = location.pathname === '/login' || location.pathname === '/signup';

    if (isPublicPage) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100 font-sans antialiased">
                {children}
            </div>
        );
    }

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Vehicle Setup', path: '/vehicle-setup', icon: Sliders },
        { name: 'Journey Companion', path: '/journey', icon: Compass },
        { name: 'Itinerary Planner', path: '/itinerary', icon: Calendar },
        { name: 'Digital Twin Studio', path: '/digital-twin', icon: Activity },
        { name: 'AI Agent Panel', path: '/agents', icon: BrainCircuit }
    ];

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans antialiased">
            {/* Mobile Top Navbar */}
            <header className="lg:hidden h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-purple-500 fill-purple-500/20" />
                    <span className="font-extrabold text-white text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                        GUARDIANDRIVE AI
                    </span>
                </div>
                <button
                    onClick={toggleMobileMenu}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </header>

            <div className="flex-1 flex relative">
                {/* Left Sidebar (Desktop only) */}
                <aside className="hidden lg:flex w-72 bg-slate-900/60 border-r border-slate-800/80 flex-col justify-between sticky top-0 h-screen p-6 z-30 backdrop-blur-md">
                    <div className="space-y-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 px-2">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-white text-base tracking-widest leading-none">
                                    GUARDIANDRIVE
                                </span>
                                <span className="text-[10px] text-purple-400 font-bold tracking-widest mt-0.5">
                                    MOBILITY COMPANION
                                </span>
                            </div>
                        </div>

                        {user && (
                            <div className="px-3 py-2 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-purple-650 flex items-center justify-center font-bold text-white text-xs">
                                    {user.name ? user.name[0].toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                                    <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation links */}
                        <nav className="space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${isActive
                                                ? 'bg-purple-600/10 text-purple-300 border border-purple-500/30 shadow-md shadow-purple-500/5'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-white'
                                            }`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Active Trip Info and Credits */}
                    <div className="space-y-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent cursor-pointer"
                        >
                            <LogOut className="h-4 w-4 text-red-400" />
                            Sign Out
                        </button>

                        {activeTripId ? (
                            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping mt-3 mr-3"></div>
                                <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-emerald-500 rounded-full mt-3 mr-3"></div>
                                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">ACTIVE TRIP STATE</span>
                                <span className="block text-xs text-emerald-400 font-mono font-bold mt-1 tracking-wide">
                                    {activeTripId}
                                </span>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl">
                                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">SYSTEM STATUS</span>
                                <span className="block text-xs text-slate-400 mt-1">
                                    Ready to initialize
                                </span>
                            </div>
                        )}

                        <div className="text-[10px] text-slate-650 text-center font-medium">
                            GuardianDrive AI © 2026. Hackathon Module.
                        </div>
                    </div>
                </aside>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-30 flex">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
                            onClick={toggleMobileMenu}
                        ></div>

                        {/* Menu */}
                        <nav className="relative w-64 max-w-xs bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 z-45 animate-fade-in h-full">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                    <span className="font-extrabold text-white text-sm tracking-wider">NAVIGATION</span>
                                    <button
                                        onClick={toggleMobileMenu}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {user && (
                                    <div className="px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-purple-650 flex items-center justify-center font-bold text-white text-xs">
                                            {user.name ? user.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                                            <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;

                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={toggleMobileMenu}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${isActive
                                                        ? 'bg-purple-600/10 text-purple-300 border border-purple-500/20'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {item.name}
                                            </Link>
                                        );
                                    })}

                                    <button
                                        onClick={() => {
                                            toggleMobileMenu();
                                            handleLogout();
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>

                            {activeTripId && (
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase block">ACTIVE MONITORING</span>
                                    <span className="text-xs text-emerald-400 font-mono font-semibold">{activeTripId}</span>
                                </div>
                            )}
                        </nav>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 flex flex-col bg-slate-950/40 relative">
                    <div className="p-6 md:p-8 lg:p-10 flex-1 overflow-y-auto w-full max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <DashboardLayout>
                <Routes>
                    {/* Public Authentication routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/vehicle-setup" element={<ProtectedRoute><VehicleSetup /></ProtectedRoute>} />
                    <Route path="/journey" element={<ProtectedRoute><JourneyCompanion /></ProtectedRoute>} />
                    <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
                    <Route path="/digital-twin" element={<ProtectedRoute><DigitalTwin /></ProtectedRoute>} />
                    <Route path="/agents" element={<ProtectedRoute><AgentPanel /></ProtectedRoute>} />

                    {/* Root Redirects */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </DashboardLayout>
        </BrowserRouter>
    );
};

export default App;
