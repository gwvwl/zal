const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const clientController = require('../controllers/client.controller');
const { requireWorker } = require('../middlewares/auth');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Дозволені тільки зображення'));
  },
});

router.get('/', requireWorker, clientController.getAll);
router.post('/', requireWorker, upload.single('photo'), clientController.create);
router.get('/by-code/:code', requireWorker, clientController.getByCode);
router.get('/:id', requireWorker, clientController.getById);
router.put('/:id', requireWorker, upload.single('photo'), clientController.update);
router.post('/:id/replace-card', requireWorker, clientController.replaceCard);

module.exports = router;
