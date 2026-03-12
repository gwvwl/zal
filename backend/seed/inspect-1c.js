'use strict';
/**
 * Діагностика структури export_1c.json
 * Запуск: node seed/inspect-1c.js
 *
 * Виводить: назви полів, типи, приклади значень для кожної секції
 */

const fs   = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, '../export_1c.json');

console.log('Читаємо файл...');
const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

function inspect(sectionName, items, sampleCount = 2) {
  const arr = items || [];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${sectionName}  (всього: ${arr.length} записів)`);
  console.log('='.repeat(60));

  if (arr.length === 0) {
    console.log('  (порожньо)');
    return;
  }

  // Збираємо всі унікальні ключі з перших 10 записів
  const keys = [...new Set(arr.slice(0, 10).flatMap(Object.keys))];

  // Для кожного ключа показуємо тип і приклад
  for (const key of keys) {
    const samples = arr.slice(0, sampleCount)
      .map(item => {
        const val = item[key];
        if (val === null || val === undefined) return 'null';
        if (typeof val === 'string' && val.length > 60) return `"${val.slice(0, 40)}..." (${val.length} chars)`;
        if (typeof val === 'string') return `"${val}"`;
        return JSON.stringify(val);
      })
      .join('  |  ');
    console.log(`  ${key.padEnd(30)} ${samples}`);
  }
}

const sections = [
  'clients',
  'subscription_types',
  'subscriptions',
  'visits',
  'subscription_topups',
  'opening_balances',
];

for (const s of sections) {
  inspect(s, data[s]);
}

// Додатково: перевіряємо чи є штрихкоди
const subs = data.subscriptions || [];
const withBarcode = subs.filter(s => {
  return Object.values(s).some(v => typeof v === 'string' && /^\d{6,}$/.test(v));
});
console.log(`\n>>> Абонементів з числовим полем (схожим на штрихкод): ${withBarcode.length}`);
if (withBarcode.length > 0) {
  console.log('  Приклад:', JSON.stringify(withBarcode[0], null, 2).slice(0, 400));
}

// Перевіряємо ключі верхнього рівня JSON
console.log('\n>>> Ключі верхнього рівня JSON:', Object.keys(data).join(', '));

// ── Перевірка: скільки клієнтів можна зіставити з ШтрихКод ──────────────────
// subscriptions — довідник карток (id → ШтрихКод)
// subscription_topups — продажі (Клиент + Абонемент → зв'язок клієнта з карткою)
console.log('\n' + '='.repeat(60));
console.log('  ПЕРЕВІРКА: ШтрихКод → code клієнта');
console.log('='.repeat(60));

// Показуємо поля першого topup щоб знайти поле-посилання на картку абонемента
const topups = data.subscription_topups || [];
if (topups.length > 0) {
  console.log('\nПоля першого subscription_topups:');
  console.log(JSON.stringify(topups[0], null, 2));
}

// Map: subscriptionCardId → ШтрихКод
const cardBarcodeMap = new Map();
for (const s of (data.subscriptions || [])) {
  const barcode = s['ШтрихКод'] || s['name'] || null;
  if (barcode) cardBarcodeMap.set(s.id, barcode);
}

// Map: clientId → ШтрихКод  (через topup.Абонемент або інше поле посилання)
const clientBarcodeMap = new Map();
for (const t of topups) {
  const clientId = t['Клиент'] || t['_Клиент'] || null;
  // Поле що посилається на картку абонемента — перебираємо варіанти
  const cardId = t['Абонемент'] || t['_Абонемент'] || t['subscription'] || t['subscription_id'] || null;
  if (clientId && cardId && cardBarcodeMap.has(cardId) && !clientBarcodeMap.has(clientId)) {
    clientBarcodeMap.set(clientId, cardBarcodeMap.get(cardId));
  }
}

const clients = data.clients || [];
let matched = 0;
let noBarcode = 0;

for (const c of clients) {
  if (clientBarcodeMap.has(c.id)) matched++;
  else noBarcode++;
}

console.log(`\nКарток абонементів (subscriptions): ${cardBarcodeMap.size}`);
console.log(`Клієнтів у топапах з карткою:       ${clientBarcodeMap.size}`);
console.log(`\nВсього клієнтів:          ${clients.length}`);
console.log(`З ШтрихКод (знайшли):     ${matched}`);
console.log(`Без ШтрихКод:             ${noBarcode}`);
console.log(`Покриття:                 ${clients.length ? ((matched / clients.length) * 100).toFixed(1) : 0}%`);

// Показуємо кілька прикладів зіставлення
if (matched > 0) {
  console.log('\nПриклади зіставлення (перші 5):');
  let count = 0;
  for (const c of clients) {
    if (clientBarcodeMap.has(c.id) && count < 5) {
      console.log(`  client.id=${c.id}  client.code(1С)=${c.code}  →  ШтрихКод=${clientBarcodeMap.get(c.id)}`);
      count++;
    }
  }
}

console.log('\nГотово.');
