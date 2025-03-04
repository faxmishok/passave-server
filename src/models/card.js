const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  bank_name: {
    type: String,
    required: [true, 'Bank name is required!'],
  },
  card_number: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{16}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid 16-digit card number!`,
    },
  },
  cvv: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{3}$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid three-digit CVV number!`,
    },
  },
  expiry_date: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(0[1-9]|1[0-2])\/\d{2}$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid expiry date! Please use MM/YY format.`,
    },
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
    validate: {
      validator: function (v) {
        return /^\d{4}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid 4-digit PIN!`,
    },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// URL validation for bank_website
const urlRegex =
  /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
cardSchema.path('bank_website').validate(function (value) {
  return urlRegex.test(value);
}, 'Invalid URL.');

// Pre-save hook to automatically generate logoURL using Clearbit's API
cardSchema.pre('save', function (next) {
  if (this.isModified('bank_website') && this.bank_website) {
    try {
      const url = new URL(this.bank_website);
      // Remove any leading "www." from the hostname
      const domain = url.hostname.replace(/^www\./, '');
      this.logoURL = `https://logo.clearbit.com/${domain}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Card', cardSchema);
