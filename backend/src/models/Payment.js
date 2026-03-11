const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  gym_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('subscription', 'single', 'card_replace'),
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  worker_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  worker_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('cash', 'card'),
    allowNull: false,
  },
}, {
  tableName: 'payments',
  timestamps: false,
});

module.exports = Payment;
