const asyncHandler = require('./async');
const jwt = require('jsonwebtoken');

exports.protect = (permissions) =>
  asyncHandler(async (req, res, next) => {
    // Try to get token from cookies or from Authorization header
    let token = req.cookies.token;
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

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
