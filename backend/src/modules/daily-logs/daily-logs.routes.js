const express = require('express');
const dailyLogsController = require('./daily-logs.controller');
const authenticate = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

const router = express.Router();

router.use(authenticate); // Secure all daily logs routes

// Custom export endpoint must be registered before general /:id parameterized routes
router.get('/export', dailyLogsController.exportCSV);

router.post('/', dailyLogsController.create);
router.get('/mine', dailyLogsController.getMine);

router.patch('/:id', dailyLogsController.update);
router.delete('/:id', dailyLogsController.remove);

// Admin-only endpoints
router.get('/', roleGuard('ADMIN'), dailyLogsController.getAll);
router.patch('/:id/approve', roleGuard('ADMIN'), dailyLogsController.approve);
router.patch('/:id/reject', roleGuard('ADMIN'), dailyLogsController.reject);

module.exports = router;
