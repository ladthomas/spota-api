const express = require('express');
const { register, login, getMe, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  validateUpdateProfile 
} = require('../middleware/validation');
const { authRateLimit, mutationRateLimit } = require('../middleware/security');

const router = express.Router();

// Routes publiques (sans authentification) avec rate limiting strict
router.post('/register', authRateLimit, validateRegister, register);
router.post('/login', authRateLimit, validateLogin, login);

// Routes protégées (avec authentification)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, mutationRateLimit, validateUpdateProfile, updateProfile);
router.delete('/delete-account', protect, mutationRateLimit, deleteAccount);

module.exports = router; 