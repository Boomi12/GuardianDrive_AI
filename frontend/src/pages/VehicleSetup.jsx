import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveVehicle, updateVehicle, getVehicle } from '../services/api';
import { Car, ShieldAlert, Sparkles, Sliders, ArrowRight } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';

const VehicleSetup = () => {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    ownerName: '',
    model: '',
    number: '',
    type: 'EV',
    batteryPercentage: 80,
    fuelPercentage: 80,
    mileage: 15,
    range: 350,
    emergencyContact: ''
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const user = JSON.parse(localStorage.getItem('gd_user') || '{}');

  // Check if user already has a vehicle profile
  useEffect(() => {
    const fetchExistingVehicle = async () => {
      if (!user.id) {
        setFetching(false);
        return;
      }
      try {
        const res = await getVehicle(user.id);
        if (res.success && res.data) {
          const vehicle = res.data;
          setFormData({
            ownerName: vehicle.ownerName || '',
            model: vehicle.model || '',
            number: vehicle.number || '',
            type: vehicle.type || 'EV',
            batteryPercentage: vehicle.batteryPercentage || 80,
            fuelPercentage: vehicle.fuelPercentage || 80,
            mileage: vehicle.mileage || 15,
            range: vehicle.range || 350,
            emergencyContact: vehicle.emergencyContact || ''
          });
          setIsEditMode(true);
          localStorage.setItem('gd_vehicle', JSON.stringify(vehicle));
        }
      } catch (err) {
        // Safe to ignore if vehicle profile doesn't exist
        console.log('No existing vehicle profile, using clean setup form.');
      } finally {
        setFetching(false);
      }
    };

    fetchExistingVehicle();
  }, [user.id]);

  // Real-time validations as the user types
  useEffect(() => {
    const newErrors = {};

    if (formData.ownerName !== undefined && formData.ownerName.trim() === '') {
      newErrors.ownerName = 'Owner name is required';
    }

    if (formData.model !== undefined && formData.model.trim() === '') {
      newErrors.model = 'Vehicle model is required';
    }

    if (formData.number !== undefined && formData.number.trim() === '') {
      newErrors.number = 'Vehicle number is required';
    }

    if (!formData.type) {
      newErrors.type = 'Vehicle type is required';
    }

    if (formData.type === 'EV') {
      const bat = Number(formData.batteryPercentage);
      if (isNaN(bat) || bat < 0 || bat > 100) {
        newErrors.batteryPercentage = 'Battery percentage must be between 0 and 100';
      }
    } else {
      // Petrol/Diesel
      const fuel = Number(formData.fuelPercentage);
      if (isNaN(fuel) || fuel < 0 || fuel > 100) {
        newErrors.fuelPercentage = 'Fuel percentage must be between 0 and 100';
      }

      const mil = Number(formData.mileage);
      if (isNaN(mil) || mil <= 0) {
        newErrors.mileage = 'Mileage must be a positive number';
      }
    }

    const rng = Number(formData.range);
    if (isNaN(rng) || rng <= 0) {
      newErrors.range = 'Range must be a positive number';
    }

    if (formData.emergencyContact !== undefined && formData.emergencyContact.trim() === '') {
      newErrors.emergencyContact = 'Emergency contact is required';
    }

    setErrors(newErrors);

    // Form validity evaluation
    const basicFilled = formData.ownerName.trim() && formData.model.trim() && formData.number.trim() && formData.emergencyContact.trim();
    let typeFilled = false;
    if (formData.type === 'EV') {
      typeFilled = formData.batteryPercentage !== '';
    } else {
      typeFilled = formData.fuelPercentage !== '' && formData.mileage !== '';
    }
    const rangeFilled = formData.range !== '';

    setIsFormValid(Object.keys(newErrors).length === 0 && basicFilled && typeFilled && rangeFilled);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-set reasonable default ranges based on selection if not modified
      if (name === 'type') {
        updated.range = value === 'EV' ? 340 : 580;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setSubmitError('');
    setSuccessMsg('');

    const submitData = {
      ownerName: formData.ownerName,
      model: formData.model,
      number: formData.number,
      type: formData.type,
      batteryPercentage: formData.type === 'EV' ? Number(formData.batteryPercentage) : undefined,
      fuelPercentage: formData.type !== 'EV' ? Number(formData.fuelPercentage) : undefined,
      mileage: formData.type !== 'EV' ? Number(formData.mileage) : undefined,
      range: Number(formData.range),
      emergencyContact: formData.emergencyContact
    };

    try {
      let res;
      if (isEditMode) {
        res = await updateVehicle(user.id, submitData);
      } else {
        res = await saveVehicle(submitData);
      }

      if (res.success) {
        setSuccessMsg(isEditMode ? 'Vehicle profile updated successfully!' : 'Vehicle profile registered successfully!');
        localStorage.setItem('gd_vehicle', JSON.stringify(res.data));
        
        // Setup local storage gd_form vehicle items as well to keep in sync with teammate 4 companion
        const savedForm = localStorage.getItem('gd_form');
        if (savedForm) {
          const currentForm = JSON.parse(savedForm);
          currentForm.vehicleType = formData.type;
          currentForm.fuelOrBatteryLevel = formData.type === 'EV' ? Number(formData.batteryPercentage) : Number(formData.fuelPercentage);
          currentForm.mileageOrRange = Number(formData.range);
          localStorage.setItem('gd_form', JSON.stringify(currentForm));
        }

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setSubmitError(err.error || err.message || 'Failed to save vehicle profile. Please check inputs.');
      
      // Fallback local storage save if backend database status is degraded
      if (!isEditMode) {
        const fallbackVehicle = { userId: user.id, ...submitData };
        localStorage.setItem('gd_vehicle', JSON.stringify(fallbackVehicle));
        setSuccessMsg('Saved vehicle parameters locally (Offline mode).');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-sm">Retrieving profile status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 animate-fade-in">
      <div className="bg-slate-900/60 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

        <div className="flex items-center gap-3.5 mb-6 border-b border-slate-850 pb-5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {isEditMode ? 'Vehicle Configuration' : 'Vehicle Profile Setup'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Register vehicle drivetrain parameters for live routing twins</p>
          </div>
        </div>

        {submitError && (
          <div className="mb-5 p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-300 text-xs">
            {submitError}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Vehicle Owner Name
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Owner full name"
                className={`w-full bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-650 focus:outline-none transition-colors ${
                  errors.ownerName ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                }`}
              />
              {errors.ownerName && <span className="text-[10px] text-red-400 mt-1 block">{errors.ownerName}</span>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Vehicle Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. Tesla Model 3 / Hyundai Creta"
                className={`w-full bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-650 focus:outline-none transition-colors ${
                  errors.model ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                }`}
              />
              {errors.model && <span className="text-[10px] text-red-400 mt-1 block">{errors.model}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="e.g. KA-03-HA-1234"
                className={`w-full bg-slate-950 border rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-650 focus:outline-none transition-colors ${
                  errors.number ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                }`}
              />
              {errors.number && <span className="text-[10px] text-red-400 mt-1 block">{errors.number}</span>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Drivetrain Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500/80 transition-colors appearance-none cursor-pointer"
              >
                <option value="EV">EV (Electric)</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>
          </div>

          {/* Conditional parameters based on drivetrain selection */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Sliders className="h-3.5 w-3.5 text-purple-400" />
              Engine / Battery Parameters
            </h3>

            {formData.type === 'EV' ? (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Current Battery Charge (%)
                </label>
                <input
                  type="number"
                  name="batteryPercentage"
                  min="0"
                  max="100"
                  value={formData.batteryPercentage}
                  onChange={handleChange}
                  className={`w-full bg-slate-900 border rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-colors ${
                    errors.batteryPercentage ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                  }`}
                />
                {errors.batteryPercentage && (
                  <span className="text-[10px] text-red-400 mt-1 block">{errors.batteryPercentage}</span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Current Fuel Level (%)
                  </label>
                  <input
                    type="number"
                    name="fuelPercentage"
                    min="0"
                    max="100"
                    value={formData.fuelPercentage}
                    onChange={handleChange}
                    className={`w-full bg-slate-900 border rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-colors ${
                      errors.fuelPercentage ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                    }`}
                  />
                  {errors.fuelPercentage && (
                    <span className="text-[10px] text-red-400 mt-1 block">{errors.fuelPercentage}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Average Mileage (km/l)
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    min="1"
                    value={formData.mileage}
                    onChange={handleChange}
                    className={`w-full bg-slate-900 border rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-colors ${
                      errors.mileage ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                    }`}
                  />
                  {errors.mileage && <span className="text-[10px] text-red-400 mt-1 block">{errors.mileage}</span>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Current Range Estimate (km)
              </label>
              <input
                type="number"
                name="range"
                min="1"
                value={formData.range}
                onChange={handleChange}
                className={`w-full bg-slate-900 border rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-colors ${
                  errors.range ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                }`}
              />
              {errors.range && <span className="text-[10px] text-red-400 mt-1 block">{errors.range}</span>}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Preferred Emergency Contact (SOS Number)
            </label>
            <div className="relative">
              <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400/80 h-4 w-4" />
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="e.g. +91 99999 99999"
                className={`w-full bg-slate-950 border rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-650 focus:outline-none transition-colors ${
                  errors.emergencyContact ? 'border-red-500/50' : 'border-slate-800 focus:border-purple-500/80'
                }`}
              />
            </div>
            {errors.emergencyContact && (
              <span className="text-[10px] text-red-400 mt-1 block">{errors.emergencyContact}</span>
            )}
          </div>

          <PrimaryButton
            type="submit"
            disabled={!isFormValid}
            loading={loading}
            className="mt-6"
          >
            {isEditMode ? 'Update Drivetrain Profile' : 'Save and Continue'}
            <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
};

export default VehicleSetup;
