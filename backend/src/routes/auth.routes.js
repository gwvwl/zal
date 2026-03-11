const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { requireGym } = require('../middlewares/auth');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Забагато спроб входу, спробуйте через хвилину' },
});

router.post('/gym-login', loginLimiter, authController.gymLogin);
router.post('/worker-login', loginLimiter, requireGym, authController.workerLogin);
router.post('/refresh', authController.refresh);

module.exports = router;
