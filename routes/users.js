const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [donor, volunteer, admin]
 *           description: User's role in the NGO
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /users - Return all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /users - Create a new user
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, and role are required'
      });
    }

    if (!['donor', 'volunteer', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Role must be either donor, volunteer, or admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role
    });

    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /users/:id - Update a user
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, and role are required'
      });
    }

    if (!['donor', 'volunteer', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Role must be either donor, volunteer, or admin'
      });
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    const emailExists = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: id }
    });

    if (emailExists) {
      return res.status(400).json({ error: 'Email is already taken by another user' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role
      },
      { new: true, runValidators: true }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /users/:id - Delete a user
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    console.error('Error deleting user:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;