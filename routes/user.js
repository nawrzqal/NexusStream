// routes/user.js - Routes for user operations
const express = require('express');
const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /user/status
router.get('/status', isAuth, userController.getUserStatus);

// PATCH /user/status
router.patch(
  '/status',
  isAuth,
  userController.updateUserStatus
);

module.exports = router;
