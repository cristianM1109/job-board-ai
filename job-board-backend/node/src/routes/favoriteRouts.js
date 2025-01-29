const express = require('express');
const { addFavoriteJob, getFavoriteJobs, deleteFavoriteJob } = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

router.post('/favorites', authMiddleware, cacheMiddleware, addFavoriteJob); // Adaugă job la favorite
router.get('/favorites', authMiddleware, getFavoriteJobs); // Obține joburi favorite
router.delete('/favorites/:jobId', authMiddleware, cacheMiddleware, deleteFavoriteJob); // Șterge job din favorite

module.exports = router;
