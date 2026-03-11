require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sequelize = require('../src/config/db');
const { Gym, Worker, Client, Subscription, Visit, Payment } = require('../src/models');
const bcrypt = require('bcryptjs');

// ─── helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const dateOnly = (d) => d.toISOString().slice(0, 10);

// ─── ids ──────────────────────────────────────────────────────────────────────

// Workers
const W = {
  g1_admin:     'aaaaaaaa-0001-0001-0001-000000000001',
  g1_reception: 'aaaaaaaa-0001-0001-0001-000000000002',
  g1_trainer:   'aaaaaaaa-0001-0001-0001-000000000003',
  g2_admin:     'aaaaaaaa-0002-0002-0002-000000000001',
  g2_reception: 'aaaaaaaa-0002-0002-0002-000000000002',
};

// Clients gym1
const C1 = {
  koval:    'cccccccc-0001-0001-0001-000000000001',
  bondar:   'cccccccc-0001-0001-0001-000000000002',
  shev:     'cccccccc-0001-0001-0001-000000000003',
  moroz:    'cccccccc-0001-0001-0001-000000000004',
  lysen:    'cccccccc-0001-0001-0001-000000000005',
  gryt:     'cccccccc-0001-0001-0001-000000000006',
};

// Clients gym2
const C2 = {
  panch:  'cccccccc-0002-0002-0002-000000000001',
  tymch:  'cccccccc-0002-0002-0002-000000000002',
  ostap:  'cccccccc-0002-0002-0002-000000000003',
};

// ─── data ─────────────────────────────────────────────────────────────────────

const PIN_HASH = bcrypt.hashSync('1234', 10);

const GYMS = [
  { id: 'gym1', name: 'Кормарова',  login: 'gym1', password_hash: PIN_HASH },
  { id: 'gym2', name: 'Олімпієць',  login: 'gym2', password_hash: PIN_HASH },
];

const WORKERS = [
  { id: W.g1_admin,     gym_id: 'gym1', name: 'Іваненко Олена',    role: 'admin',     password_hash: PIN_HASH },
  { id: W.g1_reception, gym_id: 'gym1', name: 'Петренко Сергій',   role: 'reception', password_hash: PIN_HASH },
  { id: W.g1_trainer,   gym_id: 'gym1', name: 'Сидоренко Андрій',  role: 'trainer',   password_hash: PIN_HASH },
  { id: W.g2_admin,     gym_id: 'gym2', name: 'Коваленко Марина',  role: 'admin',     password_hash: PIN_HASH },
  { id: W.g2_reception, gym_id: 'gym2', name: 'Мельник Тарас',     role: 'reception', password_hash: PIN_HASH },
];

const CLIENTS = [
  { id: C1.koval,  gym_id: 'gym1', code: '1000001', last_name: 'Коваль',    first_name: 'Микола',   middle_name: 'Петрович',    phone: '+380991234501', email: 'koval@gmail.com',     birth_date: '1990-05-12', gender: 'male',   goal: 'Схуднення',   experience: 'Початківець', source: 'Instagram', created_at: dateOnly(daysAgo(90)) },
  { id: C1.bondar, gym_id: 'gym1', code: '1000002', last_name: 'Бондар',    first_name: 'Олеся',    middle_name: 'Іванівна',    phone: '+380991234502', email: 'bondar@gmail.com',    birth_date: '1995-08-20', gender: 'female', goal: 'Тонус',       experience: 'Середній',    source: 'Реклама',   created_at: dateOnly(daysAgo(60)) },
  { id: C1.shev,   gym_id: 'gym1', code: '1000003', last_name: 'Шевченко',  first_name: 'Дмитро',   middle_name: 'Олексійович', phone: '+380991234503', email: null,                  birth_date: '1988-03-15', gender: 'male',   goal: 'Набір маси',  experience: 'Досвідчений', source: 'Друзі',     created_at: dateOnly(daysAgo(45)) },
  { id: C1.moroz,  gym_id: 'gym1', code: '1000004', last_name: 'Мороз',     first_name: 'Катерина', middle_name: 'Василівна',   phone: '+380991234504', email: 'moroz@ukr.net',       birth_date: '2000-11-02', gender: 'female', goal: 'Здоров\'я',   experience: 'Початківець', source: 'Google',    created_at: dateOnly(daysAgo(30)) },
  { id: C1.lysen,  gym_id: 'gym1', code: '1000005', last_name: 'Лисенко',   first_name: 'Віктор',   middle_name: 'Миколайович', phone: '+380991234505', email: 'lysenko@gmail.com',   birth_date: '1985-07-28', gender: 'male',   goal: 'Схуднення',   experience: 'Середній',    source: 'Instagram', created_at: dateOnly(daysAgo(20)) },
  { id: C1.gryt,   gym_id: 'gym1', code: '1000006', last_name: 'Гриценко',  first_name: 'Юлія',     middle_name: 'Андріївна',   phone: '+380991234506', email: null,                  birth_date: '1998-01-14', gender: 'female', goal: 'Тонус',       experience: 'Початківець', source: 'Друзі',     created_at: dateOnly(daysAgo(10)) },
  { id: C2.panch,  gym_id: 'gym2', code: '2000001', last_name: 'Панченко',  first_name: 'Роман',    middle_name: 'Олегович',    phone: '+380992234501', email: 'panchenko@gmail.com', birth_date: '1992-04-10', gender: 'male',   goal: 'Набір маси',  experience: 'Досвідчений', source: 'Instagram', created_at: dateOnly(daysAgo(80)) },
  { id: C2.tymch,  gym_id: 'gym2', code: '2000002', last_name: 'Тимченко',  first_name: 'Ірина',    middle_name: 'Борисівна',   phone: '+380992234502', email: 'tymchenko@ukr.net',   birth_date: '1997-09-25', gender: 'female', goal: 'Схуднення',   experience: 'Середній',    source: 'Реклама',   created_at: dateOnly(daysAgo(50)) },
  { id: C2.ostap,  gym_id: 'gym2', code: '2000003', last_name: 'Остапенко', first_name: 'Олексій',  middle_name: 'Сергійович',  phone: '+380992234503', email: null,                  birth_date: '1991-12-03', gender: 'male',   goal: 'Здоров\'я',   experience: 'Початківець', source: 'Друзі',     created_at: dateOnly(daysAgo(25)) },
];

