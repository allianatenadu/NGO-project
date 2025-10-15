const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - startDate
 *         - endDate
 *         - budget
 *         - targetAmount
 *         - managerId
 *         - category
 *       properties:
 *         name:
 *           type: string
 *           description: Project name
 *         description:
 *           type: string
 *           description: Project description
 *         startDate:
 *           type: string
 *           format: date
 *           description: Project start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Project end date
 *         budget:
 *           type: number
 *           minimum: 0
 *           description: Project budget
 *         targetAmount:
 *           type: number
 *           minimum: 0
 *           description: Target fundraising amount
 *         managerId:
 *           type: string
 *           description: ID of the project manager (User)
 *         location:
 *           type: string
 *           description: Project location
 *         category:
 *           type: string
 *           enum: [education, healthcare, environment, community, emergency, other]
 *           description: Project category
 *         status:
 *           type: string
 *           enum: [planning, active, on-hold, completed, cancelled]
 *           description: Project status
 */

// GET /projects - Return all projects
/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate('managerId', 'name email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /projects - Create a new project
/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or volunteer access required
 *       404:
 *         description: Manager not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      budget,
      targetAmount,
      managerId,
      location,
      category,
      status
    } = req.body;

    // Validation
    if (!name || !description || !startDate || !endDate || !budget || !targetAmount || !managerId || !category) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, startDate, endDate, budget, targetAmount, managerId, and category are required'
      });
    }

    if (budget < 0 || targetAmount < 0) {
      return res.status(400).json({
        error: 'Budget and target amount cannot be negative'
      });
    }

    // Validate managerId format
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({
        error: 'Invalid manager ID format. Must be a valid ObjectId.'
      });
    }

    // Check if manager exists
    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({ error: 'Project manager not found' });
    }

    // Validate category
    const validCategories = ['education', 'healthcare', 'environment', 'community', 'emergency', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category. Must be one of: education, healthcare, environment, community, emergency, other'
      });
    }

    // Validate status if provided
    if (status && !['planning', 'active', 'on-hold', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: planning, active, on-hold, completed, cancelled'
      });
    }

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: Number(budget),
      targetAmount: Number(targetAmount),
      managerId,
      location: location ? location.trim() : undefined,
      category,
      status: status || 'planning'
    });

    const savedProject = await project.save();
    const populatedProject = await Project.findById(savedProject._id).populate('managerId', 'name email');

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('Error creating project:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid date format or ObjectId' });
    }

    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /projects/:id - Update a project
/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               budget:
 *                 type: number
 *               targetAmount:
 *                 type: number
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [education, healthcare, environment, community, emergency, other]
 *               status:
 *                 type: string
 *                 enum: [planning, active, on-hold, completed, cancelled]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or volunteer access required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      startDate,
      endDate,
      budget,
      targetAmount,
      location,
      category,
      status
    } = req.body;

    // Check if project exists
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validation for budget and targetAmount if provided
    if (budget !== undefined && budget < 0) {
      return res.status(400).json({
        error: 'Budget cannot be negative'
      });
    }

    if (targetAmount !== undefined && targetAmount < 0) {
      return res.status(400).json({
        error: 'Target amount cannot be negative'
      });
    }

    // Validate category if provided
    if (category && !['education', 'healthcare', 'environment', 'community', 'emergency', 'other'].includes(category)) {
      return res.status(400).json({
        error: 'Invalid category. Must be one of: education, healthcare, environment, community, emergency, other'
      });
    }

    // Validate status if provided
    if (status && !['planning', 'active', 'on-hold', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: planning, active, on-hold, completed, cancelled'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (budget !== undefined) updateData.budget = Number(budget);
    if (targetAmount !== undefined) updateData.targetAmount = Number(targetAmount);
    if (location !== undefined) updateData.location = location.trim();
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('managerId', 'name email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid project ID or date format' });
    }

    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /projects/:id - Delete a project
/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully', project: deletedProject });
  } catch (error) {
    console.error('Error deleting project:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// GET /projects/manager/:managerId - Get projects by manager
/**
 * @swagger
 * /projects/manager/{managerId}:
 *   get:
 *     summary: Get projects by manager ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manager ID
 *     responses:
 *       200:
 *         description: List of projects by the manager
 *       404:
 *         description: Manager not found
 *       500:
 *         description: Server error
 */
router.get('/manager/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;

    // Validate managerId format
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ error: 'Invalid manager ID format. Must be a valid ObjectId.' });
    }

    // Check if manager exists
    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({ error: 'Project manager not found' });
    }

    const projects = await Project.find({ managerId }).populate('managerId', 'name email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects by manager:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid manager ID' });
    }

    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

module.exports = router;