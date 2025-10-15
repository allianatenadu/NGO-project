const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');

// Create Express app for testing
const app = express();
app.use(express.json());

// Import routes
const projectRoutes = require('../routes/projects');
app.use('/projects', projectRoutes);

// Mock the models for testing
jest.mock('../models/Project');
jest.mock('../models/User');

describe('Projects API - GET Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /projects', () => {
    it('should return all projects with populated manager info', async () => {
      const managerId = new mongoose.Types.ObjectId();
      const mockProjects = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Education Project',
          description: 'Project for education',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          budget: 10000,
          targetAmount: 15000,
          status: 'active',
          managerId: managerId,
          category: 'education',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Healthcare Project',
          description: 'Project for healthcare',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-11-30'),
          budget: 20000,
          targetAmount: 25000,
          status: 'planning',
          managerId: managerId,
          category: 'healthcare',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockPopulatedProjects = mockProjects.map(project => ({
        ...project,
        managerId: {
          _id: managerId,
          name: 'John Doe',
          email: 'john@example.com'
        }
      }));

      Project.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedProjects)
      });

      const response = await request(app)
        .get('/projects')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        name: 'Education Project',
        description: 'Project for education',
        budget: 10000,
        targetAmount: 15000,
        status: 'active',
        category: 'education'
      });
      expect(response.body[0].managerId).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(Project.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no projects exist', async () => {
      Project.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      const response = await request(app)
        .get('/projects')
        .expect(200);

      expect(response.body).toHaveLength(0);
      expect(Project.find).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database connection error';
      Project.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error(errorMessage))
      });

      const response = await request(app)
        .get('/projects')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch projects' });
      expect(Project.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /projects/manager/:managerId', () => {
    it('should return projects by specific manager', async () => {
      const managerId = new mongoose.Types.ObjectId();
      const mockProjects = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Education Project',
          managerId: managerId,
          status: 'active'
        }
      ];

      const mockUser = {
        _id: managerId,
        name: 'John Doe',
        email: 'john@example.com'
      };

      User.findById.mockResolvedValue(mockUser);
      Project.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProjects)
      });

      const response = await request(app)
        .get(`/projects/manager/${managerId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: 'Education Project',
        status: 'active'
      });
      expect(User.findById).toHaveBeenCalledWith(managerId.toString());
      expect(Project.find).toHaveBeenCalledWith({ managerId });
    });

    it('should return 404 when manager not found', async () => {
      const managerId = new mongoose.Types.ObjectId();

      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/projects/manager/${managerId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Project manager not found' });
      expect(User.findById).toHaveBeenCalledWith(managerId.toString());
      expect(Project.find).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid manager ID format', async () => {
      const invalidManagerId = 'invalid-id';

      const response = await request(app)
        .get(`/projects/manager/${invalidManagerId}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid manager ID format. Must be a valid ObjectId.'
      });
      expect(User.findById).not.toHaveBeenCalled();
      expect(Project.find).not.toHaveBeenCalled();
    });
  });
});