const usersService = require('./users.service');

const getProfile = async (req, res, next) => {
  try {
    const profile = await usersService.getUserProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await usersService.updateUserProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile successfully updated.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided for upload.',
      });
    }

    const updatedUser = await usersService.updateAvatar(
      req.user.id,
      req.file.buffer,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      message: 'Avatar image successfully updated.',
      data: {
        avatarUrl: updatedUser.avatarUrl,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await usersService.getNotifications(req.user.id, page, limit);

    return res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await usersService.markAllNotificationsRead(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    await usersService.markNotificationRead(req.user.id, notificationId);
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getNotifications,
  markAllRead,
  markRead,
};
