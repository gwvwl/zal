const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { Payment, Client, Subscription } = require('../models');

const VALID_TYPES = ['subscription', 'single', 'card_replace', 'locker'];
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
  const { clientId, subscriptionId, amount, type, label, method } = data;

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
    gym_id:          gymId,
    client_id:       clientId,
    subscription_id: subscriptionId || null,
    amount:          Number(amount),
    type,
    label:           label || null,
    worker_id:       auth.worker_id,
    worker_name:     auth.worker_name,
    method,
    status:          'active',
  });
};

const update = async (gymId, id, { amount, method }) => {
  const payment = await Payment.findOne({ where: { id, gym_id: gymId } });
  if (!payment) {
    const err = new Error('Платіж не знайдений');
    err.status = 404;
    throw err;
  }
  if (payment.status === 'cancelled') {
    const err = new Error('Не можна редагувати скасований платіж');
    err.status = 400;
    throw err;
  }

  const updates = {};
  if (amount != null) {
    if (Number(amount) <= 0) {
      const err = new Error('Сума повинна бути більше 0');
      err.status = 400;
      throw err;
    }
    updates.amount = Number(amount);
  }
  if (method) {
    if (!VALID_METHODS.includes(method)) {
      const err = new Error('Невірний спосіб оплати');
      err.status = 400;
      throw err;
    }
    updates.method = method;
  }

  await payment.update(updates);
  return payment;
};

const cancel = async (gymId, id, { note } = {}) => {
  return sequelize.transaction(async (t) => {
    const payment = await Payment.findOne({
      where: { id, gym_id: gymId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!payment) {
      const err = new Error('Платіж не знайдений');
      err.status = 404;
      throw err;
    }
    if (payment.status === 'cancelled') {
      const err = new Error('Платіж вже скасований');
      err.status = 400;
      throw err;
    }

    await payment.update({
      status: 'cancelled',
      cancel_note: note || null,
    }, { transaction: t });

    // Revert linked subscription back to 'purchased'
    if (payment.subscription_id) {
      const sub = await Subscription.findOne({
        where: { id: payment.subscription_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (sub && (sub.status === 'purchased' || sub.status === 'active')) {
        await sub.update({
          status: 'purchased',
          start_date: null,
          end_date: null,
          activated_at: null,
        }, { transaction: t });
      }
    }

    return payment;
  });
};

module.exports = { getAll, create, update, cancel };
