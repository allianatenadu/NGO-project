const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const swaggerDocument = require('./swagger');

// Import auth middleware
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Handle Render's dynamic port assignment
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at: http://localhost:${PORT}/api-docs`);
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`Production API available at: ${process.env.RENDER_EXTERNAL_URL}`);
    console.log(`Production Swagger UI: ${process.env.RENDER_EXTERNAL_URL}/api-docs`);
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ngo-project';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log(`Connected to: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.error('Full error:', err);
  console.log('Server will continue running without database connection');
  console.log('Please ensure MongoDB is running or set MONGO_URI environment variable');
  console.log('For Render deployment, make sure MONGO_URI environment variable is set correctly');
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'NGO Project API is running!' });
});

// Routes
const userRoutes = require('./routes/users');
const donationRoutes = require('./routes/donations');
const projectRoutes = require('./routes/projects');
const eventRoutes = require('./routes/events');
const authRoutes = require('./routes/auth');

app.use('/users', userRoutes);
app.use('/donations', donationRoutes);
app.use('/projects', projectRoutes);
app.use('/events', eventRoutes);
app.use('/auth', authRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;