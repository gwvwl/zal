'use strict';

/**
 * Імпорт даних з 1С → БД ZAL
 *
 * Запуск: npm run seed:1c
 * Файл export_1c.json повинен лежати в корені backend/
 *
 * Маппінг:
 *   subscription_types  → subscription_presets
 *   clients             → clients  (фото зберігаються в uploads/)
 *   subscription_topups → subscriptions  (реальні продажі абонементів)
 *   subscription_topups → payments       (оплата за абонемент)
 *   visits              → visits
 *   opening_balances    → payments (type='subscription', label='Ввод залишків')
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs   = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// ─── Налаштування ─────────────────────────────────────────────────────────────
const JSON_FILE    = path.join(__dirname, '../export_1c.json');
const UPLOADS_DIR  = path.join(__dirname, '../uploads');
const BATCH_SIZE   = 300;

// Placeholder для worker_id / worker_name у payments (1С не зберігає касира)
const SYSTEM_WORKER_ID   = '00000000-0000-0000-0000-000000000001';
const SYSTEM_WORKER_NAME = '1С Імпорт';

const NOW = new Date();

// ─── Визначення категорії по назві типу абонемента ────────────────────────────
function detectCategory(label = '') {
  const l = label.toLowerCase();
  if (/ящик|шкафчик|locker/.test(l))                return 'locker';
  if (/мма|mma/.test(l))                            return 'mma';
  if (/самбо|sambo/.test(l))                        return 'sambo';
  if (/грэпплинг|grappling/.test(l))                return 'grappling';
  if (/стретчинг|stretching/.test(l))               return 'stretching';
  if (/бокс(?!ёр)|boxing/.test(l))                  return 'boxing';
  if (/карат|karate/.test(l))                       return 'karate';
  if (/аренда|rental/.test(l))                      return 'rental';
  if (/разов|single|разовое/.test(l))               return 'single';
  return 'gym';
}

// ─── Визначення формату зображення за magic bytes ─────────────────────────────
function detectImageExt(buf) {
  if (buf[0] === 0xFF && buf[1] === 0xD8) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E) return 'png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  if (buf[0] === 0x42 && buf[1] === 0x4D) return 'bmp';
  return 'jpg';
}

function decodePhoto(raw) {
  const base64 = raw.includes(',') ? raw.split(',')[1] : raw;
  return Buffer.from(base64.replace(/\s/g, ''), 'base64');
}

// ─── Хелпери ──────────────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  // "31.01.2021 9:13:03" → "2021-01-31 09:13:03"
  if (str.includes('.')) {
    const [datePart, timePart = '00:00:00'] = str.split(' ');
    const [d, m, y] = datePart.split('.');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${timePart.padStart(8, '0')}`;
  }
  return str || null;
}

function parseGender(val) {
  if (!val) return null;
  const v = val.trim().toLowerCase();
  if (v === 'мужской' || v === 'муж' || v === 'м' || v === 'male') return 'male';
  if (v === 'женский' || v === 'жен' || v === 'ж' || v === 'female') return 'female';
  return null;
}

async function batchInsert(db, table, columns, rows) {
  if (rows.length === 0) return;
  const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
  const values = rows.flat();
  await db.execute(
    `INSERT IGNORE INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES ${placeholders}`,
    values,
  );
}

async function insertInBatches(db, table, columns, allRows) {
  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    await batchInsert(db, table, columns, allRows.slice(i, i + BATCH_SIZE));
  }
}

// ─── Головний скрипт ──────────────────────────────────────────────────────────
(async () => {
  // 1. Підключення до БД
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'zal_db',
    charset:  'utf8mb4',
    multipleStatements: false,
  });
  console.log('Підключено до БД.');

  // 2. Отримуємо gym_id з першого залу
  const [[firstGym]] = await db.execute('SELECT id FROM gyms LIMIT 1');
  if (!firstGym) throw new Error('Не знайдено жодного залу в таблиці gyms. Спочатку створіть зал.');
  const GYM_ID = firstGym.id;
  console.log(`gym_id = ${GYM_ID}`);

  // 3. Чистимо клієнтські таблиці (з урахуванням FK-порядку)
  console.log('\nЧистимо старі дані...');
  await db.execute('SET FOREIGN_KEY_CHECKS = 0');
  await db.execute('TRUNCATE TABLE payments');
  await db.execute('TRUNCATE TABLE visits');
  await db.execute('TRUNCATE TABLE subscriptions');
  await db.execute('TRUNCATE TABLE clients');
  await db.execute('TRUNCATE TABLE subscription_presets');
  await db.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('  → Таблиці очищено.');

  // 4. Читаємо JSON (500 МБ — потрібен --max-old-space-size=4096)
  console.log('\nЧитаємо export_1c.json...');
  const raw  = fs.readFileSync(JSON_FILE, 'utf8');
  const data = JSON.parse(raw);
  console.log('JSON завантажено.');

  // 5. Папка для фото
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // ── 0. Будуємо Map: clientId → ШтрихКод ────────────────────────────────────
  // subscriptions — довідник карток (id → ШтрихКод)
  // subscription_topups — продажі (Абонемент → картка, Клиент → клієнт)
  const cardBarcodeMap = new Map();
  for (const s of (data.subscriptions || [])) {
    const barcode = (s['ШтрихКод'] || '').trim();
    // Фільтруємо сміттєві значення (пусті, нулі, занадто короткі)
    if (barcode && barcode.replace(/0/g, '').length > 0 && barcode.length >= 6) {
      cardBarcodeMap.set(s.id, barcode);
    }
  }
  const clientBarcodeMap = new Map();
  for (const t of (data.subscription_topups || [])) {
    const clientId = t['Клиент'] || null;
    const cardId   = t['Абонемент'] || null;
    if (clientId && cardId && cardBarcodeMap.has(cardId) && !clientBarcodeMap.has(clientId)) {
      clientBarcodeMap.set(clientId, cardBarcodeMap.get(cardId));
    }
  }
  console.log(`Штрихкоди: ${clientBarcodeMap.size} клієнтів з ${(data.clients || []).length} мають ШтрихКод`);

  // ── A. subscription_types → subscription_presets ───────────────────────────
  console.log('\n[1/5] subscription_presets...');
  const typeMap = {}; // id → { type, category, label, duration_days, total_visits }

  const presetRows = (data.subscription_types || []).map(t => {
    const label    = (t.name || '').trim();
    const category = detectCategory(label);
    // Спортзал — завжди unlimited, total_visits тільки для групових
    const isGym    = category === 'gym';
    const subType  = isGym ? 'unlimited' : (t.Безлимитный ? 'unlimited' : 'visits');
    const totalV   = isGym ? null : (t.КоличествоЗанятий ?? null);
    typeMap[t.id] = {
      type:          subType,
      category,
      label,
      duration_days: t.СрокДействия      ?? null,
      total_visits:  totalV,
    };
    return [
      t.id,
      GYM_ID,
      label || 'Абонемент',
      subType,
      category,
      t.СрокДействия      ?? 30,
      0,                            // price — не зберігається в 1С
      totalV,
      t.Актуальный ? 1 : 0,
    ];
  });

  await insertInBatches(db, 'subscription_presets',
    ['id', 'gym_id', 'label', 'type', 'category', 'duration_days', 'price', 'total_visits', 'is_active'],
    presetRows,
  );
  console.log(`  → ${presetRows.length} записів`);

  // ── B. clients ─────────────────────────────────────────────────────────────
  console.log('\n[2/5] clients...');
  let photoSaved = 0;
  const clientRows = [];

  for (const c of (data.clients || [])) {
    let photoPath = null;

    if (c.Фотография && c.Фотография.length > 50) {
      try {
        const buffer   = decodePhoto(c.Фотография);
        const ext      = detectImageExt(buffer);
        const filename = `${c.id}.${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
        photoPath = `/uploads/${filename}`;
        photoSaved++;
      } catch (_) { /* пропускаємо пошкоджені фото */ }
    }

    const phone = (c.Телефоны || '').trim().replace(/\s+/g, '') || null;

    clientRows.push([
      c.id,
      GYM_ID,
      clientBarcodeMap.get(c.id) || null,                 // code = ШтрихКод з картки абонемента
      (c.Фамилия  || '').trim() || null,
      (c.Имя      || '').trim() || null,
      (c.Отчество || '').trim() || null,
      phone,
      (c.ЭлПочта  || '').trim() || null,
      parseDate(c.ДатаРождения)?.slice(0, 10) || null,
      parseGender(c.Пол),
      (c.Комментарий || '').trim() || null,
      null,                                               // experience
      '1С',                                               // source
      parseDate(c.ДатаРегистрации)?.slice(0, 10) || NOW.toISOString().slice(0, 10),
      photoPath,
    ]);
  }

  await insertInBatches(db, 'clients',
    ['id', 'gym_id', 'code', 'last_name', 'first_name', 'middle_name',
     'phone', 'email', 'birth_date', 'gender', 'goal', 'experience',
     'source', 'created_at', 'photo'],
    clientRows,
  );
  console.log(`  → ${clientRows.length} клієнтів, фото збережено: ${photoSaved}`);

  // ── C. subscription_topups → subscriptions ─────────────────────────────────
  // Кожен топап = один проданий абонемент прив'язаний до клієнта
  console.log('\n[3/5] subscriptions (з subscription_topups)...');

  const subRows = (data.subscription_topups || [])
    .filter(t => t.posted && t.Клиент)
    .map(t => {
      const tInfo    = typeMap[t.ТипАбонемента] || {};
      const endDate  = parseDate(t.ДатаОкончанияДействияАбонемента)?.slice(0, 10) || null;
      const status   = endDate && new Date(endDate) > NOW ? 'active' : 'expired';
      const category = tInfo.category || detectCategory(tInfo.label || '');
      // Спортзал — завжди unlimited, total_visits тільки для групових
      const isGym    = category === 'gym';
      const totalVisits = isGym ? null : (t.КоличествоЗанятий ?? tInfo.total_visits ?? null);
      const subType  = isGym ? 'unlimited' : (totalVisits ? 'visits' : (tInfo.type || 'unlimited'));

      return [
        t.id,
        GYM_ID,
        t.Клиент,
        subType,
        category,
        tInfo.label    || 'Абонемент',
        parseDate(t.date)?.slice(0, 10) || null,          // start_date = дата продажу
        endDate,
        totalVisits,
        0,                                                 // used_visits
        status,
        Number(t.Сумма) || 0,                             // price з топапа
        tInfo.duration_days ?? null,
        null,                                              // frozen_from
        null,                                              // frozen_to
        parseDate(t.date) || NOW,                          // purchased_at
        parseDate(t.date) || NOW,                          // activated_at
        parseDate(t.date) || NOW,                          // created_at
      ];
    });

  // For lockers: keep only the latest per client as expired, cancel the rest
  // (clients may have 10+ overdue locker records from 1C — no need to dismiss each manually)
  const latestLockerByClient = {}; // clientId -> index of latest locker row
  subRows.forEach((row, i) => {
    const clientId = row[2];
    const category = row[4];
    const endDate  = row[7] || '0000-00-00';
    if (category !== 'locker') return;
    const prev = latestLockerByClient[clientId];
    if (prev === undefined || endDate > (subRows[prev][7] || '0000-00-00')) {
      latestLockerByClient[clientId] = i;
    }
  });
  subRows.forEach((row, i) => {
    const clientId = row[2];
    const category = row[4];
    if (category !== 'locker') return;
    if (latestLockerByClient[clientId] !== i) row[10] = 'cancelled'; // cancel all but latest
  });
  const cancelledLockers = subRows.filter(r => r[4] === 'locker' && r[10] === 'cancelled').length;
  if (cancelledLockers > 0) console.log(`  → Скасовано старих ящиків: ${cancelledLockers}`);

  await insertInBatches(db, 'subscriptions',
    ['id', 'gym_id', 'client_id', 'type', 'category', 'label',
     'start_date', 'end_date', 'total_visits', 'used_visits', 'status',
     'price', 'duration_days', 'frozen_from', 'frozen_to',
     'purchased_at', 'activated_at', 'created_at'],
    subRows,
  );
  console.log(`  → ${subRows.length} записів`);

  // ── D. visits ──────────────────────────────────────────────────────────────
  console.log('\n[4/5] visits...');
  const visitRows = (data.visits || [])
    .filter(v => v.Клиент)
    .map(v => [
      v.id,
      GYM_ID,
      v.Клиент,
      v.Абонемент || null,
      parseDate(v.date) || NOW,
      null,                          // exited_at — немає у 1С
    ]);

  await insertInBatches(db, 'visits',
    ['id', 'gym_id', 'client_id', 'subscription_id', 'entered_at', 'exited_at'],
    visitRows,
  );
  console.log(`  → ${visitRows.length} записів`);

  // ── E. payments ────────────────────────────────────────────────────────────
  // subscription_topups: оплата за абонемент (той самий id що й subscription)
  // opening_balances:    ввід залишків
  console.log('\n[5/5] payments...');

  const topupPayRows = (data.subscription_topups || [])
    .filter(t => t.posted && t.Клиент && t.Сумма)
    .map(t => {
      const tInfo = typeMap[t.ТипАбонемента] || {};
      const payType = tInfo.category === 'locker' ? 'locker' : 'subscription';
      return [
        t.id,
        GYM_ID,
        t.Клиент,
        parseDate(t.date) || NOW,
        Number(t.Сумма) || 0,
        payType,
        tInfo.label || 'Абонемент (1С)',
        SYSTEM_WORKER_ID,
        SYSTEM_WORKER_NAME,
        'cash',
      ];
    });

  const balanceRows = (data.opening_balances || [])
    .filter(b => b.Клиент && b.Сумма)
    .map(b => [
      b.id,
      GYM_ID,
      b.Клиент,
      parseDate(b.date) || NOW,
      Number(b.Сумма) || 0,
      'subscription',
      'Ввод залишків (1С)',
      SYSTEM_WORKER_ID,
      SYSTEM_WORKER_NAME,
      'cash',
    ]);

  const allPaymentRows = [...topupPayRows, ...balanceRows];
  await insertInBatches(db, 'payments',
    ['id', 'gym_id', 'client_id', 'date', 'amount', 'type',
     'label', 'worker_id', 'worker_name', 'method'],
    allPaymentRows,
  );
  console.log(`  → ${allPaymentRows.length} записів (${topupPayRows.length} оплат + ${balanceRows.length} залишків)`);

  await db.end();
  console.log('\nІмпорт завершено успішно!');
})().catch(err => {
  console.error('\nПомилка імпорту:', err.message);
  process.exit(1);
});
