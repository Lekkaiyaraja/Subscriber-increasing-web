require('dotenv').config();

const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const Team = require('./models/Team');
const Admin = require('./models/Admin');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL?.trim() || 'http://localhost:3000';
const FRONTEND_URL_ALT = 'http://localhost:5173';
const allowedOrigins = [FRONTEND_URL, FRONTEND_URL_ALT].filter(Boolean);

const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

mongoose.connection.on('connected', () => {
  console.log('🔁 MongoDB connection established');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔁 MongoDB reconnected');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error.message);
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Service unavailable: database is not connected' });
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbConnected: mongoose.connection.readyState === 1 });
});

app.set('io', io);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error && error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
});

const seedDefaultData = async () => {
  try {
    const defaultAdmin = await Admin.findOne({ username: 'admin' });
    if (!defaultAdmin) {
      await Admin.create({ username: 'admin', password: 'admin123' });
      console.log('👤 Default admin created: admin / admin123');
    }

    const teams = await Team.find();
    if (teams.length === 0) {
      await Team.create([{ name: 'Mumbai Superstars' }, { name: 'Chennai Chargers' }]);
      console.log('🏏 Default teams seeded');
    }
  } catch (error) {
    console.error('❌ Error seeding default data:', error.message);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

const startServer = async () => {
  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    console.error('❌ Initial MongoDB connection failed:', error.message);
  }

  if (dbConnected) {
    await seedDefaultData();
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (!dbConnected) {
      console.warn('⚠️ Server is running without a database connection. API routes will return 503 until MongoDB reconnects.');
    }
  });
};

startServer();
