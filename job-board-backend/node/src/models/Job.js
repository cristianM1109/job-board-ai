const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); 

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.STRING, // ID-ul este string
    primaryKey: true, // Definim cheia primară
  },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  company: DataTypes.STRING,
  location: DataTypes.STRING,
  salary: DataTypes.FLOAT,
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  employmentType: DataTypes.STRING, // Tipul de angajare
  remote: DataTypes.BOOLEAN, // Dacă este remote
  logo: DataTypes.STRING, // URL-ul logo-ului companiei
  url: DataTypes.STRING, // URL-ul jobului
  datePosted: DataTypes.DATE, // Data publicării
  source: DataTypes.STRING, // Sursa jobului
  keywords: DataTypes.ARRAY(DataTypes.STRING), // Lista de cuvinte-cheie
});

User.hasMany(Job, { foreignKey: 'userId' });
Job.belongsTo(User, { foreignKey: 'userId' });

module.exports = Job;
