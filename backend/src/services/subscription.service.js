const sequelize = require('../config/db');
const { Subscription } = require('../models');

const VALID_TYPES = ['unlimited', 'visits'];
const VALID_CATEGORIES = ['gym', 'group', 'mma', 'sambo', 'grappling', 'stretching', 'boxing', 'karate', 'locker', 'rental', 'single'];

const getAll = async (gymId, { clientId, status, category } = {}) => {
  const where = { gym_id: gymId };
  if (clientId) where.client_id = clientId;
  if (status) where.status = status;
  if (category) where.category = category;

  return Subscription.findAll({
    where,
    order: [['created_at', 'DESC']],
  });
};

const create = async (gymId, data) => {
  const { clientId, type, category, label, totalVisits, price, durationDays } = data;

  if (!clientId || !type || !category || !label || price == null || !durationDays) {
    const err = new Error('clientId, type, category, label, price, durationDays are required');
    err.status = 400;
    throw err;
  }
  if (!VALID_TYPES.includes(type)) {
    const err = new Error('Невірний тип абонементу');
    err.status = 400;
    throw err;
  }
  if (!VALID_CATEGORIES.includes(category)) {
    const err = new Error('Невірна категорія абонементу');
    err.status = 400;
    throw err;
  }
  if (Number(price) <= 0) {
    const err = new Error('Ціна повинна бути більше 0');
    err.status = 400;
    throw err;
  }
  if (Number(durationDays) <= 0) {
    const err = new Error('Тривалість повинна бути більше 0');
    err.status = 400;
    throw err;
  }
  if (type === 'visits' && (!totalVisits || Number(totalVisits) <= 0)) {
    const err = new Error('Кількість відвідувань обов\'язкова для типу visits');
    err.status = 400;
    throw err;
  }

  return Subscription.create({
    gym_id:       gymId,
    client_id:    clientId,
    type,
    category,
    label,
    start_date:   null,
    end_date:     null,
    total_visits: type === 'visits' ? Number(totalVisits) : null,
    used_visits:  0,
    status:       'purchased',
    price:        Number(price),
    duration_days: Number(durationDays),
    purchased_at: new Date(),
    activated_at: null,
    created_at:   new Date(),
  });
};

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const activate = async (gymId, id) => {
  return sequelize.transaction(async (t) => {
    const sub = await Subscription.findOne({
      where: { id, gym_id: gymId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!sub) {
      const err = new Error('Абонемент не знайдений');
      err.status = 404;
      throw err;
    }
    if (sub.status !== 'purchased') {
      const err = new Error('Можна активувати лише куплений абонемент');
      err.status = 400;
      throw err;
    }

    const existing = await Subscription.findOne({
      where: {
        client_id: sub.client_id,
        gym_id: gymId,
        category: sub.category,
        status: 'active',
      },
      transaction: t,
    });
    if (existing) {
      const err = new Error(`У клієнта вже є активний абонемент категорії "${sub.category}"`);
      err.status = 409;
      throw err;
    }

    const today = new Date().toISOString().split('T')[0];
    const endDate = addDays(today, sub.duration_days);

    await sub.update({
      status: 'active',
      start_date: today,
      end_date: endDate,
      activated_at: new Date(),
    }, { transaction: t });
    return sub;
  });
};

const freeze = async (gymId, id, { frozenTo }) => {
  const sub = await Subscription.findOne({ where: { id, gym_id: gymId } });
  if (!sub) {
    const err = new Error('Абонемент не знайдений');
    err.status = 404;
    throw err;
  }
  if (sub.status !== 'active') {
    const err = new Error('Заморозити можна лише активний абонемент');
    err.status = 400;
    throw err;
  }

  if (frozenTo) {
    const d = new Date(frozenTo);
    if (isNaN(d.getTime())) {
      const err = new Error('Невірний формат дати заморозки');
      err.status = 400;
      throw err;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d <= today) {
      const err = new Error('Дата розморозки повинна бути в майбутньому');
      err.status = 400;
      throw err;
    }
  }

  const today = new Date().toISOString().split('T')[0];

  await sub.update({
    status: 'frozen',
    frozen_from: today,
    frozen_to: frozenTo || null,
  });
  return sub;
};

const unfreeze = async (gymId, id) => {
  const sub = await Subscription.findOne({ where: { id, gym_id: gymId } });
  if (!sub) {
    const err = new Error('Абонемент не знайдений');
    err.status = 404;
    throw err;
  }
  if (sub.status !== 'frozen') {
    const err = new Error('Абонемент не заморожений');
    err.status = 400;
    throw err;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const frozenFrom = new Date(sub.frozen_from);
  frozenFrom.setHours(0, 0, 0, 0);
  const actualFrozenDays = Math.max(0, Math.floor((today - frozenFrom) / (1000 * 60 * 60 * 24)));

  const newEndDate = addDays(sub.end_date, actualFrozenDays);

  await sub.update({
    status: 'active',
    end_date: newEndDate,
    frozen_from: null,
    frozen_to: null,
  });
  return sub;
};

module.exports = { getAll, create, activate, freeze, unfreeze };
