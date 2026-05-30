const adminService = require('./admin.service');

const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getAllUsers(req.query);
    return res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const toggleUser = async (req, res, next) => {
  try {
    const result = await adminService.toggleUserStatus(req.user.id, req.params.id);
    return res.status(200).json({
      success: true,
      message: `Account status successfully toggled. User is now ${result.isActive ? 'Active' : 'Inactive'}.`,
      data: result,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const getAudits = async (req, res, next) => {
  try {
    const logs = await adminService.getAuditLogs();
    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

const getPending = async (req, res, next) => {
  try {
    const logs = await adminService.getPendingLogs();
    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  toggleUser,
  getAudits,
  getPending,
};
