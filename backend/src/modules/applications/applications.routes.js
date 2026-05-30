const express = require('express');
const applicationsController = require('./applications.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

const router = express.Router();

router.use(authenticate); // Secure all applications routes

router.post('/', applicationsController.create);
router.get('/mine', applicationsController.getMine);
router.get('/:id', applicationsController.getOne);
router.delete('/:id', applicationsController.withdraw);

// Admin-only endpoints
router.get('/', roleGuard('ADMIN'), applicationsController.getAll);
router.patch('/:id/status', roleGuard('ADMIN'), applicationsController.updateStatus);

module.exports = router;
