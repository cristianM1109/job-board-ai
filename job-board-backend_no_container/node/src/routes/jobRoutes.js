const express = require('express');
const {  fetchExternalJobs, recommendJobs, analyzeJobCV } = require('../controllers/jobController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/external-jobs', fetchExternalJobs);
router.get('/recommend-jobs',authMiddleware, recommendJobs);
router.get('/analyze-job/:jobId', authMiddleware, analyzeJobCV);

module.exports = router;