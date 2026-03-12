const visitService = require('../services/visit.service');
const { createAuditLog } = require('../services/admin.service');

function audit(auth, action, entityId, details) {
  createAuditLog({
    gym_id: auth.gym_id,
    worker_id: auth.worker_id || null,
    worker_name: auth.worker_name || null,
    action,
    entity: 'visit',
    entity_id: String(entityId || ''),
    details: typeof details === 'string' ? details : JSON.stringify(details),
  }).catch(() => {});
}

const getAll = async (req, res, next) => {
  try {
    const visits = await visitService.getAll(req.auth.gym_id, req.query);
    res.json(visits);
  } catch (err) {
    next(err);
  }
};

const enter = async (req, res, next) => {
  try {
    const visit = await visitService.enter(req.auth.gym_id, req.body.clientId, req.body.subscriptionId);
    audit(req.auth, 'enter', visit.id, { client_id: req.body.clientId, subscription_id: req.body.subscriptionId || null });
    res.status(201).json(visit);
  } catch (err) {
    next(err);
  }
};

const enterByCode = async (req, res, next) => {
  try {
    const result = await visitService.enterByCode(req.auth.gym_id, req.body.code, req.body.subscriptionId);
    audit(req.auth, 'enter', result.visit.id, { code: req.body.code, client_id: result.client.id });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const singleEntry = async (req, res, next) => {
  try {
    const result = await visitService.singleEntry(req.auth.gym_id, req.body, req.auth);
    audit(req.auth, 'enter', result.visit.id, { client_id: req.body.clientId, type: 'single', amount: req.body.amount });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const exit = async (req, res, next) => {
  try {
    const visit = await visitService.exit(req.auth.gym_id, req.params.id);
    audit(req.auth, 'exit', visit.id, { client_id: visit.client_id });
    res.json(visit);
  } catch (err) {
    next(err);
  }
};

const getGroupReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date є обов\'язковим' });
    const data = await visitService.getGroupReport(req.auth.gym_id, date);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, enter, enterByCode, singleEntry, exit, getGroupReport };
