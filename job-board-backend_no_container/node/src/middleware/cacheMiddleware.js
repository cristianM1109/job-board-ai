const { invalidateCache } = require('../utils/cacheUtils');

const cacheMiddleware = async (req, res, next) => {
  const userId = req.user.id;

  // Chei pentru cache care trebuie invalidate
  const keysToInvalidate = [
    `compatibility_scores_user_${userId}`,
    `keyword_compatibility_scores_user_${userId}`,
  ];

  try {
    // Invalidează cache-ul dacă este necesar
    await invalidateCache(userId, keysToInvalidate);
    next();
  } catch (error) {
    console.error('Eroare în cacheMiddleware:', error.message);
    res.status(500).json({ error: 'Eroare la gestionarea cache-ului.' });
  }
};

const cvCacheMiddleware = async (req, res, next) => {
    const userId = req.user.id;
  
    // Chei pentru cache care trebuie invalidate la schimbarea CV-ului
    const keysToInvalidate = [`recommend_jobs_user_${userId}`];
  
    try {
      await invalidateCache(userId, keysToInvalidate);
      console.log('Cache pentru CV invalidat.');
      next();
    } catch (error) {
      console.error('Eroare în cvCacheMiddleware:', error.message);
      res.status(500).json({ error: 'Eroare la gestionarea cache-ului pentru CV.' });
    }
  };

module.exports = {cacheMiddleware, cvCacheMiddleware};