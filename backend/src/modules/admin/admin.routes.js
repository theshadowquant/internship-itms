const express = require('express');
const adminController = require('./admin.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

const router = express.Router();

router.use(authenticate, roleGuard('ADMIN')); // Protect all administrative routes

router.get('/users', adminController.getUsers);
router.patch('/users/:id/toggle', adminController.toggleUser);
router.get('/audit-logs', adminController.getAudits);
router.get('/pending-logs', adminController.getPending);

module.exports = router;