const SUBSCRIPTIONS = [
  // gym1 active subs
  { id: 'eeeeeeee-0001-0001-0001-000000000001', gym_id: 'gym1', client_id: C1.koval,  type: 'unlimited', category: 'gym', label: 'Безліміт (1 міс.)', start_date: dateOnly(daysAgo(20)), end_date: dateOnly(daysAgo(-10)), total_visits: null, used_visits: 0, status: 'active',    price: 1200, duration_days: 30, purchased_at: daysAgo(20), activated_at: daysAgo(20), created_at: daysAgo(20) },
  { id: 'eeeeeeee-0001-0001-0001-000000000002', gym_id: 'gym1', client_id: C1.bondar, type: 'visits',    category: 'gym', label: '10 відвідувань',    start_date: dateOnly(daysAgo(30)), end_date: dateOnly(daysAgo(-1)),  total_visits: 10,   used_visits: 4, status: 'active',    price: 900,  duration_days: 30, purchased_at: daysAgo(30), activated_at: daysAgo(30), created_at: daysAgo(30) },
  { id: 'eeeeeeee-0001-0001-0001-000000000003', gym_id: 'gym1', client_id: C1.shev,   type: 'unlimited', category: 'gym', label: 'Безліміт (3 міс.)', start_date: dateOnly(daysAgo(40)), end_date: dateOnly(daysAgo(-50)),total_visits: null, used_visits: 0, status: 'active',    price: 3200, duration_days: 90, purchased_at: daysAgo(40), activated_at: daysAgo(40), created_at: daysAgo(40) },
  { id: 'eeeeeeee-0001-0001-0001-000000000004', gym_id: 'gym1', client_id: C1.moroz,  type: 'visits',    category: 'gym', label: '20 відвідувань',    start_date: dateOnly(daysAgo(15)), end_date: dateOnly(daysAgo(-15)), total_visits: 20,   used_visits: 2, status: 'active',    price: 1600, duration_days: 30, purchased_at: daysAgo(15), activated_at: daysAgo(15), created_at: daysAgo(15) },
  // gym1 expired
  { id: 'eeeeeeee-0001-0001-0001-000000000005', gym_id: 'gym1', client_id: C1.lysen,  type: 'unlimited', category: 'gym', label: 'Безліміт (1 міс.)', start_date: dateOnly(daysAgo(35)), end_date: dateOnly(daysAgo(5)),  total_visits: null, used_visits: 0, status: 'expired',   price: 1200, duration_days: 30, purchased_at: daysAgo(35), activated_at: daysAgo(35), created_at: daysAgo(35) },
  { id: 'eeeeeeee-0001-0001-0001-000000000006', gym_id: 'gym1', client_id: C1.koval,  type: 'unlimited', category: 'gym', label: 'Безліміт (1 міс.)', start_date: dateOnly(daysAgo(55)), end_date: dateOnly(daysAgo(25)), total_visits: null, used_visits: 0, status: 'expired',   price: 1200, duration_days: 30, purchased_at: daysAgo(55), activated_at: daysAgo(55), created_at: daysAgo(55) },
  // gym1 purchased (not yet activated)
  { id: 'eeeeeeee-0001-0001-0001-000000000007', gym_id: 'gym1', client_id: C1.lysen,  type: 'unlimited', category: 'gym', label: 'Безліміт (1 міс.)', start_date: null, end_date: null, total_visits: null, used_visits: 0, status: 'purchased', price: 1200, duration_days: 30, purchased_at: daysAgo(2), activated_at: null, created_at: daysAgo(2) },
  { id: 'eeeeeeee-0001-0001-0001-000000000008', gym_id: 'gym1', client_id: C1.koval,  type: 'visits',    category: 'group', label: '12 групових занять', start_date: null, end_date: null, total_visits: 12,  used_visits: 0, status: 'purchased', price: 1500, duration_days: 30, purchased_at: daysAgo(1), activated_at: null, created_at: daysAgo(1) },
  // gym2
  { id: 'eeeeeeee-0002-0002-0002-000000000001', gym_id: 'gym2', client_id: C2.panch,  type: 'unlimited', category: 'gym', label: 'Безліміт (1 міс.)', start_date: dateOnly(daysAgo(10)), end_date: dateOnly(daysAgo(-20)),total_visits: null, used_visits: 0, status: 'active',    price: 1200, duration_days: 30, purchased_at: daysAgo(10), activated_at: daysAgo(10), created_at: daysAgo(10) },
  { id: 'eeeeeeee-0002-0002-0002-000000000002', gym_id: 'gym2', client_id: C2.tymch,  type: 'visits',    category: 'gym', label: '10 відвідувань',    start_date: dateOnly(daysAgo(20)), end_date: dateOnly(daysAgo(-10)), total_visits: 10,   used_visits: 6, status: 'active',    price: 900,  duration_days: 30, purchased_at: daysAgo(20), activated_at: daysAgo(20), created_at: daysAgo(20) },
];

