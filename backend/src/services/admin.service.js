const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  Admin,
  Gym,
  Worker,
  Client,
  Subscription,
  Visit,
  Payment,
  SubscriptionPreset,
  AuditLog,
} = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/db");

const TOKEN_EXPIRES = "2h";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: TOKEN_EXPIRES,
  });

// ── Auth ──

const login = async (login, password) => {
  const admin = await Admin.findOne({ where: { login } });

  if (!admin) {
    const err = new Error("Невірний логін або пароль");
    err.status = 401;
    throw err;
  }
  const valid = await bcrypt.compare(String(password), admin.password_hash);
  if (!valid) {
    const err = new Error("Невірний логін або пароль");
    err.status = 401;
    throw err;
  }
  const token = signToken({ admin_id: admin.id, admin_name: admin.name });
  return { token, admin: { id: admin.id, name: admin.name } };
};

const refresh = (cookieToken) => {
  if (!cookieToken) {
    const err = new Error("Refresh cookie відсутній");
    err.status = 401;
    throw err;
  }
  let payload;
  try {
    payload = jwt.verify(cookieToken, process.env.JWT_ACCESS_SECRET, {
      ignoreExpiration: true,
    });
  } catch {
    const err = new Error("Недійсний токен");
    err.status = 401;
    throw err;
  }
  if (!payload.admin_id) {
    const err = new Error("Недійсний токен");
    err.status = 401;
    throw err;
  }
  const tokenAge = Math.floor(Date.now() / 1000) - payload.iat;
  if (tokenAge > 7 * 24 * 60 * 60) {
    const err = new Error("Сесія закінчилась, увійдіть знову");
    err.status = 401;
    throw err;
  }
  const { iat, exp, ...clean } = payload;
  return { access_token: signToken(clean) };
};

// ── Gyms CRUD ──

const getGyms = async () => {
  const gyms = await Gym.findAll({
    attributes: ["id", "name", "login"],
    order: [["name", "ASC"]],
  });
  return gyms;
};

const createGym = async ({ id, name, login: gymLogin, password }) => {
  if (!id || !name || !gymLogin || !password) {
    const err = new Error("Усі поля обовʼязкові");
    err.status = 400;
    throw err;
  }
  const hash = await bcrypt.hash(String(password), 10);
  const gym = await Gym.create({
    id,
    name,
    login: gymLogin,
    password_hash: hash,
  });
  return { id: gym.id, name: gym.name, login: gym.login };
};

const updateGym = async (gymId, { name, login: gymLogin, password }) => {
  const gym = await Gym.findByPk(gymId);
  if (!gym) {
    const err = new Error("Зал не знайдено");
    err.status = 404;
    throw err;
  }
  const upd = {};
  if (name) upd.name = name;
  if (gymLogin) upd.login = gymLogin;
  if (password) upd.password_hash = await bcrypt.hash(String(password), 10);
  await gym.update(upd);
  return { id: gym.id, name: gym.name, login: gym.login };
};

const deleteGym = async (gymId) => {
  const gym = await Gym.findByPk(gymId);
  if (!gym) {
    const err = new Error("Зал не знайдено");
    err.status = 404;
    throw err;
  }
  await gym.destroy();
};

// ── Workers CRUD ──

const getWorkers = async (gymId) => {
  const where = {};
  if (gymId) where.gym_id = gymId;
  return Worker.findAll({
    where,
    attributes: ["id", "gym_id", "name", "role", "avatar"],
    order: [["name", "ASC"]],
  });
};

const createWorker = async ({ gym_id, name, role, pin }) => {
  if (!gym_id || !name || !role || !pin) {
    const err = new Error("Усі поля обовʼязкові");
    err.status = 400;
    throw err;
  }
  const hash = await bcrypt.hash(String(pin), 10);
  const worker = await Worker.create({
    gym_id,
    name,
    role,
    password_hash: hash,
  });
  return {
    id: worker.id,
    gym_id: worker.gym_id,
    name: worker.name,
    role: worker.role,
  };
};

