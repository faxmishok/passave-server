const path = require('path');
const multer = require('multer');

exports.uploadImageHandler = (imagePath, size = 1024 * 1024 * 5) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, imagePath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, req.user.userId + '-' + Date.now() + ext);
    },
  });

  // Filter to allow only image files
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  };

  const upload = multer({
    storage: storage,
    limits: { fileSize: size },
    fileFilter: fileFilter,
  });

  return upload;
};
