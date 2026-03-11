const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middlewares/adminAuth');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Забагато спроб входу, спробуйте через хвилину' },
});

// Auth
router.post('/login', loginLimiter, adminController.login);
router.post('/refresh', adminController.refresh);

// All below require admin auth
router.use(requireAdmin);

// Gyms
router.get('/gyms', adminController.getGyms);
router.post('/gyms', adminController.createGym);
router.put('/gyms/:id', adminController.updateGym);
router.delete('/gyms/:id', adminController.deleteGym);

// Workers
router.get('/workers', adminController.getWorkers);
router.post('/workers', adminController.createWorker);
router.put('/workers/:id', adminController.updateWorker);
router.delete('/workers/:id', adminController.deleteWorker);

// Presets
router.get('/presets', adminController.getPresets);
router.post('/presets', adminController.createPreset);
router.put('/presets/:id', adminController.updatePreset);
router.delete('/presets/:id', adminController.deletePreset);

// Stats
router.get('/stats', adminController.getStats);

// Clients
router.get('/clients', adminController.getClients);

// Audit
router.get('/audit', adminController.getAuditLogs);

module.exports = router;
