const subscriptionService = require('../services/subscription.service');
const { SubscriptionPreset } = require('../models');
const { createAuditLog } = require('../services/admin.service');

function audit(auth, action, entityId, details) {
  createAuditLog({
    gym_id: auth.gym_id,
    worker_id: auth.worker_id || null,
    worker_name: auth.worker_name || null,
    action,
    entity: 'subscription',
    entity_id: String(entityId || ''),
    details: typeof details === 'string' ? details : JSON.stringify(details),
  }).catch(() => {});
}

const getAll = async (req, res, next) => {
  try {
    const subs = await subscriptionService.getAll(req.auth.gym_id, req.query);
    res.json(subs);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const sub = await subscriptionService.create(req.auth.gym_id, req.body);
    audit(req.auth, 'create', sub.id, { client_id: req.body.clientId, label: sub.label, price: sub.price });
    res.status(201).json(sub);
  } catch (err) {
    next(err);
  }
};

const freeze = async (req, res, next) => {
  try {
    const sub = await subscriptionService.freeze(req.auth.gym_id, req.params.id, req.body);
    audit(req.auth, 'freeze', sub.id, { client_id: sub.client_id, frozen_to: req.body.frozenTo });
    res.json(sub);
  } catch (err) {
    next(err);
  }
};

const unfreeze = async (req, res, next) => {
  try {
    const sub = await subscriptionService.unfreeze(req.auth.gym_id, req.params.id);
    audit(req.auth, 'unfreeze', sub.id, { client_id: sub.client_id, new_end_date: sub.end_date });
    res.json(sub);
  } catch (err) {
    next(err);
  }
};

const activate = async (req, res, next) => {
  try {
    const sub = await subscriptionService.activate(req.auth.gym_id, req.params.id);
    audit(req.auth, 'activate', sub.id, { client_id: sub.client_id, start_date: sub.start_date, end_date: sub.end_date });
    res.json(sub);
  } catch (err) {
    next(err);
  }
};

const getPresets = async (req, res, next) => {
  try {
    const presets = await SubscriptionPreset.findAll({
      where: { gym_id: req.auth.gym_id, is_active: true },
      order: [['label', 'ASC']],
    });
    res.json(presets);
  } catch (err) {
    next(err);
  }
};

const renewLocker = async (req, res, next) => {
  try {
    const sub = await subscriptionService.renewLocker(req.auth.gym_id, req.body);
    audit(req.auth, 'renew_locker', sub.id, {
      client_id: req.body.clientId,
      label: sub.label,
      price: sub.price,
      start_date: sub.start_date,
      end_date: sub.end_date,
    });
    res.status(201).json(sub);
  } catch (err) {
    next(err);
  }
};

const dismiss = async (req, res, next) => {
  try {
    const sub = await subscriptionService.dismiss(req.auth.gym_id, req.params.id);
    audit(req.auth, 'dismiss', sub.id, { client_id: sub.client_id, label: sub.label });
    res.json(sub);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, activate, freeze, unfreeze, getPresets, renewLocker, dismiss };
