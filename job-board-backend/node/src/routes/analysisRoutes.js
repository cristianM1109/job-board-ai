const express = require('express');
const { calculateKeywordCompatibilityScores, calculateCompatibilityScores } = require('../controllers/analysisController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/process-cv',authMiddleware, calculateCompatibilityScores)  
router.get('/keyword-compatibility-scores',authMiddleware, calculateKeywordCompatibilityScores);

module.exports = router;