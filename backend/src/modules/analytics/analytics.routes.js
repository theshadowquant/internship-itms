const express = require('express');
const analyticsController = require('./analytics.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

const router = express.Router();

router.use(authenticate); // Secure all analytics routes

router.get('/student', analyticsController.getStudent);
router.get('/admin', roleGuard('ADMIN'), analyticsController.getAdmin);

module.exports = router;
