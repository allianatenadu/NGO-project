const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.date;
      },
      message: 'End date must be after start date'
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event organizer is required']
  },
  type: {
    type: String,
    enum: {
      values: ['fundraiser', 'volunteer', 'workshop', 'conference', 'community', 'awareness', 'other'],
      message: 'Event type must be fundraiser, volunteer, workshop, conference, community, awareness, or other'
    },
    required: [true, 'Event type is required']
  },
  status: {
    type: String,
    enum: {
      values: ['planned', 'active', 'completed', 'cancelled', 'postponed'],
      message: 'Status must be planned, active, completed, cancelled, or postponed'
    },
    default: 'planned'
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Maximum attendees must be at least 1'],
    max: [10000, 'Maximum attendees cannot exceed 10,000']
  },
  currentAttendees: {
    type: Number,
    default: 0,
    min: [0, 'Current attendees cannot be negative'],
    validate: {
      validator: function(value) {
        if (this.maxAttendees) {
          return value <= this.maxAttendees;
        }
        return true;
      },
      message: 'Current attendees cannot exceed maximum attendees'
    }
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required'],
    validate: {
      validator: function(value) {
        return value < this.date;
      },
      message: 'Registration deadline must be before event date'
    }
  },
  entryFee: {
    type: Number,
    min: [0, 'Entry fee cannot be negative'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
EventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
EventSchema.index({ date: -1 });
EventSchema.index({ status: 1, type: 1 });
EventSchema.index({ organizerId: 1 });
EventSchema.index({ location: 1 });

module.exports = mongoose.model('Event', EventSchema);