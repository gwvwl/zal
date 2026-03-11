const { Telegraf, Markup } = require('telegraf');
const { Op } = require('sequelize');
const bwipjs = require('bwip-js');
const { Client, Subscription, Visit, Payment } = require('../models');
const TelegramSession = require('./session');
const {
  normalizePhone,
  formatDate,
  formatDateTime,
  formatMoney,
  daysUntil,
  pluralVisits,
} = require('./helpers');

const MAIN_MENU = Markup.keyboard([
  ['👥 Зараз у залі', '👤 Мій профіль'],
  ['💪 Абонементи', '📅 Відвідування'],
  ['💳 Платежі', '📊 Статистика'],
  ['🪪 Моя картка'],
]).resize();

const STATUS_EMOJI = { active: '✅', purchased: '⏳', frozen: '❄️' };
const TYPE_LABEL = { subscription: 'Абонемент', single: 'Разовий', card_replace: 'Заміна картки' };
const METHOD_EMOJI = { cash: '💵', card: '💳' };

// ── Auth middleware ─────────────────────────────────────────────────────────
async function requireAuth(ctx, next) {
  const session = await TelegramSession.findByPk(ctx.from?.id);
  if (!session) {
    return ctx.reply(
      'Будь ласка, спочатку авторизуйтесь — натисніть /start.',
    );
  }
  ctx.tgSession = session;
  return next();
}

