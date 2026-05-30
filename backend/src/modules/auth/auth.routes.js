const express = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const authenticate = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('firstName').notEmpty().withMessage('First name is required.'),
    body('lastName').notEmpty().withMessage('Last name is required.'),
    validate,
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
    validate,
  ],
  authController.login
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required.'),
    validate,
  ],
  authController.refresh
);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.me);

module.exports = router;
