const express = require('express');
const { registerUser, authenicateUser, checkUserAuth } = require('../controllers/userController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');


router.post('/register', registerUser)
router.post('/login', authenicateUser)
router.get('/me',authMiddleware, checkUserAuth)

module.exports = router;