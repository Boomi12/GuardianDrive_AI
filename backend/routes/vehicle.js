import express from 'express';
import Vehicle from '../models/Vehicle.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Helper validation function
const validateVehicleData = (data) => {
  const { type, batteryPercentage, fuelPercentage, mileage, range, number, ownerName, model, emergencyContact } = data;
  
  if (!ownerName || !ownerName.trim()) return 'Owner name is required';
  if (!model || !model.trim()) return 'Vehicle model is required';
  if (!number || !number.trim()) return 'Vehicle number is required';
  if (!emergencyContact || !emergencyContact.trim()) return 'Emergency contact is required';
  if (!type || !['EV', 'Petrol', 'Diesel'].includes(type)) {
    return 'Vehicle type is required and must be EV, Petrol, or Diesel';
  }

  if (type === 'EV') {
    if (batteryPercentage === undefined || batteryPercentage < 0 || batteryPercentage > 100) {
      return 'Battery percentage is required and must be between 0 and 100';
    }
  } else {
    // Petrol or Diesel
    if (fuelPercentage === undefined || fuelPercentage < 0 || fuelPercentage > 100) {
      return 'Fuel percentage is required and must be between 0 and 100';
    }
    if (mileage === undefined || mileage <= 0) {
      return 'Mileage is required and must be a positive number';
    }
  }

  if (range === undefined || range <= 0) {
    return 'Range is required and must be a positive number';
  }

  return null;
};

// POST /api/vehicle - Create vehicle profile
router.post('/', authMiddleware, async (req, res) => {
  try {
    const errorMsg = validateVehicleData(req.body);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const {
      ownerName,
      model,
      number,
      type,
      batteryPercentage,
      fuelPercentage,
      mileage,
      range,
      emergencyContact
    } = req.body;

    // Check if vehicle profile already exists for this user
    let vehicle = await Vehicle.findOne({ userId: req.user.id });
    if (vehicle) {
      return res.status(400).json({ error: 'Vehicle profile already exists for this user. Use PUT to update.' });
    }

    vehicle = new Vehicle({
      userId: req.user.id,
      ownerName,
      model,
      number,
      type,
      batteryPercentage: type === 'EV' ? batteryPercentage : undefined,
      fuelPercentage: type !== 'EV' ? fuelPercentage : undefined,
      mileage: type !== 'EV' ? mileage : undefined,
      range,
      emergencyContact
    });

    await vehicle.save();
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error creating vehicle profile:', error);
    res.status(500).json({ error: 'Server error creating vehicle profile' });
  }
});

// GET /api/vehicle/:userId - Get vehicle profile by userId
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ userId: req.params.userId });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle profile not found' });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error fetching vehicle profile:', error);
    res.status(500).json({ error: 'Server error fetching vehicle profile' });
  }
});

// PUT /api/vehicle/:userId - Update vehicle profile by userId
router.put('/:userId', authMiddleware, async (req, res) => {
  try {
    const errorMsg = validateVehicleData(req.body);
    if (errorMsg) {
      return res.status(400).json({ error: errorMsg });
    }

    const {
      ownerName,
      model,
      number,
      type,
      batteryPercentage,
      fuelPercentage,
      mileage,
      range,
      emergencyContact
    } = req.body;

    let vehicle = await Vehicle.findOne({ userId: req.params.userId });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle profile not found' });
    }

    // Verify ownership
    if (vehicle.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to update this vehicle profile' });
    }

    vehicle.ownerName = ownerName;
    vehicle.model = model;
    vehicle.number = number;
    vehicle.type = type;
    vehicle.batteryPercentage = type === 'EV' ? batteryPercentage : undefined;
    vehicle.fuelPercentage = type !== 'EV' ? fuelPercentage : undefined;
    vehicle.mileage = type !== 'EV' ? mileage : undefined;
    vehicle.range = range;
    vehicle.emergencyContact = emergencyContact;

    await vehicle.save();
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error updating vehicle profile:', error);
    res.status(500).json({ error: 'Server error updating vehicle profile' });
  }
});

export default router;
