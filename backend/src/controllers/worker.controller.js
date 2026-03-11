const workerService = require('../services/worker.service');

const getAll = async (req, res, next) => {
  try {
    const workers = await workerService.getAll(req.auth.gym_id);
    res.json(workers);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll };
