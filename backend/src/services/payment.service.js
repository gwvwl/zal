const { Op } = require('sequelize');
const { Payment, Client } = require('../models');

const VALID_TYPES = ['subscription', 'single', 'card_replace'];
const VALID_METHODS = ['cash', 'card'];

const getAll = async (gymId, { clientId, from, to, limit = 100, offset = 0 } = {}) => {
  const where = { gym_id: gymId };
  if (clientId) where.client_id = clientId;

  if (from || to) {
    where.date = {};
    if (from) {
      const d = new Date(from);
      if (isNaN(d.getTime())) { const err = new Error('Невірний формат дати from'); err.status = 400; throw err; }
      where.date[Op.gte] = d;
    }
    if (to) {
      const d = new Date(to);
      if (isNaN(d.getTime())) { const err = new Error('Невірний формат дати to'); err.status = 400; throw err; }
      where.date[Op.lte] = d;
    }
  }

  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [{
      model: Client,
      as: 'client',
      attributes: ['id', 'first_name', 'last_name', 'photo'],
    }],
    order: [['date', 'DESC']],
    limit: Math.min(Number(limit) || 50, 200),
    offset: Number(offset) || 0,
  });
  return { items: rows, total: count };
};

const create = async (gymId, data, auth) => {
  const { clientId, amount, type, label, method } = data;

  if (!clientId || amount == null || !type || !method) {
    const err = new Error('clientId, amount, type, method are required');
    err.status = 400;
    throw err;
  }
  if (Number(amount) <= 0) {
    const err = new Error('Сума повинна бути більше 0');
    err.status = 400;
    throw err;
  }
  if (!VALID_TYPES.includes(type)) {
    const err = new Error('Невірний тип оплати');
    err.status = 400;
    throw err;
  }
  if (!VALID_METHODS.includes(method)) {
    const err = new Error('Невірний спосіб оплати');
    err.status = 400;
    throw err;
  }

  return Payment.create({
    gym_id:      gymId,
    client_id:   clientId,
    amount:      Number(amount),
    type,
    label:       label || null,
    worker_id:   auth.worker_id,
    worker_name: auth.worker_name,
    method,
  });
};

module.exports = { getAll, create };
