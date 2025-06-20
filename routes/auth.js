const express = require('express');
const { register, login, getMe, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Routes publiques (sans authentification)
router.post('/register', register);
router.post('/login', login);

// Routes protégées (avec authentification)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router; 