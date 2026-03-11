const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TelegramSession = sequelize.define('TelegramSession', {
  telegram_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  gym_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
}, {
  tableName: 'telegram_sessions',
  timestamps: false,
});

module.exports = TelegramSession;
