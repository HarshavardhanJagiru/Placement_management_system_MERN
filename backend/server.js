import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import startReminderDaemon from './services/reminderDaemon.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Placement Management System API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);

  // Start the interview 24h reminders background loop
  startReminderDaemon();
});
