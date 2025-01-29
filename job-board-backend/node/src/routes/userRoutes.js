const express = require('express');
const multer = require('../config/multer');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadCV, getUserCVs, deleteCV } = require('../controllers/fileController');
const {cvCacheMiddleware} = require('../middleware/cacheMiddleware');
const {cacheMiddleware} = require('../middleware/cacheMiddleware');

const router = express.Router();

router.post('/upload-cv', authMiddleware, multer.single('cv'),cvCacheMiddleware, cacheMiddleware, uploadCV);
router.get('/cvs', authMiddleware, getUserCVs);
router.delete('/cvs/:cvId', authMiddleware,cvCacheMiddleware, cacheMiddleware, deleteCV);

module.exports = router;