const VISITS = [
  // gym1 — зараз у залі
  { id: 'ffffffff-0001-0001-0001-000000000001', gym_id: 'gym1', client_id: C1.koval,  subscription_id: 'eeeeeeee-0001-0001-0001-000000000001', entered_at: daysAgo(0), exited_at: null },
  { id: 'ffffffff-0001-0001-0001-000000000002', gym_id: 'gym1', client_id: C1.shev,   subscription_id: 'eeeeeeee-0001-0001-0001-000000000003', entered_at: daysAgo(0), exited_at: null },
  // gym1 — завершені
  { id: 'ffffffff-0001-0001-0001-000000000003', gym_id: 'gym1', client_id: C1.koval,  subscription_id: 'eeeeeeee-0001-0001-0001-000000000001', entered_at: daysAgo(2), exited_at: daysAgo(2) },
  { id: 'ffffffff-0001-0001-0001-000000000004', gym_id: 'gym1', client_id: C1.bondar, subscription_id: 'eeeeeeee-0001-0001-0001-000000000002', entered_at: daysAgo(2), exited_at: daysAgo(2) },
  { id: 'ffffffff-0001-0001-0001-000000000005', gym_id: 'gym1', client_id: C1.shev,   subscription_id: 'eeeeeeee-0001-0001-0001-000000000003', entered_at: daysAgo(3), exited_at: daysAgo(3) },
  { id: 'ffffffff-0001-0001-0001-000000000006', gym_id: 'gym1', client_id: C1.moroz,  subscription_id: 'eeeeeeee-0001-0001-0001-000000000004', entered_at: daysAgo(4), exited_at: daysAgo(4) },
  { id: 'ffffffff-0001-0001-0001-000000000007', gym_id: 'gym1', client_id: C1.bondar, subscription_id: 'eeeeeeee-0001-0001-0001-000000000002', entered_at: daysAgo(5), exited_at: daysAgo(5) },
  // gym2 — зараз у залі
  { id: 'ffffffff-0002-0002-0002-000000000001', gym_id: 'gym2', client_id: C2.panch,  subscription_id: 'eeeeeeee-0002-0002-0002-000000000001', entered_at: daysAgo(0), exited_at: null },
  // gym2 — завершені
  { id: 'ffffffff-0002-0002-0002-000000000002', gym_id: 'gym2', client_id: C2.tymch,  subscription_id: 'eeeeeeee-0002-0002-0002-000000000002', entered_at: daysAgo(1), exited_at: daysAgo(1) },
  { id: 'ffffffff-0002-0002-0002-000000000003', gym_id: 'gym2', client_id: C2.panch,  subscription_id: 'eeeeeeee-0002-0002-0002-000000000001', entered_at: daysAgo(3), exited_at: daysAgo(3) },
];

