import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route files
import itineraryRouter from './routes/itinerary.js';
import placesRouter from './routes/places.js';
import twinRouter from './routes/twin.js';
import agentsRouter from './routes/agents.js';
import vehicleRouter from './routes/vehicleRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guardiandrive';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB database.');
  })
  .catch((err) => {
    console.error('MongoDB database connection error:', err);
    console.log('Backend will run with degraded database status (no db persistence).');
  });

// API Routes
app.use('/api/itinerary', itineraryRouter);
app.use('/api/places', placesRouter);
app.use('/api/twin', twinRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/vehicle', vehicleRouter);

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    databaseConnected: mongoose.connection.readyState === 1
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`GuardianDrive AI Backend Server is running on port ${PORT}`);
});
