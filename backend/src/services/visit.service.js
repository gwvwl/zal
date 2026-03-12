const { Op, literal } = require('sequelize');
const sequelize = require('../config/db');
const { Visit, Client, Payment, Subscription } = require('../models');

const getAll = async (gymId, { clientId, inGym, date } = {}) => {
  const where = { gym_id: gymId };

  if (clientId) where.client_id = clientId;
  if (inGym === 'true' || inGym === true) where.exited_at = null;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.entered_at = { [Op.gte]: start, [Op.lt]: end };
  }

  return Visit.findAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: ['id', 'first_name', 'last_name', 'phone', 'photo'] },
      { model: Subscription, as: 'subscription', attributes: ['id', 'label', 'category', 'status'] },
    ],
    order: [['entered_at', 'DESC']],
  });
};

async function deductVisit(sub, transaction) {
  if (sub.type !== 'visits') return;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayCount = await Visit.count({
    where: {
      subscription_id: sub.id,
      entered_at: { [Op.gte]: todayStart, [Op.lte]: todayEnd },
    },
    transaction,
  });

  if (todayCount > 1) return;

  const newUsed = sub.used_visits + 1;
  const updates = { used_visits: newUsed };
  if (newUsed >= sub.total_visits) {
    updates.status = 'expired';
  }
  await sub.update(updates, { transaction });
}

const enter = async (gymId, clientId, subscriptionId) => {
  return sequelize.transaction(async (t) => {
    const existing = await Visit.findOne({
      where: { client_id: clientId, gym_id: gymId, exited_at: null },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existing) {
      const err = new Error('Клієнт вже в залі');
      err.status = 409;
      throw err;
    }

    let sub = null;
    if (subscriptionId) {
      sub = await Subscription.findOne({
        where: {
          id: subscriptionId,
          client_id: clientId,
          [Op.or]: [
            { gym_id: gymId },
            literal(`JSON_CONTAINS(allowed_gyms, '"${gymId}"')`),
          ],
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!sub) {
        const err = new Error('Абонемент не знайдений');
        err.status = 404;
        throw err;
      }
      if (sub.status !== 'active') {
        const err = new Error('Абонемент не активний');
        err.status = 400;
        throw err;
      }
      if (sub.category === 'locker') {
        const err = new Error('Абонемент на ящик не дає права входу в зал');
        err.status = 400;
        throw err;
      }
      const today = new Date().toISOString().split('T')[0];
      if (sub.end_date && today > sub.end_date) {
        await sub.update({ status: 'expired' }, { transaction: t });
        const err = new Error('Абонемент прострочений');
        err.status = 400;
        throw err;
      }
      if (sub.type === 'visits' && sub.used_visits >= sub.total_visits) {
        await sub.update({ status: 'expired' }, { transaction: t });
        const err = new Error('Відвідування вичерпані');
        err.status = 400;
        throw err;
      }
    }

    const visit = await Visit.create({
      gym_id: gymId,
      client_id: clientId,
      subscription_id: subscriptionId || null,
      entered_at: new Date(),
    }, { transaction: t });

    if (sub) {
      await deductVisit(sub, t);
    }

    return visit;
  });
};

const enterByCode = async (gymId, code, subscriptionId) => {
  let client = await Client.findOne({ where: { code, gym_id: gymId } });

  if (!client) {
    const foreignClient = await Client.findOne({ where: { code } });
    if (foreignClient) {
      const crossSub = await Subscription.findOne({
        where: {
          client_id: foreignClient.id,
          status: 'active',
          [Op.and]: [literal(`JSON_CONTAINS(allowed_gyms, '"${gymId}"')`)],
        },
      });
      if (crossSub) client = foreignClient;
    }
    if (!client) {
      const err = new Error('Клієнт не знайдений у цьому залі');
      err.status = 404;
      throw err;
    }
  }

  const visit = await enter(gymId, client.id, subscriptionId);
  return { visit, client };
};

const singleEntry = async (gymId, { clientId, amount, method }, auth) => {
  if (!clientId) {
    const err = new Error('clientId є обов\'язковим');
    err.status = 400;
    throw err;
  }
  if (!amount || Number(amount) <= 0) {
    const err = new Error('Сума повинна бути більше 0');
    err.status = 400;
    throw err;
  }
  const validMethods = ['cash', 'card'];
  if (!validMethods.includes(method)) {
    const err = new Error('Невірний спосіб оплати');
    err.status = 400;
    throw err;
  }

  return sequelize.transaction(async (t) => {
    const existing = await Visit.findOne({
      where: { client_id: clientId, gym_id: gymId, exited_at: null },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existing) {
      const err = new Error('Клієнт вже в залі');
      err.status = 409;
      throw err;
    }

    const visit = await Visit.create({
      gym_id:     gymId,
      client_id:  clientId,
      entered_at: new Date(),
    }, { transaction: t });

    const payment = await Payment.create({
      gym_id:      gymId,
      client_id:   clientId,
      amount:      Number(amount),
      type:        'single',
      label:       'Разовий вхід',
      worker_id:   auth.worker_id,
      worker_name: auth.worker_name,
      method,
    }, { transaction: t });

    return { visit, payment };
  });
};

const exit = async (gymId, visitId) => {
  const visit = await Visit.findOne({
    where: { id: visitId, gym_id: gymId, exited_at: null },
  });
  if (!visit) {
    const err = new Error('Активний візит не знайдений');
    err.status = 404;
    throw err;
  }

  await visit.update({ exited_at: new Date() });
  return visit;
};

module.exports = { getAll, enter, enterByCode, singleEntry, exit };
