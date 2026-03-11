const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { requireWorker } = require('../middlewares/auth');

router.get('/', requireWorker, paymentController.getAll);
router.post('/', requireWorker, paymentController.create);

module.exports = router;
