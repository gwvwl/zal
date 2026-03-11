const jwt = require('jsonwebtoken');

const extractToken = (req) => {
  const authHeader = req.headers['authorization'];
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
};

const requireAdmin = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Токен відсутній' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!payload.admin_id) {
      return res.status(401).json({ error: 'Потрібна авторизація адміністратора' });
    }
    req.admin = { id: payload.admin_id, name: payload.admin_name };
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недійсний або прострочений' });
  }
};

module.exports = { requireAdmin };
