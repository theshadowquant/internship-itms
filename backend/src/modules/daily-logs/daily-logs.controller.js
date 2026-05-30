const dailyLogsService = require('./daily-logs.service');

const create = async (req, res, next) => {
  try {
    const log = await dailyLogsService.createDailyLog(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Daily log successfully recorded!',
      data: log,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const getMine = async (req, res, next) => {
  try {
    const logs = await dailyLogsService.getMyLogs(req.user.id, req.query);
    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await dailyLogsService.getAllLogs(req.query);
    return res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const log = await dailyLogsService.updateDailyLog(req.user.id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Daily log updated successfully.',
      data: log,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await dailyLogsService.deleteDailyLog(req.user.id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Daily log deleted.',
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const { supervisorNote } = req.body;
    const result = await dailyLogsService.approveLog(req.user.id, req.params.id, supervisorNote);
    return res.status(200).json({
      success: true,
      message: 'Daily log successfully approved.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const { supervisorNote } = req.body;
    const result = await dailyLogsService.rejectLog(req.user.id, req.params.id, supervisorNote);
    return res.status(200).json({
      success: true,
      message: 'Daily log rejected.',
      data: result,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const exportCSV = async (req, res, next) => {
  try {
    const csvContent = await dailyLogsService.exportLogsToCSV(req.user.id);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=daily-logs-${Date.now()}.csv`);
    
    return res.status(200).send(csvContent);
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
  create,
  getMine,
  getAll,
  update,
  remove,
  approve,
  reject,
  exportCSV,
};
