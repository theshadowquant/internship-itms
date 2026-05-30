const express = require('express');
const multer = require('multer');
const usersController = require('./users.controller');
const authenticate = require('../../middleware/auth');

const router = express.Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB maximum file size limit
});

router.use(authenticate); // Secure all users endpoints

router.get('/profile', usersController.getProfile);
router.patch('/profile', usersController.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), usersController.uploadAvatar);

router.get('/notifications', usersController.getNotifications);
router.patch('/notifications/read-all', usersController.markAllRead);
router.patch('/notifications/:id/read', usersController.markRead);

module.exports = router;
