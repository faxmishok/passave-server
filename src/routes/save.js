const express = require('express');
const router = express.Router();
const { PERMISSIONS } = require('../constants/permissions');
const { protect } = require('../middleware/protect');

const {
  getAllSaves,
  createSave,
  updateSave,
  deleteSave,
} = require('../controllers/saveController');

// Create, update & delete saves
router.get('/all', protect(PERMISSIONS.ONLY_USERS), getAllSaves);
router.post('/add', protect(PERMISSIONS.ONLY_USERS), createSave);
router.put('/:id', protect(PERMISSIONS.ONLY_USERS), updateSave);
router.delete('/:id', protect(PERMISSIONS.ONLY_USERS), deleteSave);

module.exports = router;
