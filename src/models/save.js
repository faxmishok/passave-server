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

const urlRegex =
  /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
saveSchema.path('loginURL').validate(function (value) {
  return urlRegex.test(value);
}, 'Invalid URL.');

// Pre-save hook to automatically generate logoURL using Clearbit's API
saveSchema.pre('save', function (next) {
  // Only update logoURL if loginURL is modified and exists
  if (this.isModified('loginURL') && this.loginURL) {
    try {
      const url = new URL(this.loginURL);
      // Remove "www." if present
      const domain = url.hostname.replace(/^www\./, '');
      // Build the logo URL using Clearbit's Logo API
      this.logoURL = `https://logo.clearbit.com/${domain}`;
    } catch (err) {
      // Pass error if URL parsing fails
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Save', saveSchema);
