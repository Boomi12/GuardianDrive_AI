import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getVehicle } from '../services/api';
import { Shield, Mail, Lock } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate fields immediately as user types
  useEffect(() => {
    const newErrors = {};

    // Email check
    if (formData.email !== undefined && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else if (formData.email !== undefined) {
      newErrors.email = 'Email is required';
    }

    // Password check
    if (formData.password !== undefined && formData.password !== '') {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else if (formData.password !== undefined) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    // Form is valid if no errors and all fields are filled
    const allFilled = formData.email.trim() && formData.password;
    setIsFormValid(Object.keys(newErrors).length === 0 && allFilled);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setSubmitError('');

    try {
      const data = await login(formData.email, formData.password);
      if (data.success) {
        // Store in localStorage
        localStorage.setItem('gd_token', data.token);
        localStorage.setItem('gd_user', JSON.stringify(data.user));
        
        // Trigger event to re-render layouts
        window.dispatchEvent(new Event('auth-change'));

        // Check if vehicle profile exists
        try {
          const vehicleRes = await getVehicle(data.user.id);
          if (vehicleRes.success && vehicleRes.data) {
            localStorage.setItem('gd_vehicle', JSON.stringify(vehicleRes.data));
            navigate('/dashboard');
          } else {
            navigate('/vehicle-setup');
          }
        } catch (vehicleErr) {
          // If vehicle search fails (e.g. 404), go to setup page
          navigate('/vehicle-setup');
        }
      }
    } catch (err) {
      setSubmitError(err.error || err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -ml-10 -mt-10"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mb-10"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to monitor your GuardianDrive AI twins</p>
        </div>

        {submitError && (
          <div className="mb-5 p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-300 text-xs">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`w-full bg-slate-950 border rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-650 focus:outline-none transition-colors ${
                  errors.email ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                }`}
              />
            </div>
            {errors.email && <span className="text-[10px] text-red-400 mt-1 block">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full bg-slate-950 border rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-650 focus:outline-none transition-colors ${
                  errors.password ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                }`}
              />
            </div>
            {errors.password && <span className="text-[10px] text-red-400 mt-1 block">{errors.password}</span>}
          </div>

          <PrimaryButton
            type="submit"
            disabled={!isFormValid}
            loading={loading}
            className="mt-6"
          >
            Sign In
          </PrimaryButton>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-bold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
