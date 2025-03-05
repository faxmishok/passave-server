const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  bank_name: {
    type: String,
    required: [true, 'Bank name is required!'],
  },
  card_number: {
    type: String,
    required: true,
  },
  cvv: {
    type: String,
    required: true,
  },
  expiry_date: {
    type: String,
    required: true,
  },
  bank_website: {
    type: String,
  },
  logoURL: {
    type: String,
  },
  pin: {
    type: String,
    required: [true, 'PIN is required!'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Pre-save hook to automatically generate logoURL using Clearbit's API
cardSchema.pre('save', function (next) {
  if (this.isModified('bank_website') && this.bank_website) {
    let input = this.bank_website.trim();

    // Prepend "https://" if the URL doesn't start with http:// or https://
    if (!/^https?:\/\//i.test(input)) {
      input = 'https://' + input;
    }

    try {
      const urlObj = new URL(input);

      // Ensure the canonical loginURL has "www." at the beginning
      if (!urlObj.hostname.startsWith('www.')) {
        urlObj.hostname = 'www.' + urlObj.hostname;
      }
      // Store the canonical loginURL (protocol + www.hostname)
      this.bank_website = `${urlObj.protocol}//${urlObj.hostname}`;

      // For logoURL, remove the "www." prefix if it exists
      const logoHostname = urlObj.hostname.replace(/^www\./, '');
      this.logoURL = `https://logo.clearbit.com/${logoHostname}`;
    } catch (error) {
      return next(new Error('Invalid URL provided.'));
    }
  }
  next();
});

module.exports = mongoose.model('Card', cardSchema);
