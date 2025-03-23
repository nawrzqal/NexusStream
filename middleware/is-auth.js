// middleware/is-auth.js - Authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }
    
    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      err.statusCode = 401;
      throw err;
    }
    
    if (!decodedToken) {
      const error = new Error('Not authenticated');
      error.statusCode = 401;
      throw error;
    }
    
    // Optional: Check token version to validate if token has been invalidated
    const user = await User.findById(decodedToken.userId);
    if (!user || user.tokenVersion !== decodedToken.tokenVersion) {
      const error = new Error('Token is invalid');
      error.statusCode = 401;
      throw error;
    }
    
    // Add user data to request
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    next(error);
  }
};
