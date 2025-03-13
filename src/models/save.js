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

// Pre-save hook to transform loginURL into a canonical form and generate logoURL
saveSchema.pre('save', function (next) {
  if (this.isModified('loginURL')) {
    let input = this.loginURL?.trim(); // Handle undefined or null gracefully

    if (!input) {
      // If loginURL is cleared or empty, reset logoURL too
      this.logoURL = undefined;
    } else {
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
  }

  next();
});

module.exports = mongoose.model('Save', saveSchema);
