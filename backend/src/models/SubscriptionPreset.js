const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubscriptionPreset = sequelize.define('SubscriptionPreset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  gym_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('unlimited', 'visits'),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('gym', 'group'),
    allowNull: false,
    defaultValue: 'gym',
  },
  duration_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_visits: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'subscription_presets',
  timestamps: false,
});

module.exports = SubscriptionPreset;
