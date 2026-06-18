import express from 'express';
import { calculateRange, predictBatteryHealth, diagnoseMileage, suggestStops } from '../controllers/vehicleController.js';

const router = express.Router();

router.post('/calculate-range', calculateRange);
router.post('/battery-health', predictBatteryHealth);
router.post('/mileage', diagnoseMileage);
router.post('/stop-suggestions', suggestStops);

export default router;
