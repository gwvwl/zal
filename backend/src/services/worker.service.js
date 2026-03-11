const { Worker } = require('../models');

const getAll = async (gymId) => {
  return Worker.findAll({
    attributes: ['id', 'gym_id', 'name', 'role', 'avatar'],
    where: { gym_id: gymId },
    order: [['name', 'ASC']],
  });
};

module.exports = { getAll };
