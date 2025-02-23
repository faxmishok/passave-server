const asyncHandler = require('./async');
const jwt = require('jsonwebtoken');

exports.protect = (permissions) =>
  asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized for this route. Please sign in.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      if (!permissions.includes(decoded.status)) {
        return res.status(403).json({
          success: false,
          message:
            'Insufficient permissions. Please verify your email or try again later.',
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token error. Please sign in again.',
      });
    }
  });
