const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const visitController = require('../controllers/visit.controller');
const { requireWorker } = require('../middlewares/auth');

const entryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Забагато спроб входу, спробуйте через хвилину' },
});

router.get('/', requireWorker, visitController.getAll);
router.get('/group-report', requireWorker, visitController.getGroupReport);
router.post('/enter', requireWorker, entryLimiter, visitController.enter);
router.post('/enter-by-code', requireWorker, entryLimiter, visitController.enterByCode);
router.post('/single-entry', requireWorker, entryLimiter, visitController.singleEntry);
router.patch('/:id/exit', requireWorker, visitController.exit);

module.exports = router;
