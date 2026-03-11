const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Visit = sequelize.define('Visit', {
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
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  entered_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  exited_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'visits',
  timestamps: false,
});

module.exports = Visit;
