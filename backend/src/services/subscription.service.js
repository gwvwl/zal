const { Op, literal } = require('sequelize');
const sequelize = require('../config/db');
const { Subscription, Gym } = require('../models');

const VALID_TYPES = ['unlimited', 'visits'];
const VALID_CATEGORIES = ['gym', 'group', 'mma', 'sambo', 'grappling', 'stretching', 'boxing', 'karate', 'locker', 'rental', 'single'];

const getAll = async (gymId, { clientId, status, category } = {}) => {
  const where = {};

  if (clientId) {
    // For a specific client: include their subscriptions from other gyms if allowed here
    where.client_id = clientId;
    where[Op.or] = [
      { gym_id: gymId },
      literal(`JSON_CONTAINS(allowed_gyms, '"${gymId}"')`),
    ];
  } else {
    where.gym_id = gymId;
  }

  if (status) where.status = status;
  if (category) where.category = category;

  return Subscription.findAll({
    where,
    order: [['created_at', 'DESC']],
  });
};

const create = async (gymId, data) => {
  const { clientId, type, category, label, totalVisits, price, durationDays, multiGym } = data;

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

  if (category === 'locker') {
    const taken = await Subscription.findOne({
      where: {
        gym_id: gymId,
        category: 'locker',
        label,
        client_id: { [Op.ne]: clientId },
        status: { [Op.in]: ['active', 'purchased', 'frozen'] },
      },
    });
    if (taken) {
      const err = new Error(`Ящик "${label}" вже зайнятий іншим клієнтом`);
      err.status = 409;
      throw err;
    }
  }

  let allowedGyms = null;
  if (multiGym) {
    const allGyms = await Gym.findAll({ attributes: ['id'] });
    allowedGyms = allGyms.map(g => g.id);
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
    allowed_gyms: allowedGyms,
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

const freeze = async (gymId, id, { frozenFrom, frozenTo }) => {
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

  if (frozenFrom) {
    const d = new Date(frozenFrom);
    if (isNaN(d.getTime())) {
      const err = new Error('Невірний формат дати початку заморозки');
      err.status = 400;
      throw err;
    }
  }

  if (frozenTo) {
    const d = new Date(frozenTo);
    if (isNaN(d.getTime())) {
      const err = new Error('Невірний формат дати кінця заморозки');
      err.status = 400;
      throw err;
    }
    const from = new Date(frozenFrom || new Date().toISOString().split('T')[0]);
    from.setHours(0, 0, 0, 0);
    if (d <= from) {
      const err = new Error('Дата кінця заморозки повинна бути пізніше дати початку');
      err.status = 400;
      throw err;
    }
  }

  const resolvedFrom = frozenFrom || new Date().toISOString().split('T')[0];

  await sub.update({
    status: 'frozen',
    frozen_from: resolvedFrom,
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

// Creates a locker subscription that is immediately active (retroactive start date)
const renewLocker = async (gymId, data) => {
  const { clientId, type, category, label, price, durationDays, startDate } = data;

  if (!clientId || !type || !label || price == null || !durationDays) {
    const err = new Error('clientId, type, label, price, durationDays are required');
    err.status = 400;
    throw err;
  }
  if (category !== 'locker') {
    const err = new Error('renewLocker тільки для ящиків (locker)');
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

  const taken = await Subscription.findOne({
    where: {
      gym_id: gymId,
      category: 'locker',
      label,
      client_id: { [Op.ne]: clientId },
      status: { [Op.in]: ['active', 'purchased', 'frozen'] },
    },
  });
  if (taken) {
    const err = new Error(`Ящик "${label}" вже зайнятий іншим клієнтом`);
    err.status = 409;
    throw err;
  }

  const start = startDate || new Date().toISOString().split('T')[0];
  const endDate = addDays(start, Number(durationDays));

  return Subscription.create({
    gym_id:        gymId,
    client_id:     clientId,
    type,
    category:      'locker',
    label,
    start_date:    start,
    end_date:      endDate,
    total_visits:  null,
    used_visits:   0,
    status:        'active',
    price:         Number(price),
    duration_days: Number(durationDays),
    purchased_at:  new Date(),
    activated_at:  new Date(),
    created_at:    new Date(),
    allowed_gyms:  null,
  });
};

const dismiss = async (gymId, id) => {
  const sub = await Subscription.findOne({ where: { id, gym_id: gymId } });
  if (!sub) {
    const err = new Error('Абонемент не знайдений');
    err.status = 404;
    throw err;
  }
  if (sub.status !== 'expired') {
    const err = new Error('Відв\'язати можна лише прострочений абонемент');
    err.status = 400;
    throw err;
  }
  await sub.update({ status: 'cancelled' });
  return sub;
};

module.exports = { getAll, create, activate, freeze, unfreeze, renewLocker, dismiss };
