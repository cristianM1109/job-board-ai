const redisClient = require('../../redis.js'); 

const invalidateCache = async (userId, keysToInvalidate) => {
    try {
      for (const key of keysToInvalidate) {
        await redisClient.del(key);
        console.log(`Cache invalidat pentru cheia: ${key}`);
      }
    } catch (error) {
      console.error('Eroare la invalidarea cache-ului:', error.message);
    }
  };
  
  module.exports = { invalidateCache };