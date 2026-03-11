const jwt = require('jsonwebtoken');

const extractToken = (req) => {
  const authHeader = req.headers['authorization'];
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

/**
 * Потребує gym_id у токені (після gym-login)
 * Встановлює req.auth = { gym_id, gym_name }
 */
const requireGym = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Токен відсутній' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!payload.gym_id) {
      return res.status(401).json({ error: 'Недійсний токен' });
    }
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недійсний або прострочений' });
  }
};

/**
 * Потребує gym_id + worker_id у токені (після worker-login)
 * Встановлює req.auth = { gym_id, gym_name, worker_id, worker_name, role }
 */
const requireWorker = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Токен відсутній' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!payload.gym_id || !payload.worker_id) {
      return res.status(401).json({ error: 'Потрібна авторизація працівника' });
    }
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недійсний або прострочений' });
  }
};

module.exports = { requireGym, requireWorker };
