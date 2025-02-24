const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');

// @desc    Get user's dashboard data
// @route   GET /profile/dashboard
// @access  PRIVATE (VERIFIED)
exports.getUserDB = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId)
    .select('saves first_name last_name username email profileImage')
    .populate({
      path: 'saves',
      select:
        'name username email password_secret registered_number loginURL category',
    });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  return res.status(200).json({
    success: true,
    message: 'Welcome to your Dashboard!',
    user,
    nbSaves: user.saves.length,
  });
});

// @desc    Update user profile data
// @route   PUT /profile/dashboard
// @access  PRIVATE (VERIFIED)
exports.updateUserDB = asyncHandler(async (req, res, next) => {
  const {
    first_name,
    last_name,
    username,
    oldPassword,
    newPassword,
    newPasswordConfirmation,
  } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(403).json({
      success: false,
      message: 'Error fetching user data. Please sign in again.',
    });
  }

  if (!oldPassword) {
    return res.status(403).json({
      success: false,
      message: 'You must provide your current password to update your profile.',
    });
  }

  const isMatch = await user.isMatchedPassword(oldPassword);
  if (!isMatch) {
    return res.status(403).json({
      success: false,
      message: 'Incorrect current password.',
    });
  }

  // Handle password update if provided
  if (newPassword || newPasswordConfirmation) {
    if (newPassword !== newPasswordConfirmation) {
      return res.status(401).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }
    user.password = newPassword;
    await user.save(); // triggers the password hashing middleware
  }

  user.first_name = first_name || user.first_name;
  user.last_name = last_name || user.last_name;
  user.username = username || user.username;

  try {
    const updatedUser = await user.save();
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      updatedUser: {
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        username: updatedUser.username,
        email: updatedUser.email,
        saves: updatedUser.saves,
      },
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: `Profile could not be updated: ${err.message}`,
    });
  }
});

// @desc    Upload user profile image
// @route   POST /profile/upload
// @access  PRIVATE (VERIFIED)
exports.uploadProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  // Construct the file URL. Since you're serving your public folder statically at "/static"
  // the image URL will be available at "/static/uploads/<filename>"
  const filePath = '/static/uploads/' + req.file.filename;

  // Update the user's profile with the image path
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { profileImage: filePath },
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    success: true,
    message: 'Profile image uploaded successfully',
    user,
  });
});
