const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Save name is required!'],
  },
  username: String,
  email: {
    type: String,
    required: [true, 'Email field is required!'],
  },
  password_secret: {
    type: String,
    required: [true, 'Encrypted password is required!'],
  },
  registered_number: String,
  loginURL: {
    type: String,
  },
  logoURL: {
    type: String,
  },
  category: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;

saveSchema.path('loginURL').validate(function (value) {
  if (!value) return true;
  return urlRegex.test(value);
}, 'Invalid URL.');

// Pre-save hook to transform loginURL into a canonical form and generate logoURL
saveSchema.pre('save', function (next) {
  if (this.isModified('loginURL') && this.loginURL) {
    let input = this.loginURL.trim();

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
      this.loginURL = `${urlObj.protocol}//${urlObj.hostname}`;

      // For logoURL, remove the "www." prefix if it exists
      const logoHostname = urlObj.hostname.replace(/^www\./, '');
      this.logoURL = `https://logo.clearbit.com/${logoHostname}`;
    } catch (error) {
      return next(new Error('Invalid URL provided.'));
    }
  }
  next();
});

module.exports = mongoose.model('Save', saveSchema);
