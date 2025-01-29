const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('job_board', 'postgres', '0000', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432, // Portul default al PostgreSQL
});

sequelize.authenticate()
    .then(() => console.log('✅ Connected to PostgreSQL'))
    .catch(err => console.error('❌     :', err));

module.exports = sequelize;