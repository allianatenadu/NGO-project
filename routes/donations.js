const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     DonationInput:
 *       type: object
 *       required:
 *         - amount
 *         - donorId
 *         - projectId
 *       properties:
 *         amount:
 *           type: number
 *           minimum: 1
 *           description: Donation amount
 *         donorId:
 *           type: string
 *           description: ID of the donor (User) - must be a valid MongoDB ObjectId
 *         projectId:
 *           type: string
 *           description: ID of the project being donated to
 *         description:
 *           type: string
 *           description: Optional donation description
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           description: Donation status
 */

/**
 * @swagger
 * /donations:
 *   get:
 *     summary: Get all donations
 *     tags: [Donations]
 *     responses:
 *       200:
 *         description: List of all donations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Donation'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// GET /donations - Return all donations
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().populate('donorId', 'name email');
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// POST /donations - Create a new donation
/**
 * @swagger
 * /donations:
 *   post:
 *     summary: Create a new donation
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DonationInput'
 *     responses:
 *       201:
 *         description: Donation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Donor not found
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
    const { amount, donorId, projectId, description } = req.body;

    // Validation
    if (!amount || !donorId || !projectId) {
      return res.status(400).json({
        error: 'Missing required fields: amount, donorId, and projectId are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      });
    }

    // Validate donorId format
    if (!mongoose.Types.ObjectId.isValid(donorId)) {
      return res.status(400).json({
        error: 'Invalid donor ID format. Must be a valid ObjectId.'
      });
    }

    // Check if donor exists
    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    const donation = new Donation({
      amount: Number(amount),
      donorId,
      projectId: projectId.trim(),
      description: description ? description.trim() : undefined
    });

    const savedDonation = await donation.save();
    const populatedDonation = await Donation.findById(savedDonation._id).populate('donorId', 'name email');

    res.status(201).json(populatedDonation);
  } catch (error) {
    console.error('Error creating donation:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid donor ID format' });
    }

    res.status(500).json({ error: 'Failed to create donation' });
  }
});

// PUT /donations/:id - Update a donation
/**
 * @swagger
 * /donations/{id}:
 *   put:
 *     summary: Update a donation by ID
 *     tags: [Donations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *               projectId:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *     responses:
 *       200:
 *         description: Donation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Donation not found
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
    const { amount, projectId, description, status } = req.body;

    // Check if donation exists
    const existingDonation = await Donation.findById(id);
    if (!existingDonation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Validation for amount if provided
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      });
    }

    // Validation for status if provided
    if (status && !['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Status must be either pending, completed, or cancelled'
      });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = Number(amount);
    if (projectId !== undefined) updateData.projectId = projectId.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;

    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('donorId', 'name email');

    res.json(updatedDonation);
  } catch (error) {
    console.error('Error updating donation:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid donation ID' });
    }

    res.status(500).json({ error: 'Failed to update donation' });
  }
});

// DELETE /donations/:id - Delete a donation
/**
 * @swagger
 * /donations/{id}:
 *   delete:
 *     summary: Delete a donation by ID
 *     tags: [Donations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donation ID
 *     responses:
 *       200:
 *         description: Donation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 donation:
 *                   $ref: '#/components/schemas/Donation'
 *       404:
 *         description: Donation not found
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

    const deletedDonation = await Donation.findByIdAndDelete(id);

    if (!deletedDonation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json({ message: 'Donation deleted successfully', donation: deletedDonation });
  } catch (error) {
    console.error('Error deleting donation:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid donation ID' });
    }

    res.status(500).json({ error: 'Failed to delete donation' });
  }
});

// GET /donations/donor/:donorId - Get donations by donor
/**
 * @swagger
 * /donations/donor/{donorId}:
 *   get:
 *     summary: Get donations by donor ID
 *     tags: [Donations]
 *     parameters:
 *       - in: path
 *         name: donorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Donor ID - must be a valid MongoDB ObjectId
 *     responses:
 *       200:
 *         description: List of donations by the donor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Donation'
 *       404:
 *         description: Donor not found
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
router.get('/donor/:donorId', async (req, res) => {
   try {
     const { donorId } = req.params;

     // Validate donorId format
     if (!mongoose.Types.ObjectId.isValid(donorId)) {
       return res.status(400).json({ error: 'Invalid donor ID format. Must be a valid ObjectId.' });
     }

     // Check if donor exists
     const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    const donations = await Donation.find({ donorId }).populate('donorId', 'name email');
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations by donor:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid donor ID' });
    }

    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

module.exports = router;