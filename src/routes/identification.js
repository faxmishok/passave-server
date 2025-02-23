const express = require('express');
const router = express.Router();
const { PERMISSIONS } = require('../constants/permissions');
const { protect } = require('../middleware/protect');

const {
  getIdentifications,
  createIdentification,
  updateIdentification,
  deleteIdentification,
} = require('../controllers/identificationController');

// Create, update & delete identifications
router.get('/all', protect(PERMISSIONS.ONLY_USERS), getIdentifications);
router.post('/add', protect(PERMISSIONS.ONLY_USERS), createIdentification);
router.put('/:id', protect(PERMISSIONS.ONLY_USERS), updateIdentification);
router.delete('/:id', protect(PERMISSIONS.ONLY_USERS), deleteIdentification);

module.exports = router;
