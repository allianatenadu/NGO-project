const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

// Create Express app for testing
const app = express();
app.use(express.json());

// Import routes
const userRoutes = require('../routes/users');
app.use('/users', userRoutes);

// Mock the User model for testing
jest.mock('../models/User');

describe('Users API - GET Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'John Doe',
          email: 'john@example.com',
          role: 'donor',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'volunteer',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      User.find.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'donor'
      });
      expect(response.body[1]).toMatchObject({
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'volunteer'
      });
      expect(User.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users exist', async () => {
      User.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toHaveLength(0);
      expect(User.find).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database connection error';
      User.find.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch users' });
      expect(User.find).toHaveBeenCalledTimes(1);
    });
  });
});