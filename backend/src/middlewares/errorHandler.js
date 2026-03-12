const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const meta = { status, method: req.method, path: req.originalUrl };
  if (status >= 500) meta.stack = err.stack;
  logger.error(err.message || 'Internal server error', meta);
  res.status(status).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
