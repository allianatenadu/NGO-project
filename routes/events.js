const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     EventInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - date
 *         - endDate
 *         - location
 *         - organizerId
 *         - type
 *         - registrationDeadline
 *       properties:
 *         name:
 *           type: string
 *           description: Event name
 *         description:
 *           type: string
 *           description: Event description
 *         date:
 *           type: string
 *           format: date
 *           description: Event start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Event end date
 *         location:
 *           type: string
 *           description: Event location
 *         organizerId:
 *           type: string
 *           description: ID of the event organizer (User)
 *         type:
 *           type: string
 *           enum: [fundraiser, volunteer, workshop, conference, community, awareness, other]
 *           description: Event type
 *         status:
 *           type: string
 *           enum: [planned, active, completed, cancelled, postponed]
 *           description: Event status
 *         maxAttendees:
 *           type: number
 *           minimum: 1
 *           maximum: 10000
 *           description: Maximum number of attendees
 *         currentAttendees:
 *           type: number
 *           minimum: 0
 *           description: Current number of attendees
 *         registrationDeadline:
 *           type: string
 *           format: date
 *           description: Registration deadline
 *         entryFee:
 *           type: number
 *           minimum: 0
 *           description: Entry fee amount
 */

// GET /events - Return all events
/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of all events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('organizerId', 'name email');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /events - Create a new event
/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or volunteer access required
 *       404:
 *         description: Organizer not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      endDate,
      location,
      organizerId,
      type,
      status,
      maxAttendees,
      currentAttendees,
      registrationDeadline,
      entryFee
    } = req.body;

    // Validation
    if (!name || !description || !date || !endDate || !location || !organizerId || !type || !registrationDeadline) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, date, endDate, location, organizerId, type, and registrationDeadline are required'
      });
    }

    // Validate organizerId format
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({
        error: 'Invalid organizer ID format. Must be a valid ObjectId.'
      });
    }

    // Check if organizer exists
    const organizer = await User.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ error: 'Event organizer not found' });
    }

    // Validate event type
    const validTypes = ['fundraiser', 'volunteer', 'workshop', 'conference', 'community', 'awareness', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid event type. Must be one of: fundraiser, volunteer, workshop, conference, community, awareness, other'
      });
    }

    // Validate status if provided
    if (status && !['planned', 'active', 'completed', 'cancelled', 'postponed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: planned, active, completed, cancelled, postponed'
      });
    }

    // Validate maxAttendees if provided
    if (maxAttendees !== undefined && (maxAttendees < 1 || maxAttendees > 10000)) {
      return res.status(400).json({
        error: 'Maximum attendees must be between 1 and 10,000'
      });
    }

    // Validate currentAttendees if provided
    if (currentAttendees !== undefined && currentAttendees < 0) {
      return res.status(400).json({
        error: 'Current attendees cannot be negative'
      });
    }

    // Validate entryFee if provided
    if (entryFee !== undefined && entryFee < 0) {
      return res.status(400).json({
        error: 'Entry fee cannot be negative'
      });
    }

    const event = new Event({
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
      endDate: new Date(endDate),
      location: location.trim(),
      organizerId,
      type,
      status: status || 'planned',
      maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      currentAttendees: currentAttendees ? Number(currentAttendees) : 0,
      registrationDeadline: new Date(registrationDeadline),
      entryFee: entryFee ? Number(entryFee) : 0
    });

    const savedEvent = await event.save();
    const populatedEvent = await Event.findById(savedEvent._id).populate('organizerId', 'name email');

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error('Error creating event:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid date format or ObjectId' });
    }

    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /events/:id - Update an event
/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
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
 *               date:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [fundraiser, volunteer, workshop, conference, community, awareness, other]
 *               status:
 *                 type: string
 *                 enum: [planned, active, completed, cancelled, postponed]
 *               maxAttendees:
 *                 type: number
 *               currentAttendees:
 *                 type: number
 *               registrationDeadline:
 *                 type: string
 *                 format: date
 *               entryFee:
 *                 type: number
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin or volunteer access required
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateToken, requireAdminOrManager, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      date,
      endDate,
      location,
      type,
      status,
      maxAttendees,
      currentAttendees,
      registrationDeadline,
      entryFee
    } = req.body;

    // Check if event exists
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Validate event type if provided
    if (type && !['fundraiser', 'volunteer', 'workshop', 'conference', 'community', 'awareness', 'other'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid event type. Must be one of: fundraiser, volunteer, workshop, conference, community, awareness, other'
      });
    }

    // Validate status if provided
    if (status && !['planned', 'active', 'completed', 'cancelled', 'postponed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: planned, active, completed, cancelled, postponed'
      });
    }

    // Validate maxAttendees if provided
    if (maxAttendees !== undefined && (maxAttendees < 1 || maxAttendees > 10000)) {
      return res.status(400).json({
        error: 'Maximum attendees must be between 1 and 10,000'
      });
    }

    // Validate currentAttendees if provided
    if (currentAttendees !== undefined && currentAttendees < 0) {
      return res.status(400).json({
        error: 'Current attendees cannot be negative'
      });
    }

    // Validate entryFee if provided
    if (entryFee !== undefined && entryFee < 0) {
      return res.status(400).json({
        error: 'Entry fee cannot be negative'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (date !== undefined) updateData.date = new Date(date);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location.trim();
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (maxAttendees !== undefined) updateData.maxAttendees = Number(maxAttendees);
    if (currentAttendees !== undefined) updateData.currentAttendees = Number(currentAttendees);
    if (registrationDeadline !== undefined) updateData.registrationDeadline = new Date(registrationDeadline);
    if (entryFee !== undefined) updateData.entryFee = Number(entryFee);

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('organizerId', 'name email');

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid event ID or date format' });
    }

    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /events/:id - Delete an event
/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully', event: deletedEvent });
  } catch (error) {
    console.error('Error deleting event:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// GET /events/organizer/:organizerId - Get events by organizer
/**
 * @swagger
 * /events/organizer/{organizerId}:
 *   get:
 *     summary: Get events by organizer ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: organizerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organizer ID
 *     responses:
 *       200:
 *         description: List of events by the organizer
 *       404:
 *         description: Organizer not found
 *       500:
 *         description: Server error
 */
router.get('/organizer/:organizerId', async (req, res) => {
  try {
    const { organizerId } = req.params;

    // Validate organizerId format
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({ error: 'Invalid organizer ID format. Must be a valid ObjectId.' });
    }

    // Check if organizer exists
    const organizer = await User.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ error: 'Event organizer not found' });
    }

    const events = await Event.find({ organizerId }).populate('organizerId', 'name email');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events by organizer:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid organizer ID' });
    }

    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;