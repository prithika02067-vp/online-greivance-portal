require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const grievanceRoutes = require('./routes/grievances');
const adminRoutes = require('./routes/admin');
const { listCategories, listDepartments } = require('./data/store');

const app = express();
const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/meta', async (req, res) => res.json({ categories: listCategories(), departments: listDepartments() }));
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/admin', adminRoutes);
app.use((error, req, res, next) => { console.error(error); res.status(error.status || 500).json({ message: error.message || 'Server error' }); });

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API listening on ${port}`));

module.exports = app;
