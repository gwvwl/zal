const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Subscription = sequelize.define('Subscription', {
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
  type: {
    type: DataTypes.ENUM('unlimited', 'visits'),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'gym',
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  total_visits: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  used_visits: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('purchased', 'active', 'expired', 'frozen', 'cancelled'),
    allowNull: false,
    defaultValue: 'purchased',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  duration_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  duration_months: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  frozen_from: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  frozen_to: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  purchased_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  activated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  allowed_gyms: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'subscriptions',
  timestamps: false,
});

module.exports = Subscription;
