const applicationsService = require('./applications.service');

const create = async (req, res, next) => {
  try {
    const app = await applicationsService.createApplication(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: app,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const getMine = async (req, res, next) => {
  try {
    const apps = await applicationsService.getMyApplications(req.user.id);
    return res.status(200).json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await applicationsService.getAllApplications(req.query);
    return res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const app = await applicationsService.getApplicationById(
      req.user.id,
      req.user.role,
      req.params.id
    );

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'Application record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status parameter is required.',
      });
    }

    const result = await applicationsService.updateApplicationStatus(
      req.user.id,
      req.params.id,
      status,
      note
    );

    return res.status(200).json({
      success: true,
      message: `Application successfully updated to ${status}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const withdraw = async (req, res, next) => {
  try {
    await applicationsService.withdrawApplication(req.user.id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Application successfully withdrawn.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getMine,
  getAll,
  getOne,
  updateStatus,
  withdraw,
};
