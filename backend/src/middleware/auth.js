const { verifyAccessToken } = require('../config/jwt');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Access token has expired or is invalid.',
      code: 'TOKEN_EXPIRED', // specific code to help axios interceptor rotate tokens
    });
  }

  req.user = decoded; // { id, email, role }
  next();
};

module.exports = authenticate;
