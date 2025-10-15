const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

// Create Express app for testing
const app = express();
app.use(express.json());

// Import routes
const eventRoutes = require('../routes/events');
app.use('/events', eventRoutes);

// Mock the models for testing
jest.mock('../models/Event');
jest.mock('../models/User');

describe('Events API - GET Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /events', () => {
    it('should return all events with populated organizer info', async () => {
      const organizerId = new mongoose.Types.ObjectId();
      const mockEvents = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Fundraising Gala',
          description: 'Annual fundraising event',
          date: new Date('2024-12-01'),
          endDate: new Date('2024-12-01'),
          location: 'Grand Hotel',
          organizerId: organizerId,
          type: 'fundraiser',
          status: 'planned',
          maxAttendees: 200,
          currentAttendees: 0,
          registrationDeadline: new Date('2024-11-15'),
          entryFee: 50,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Volunteer Training',
          description: 'Training session for volunteers',
          date: new Date('2024-11-15'),
          endDate: new Date('2024-11-15'),
          location: 'Community Center',
          organizerId: organizerId,
          type: 'workshop',
          status: 'active',
          maxAttendees: 50,
          currentAttendees: 25,
          registrationDeadline: new Date('2024-11-10'),
          entryFee: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockPopulatedEvents = mockEvents.map(event => ({
        ...event,
        organizerId: {
          _id: organizerId,
          name: 'Jane Smith',
          email: 'jane@example.com'
        }
      }));

      Event.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedEvents)
      });

      const response = await request(app)
        .get('/events')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        name: 'Fundraising Gala',
        description: 'Annual fundraising event',
        location: 'Grand Hotel',
        type: 'fundraiser',
        status: 'planned',
        maxAttendees: 200,
        currentAttendees: 0,
        entryFee: 50
      });
      expect(response.body[0].organizerId).toMatchObject({
        name: 'Jane Smith',
        email: 'jane@example.com'
      });
      expect(Event.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no events exist', async () => {
      Event.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/events')
        .expect(200);

      expect(response.body).toHaveLength(0);
      expect(Event.find).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database connection error';
      Event.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      const response = await request(app)
        .get('/events')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch events' });
      expect(Event.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /events/organizer/:organizerId', () => {
    it('should return events by specific organizer', async () => {
      const organizerId = new mongoose.Types.ObjectId();
      const mockEvents = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Fundraising Gala',
          organizerId: organizerId,
          type: 'fundraiser',
          status: 'planned'
        }
      ];

      const mockUser = {
        _id: organizerId,
        name: 'Jane Smith',
        email: 'jane@example.com'
      };

      User.findById.mockResolvedValue(mockUser);
      Event.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockEvents)
      });

      const response = await request(app)
        .get(`/events/organizer/${organizerId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'Fundraising Gala',
        type: 'fundraiser',
        status: 'planned'
      });
      expect(User.findById).toHaveBeenCalledWith(organizerId.toString());
      expect(Event.find).toHaveBeenCalledWith({ organizerId });
    });

    it('should return 404 when organizer not found', async () => {
      const organizerId = new mongoose.Types.ObjectId();

      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/events/organizer/${organizerId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Event organizer not found' });
      expect(User.findById).toHaveBeenCalledWith(organizerId.toString());
      expect(Event.find).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid organizer ID format', async () => {
      const invalidOrganizerId = 'invalid-id';

      const response = await request(app)
        .get(`/events/organizer/${invalidOrganizerId}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid organizer ID format. Must be a valid ObjectId.'
      });
      expect(User.findById).not.toHaveBeenCalled();
      expect(Event.find).not.toHaveBeenCalled();
    });
  });
});