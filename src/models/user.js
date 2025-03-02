const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  saves: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Save',
    },
  ],
  first_name: {
    type: String,
    required: [true, 'First name is required!'],
    trim: true,
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required!'],
    trim: true,
  },
  username: {
    type: String,
    required: [true, 'Username is required!'],
    unique: [true, 'Username is already taken!'],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required!'],
    validate: {
      validator: function (password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])(?=.{8,50})/.test(
          password
        );
      },
      message: (props) =>
        `Password "${props.value}" is not strong enough! It must be 8-50 characters long and include an uppercase letter, a number, and a special character.`,
    },
  },
  email: {
    type: String,
    required: [true, 'E-mail address is required!'],
    unique: true,
    validate: {
      validator: function (email) {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          email
        );
      },
      message: (props) => `${props.value} is not a valid e-mail address!`,
    },
  },
  secret: {
    // OTP setup key
    type: String,
    unique: true,
  },
  encryptor_private_key: {
    type: String,
    required: [true, 'Encryptor private key is required!'],
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED'],
    default: 'PENDING',
  },
  reset_token: String,
  reset_expires: Date,
  profileImage: {
    type: String,
  },
});

// Hash password asynchronously before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed password
userSchema.methods.isMatchedPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate signed JWT token
userSchema.methods.getSignedJWTToken = function () {
  const payload = { userId: this._id, status: this.status };
  const options = { expiresIn: process.env.JWT_EXP_DATE };
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, options);
};

// Set password reset token and expiration
userSchema.methods.setResetToken = function () {
  this.reset_token = crypto.randomBytes(20).toString('hex');
  this.reset_expires = Date.now() + 30 * 60 * 1000; // 30 minutes from now
};

module.exports = mongoose.model('User', userSchema);
