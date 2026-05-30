const analyticsService = require('./analytics.service');

const getStudent = async (req, res, next) => {
  try {
    const data = await analyticsService.getStudentAnalytics(req.user.id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getAdmin = async (req, res, next) => {
  try {
    const data = await analyticsService.getAdminAnalytics();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudent,
  getAdmin,
};
