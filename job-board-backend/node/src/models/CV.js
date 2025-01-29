const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const CV = sequelize.define('CV', {
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

User.hasMany(CV, { foreignKey: 'userId' });
CV.belongsTo(User, { foreignKey: 'userId' });

module.exports = CV;
