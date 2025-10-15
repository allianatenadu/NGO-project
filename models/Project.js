const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget cannot be negative']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0, 'Target amount cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
      message: 'Status must be either planning, active, on-hold, completed, or cancelled'
    },
    default: 'planning'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project manager is required']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['education', 'healthcare', 'environment', 'community', 'emergency', 'other'],
      message: 'Category must be education, healthcare, environment, community, emergency, or other'
    },
    required: [true, 'Project category is required']
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
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
ProjectSchema.index({ status: 1, category: 1 });
ProjectSchema.index({ managerId: 1 });
ProjectSchema.index({ startDate: -1 });

module.exports = mongoose.model('Project', ProjectSchema);