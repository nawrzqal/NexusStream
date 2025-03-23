// routes/auth.js - Routes for authentication
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// POST /auth/signup
router.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Name is required')
  ],
  authController.signup
);

// POST /auth/login
router.post('/login', authController.login);

// POST /auth/logout
router.post('/logout', isAuth, authController.logout);

module.exports = router;