// ── Factory ─────────────────────────────────────────────────────────────────
function createBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.warn('[Bot] BOT_TOKEN not set — Telegram bot disabled.');
    return null;
  }

  const bot = new Telegraf(token);

  // ── /start ──────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    const existing = await TelegramSession.findByPk(ctx.from.id);
    if (existing) {
      const client = await Client.findByPk(existing.client_id);
      if (client) {
        return ctx.reply(`З поверненням, ${client.first_name}! 👋`, MAIN_MENU);
      }
      // session exists but client deleted — clean up
      await TelegramSession.destroy({ where: { telegram_id: ctx.from.id } });
    }

    return ctx.reply(
      `Привіт! 👋 Я бот спортзалу *ZAL*.\n\nПоділіться номером телефону, щоб я міг знайти вас в базі клієнтів.`,
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          [Markup.button.contactRequest('📱 Поділитися номером')],
        ]).resize().oneTime(),
      },
    );
  });

  // ── Contact (авторизація) ───────────────────────────────────────────────
  bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;

    if (contact.user_id !== ctx.from.id) {
      return ctx.reply('Будь ласка, поділіться власним номером телефону.');
    }

    const suffix = normalizePhone(contact.phone_number);

    // In-memory phone matching with normalization (handles any format in DB)
    const allClients = await Client.findAll({
      attributes: ['id', 'gym_id', 'first_name', 'last_name', 'phone'],
    });
    const client = allClients.find(
      (c) => c.phone && normalizePhone(c.phone) === suffix,
    );

    if (!client) {
      return ctx.reply(
        '❌ Клієнта з таким номером не знайдено.\n\nЗверніться до адміністратора спортзалу.',
      );
    }

    await TelegramSession.upsert({
      telegram_id: ctx.from.id,
      client_id: client.id,
      gym_id: client.gym_id,
    });

    return ctx.reply(
      `✅ Авторизація успішна!\n\nВітаємо, *${client.first_name} ${client.last_name}*! 💪`,
      { parse_mode: 'Markdown', ...MAIN_MENU },
    );
  });

  // ── 👥 Зараз у залі ─────────────────────────────────────────────────────
  bot.hears('👥 Зараз у залі', requireAuth, async (ctx) => {
    const count = await Visit.count({
      where: { gym_id: ctx.tgSession.gym_id, exited_at: null },
    });

    const emoji = count === 0 ? '🏜️' : count < 5 ? '🟢' : count < 15 ? '🟡' : '🔴';
    const text =
      count === 0
        ? `${emoji} Зал порожній — відмінний час потренуватися!`
        : `${emoji} Зараз у залі: *${count}* ${pluralVisits(count)}`;

    return ctx.reply(text, { parse_mode: 'Markdown' });
  });

  // ── 👤 Мій профіль ──────────────────────────────────────────────────────
  bot.hears('👤 Мій профіль', requireAuth, async (ctx) => {
    const client = await Client.findByPk(ctx.tgSession.client_id);

    const lines = [
      `👤 *${client.last_name} ${client.first_name}${client.middle_name ? ' ' + client.middle_name : ''}*`,
      '',
    ];
    if (client.phone) lines.push(`📱 ${client.phone}`);
    if (client.email) lines.push(`✉️ ${client.email}`);
    if (client.birth_date) lines.push(`🎂 ${formatDate(client.birth_date)}`);
    if (client.goal) lines.push(`🎯 Мета: ${client.goal}`);
    lines.push(`📅 Клієнт з: ${formatDate(client.created_at)}`);

    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
  });

  // ── 💪 Абонементи ───────────────────────────────────────────────────────
  bot.hears('💪 Абонементи', requireAuth, async (ctx) => {
    const subs = await Subscription.findAll({
      where: {
        client_id: ctx.tgSession.client_id,
        status: { [Op.in]: ['active', 'purchased', 'frozen'] },
      },
      order: [['purchased_at', 'DESC']],
    });

    if (subs.length === 0) {
      return ctx.reply('У вас немає активних або придбаних абонементів.');
    }

    const parts = subs.map((s) => {
      const emoji = STATUS_EMOJI[s.status] || '❓';
      const lines = [`${emoji} *${s.label}*`];

      if (s.status === 'active' && s.end_date) {
        const days = daysUntil(s.end_date);
        const warn = days !== null && days <= 7 ? ' ⚠️' : '';
        lines.push(`   До: ${formatDate(s.end_date)}${warn} _(${days} дн.)_`);
      }
      if (s.status === 'purchased') {
        lines.push(`   Куплено, ще не активовано`);
      }
      if (s.status === 'frozen' && s.frozen_to) {
        lines.push(`   Заморожено до: ${formatDate(s.frozen_to)}`);
      }
      if (s.type === 'visits' && s.total_visits) {
        lines.push(`   Відвідувань: ${s.used_visits}/${s.total_visits}`);
      }

      return lines.join('\n');
    });

    return ctx.reply(parts.join('\n\n'), { parse_mode: 'Markdown' });
  });

  // ── 📅 Відвідування ─────────────────────────────────────────────────────
  bot.hears('📅 Відвідування', requireAuth, async (ctx) => {
    const visits = await Visit.findAll({
      where: { client_id: ctx.tgSession.client_id },
      order: [['entered_at', 'DESC']],
      limit: 15,
    });

    if (visits.length === 0) {
      return ctx.reply('Відвідувань поки немає.');
    }

    const lines = ['📅 *Останні відвідування:*', ''];
    for (const v of visits) {
      if (v.exited_at) {
        const mins = Math.round(
          (new Date(v.exited_at) - new Date(v.entered_at)) / 60000,
        );
        const dur =
          mins >= 60
            ? `${Math.floor(mins / 60)}г ${mins % 60}хв`
            : `${mins}хв`;
        lines.push(`📍 ${formatDateTime(v.entered_at)} (${dur})`);
      } else {
        lines.push(`📍 ${formatDateTime(v.entered_at)} _(зараз у залі)_`);
      }
    }

    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
  });

  // ── 💳 Платежі ──────────────────────────────────────────────────────────
  bot.hears('💳 Платежі', requireAuth, async (ctx) => {
    const payments = await Payment.findAll({
      where: { client_id: ctx.tgSession.client_id },
      order: [['date', 'DESC']],
      limit: 15,
    });

    if (payments.length === 0) {
      return ctx.reply('Платежів поки немає.');
    }

    const lines = ['💳 *Останні платежі:*', ''];
    for (const p of payments) {
      const typeLabel = TYPE_LABEL[p.type] || p.type;
      const methodEmoji = METHOD_EMOJI[p.method] || '';
      lines.push(
        `${methodEmoji} *${formatMoney(p.amount)}* — ${typeLabel}` +
          (p.label ? `\n   _${p.label}_` : '') +
          `\n   ${formatDate(p.date)}`,
      );
    }

    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
  });

  // ── 📊 Статистика ───────────────────────────────────────────────────────
  bot.hears('📊 Статистика', requireAuth, async (ctx) => {
    const clientId = ctx.tgSession.client_id;
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const [totalVisits, monthVisits, completedVisits, totalSpent] =
      await Promise.all([
        Visit.count({ where: { client_id: clientId } }),
        Visit.count({
          where: { client_id: clientId, entered_at: { [Op.gte]: startOfMonth } },
        }),
        Visit.findAll({
          where: { client_id: clientId, exited_at: { [Op.not]: null } },
          attributes: ['entered_at', 'exited_at'],
        }),
        Payment.sum('amount', { where: { client_id: clientId } }),
      ]);

    let avgDur = '—';
    if (completedVisits.length > 0) {
      const totalMins = completedVisits.reduce(
        (sum, v) =>
          sum + (new Date(v.exited_at) - new Date(v.entered_at)) / 60000,
        0,
      );
      const avg = Math.round(totalMins / completedVisits.length);
      avgDur =
        avg >= 60 ? `${Math.floor(avg / 60)}г ${avg % 60}хв` : `${avg}хв`;
    }

    const lines = [
      '📊 *Ваша статистика*',
      '',
      `🏋️ Всього відвідувань: *${totalVisits}*`,
      `📅 Цього місяця: *${monthVisits}*`,
      `⏱️ Середня тривалість: *${avgDur}*`,
      `💰 Витрачено всього: *${formatMoney(totalSpent || 0)}*`,
    ];

    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
  });

  // ── 🪪 Моя картка ───────────────────────────────────────────────────────
  bot.hears('🪪 Моя картка', requireAuth, async (ctx) => {
    const client = await Client.findByPk(ctx.tgSession.client_id);

    if (!client || !client.code) {
      return ctx.reply(
        '❌ Карточка не призначена.\\n\\nЗверніться до адміністратора спортзалу.',
      );
    }

    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: client.code,
      scale: 3,
      height: 20,
      includetext: true,
      textxalign: 'center',
    });

    return ctx.replyWithPhoto(
      { source: png },
      { caption: `🪪 *${client.last_name} ${client.first_name}*`, parse_mode: 'Markdown' },
    );
  });

  // ── Fallback ─────────────────────────────────────────────────────────────
  bot.on('text', async (ctx) => {
    const session = await TelegramSession.findByPk(ctx.from?.id);
    if (session) {
      return ctx.reply('Скористайтесь кнопками меню.', MAIN_MENU);
    }
    return ctx.reply('Натисніть /start для початку.');
  });

  return bot;
}

module.exports = { createBot };
