const { Op } = require('sequelize');
const { Client, Payment } = require('../models');

const getAll = async (gymId, { q, limit = 100, offset = 0 } = {}) => {
  const where = { gym_id: gymId };

  if (q) {
    where[Op.or] = [
      { last_name:  { [Op.like]: `%${q}%` } },
      { first_name: { [Op.like]: `%${q}%` } },
      { phone:      { [Op.like]: `%${q}%` } },
      { code:       { [Op.like]: `%${q}%` } },
    ];
  }

  return Client.findAll({
    where,
    order: [['last_name', 'ASC'], ['first_name', 'ASC']],
    limit: Math.min(Number(limit) || 100, 500),
    offset: Number(offset) || 0,
  });
};

const getById = async (gymId, id) => {
  const client = await Client.findOne({ where: { id, gym_id: gymId } });
  if (!client) {
    const err = new Error('Клієнт не знайдений');
    err.status = 404;
    throw err;
  }
  return client;
};

const getByCode = async (gymId, code) => {
  const client = await Client.findOne({ where: { code, gym_id: gymId } });
  if (!client) {
    const err = new Error('Клієнт не знайдений у цьому залі');
    err.status = 404;
    throw err;
  }
  return client;
};

const create = async (gymId, data) => {
  const { lastName, firstName, middleName, phone, email,
          birthDate, gender, goal, experience, source, code, photo } = data;

  if (!lastName || !firstName) {
    const err = new Error('lastName and firstName are required');
    err.status = 400;
    throw err;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Невірний формат email');
    err.status = 400;
    throw err;
  }

  if (birthDate) {
    const d = new Date(birthDate);
    if (isNaN(d.getTime())) {
      const err = new Error('Невірний формат дати народження');
      err.status = 400;
      throw err;
    }
  }

  if (gender && !['male', 'female'].includes(gender)) {
    const err = new Error('Невірне значення gender');
    err.status = 400;
    throw err;
  }

  if (code) {
    const existing = await Client.findOne({ where: { code, gym_id: gymId } });
    if (existing) {
      const err = new Error('Клієнт з таким кодом вже існує');
      err.status = 409;
      throw err;
    }
  }

  return Client.create({
    gym_id: gymId,
    code: code || null,
    last_name: lastName,
    first_name: firstName,
    middle_name: middleName || null,
    phone: phone || null,
    email: email || null,
    birth_date: birthDate || null,
    gender: gender || null,
    goal: goal || null,
    experience: experience || null,
    source: source || null,
    created_at: new Date().toISOString().slice(0, 10),
    photo: photo || null,
  });
};

const update = async (gymId, id, data) => {
  const client = await getById(gymId, id);

  const { lastName, firstName, middleName, phone, email,
          birthDate, gender, goal, experience, source, code, photo } = data;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const err = new Error('Невірний формат email');
    err.status = 400;
    throw err;
  }

  if (gender && !['male', 'female'].includes(gender)) {
    const err = new Error('Невірне значення gender');
    err.status = 400;
    throw err;
  }

  await client.update({
    code:        code        ?? client.code,
    last_name:   lastName    ?? client.last_name,
    first_name:  firstName   ?? client.first_name,
    middle_name: middleName  ?? client.middle_name,
    phone:       phone       ?? client.phone,
    email:       email       ?? client.email,
    birth_date:  birthDate   ?? client.birth_date,
    gender:      gender      ?? client.gender,
    goal:        goal        ?? client.goal,
    experience:  experience  ?? client.experience,
    source:      source      ?? client.source,
    photo:       photo       ?? client.photo,
  });

  return client;
};

const replaceCard = async (gymId, clientId, { code, paid, amount, method }, auth) => {
  const client = await getById(gymId, clientId);

  if (!code) {
    const err = new Error('Код картки обов\'язковий');
    err.status = 400;
    throw err;
  }

  const existing = await Client.findOne({ where: { code, gym_id: gymId } });
  if (existing && existing.id !== clientId) {
    const err = new Error('Цей код вже використовується в цьому залі');
    err.status = 409;
    throw err;
  }

  await client.update({ code });

  let payment = null;
  if (paid && amount) {
    if (Number(amount) <= 0) {
      const err = new Error('Сума повинна бути більше 0');
      err.status = 400;
      throw err;
    }
    const validMethods = ['cash', 'card'];
    if (method && !validMethods.includes(method)) {
      const err = new Error('Невірний спосіб оплати');
      err.status = 400;
      throw err;
    }
    payment = await Payment.create({
      gym_id:      gymId,
      client_id:   clientId,
      amount:      Number(amount),
      type:        'card_replace',
      label:       'Заміна картки',
      worker_id:   auth.worker_id,
      worker_name: auth.worker_name,
      method:      method || 'cash',
    });
  }

  return { client, payment };
};

module.exports = { getAll, getById, getByCode, create, update, replaceCard };
