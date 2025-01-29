const redis = require('redis');

const redisClient = redis.createClient({
  url: 'redis://localhost:6380', 
});

redisClient.on('connect', () => {
  console.log('Conexiune stabilită cu Redis!');
});

redisClient.on('error', (err) => {
  console.error('Eroare Redis:', err);
});
console.log('Redis client initialized:', redisClient.connect);
redisClient.connect();

module.exports = redisClient;