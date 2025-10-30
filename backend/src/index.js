require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const enrollmentRoutes = require('./routes/enrollments');
const editionRoutes = require('./routes/editions');
const rolesRoutes = require('./routes/roles');
const resultsRoutes = require('./routes/results');
const uploadRoutes = require('./routes/upload');
const newsRoutes = require('./routes/news');

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gesport';

async function start() {
  await mongoose.connect(MONGO_URI, { dbName: 'gesport' });
  console.log('MongoDB connected');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  // Serve uploads statically
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/events', eventRoutes);
  app.use('/enrollments', enrollmentRoutes);
  app.use('/editions', editionRoutes);
  app.use('/roles', rolesRoutes);
  app.use('/results', resultsRoutes);
  app.use('/upload', uploadRoutes);
  app.use('/news', newsRoutes);

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
