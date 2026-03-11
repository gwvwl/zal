const router = require('express').Router();
const workerController = require('../controllers/worker.controller');
const { requireGym } = require('../middlewares/auth');

// Захищений gym-токеном (викликається на сторінці вибору працівника)
router.get('/', requireGym, workerController.getAll);

module.exports = router;
