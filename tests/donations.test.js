const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const User = require('../models/User');

// Create Express app for testing
const app = express();
app.use(express.json());

// Import routes
const donationRoutes = require('../routes/donations');
app.use('/donations', donationRoutes);

// Mock the models for testing
jest.mock('../models/Donation');
jest.mock('../models/User');

describe('Donations API - GET Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /donations', () => {
    it('should return all donations with populated donor info', async () => {
      const testDonorId = new mongoose.Types.ObjectId();
      const mockDonations = [
        {
          _id: new mongoose.Types.ObjectId(),
          amount: 100,
          donorId: testDonorId.toString(),
          projectId: 'project1',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          amount: 250,
          donorId: testDonorId.toString(),
          projectId: 'project2',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockPopulatedDonations = mockDonations.map(donation => ({
        ...donation,
        donorId: {
          _id: donation.donorId,
          name: 'John Doe',
          email: 'john@example.com'
        }
      }));

      Donation.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedDonations)
      });

      const response = await request(app)
        .get('/donations')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        amount: 100,
        projectId: 'project1',
        status: 'completed'
      });
      expect(response.body[0].donorId).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(Donation.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no donations exist', async () => {
      Donation.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/donations')
        .expect(200);

      expect(response.body).toHaveLength(0);
      expect(Donation.find).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database connection error';
      Donation.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      const response = await request(app)
        .get('/donations')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch donations' });
      expect(Donation.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /donations/donor/:donorId', () => {
    it('should return donations by specific donor', async () => {
      const donorId = new mongoose.Types.ObjectId();
      const mockDonations = [
        {
          _id: new mongoose.Types.ObjectId(),
          amount: 100,
          donorId: donorId,
          projectId: 'project1',
          status: 'completed'
        }
      ];

      const mockUser = {
        _id: donorId,
        name: 'John Doe',
        email: 'john@example.com'
      };

      User.findById.mockResolvedValue(mockUser);
      Donation.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDonations)
      });

      const response = await request(app)
        .get(`/donations/donor/${donorId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        amount: 100,
        projectId: 'project1',
        status: 'completed'
      });
      expect(User.findById).toHaveBeenCalledWith(donorId.toString());
      expect(Donation.find).toHaveBeenCalledWith({ donorId });
    });

    it('should return 404 when donor not found', async () => {
      const donorId = new mongoose.Types.ObjectId();

      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/donations/donor/${donorId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Donor not found' });
      expect(User.findById).toHaveBeenCalledWith(donorId.toString());
      expect(Donation.find).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid donor ID format', async () => {
      const invalidDonorId = 'invalid-id';

      const response = await request(app)
        .get(`/donations/donor/${invalidDonorId}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid donor ID format. Must be a valid ObjectId.'
      });
      expect(User.findById).not.toHaveBeenCalled();
      expect(Donation.find).not.toHaveBeenCalled();
    });
  });
});