const updateWorker = async (workerId, { name, role, pin }) => {
  const worker = await Worker.findByPk(workerId);
  if (!worker) {
    const err = new Error("Працівника не знайдено");
    err.status = 404;
    throw err;
  }
  const upd = {};
  if (name) upd.name = name;
  if (role) upd.role = role;
  if (pin) upd.password_hash = await bcrypt.hash(String(pin), 10);
  await worker.update(upd);
  return {
    id: worker.id,
    gym_id: worker.gym_id,
    name: worker.name,
    role: worker.role,
  };
};

const deleteWorker = async (workerId) => {
  const worker = await Worker.findByPk(workerId);
  if (!worker) {
    const err = new Error("Працівника не знайдено");
    err.status = 404;
    throw err;
  }
  await worker.destroy();
};

// ── Subscription Presets CRUD ──

const getPresets = async (gymId) => {
  const where = {};
  if (gymId) where.gym_id = gymId;
  return SubscriptionPreset.findAll({ where, order: [["label", "ASC"]] });
};

const createPreset = async (data) => {
  const { gym_id, label, type, category, duration_days, price, total_visits } =
    data;
  if (!gym_id || !label || !type || !category || !duration_days || !price) {
    const err = new Error("Усі поля обовʼязкові");
    err.status = 400;
    throw err;
  }
  if (type === "visits" && !total_visits) {
    const err = new Error("Кількість відвідувань обовʼязкова для типу visits");
    err.status = 400;
    throw err;
  }
  return SubscriptionPreset.create(data);
};

const updatePreset = async (presetId, data) => {
  const preset = await SubscriptionPreset.findByPk(presetId);
  if (!preset) {
    const err = new Error("Пресет не знайдено");
    err.status = 404;
    throw err;
  }
  await preset.update(data);
  return preset;
};

const deletePreset = async (presetId) => {
  const preset = await SubscriptionPreset.findByPk(presetId);
  if (!preset) {
    const err = new Error("Пресет не знайдено");
    err.status = 404;
    throw err;
  }
  await preset.destroy();
};

// ── Stats / Analytics ──

