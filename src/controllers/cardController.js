const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Card = require('../models/card');
const User = require('../models/user');

// @desc    Create a new card
// @route   POST /card/add
// @access  PRIVATE (VERIFIED)
exports.createCard = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const { bank_name, card_number, cvv, expiry_date, bank_website, pin } =
    req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Create a new card.
  // The logoURL will be automatically generated in the pre-save hook of the Card model.
  const card = new Card({
    bank_name,
    card_number,
    cvv,
    expiry_date,
    bank_website,
    pin,
    user: userId,
  });

  await card.save();

  // Optionally, if your User model tracks cards, push the card into user's cards array:
  // user.cards.push(card);
  // await user.save();

  return res.status(201).json({
    success: true,
    message: `Card added successfully for ${user.username}!`,
    card,
  });
});

// @desc    Update an existing card
// @route   PUT /card/:id
// @access  PRIVATE (VERIFIED)
exports.updateCard = asyncHandler(async (req, res, next) => {
  const { bank_name, card_number, cvv, expiry_date, bank_website, pin } =
    req.body;
  const cardId = req.params.id;

  let cardDoc = await Card.findById(cardId);
  if (!cardDoc) {
    return res.status(404).json({
      success: false,
      message: 'Card not found.',
    });
  }

  // Update fields if provided.
  // The pre-save hook will update logoURL if bank_website is modified.
  if (bank_name !== undefined) cardDoc.bank_name = bank_name;
  if (card_number !== undefined) cardDoc.card_number = card_number;
  if (cvv !== undefined) cardDoc.cvv = cvv;
  if (expiry_date !== undefined) cardDoc.expiry_date = expiry_date;
  if (bank_website !== undefined) cardDoc.bank_website = bank_website;
  if (pin !== undefined) cardDoc.pin = pin;

  const updatedCard = await cardDoc.save();

  return res.status(200).json({
    success: true,
    message: 'Card updated successfully!',
    updatedCard,
  });
});

// @desc    Delete a card
// @route   DELETE /card/:id
// @access  PRIVATE (VERIFIED)
exports.deleteCard = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const cardId = req.params.id;

  const user = await User.findById(userId).select('cards'); // if your user schema tracks cards
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  if (!user.cards.includes(cardId)) {
    return res.status(404).json({
      success: false,
      message: 'Card not found.',
    });
  }

  // Remove the card reference from the user's cards array.
  user.cards.pull(cardId);
  await user.save();

  await Card.findByIdAndDelete(cardId);

  return res.status(200).json({
    success: true,
    message: 'Card deleted successfully!',
  });
});

// @desc    Get all saves for the current user
// @route   GET /card/all
// @access  PRIVATE (VERIFIED)
exports.getCards = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  const cards = await Card.find({ user: userId });
  return res.status(200).json({
    success: true,
    message: 'Cards fetched successfully!',
    cards,
  });
});
