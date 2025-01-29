const app = require('./app'); 
const sequelize = require('./src/config/database');
require('dotenv').config();

app.get('/', (req, res) => {
    res.send('Job Board Backend is running!');
});

const PORT = 5000;
if (process.env.NODE_ENV !== 'test') { // Evită să pornești serverul în timpul testelor
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
}

//sequelize.sync({ force: true })
//  .then(() => {
//    console.log('Database reset and synchronized!');
//  })
//  .catch((err) => {
//    console.error('Error resetting database:', err);
//  });

sequelize
  .sync() // Modifică schema fără a șterge datele existente
  .then(() => console.log('Database synchronized'))
  .catch((err) => console.error('Error synchronizing database:', err));

