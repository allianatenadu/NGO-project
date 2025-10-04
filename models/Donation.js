const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be greater than 0']
  },
  date: {
    type: Date,
    default: Date.now
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donor ID is required']
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'cancelled'],
      message: 'Status must be either pending, completed, or cancelled'
    },
    default: 'pending'
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
DonationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
DonationSchema.index({ donorId: 1, date: -1 });
DonationSchema.index({ projectId: 1 });

module.exports = mongoose.model('Donation', DonationSchema);