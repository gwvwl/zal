require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/db');
const TelegramSession = require('./src/bot/session');
const { createBot } = require('./src/bot');

const PORT = process.env.PORT || 3001;

sequelize
  .authenticate()
  .then(async () => {
    console.log('Database connected.');

    // Create telegram_sessions table if not exists
    await TelegramSession.sync({ force: false });

    // Launch Telegram bot (no-op if BOT_TOKEN not set)
    const bot = createBot();
    if (bot) {
      bot.launch().then(() => console.log('[Bot] Telegram bot launched.'));
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    }

    app.listen(PORT, () => {
      console.log(`ZAL Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to database:', err.message);
    process.exit(1);
  });
