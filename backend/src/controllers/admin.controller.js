const adminService = require('../services/admin.service');

function audit(req, action, entity, entityId, details) {
  const gymId = entity === 'gym'
    ? entityId
    : (req.body?.gym_id || entityId || 'admin');
  adminService.createAuditLog({
    gym_id: gymId,
    worker_id: null,
    worker_name: `[admin] ${req.admin?.name || 'unknown'}`,
    action,
    entity,
    entity_id: String(entityId || ''),
    details: typeof details === 'string' ? details : JSON.stringify(details),
  }).catch(() => {});
}

// ── Auth ──

const login = async (req, res, next) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Логін та пароль обовʼязкові' });
    }
    const result = await adminService.login(login, password);
    res.cookie('admin_token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = (req, res, next) => {
  try {
    const result = adminService.refresh(req.cookies?.admin_token);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ── Gyms ──

const getGyms = async (req, res, next) => {
  try {
    const gyms = await adminService.getGyms();
    res.json(gyms);
  } catch (err) {
    next(err);
  }
};

const createGym = async (req, res, next) => {
  try {
    const gym = await adminService.createGym(req.body);
    audit(req, 'create', 'gym', gym.id, { name: gym.name, login: gym.login });
    res.status(201).json(gym);
  } catch (err) {
    next(err);
  }
};

const updateGym = async (req, res, next) => {
  try {
    const gym = await adminService.updateGym(req.params.id, req.body);
    audit(req, 'update', 'gym', gym.id, { name: gym.name, login: gym.login });
    res.json(gym);
  } catch (err) {
    next(err);
  }
};

const deleteGym = async (req, res, next) => {
  try {
    await adminService.deleteGym(req.params.id);
    audit(req, 'delete', 'gym', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ── Workers ──

const getWorkers = async (req, res, next) => {
  try {
    const workers = await adminService.getWorkers(req.query.gymId);
    res.json(workers);
  } catch (err) {
    next(err);
  }
};

const createWorker = async (req, res, next) => {
  try {
    const worker = await adminService.createWorker(req.body);
    audit(req, 'create', 'worker', worker.id, { name: worker.name, role: worker.role, gym_id: worker.gym_id });
    res.status(201).json(worker);
  } catch (err) {
    next(err);
  }
};

const updateWorker = async (req, res, next) => {
  try {
    const worker = await adminService.updateWorker(req.params.id, req.body);
    audit(req, 'update', 'worker', worker.id, { name: worker.name, role: worker.role, gym_id: worker.gym_id });
    res.json(worker);
  } catch (err) {
    next(err);
  }
};

const deleteWorker = async (req, res, next) => {
  try {
    await adminService.deleteWorker(req.params.id);
    audit(req, 'delete', 'worker', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ── Presets ──

const getPresets = async (req, res, next) => {
  try {
    const presets = await adminService.getPresets(req.query.gymId);
    res.json(presets);
  } catch (err) {
    next(err);
  }
};

const createPreset = async (req, res, next) => {
  try {
    const preset = await adminService.createPreset(req.body);
    audit(req, 'create', 'preset', preset.id, { label: preset.label, gym_id: preset.gym_id });
    res.status(201).json(preset);
  } catch (err) {
    next(err);
  }
};

const updatePreset = async (req, res, next) => {
  try {
    const preset = await adminService.updatePreset(req.params.id, req.body);
    audit(req, 'update', 'preset', preset.id, { label: preset.label, gym_id: preset.gym_id });
    res.json(preset);
  } catch (err) {
    next(err);
  }
};

const deletePreset = async (req, res, next) => {
  try {
    await adminService.deletePreset(req.params.id);
    audit(req, 'delete', 'preset', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// ── Stats ──

const getStats = async (req, res, next) => {
  try {
    const { gymId, from, to } = req.query;
    const stats = await adminService.getStats(gymId, from, to);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

// ── Clients ──

const getClients = async (req, res, next) => {
  try {
    const result = await adminService.getClients(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ── Payments ──

const getPayments = async (req, res, next) => {
  try {
    const result = await adminService.getPayments(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const payment = await adminService.updatePayment(req.params.id, req.body);
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

const cancelPayment = async (req, res, next) => {
  try {
    const payment = await adminService.cancelPayment(req.params.id, req.body.note);
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// ── Audit ──

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogs(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login, refresh,
  getGyms, createGym, updateGym, deleteGym,
  getWorkers, createWorker, updateWorker, deleteWorker,
  getPresets, createPreset, updatePreset, deletePreset,
  getStats,
  getClients,
  getPayments,
  updatePayment,
  cancelPayment,
  getAuditLogs,
};
