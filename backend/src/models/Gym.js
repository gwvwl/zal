const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Gym = sequelize.define('Gym', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  login: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'gyms',
  timestamps: false,
});

module.exports = Gym;
