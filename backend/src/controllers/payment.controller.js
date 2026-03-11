const paymentService = require('../services/payment.service');
const { createAuditLog } = require('../services/admin.service');

function audit(auth, entityId, details) {
  createAuditLog({
    gym_id: auth.gym_id,
    worker_id: auth.worker_id || null,
    worker_name: auth.worker_name || null,
    action: 'create',
    entity: 'payment',
    entity_id: String(entityId || ''),
    details: typeof details === 'string' ? details : JSON.stringify(details),
  }).catch(() => {});
}

const getAll = async (req, res, next) => {
  try {
    const payments = await paymentService.getAll(req.auth.gym_id, req.query);
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const payment = await paymentService.create(req.auth.gym_id, req.body, req.auth);
    audit(req.auth, payment.id, { client_id: req.body.clientId, amount: payment.amount, type: payment.type, method: payment.method });
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create };
