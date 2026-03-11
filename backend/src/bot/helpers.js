function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-9);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('uk-UA');
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('uk-UA') +
    ' ' +
    d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  );
}

function formatMoney(val) {
  return Number(val).toLocaleString('uk-UA') + ' грн';
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function pluralVisits(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'людина';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'людини';
  return 'людей';
}

module.exports = { normalizePhone, formatDate, formatDateTime, formatMoney, daysUntil, pluralVisits };
