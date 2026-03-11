const clientService = require('../services/client.service');
const { createAuditLog } = require('../services/admin.service');

function audit(auth, action, entityId, details) {
  createAuditLog({
    gym_id: auth.gym_id,
    worker_id: auth.worker_id || null,
    worker_name: auth.worker_name || null,
    action,
    entity: 'client',
    entity_id: String(entityId || ''),
    details: typeof details === 'string' ? details : JSON.stringify(details),
  }).catch(() => {});
}

const getAll = async (req, res, next) => {
  try {
    const clients = await clientService.getAll(req.auth.gym_id, req.query);
    res.json(clients);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const client = await clientService.getById(req.auth.gym_id, req.params.id);
    res.json(client);
  } catch (err) {
    next(err);
  }
};

const getByCode = async (req, res, next) => {
  try {
    const client = await clientService.getByCode(req.auth.gym_id, req.params.code);
    res.json(client);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) body.photo = `/uploads/${req.file.filename}`;
    const client = await clientService.create(req.auth.gym_id, body);
    audit(req.auth, 'create', client.id, { name: `${client.last_name} ${client.first_name}` });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.file) body.photo = `/uploads/${req.file.filename}`;
    const client = await clientService.update(req.auth.gym_id, req.params.id, body);
    audit(req.auth, 'update', client.id, { name: `${client.last_name} ${client.first_name}` });
    res.json(client);
  } catch (err) {
    next(err);
  }
};

const replaceCard = async (req, res, next) => {
  try {
    const result = await clientService.replaceCard(
      req.auth.gym_id,
      req.params.id,
      req.body,
      req.auth,
    );
    audit(req.auth, 'update', req.params.id, { action: 'replace_card', new_code: req.body.code });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, getByCode, create, update, replaceCard };
