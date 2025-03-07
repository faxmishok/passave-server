const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Identification = require('../models/identification');
const User = require('../models/user');

// @desc    Create a new identification
// @route   POST /identification/add
// @access  PRIVATE (VERIFIED)
exports.createIdentification = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const { name, number, date_of_issue, expiration_date } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const identification = new Identification({
    name,
    number,
    date_of_issue,
    expiration_date,
    user: userId,
  });

  await identification.save();
  user.identifications.push(identification);
  await user.save();

  return res.status(201).json({
    success: true,
    message: `Identification created successfully for ${user.username}!`,
    identification,
  });
});

// @desc    Update an existing identification
// @route   PUT /identification/:id
// @access  PRIVATE (VERIFIED)
exports.updateIdentification = asyncHandler(async (req, res, next) => {
  const { name, number, date_of_issue, expiration_date } = req.body;
  const identificationId = req.params.id;

  // Find the ID document to update.
  let identificationDoc = await Identification.findById(identificationId);
  if (!identificationDoc) {
    return res.status(404).json({
      success: false,
      message: 'Identification not found.',
    });
  }

  // Update fields if provided.
  if (name !== undefined) identificationDoc.name = name;
  if (number !== undefined) identificationDoc.number = number;
  if (date_of_issue !== undefined)
    identificationDoc.date_of_issue = date_of_issue;
  if (expiration_date !== undefined)
    identificationDoc.expiration_date = expiration_date;

  const updatedIdentification = await identificationDoc.save();

  return res.status(200).json({
    success: true,
    message: 'Identification updated successfully!',
    updatedIdentification,
  });
});

// @desc    Delete an identification
// @route   DELETE /identification/:id
// @access  PRIVATE (VERIFIED)
exports.deleteIdentification = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const identificationId = req.params.id;

  const user = await User.findById(userId).select('identifications');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  if (!user.identifications.includes(identificationId)) {
    return res.status(404).json({
      success: false,
      message: 'Identification not found.',
    });
  }

  users.identifications.pull(identificationId);
  await user.save();

  await Identification.findByIdAndDelete(identificationId);

  return res.status(200).json({
    success: true,
    message: 'Identification deleted successfully!',
  });
});

// Optional: Get all identifications for the current user
// @desc    Get identifications for a user
// @route   GET /identification/all
// @access  PRIVATE (VERIFIED)
exports.getIdentifications = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  const identifications = await Identification.find({ user: userId });
  return res.status(200).json({
    success: true,
    message: 'Identifications fetched successfully!',
    identifications,
  });
});
