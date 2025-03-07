const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Save = require('../models/save');
const User = require('../models/user');

// @desc    Create a new save
// @route   POST /save/add
// @access  PRIVATE (VERIFIED)
exports.createSave = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const {
    name,
    username,
    email,
    password_secret,
    registered_number,
    loginURL,
    category,
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Create a new save.
  // The logoURL will be automatically generated in the pre-save hook of the Save model.
  const save = new Save({
    name,
    username,
    email,
    password_secret,
    registered_number,
    loginURL,
    category,
    user: userId,
  });

  await save.save();
  user.saves.push(save);
  await user.save();

  return res.status(201).json({
    success: true,
    message: `Save created successfully for ${user.username}!`,
  });
});

// @desc    Update an existing save
// @route   PUT /save/:id
// @access  PRIVATE (VERIFIED)
exports.updateSave = asyncHandler(async (req, res, next) => {
  const {
    name,
    username,
    email,
    password_secret,
    registered_number,
    loginURL,
    category,
  } = req.body;
  const saveId = req.params.id;

  // Find the save document to update.
  let saveDoc = await Save.findById(saveId);
  if (!saveDoc) {
    return res.status(404).json({
      success: false,
      message: 'Save not found.',
    });
  }

  // Update fields; the pre-save hook will update logoURL if loginURL is changed.
  if (name !== undefined) saveDoc.name = name;
  if (username !== undefined) saveDoc.username = username;
  if (email !== undefined) saveDoc.email = email;
  if (password_secret !== undefined) saveDoc.password_secret = password_secret;
  if (registered_number !== undefined)
    saveDoc.registered_number = registered_number;
  if (loginURL !== undefined) saveDoc.loginURL = loginURL;
  if (category !== undefined) saveDoc.category = category;

  const updatedSave = await saveDoc.save();

  return res.status(200).json({
    success: true,
    message: 'Save updated successfully!',
    updatedSave,
  });
});

// @desc    Delete a save
// @route   DELETE /save/:id
// @access  PRIVATE (VERIFIED)
exports.deleteSave = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const saveId = req.params.id;

  const user = await User.findById(userId).select('saves');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  if (!user.saves.includes(saveId)) {
    return res.status(404).json({
      success: false,
      message: 'Save not found.',
    });
  }

  // Remove the save reference from the user's saves array.
  user.saves.pull(saveId);
  await user.save();

  await Save.findByIdAndDelete(saveId);

  return res.status(200).json({
    success: true,
    message: 'Save deleted successfully!',
  });
});

// @desc    Get all saves for the current user
// @route   GET /save/all
// @access  PRIVATE (VERIFIED)
exports.getAllSaves = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  const saves = await Save.find({ user: userId });
  return res.status(200).json({
    success: true,
    message: 'Saves fetched successfully!',
    saves,
  });
});
