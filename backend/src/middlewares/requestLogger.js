const logger = require('../utils/logger');

const SKIP_PATHS = ['/health'];

module.exports = (req, res, next) => {
  if (SKIP_PATHS.includes(req.path)) return next();

  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('http', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms,
      ip: req.ip,
    });
  });

  next();
};
