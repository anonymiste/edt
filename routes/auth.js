// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authValidation, handleValidationErrors } = require('../middleware/validation');
const { authenticateToken, logAccess } = require('../middleware/auth');

// Routes publiques
router.use(logAccess('auth'));
router.post('/register', 
  authValidation.register, 
  handleValidationErrors, 
  authController.register
);

router.post('/login', 
  authValidation.login, 
  handleValidationErrors, 
  authController.login
);

// Nouvelle route pour vérifier le code 2FA
router.post('/verify-2fa',
  authController.verify2FA
);

// Routes protégées
router.get('/profile', 
  authenticateToken, 
  authController.getProfile
);

router.put('/profile', 
  authenticateToken, 
  authController.updateProfile
);

router.post('/change-password', 
  authenticateToken, 
  authValidation.changePassword, 
  handleValidationErrors, 
  authController.changePassword
);

router.post('/refresh-token', 
  authenticateToken, 
  authController.refreshToken
);

// Nouvelles routes pour la gestion 2FA
router.post('/setup-2fa',
  authenticateToken,
  authController.setup2FA
);

router.post('/activate-2fa',
  authenticateToken,
  authController.activate2FA
);

module.exports = router;