const express = require('express');
const router = express.Router();
const { PERMISSIONS } = require('../constants/permissions');
const { protect } = require('../middleware/protect');
const { PATH } = require('../constants/paths');

const {
  getUserDB,
  updateUserDB,
  uploadProfileImage,
} = require('../controllers/profileController');

const { uploadImageHandler } = require('../middleware/imageHandler');

router.get('/dashboard', protect(PERMISSIONS.ONLY_USERS), getUserDB);
router.put('/dashboard', protect(PERMISSIONS.ONLY_USERS), updateUserDB);

// Upload profile image
router.post(
  '/upload',
  protect(PERMISSIONS.ONLY_USERS),
  uploadImageHandler(PATH.USER).single('profileImage'),
  uploadProfileImage
);

module.exports = router;
