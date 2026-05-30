const express = require('express');
const internshipsController = require('./internships.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

const router = express.Router();

router.use(authenticate); // Secure all internships routes

// Custom recommendation endpoint must be registered first
router.get('/recommended', internshipsController.getRecommended);

router.get('/', internshipsController.getAll);
router.get('/:id', internshipsController.getOne);

// Admin-only endpoints
router.post('/', roleGuard('ADMIN'), internshipsController.create);
router.patch('/:id', roleGuard('ADMIN'), internshipsController.update);
router.delete('/:id', roleGuard('ADMIN'), internshipsController.remove);

module.exports = router;
