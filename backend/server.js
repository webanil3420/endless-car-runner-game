require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors()); // Enable CORS to allow frontend requests
app.use(express.json()); // Parse JSON request bodies

// Mount Routes
app.use('/api', gameRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Endless Runner Backend is running!' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