const getStats = async (gymId, from, to) => {
  const gymWhere = gymId ? { gym_id: gymId } : {};

  const dateFilter = {};
  if (from) dateFilter[Op.gte] = from;
  if (to) dateFilter[Op.lte] = to;
  const hasDateFilter = from || to;

  // Total clients
  const totalClients = await Client.count({ where: gymWhere });

  // Active subscriptions
  const activeSubscriptions = await Subscription.count({
    where: { ...gymWhere, status: "active" },
  });

  // Revenue
  const paymentWhere = { ...gymWhere };
  if (hasDateFilter) paymentWhere.date = dateFilter;
  const revenueResult = await Payment.findOne({
    where: paymentWhere,
    attributes: [[fn("COALESCE", fn("SUM", col("amount")), 0), "total"]],
    raw: true,
  });
  const totalRevenue = parseFloat(revenueResult.total) || 0;

  // Visits count
  const visitWhere = { ...gymWhere };
  if (hasDateFilter) visitWhere.entered_at = dateFilter;
  const totalVisits = await Visit.count({ where: visitWhere });

  // Revenue by day (last 30 days or filtered range)
  const revenueByDayWhere = { ...gymWhere };
  if (hasDateFilter) {
    revenueByDayWhere.date = dateFilter;
  } else {
    revenueByDayWhere.date = {
      [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
  }
  const revenueByDay = await Payment.findAll({
    where: revenueByDayWhere,
    attributes: [
      [fn("DATE", col("date")), "day"],
      [fn("SUM", col("amount")), "total"],
    ],
    group: [fn("DATE", col("date"))],
    order: [[fn("DATE", col("date")), "ASC"]],
    raw: true,
  });

  // Visits by day
  const visitsByDayWhere = { ...gymWhere };
  if (hasDateFilter) {
    visitsByDayWhere.entered_at = dateFilter;
  } else {
    visitsByDayWhere.entered_at = {
      [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
  }
  const visitsByDay = await Visit.findAll({
    where: visitsByDayWhere,
    attributes: [
      [fn("DATE", col("entered_at")), "day"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: [fn("DATE", col("entered_at"))],
    order: [[fn("DATE", col("entered_at")), "ASC"]],
    raw: true,
  });

  // Popular subscriptions (by label)
  const popularSubsWhere = { ...gymWhere };
  if (hasDateFilter) popularSubsWhere.created_at = dateFilter;
  const popularSubs = await Subscription.findAll({
    where: popularSubsWhere,
    attributes: [
      "label",
      "type",
      "category",
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["label", "type", "category"],
    order: [[fn("COUNT", col("id")), "DESC"]],
    limit: 10,
    raw: true,
  });

  // Revenue by method
  const revenueByMethod = await Payment.findAll({
    where: paymentWhere,
    attributes: [
      "method",
      [fn("SUM", col("amount")), "total"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["method"],
    raw: true,
  });

  return {
    totalClients,
    activeSubscriptions,
    totalRevenue,
    totalVisits,
    revenueByDay,
    visitsByDay,
    popularSubs,
    revenueByMethod,
  };
};

// ── Clients (read-only for admin) ──

const getClients = async ({ gymId, q, limit = 50, offset = 0 }) => {
  const where = {};
  if (gymId) where.gym_id = gymId;
  if (q) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${q}%` } },
      { last_name: { [Op.like]: `%${q}%` } },
      { phone: { [Op.like]: `%${q}%` } },
      { code: { [Op.like]: `%${q}%` } },
    ];
  }
  const { rows, count } = await Client.findAndCountAll({
    where,
    limit: Math.min(Number(limit) || 50, 500),
    offset: Number(offset) || 0,
    order: [["last_name", "ASC"]],
    attributes: [
      "id",
      "gym_id",
      "code",
      "first_name",
      "last_name",
      "phone",
      "email",
      "photo",
      "gender",
      "birth_date",
    ],
  });
  return { clients: rows, total: count };
};

// ── Audit Log ──

const getAuditLogs = async ({ gymId, limit = 50, offset = 0 }) => {
  const where = {};
  if (gymId) where.gym_id = gymId;
  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    limit: Math.min(Number(limit) || 50, 500),
    offset: Number(offset) || 0,
    order: [["created_at", "DESC"]],
  });
  return { logs: rows, total: count };
};

const createAuditLog = async ({
  gym_id,
  worker_id,
  worker_name,
  action,
  entity,
  entity_id,
  details,
}) => {
  return AuditLog.create({
    gym_id,
    worker_id,
    worker_name,
    action,
    entity,
    entity_id,
    details,
  });
};

const getPayments = async ({ gymId, from, to, type, method, status, limit = 50, offset = 0 } = {}) => {
  const where = {};
  if (gymId) where.gym_id = gymId;
  if (type) where.type = type;
  if (method) where.method = method;
  if (status) where.status = status;
  if (from || to) {
    where.date = {};
    if (from) where.date[Op.gte] = new Date(from);
    if (to) where.date[Op.lte] = new Date(to);
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

const updatePayment = async (id, { amount, method }) => {
  const { update } = require('./payment.service');
  // find by id without gym filter (admin can see all)
  const { Payment: P } = require('../models');
  const payment = await P.findByPk(id);
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
  const VALID_METHODS = ['cash', 'card'];
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

const cancelPayment = async (id, note) => {
  const sequelizeInstance = require('../config/db');
  const { Payment: P, Subscription: S } = require('../models');

  return sequelizeInstance.transaction(async (t) => {
    const payment = await P.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
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

    if (payment.subscription_id) {
      const sub = await S.findByPk(payment.subscription_id, { transaction: t, lock: t.LOCK.UPDATE });
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

module.exports = {
  login,
  refresh,
  getGyms,
  createGym,
  updateGym,
  deleteGym,
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  getStats,
  getClients,
  getAuditLogs,
  createAuditLog,
  getPayments,
  updatePayment,
  cancelPayment,
};
