const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailHandler');
const querystring = require('querystring');
const axios = require('axios');
const authenticator = require('../middleware/authenticator');
const sendTokenInCookie = require('../utils/sendTokenInCookie');

// @desc    Register a new user
// @route   POST /auth/register
// @access  PUBLIC
exports.createUser = asyncHandler(async (req, res, next) => {
  const {
    first_name,
    last_name,
    username,
    password,
    passwordConfirmation,
    email,
  } = req.body;

  if (password !== passwordConfirmation) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match!',
    });
  }

  // Generate secret and QR code for two-factor auth
  const secretObj = authenticator.newSecret(username);
  let qrCodeDataUrl;
  try {
    qrCodeDataUrl = await authenticator.getQRCode(secretObj.otpauth_url);
  } catch (err) {
    console.error('Error generating QR code:', err);
    return res.status(500).json({
      success: false,
      message: 'Error generating secret. Please try again later.',
    });
  }

  const secret = secretObj.base32;

  // Create new user
  const newUser = new User({
    first_name,
    last_name,
    username,
    password,
    email,
    secret,
  });

  try {
    await newUser.save();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error saving user.',
    });
  }

  // Generate JWT and send registration email
  const token = newUser.getSignedJWTToken();
  try {
    await sendMail({
      mailTo: email,
      mailType: 'REGISTRATION',
      options: { username, id: newUser._id, token },
    });
  } catch (err) {
    console.error('Error sending registration email:', err);
    // You might want to handle email errors differently
  }

  return res.status(200).json({
    success: true,
    message: 'User created and verification email sent!',
    data: {
      dataURL: qrCodeDataUrl,
      setupKey: secret,
    },
  });
});

// @desc    Activate account
// @route   POST /auth/verify
// @access  PUBLIC
exports.activateAccount = asyncHandler(async (req, res, next) => {
  const { emailToken, otp } = req.body;

  if (!emailToken || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Both email token and OTP are required.',
    });
  }

  try {
    const decoded = jwt.verify(emailToken, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const tokenValidates = await authenticator.validateUser({
      secret: user.secret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!tokenValidates) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP code.',
      });
    }

    await User.updateOne({ _id: decoded.userId }, { status: 'VERIFIED' });

    const jwtToken = user.getSignedJWTToken();
    return sendTokenInCookie(jwtToken, 200, res, {
      success: true,
      message: 'Account verified successfully!',
    });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, message: `Invalid token: ${err}` });
  }
});

// @desc    Login user
// @route   POST /auth/login
// @access  PUBLIC
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password, otp } = req.body;

  const user = await User.findOne({ email }).select(
    'email password username status secret'
  );
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Provided email is not registered.',
    });
  }

  const isMatch = await user.isMatchedPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials.',
    });
  }

  // Verify two-factor token
  const tokenValidates = await authenticator.validateUser({
    secret: user.secret,
    encoding: 'base32',
    token: otp,
    window: 1,
  });

  if (!tokenValidates) {
    return res.status(401).json({
      success: false,
      message: 'Invalid OTP. Please try again or contact support.',
    });
  }

  if (user.status === 'PENDING') {
    return res.status(401).json({
      success: false,
      message: 'Please verify your account via email.',
    });
  }

  const jwtToken = user.getSignedJWTToken();
  sendTokenInCookie(jwtToken, 200, res);
});

// @desc    Initiate password reset
// @route   POST /auth/forget
// @access  PUBLIC
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select(
    'username email reset_token reset_expires'
  );
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  user.setResetToken();
  await user.save();

  try {
    await sendMail({
      mailTo: user.email,
      mailType: 'USER_PASSWORD_RESET',
      options: { username: user.username, token: user.reset_token },
    });
  } catch (err) {
    console.error('Error sending reset email:', err);
  }

  return res.status(200).json({
    success: true,
    message: 'Password reset email sent!',
  });
});

// @desc    Verify reset token and render reset form
// @route   POST /auth/reset
// @access  PUBLIC
exports.postForget = asyncHandler(async (req, res, next) => {
  const { reset_token } = req.body;

  const user = await User.findOne({
    reset_token,
    reset_expires: { $gt: Date.now() },
  }).select('reset_token reset_expires');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Invalid or expired reset token.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Token verified. You may now reset your password.',
    resetURL: `/auth/reset/${reset_token}`,
  });
});

// @desc    Reset password
// @route   POST /auth/reset/:token
// @access  PUBLIC
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const reset_token = req.params.token;
  const { password, passwordConfirmation } = req.body;

  if (password !== passwordConfirmation) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match.',
      resetURL: `/auth/reset/${reset_token}`,
    });
  }

  const user = await User.findOne({
    reset_token,
    reset_expires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Invalid or expired reset token.',
    });
  }

  user.password = password;
  user.reset_token = null;
  user.reset_expires = null;

  try {
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully!',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error resetting password.',
    });
  }
});

// @desc    Resend verification email
// @route   POST /auth/resend
// @access  PUBLIC
exports.postEmailResend = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email, status: 'PENDING' }).select(
    'username'
  );
  if (!user) {
    return next(new ErrorResponse('User not found or already verified', 404));
  }

  const token = user.getSignedJWTToken();
  const options = { username: user.username, id: user._id, token };

  try {
    await sendMail({
      mailTo: email,
      mailType: 'REGISTRATION',
      options,
    });
  } catch (err) {
    console.error('Error resending email:', err);
    return next(new ErrorResponse('Error sending email', 500));
  }

  return res
    .status(200)
    .json({ success: true, message: 'Verification email sent!' });
});

// @desc    Sign out
// @route   POST /auth/signout
// @access  PUBLIC
exports.postSignOut = asyncHandler(async (req, res, next) => {
  res.clearCookie('token');
  return res
    .status(200)
    .json({ success: true, message: 'Signed out successfully!' });
});

// @desc    Get Google OAuth URL
// @route   GET /auth/google/url
// @access  PUBLIC
exports.getAuthURL = asyncHandler(async (req, res, next) => {
  const redirectURI = 'auth/google';
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${process.env.SERVER_URL}/${redirectURI}`,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const authUrl = `${rootUrl}?${querystring.stringify(options)}`;
  return res.send(authUrl);
});

// Helper to exchange code for tokens
async function getTokens(code, { clientId, clientSecret, redirectUri }) {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  try {
    const response = await axios.post(url, querystring.stringify(values), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch auth tokens:', error);
    throw new Error(error.message);
  }
}

// @desc    Get user information from Google and log in
// @route   GET /auth/google
// @access  PUBLIC
exports.getGoogleUser = asyncHandler(async (req, res, next) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'No code provided by Google.',
    });
  }

  let tokens;
  try {
    tokens = await getTokens(code, {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.SERVER_URL}/auth/google`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching Google tokens.',
    });
  }

  const { id_token, access_token } = tokens;

  let googleUser;
  try {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      { headers: { Authorization: `Bearer ${id_token}` } }
    );
    googleUser = response.data;
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching Google user data.',
    });
  }

  const { email } = googleUser;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Provided email is not registered.',
    });
  }

  if (user.status === 'PENDING') {
    return res.status(401).json({
      success: false,
      message: 'Please verify your account via email.',
    });
  }

  const jwtToken = user.getSignedJWTToken();
  return res.cookie('token', jwtToken, {
    expires: new Date(Date.now() + 3600000),
    httpOnly: true,
  });
});