const PAYMENTS = [
  { id: 'dddddddd-0001-0001-0001-000000000001', gym_id: 'gym1', client_id: C1.koval,  date: daysAgo(55), amount: 1200, type: 'subscription', label: 'Безліміт (1 міс.)', worker_id: W.g1_reception, worker_name: 'Петренко Сергій', method: 'cash' },
  { id: 'dddddddd-0001-0001-0001-000000000002', gym_id: 'gym1', client_id: C1.koval,  date: daysAgo(20), amount: 1200, type: 'subscription', label: 'Безліміт (1 міс.)', worker_id: W.g1_reception, worker_name: 'Петренко Сергій', method: 'card' },
  { id: 'dddddddd-0001-0001-0001-000000000003', gym_id: 'gym1', client_id: C1.bondar, date: daysAgo(30), amount: 900,  type: 'subscription', label: '10 відвідувань',    worker_id: W.g1_reception, worker_name: 'Петренко Сергій', method: 'cash' },
  { id: 'dddddddd-0001-0001-0001-000000000004', gym_id: 'gym1', client_id: C1.shev,   date: daysAgo(40), amount: 3200, type: 'subscription', label: 'Безліміт (3 міс.)', worker_id: W.g1_admin,     worker_name: 'Іваненко Олена',  method: 'cash' },
  { id: 'dddddddd-0001-0001-0001-000000000005', gym_id: 'gym1', client_id: C1.moroz,  date: daysAgo(15), amount: 1600, type: 'subscription', label: '20 відвідувань',    worker_id: W.g1_reception, worker_name: 'Петренко Сергій', method: 'card' },
  { id: 'dddddddd-0001-0001-0001-000000000006', gym_id: 'gym1', client_id: C1.lysen,  date: daysAgo(35), amount: 1200, type: 'subscription', label: 'Безліміт (1 міс.)', worker_id: W.g1_reception, worker_name: 'Петренко Сергій', method: 'cash' },
  { id: 'dddddddd-0001-0001-0001-000000000007', gym_id: 'gym1', client_id: C1.gryt,   date: daysAgo(10), amount: 150,  type: 'single',        label: 'Разовий вхід',      worker_id: W.g1_reception, worker_name: 'Петренко Сергій', method: 'cash' },
  { id: 'dddddddd-0001-0001-0001-000000000008', gym_id: 'gym1', client_id: C1.koval,  date: daysAgo(8),  amount: 100,  type: 'card_replace',  label: 'Заміна картки',     worker_id: W.g1_reception, worker_name: 'Петренко Сергій', method: 'cash' },
  { id: 'dddddddd-0002-0002-0002-000000000001', gym_id: 'gym2', client_id: C2.panch,  date: daysAgo(10), amount: 1200, type: 'subscription', label: 'Безліміт (1 міс.)', worker_id: W.g2_reception, worker_name: 'Мельник Тарас',   method: 'cash' },
  { id: 'dddddddd-0002-0002-0002-000000000002', gym_id: 'gym2', client_id: C2.tymch,  date: daysAgo(20), amount: 900,  type: 'subscription', label: '10 відвідувань',    worker_id: W.g2_reception, worker_name: 'Мельник Тарас',   method: 'card' },
];

// ─── runner ───────────────────────────────────────────────────────────────────

async function seed() {
  await sequelize.authenticate();
  console.log('DB connected.');

  await Payment.destroy({ where: {} });
  await Visit.destroy({ where: {} });
  await Subscription.destroy({ where: {} });
  await Client.destroy({ where: {} });
  await Worker.destroy({ where: {} });
  await Gym.destroy({ where: {} });
  console.log('Tables cleared.');

  await Gym.bulkCreate(GYMS);
  await Worker.bulkCreate(WORKERS);
  await Client.bulkCreate(CLIENTS);
  await Subscription.bulkCreate(SUBSCRIPTIONS);
  await Visit.bulkCreate(VISITS);
  await Payment.bulkCreate(PAYMENTS);

  console.log('\n=== SEED COMPLETED ===\n');
  console.log('--- Gym login (POST /auth/gym-login) ---');
  console.log('gym1 (Кормарова):  login=gym1  password=1234');
  console.log('gym2 (Олімпієць):  login=gym2  password=1234\n');
  console.log('--- Worker login (POST /auth/worker-login) ---');
  console.log(`gym1 — Іваненко Олена (admin):        worker_id=${W.g1_admin}     pin=1234`);
  console.log(`gym1 — Петренко Сергій (reception):   worker_id=${W.g1_reception}  pin=1234`);
  console.log(`gym1 — Сидоренко Андрій (trainer):    worker_id=${W.g1_trainer}    pin=1234`);
  console.log(`gym2 — Коваленко Марина (admin):       worker_id=${W.g2_admin}     pin=1234`);
  console.log(`gym2 — Мельник Тарас (reception):      worker_id=${W.g2_reception}  pin=1234`);

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
