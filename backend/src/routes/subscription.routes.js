const router = require('express').Router();
const subscriptionController = require('../controllers/subscription.controller');
const { requireWorker } = require('../middlewares/auth');

router.get('/', requireWorker, subscriptionController.getAll);
router.get('/presets', requireWorker, subscriptionController.getPresets);
router.post('/', requireWorker, subscriptionController.create);
router.patch('/:id/activate', requireWorker, subscriptionController.activate);
router.patch('/:id/freeze', requireWorker, subscriptionController.freeze);
router.patch('/:id/unfreeze', requireWorker, subscriptionController.unfreeze);
router.post('/renew-locker', requireWorker, subscriptionController.renewLocker);
router.patch('/:id/dismiss', requireWorker, subscriptionController.dismiss);

module.exports = router;
