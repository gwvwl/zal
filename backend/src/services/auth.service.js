const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Gym, Worker } = require("../models");

const TOKEN_EXPIRES = "15m";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: TOKEN_EXPIRES,
  });

/**
 * Шаг 1: Вхід зала за логіном/паролем
 * Повертає token з { gym_id, gym_name }
 */
const gymLogin = async (gymId, password) => {
  const gym = await Gym.findOne({ where: { id: gymId } });
  if (!gym) {
    const err = new Error("Невірний логін або пароль");
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(String(password), gym.password_hash);
  if (!valid) {
    const err = new Error("Невірний логін або пароль");
    err.status = 401;
    throw err;
  }

  const token = signToken({ gym_id: gym.id, gym_name: gym.name });
  return { token, gym: { id: gym.id, name: gym.name } };
};

/**
 * Шаг 2: Вхід сотрудника за PIN
 * Потребує gym_id у поточному токені
 * Повертає новий token з { gym_id, gym_name, worker_id, worker_name, role }
 */
const workerLogin = async (gymId, gymName, workerId, pin) => {
  const worker = await Worker.findOne({
    where: { id: workerId, gym_id: gymId },
  });
  if (!worker) {
    const err = new Error("Працівника не знайдено");
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(String(pin), worker.password_hash);
  if (!valid) {
    const err = new Error("Невірний PIN");
    err.status = 401;
    throw err;
  }

  const token = signToken({
    gym_id: gymId,
    gym_name: gymName,
    worker_id: worker.id,
    worker_name: worker.name,
    role: worker.role,
  });

  return {
    token,
    worker: { id: worker.id, name: worker.name, role: worker.role },
  };
};

/**
 * Оновлення токену — верифікує токен з httpOnly cookie (навіть прострочений)
 * і видає новий access_token
 */
const REFRESH_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

const refresh = (cookieToken) => {
  if (!cookieToken) {
    const err = new Error('Refresh cookie відсутній');
    err.status = 401;
    throw err;
  }

  let payload;
  try {
    payload = jwt.verify(cookieToken, process.env.JWT_ACCESS_SECRET, {
      ignoreExpiration: true,
    });
  } catch {
    const err = new Error('Недійсний токен');
    err.status = 401;
    throw err;
  }

  // Reject tokens older than 7 days
  const tokenAge = Math.floor(Date.now() / 1000) - payload.iat;
  if (tokenAge > REFRESH_MAX_AGE_SEC) {
    const err = new Error('Сесія закінчилась, увійдіть знову');
    err.status = 401;
    throw err;
  }

  const { iat, exp, ...cleanPayload } = payload;
  const access_token = signToken(cleanPayload);
  return { access_token };
};

module.exports = { gymLogin, workerLogin, refresh };
