const internshipsService = require('./internships.service');

const getAll = async (req, res, next) => {
  try {
    const result = await internshipsService.getInternships(req.query);
    return res.status(200).json({
      success: true,
      data: result.internships,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getRecommended = async (req, res, next) => {
  try {
    const result = await internshipsService.getRecommendedInternships(req.user.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const internship = await internshipsService.getInternshipById(req.params.id);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship posting not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: internship,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await internshipsService.createInternship(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Internship successfully posted.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await internshipsService.updateInternship(req.user.id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Internship posting updated.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await internshipsService.softDeleteInternship(req.user.id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Internship posting soft-deleted (status set to CLOSED).',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getRecommended,
  getOne,
  create,
  update,
  remove,
};
