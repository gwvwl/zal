const authService = require("../services/auth.service");

const gymLogin = async (req, res, next) => {
  try {
    const { gym_id, password } = req.body;
    if (!gym_id || !password) {
      return res.status(400).json({ error: "gym_id and password are required" });
    }

    const result = await authService.gymLogin(gym_id, password);
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const workerLogin = async (req, res, next) => {
  try {
    const { worker_id, pin } = req.body;
    if (!worker_id || !pin) {
      return res.status(400).json({ error: "worker_id and pin are required" });
    }

    const { gym_id, gym_name } = req.auth;
    const result = await authService.workerLogin(
      gym_id,
      gym_name,
      worker_id,
      pin,
    );
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = (req, res, next) => {
  try {
    const result = authService.refresh(req.cookies?.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { gymLogin, workerLogin, refresh };
