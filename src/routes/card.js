const express = require('express');
const router = express.Router();
const { PERMISSIONS } = require('../constants/permissions');
const { protect } = require('../middleware/protect');

const {
  getCards,
  createCard,
  updateCard,
  deleteCard,
} = require('../controllers/cardController');

// Create, update & delete saves
router.get('/all', protect(PERMISSIONS.ONLY_USERS), getCards);
router.post('/add', protect(PERMISSIONS.ONLY_USERS), createCard);
router.put('/:id', protect(PERMISSIONS.ONLY_USERS), updateCard);
router.delete('/:id', protect(PERMISSIONS.ONLY_USERS), deleteCard);

module.exports = router;
