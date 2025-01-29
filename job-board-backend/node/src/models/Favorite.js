const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Job = require('./Job');
const User = require('./User');

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  jobId: {
    type: DataTypes.STRING, // ID-ul jobului (din API extern sau din baza de date)
    allowNull: false,
  },
});

// Relații
Favorite.belongsTo(User, { foreignKey: 'userId' });
Favorite.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

module.exports = Favorite;