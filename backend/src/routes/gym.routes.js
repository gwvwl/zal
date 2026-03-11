const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { Gym } = require('../models');

const gymListLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Забагато запитів, спробуйте через хвилину' },
});

router.get('/', gymListLimiter, async (req, res, next) => {
  try {
    const gyms = await Gym.findAll({
      attributes: ['id', 'name'],
    });
    res.json(gyms);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
