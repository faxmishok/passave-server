const mongoose = require('mongoose');

const identificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Identification name is required.'],
  },
  number: {
    type: String,
    required: [true, 'Identification number is required.'],
  },
  date_of_issue: {
    type: Date,
    required: [true, 'Date of issue is required.'],
  },
  expiration_date: {
    type: Date,
    required: [true, 'Expiration date is required.'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Optional: Validate that expiration_date is later than date_of_issue.
identificationSchema.pre('save', function (next) {
  if (this.expiration_date <= this.date_of_issue) {
    return next(new Error('Expiration date must be later than date of issue.'));
  }
  next();
});

module.exports = mongoose.model('Identification', identificationSchema);
