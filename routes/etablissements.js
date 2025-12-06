// routes/etablissements.js
const express = require('express');
const router = express.Router();
const etablissementController = require('../controllers/etablissementController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { etablissementValidation, queryValidation, handleValidationErrors } = require('../middleware/validation');
const { RoleUtilisateur } = require('../utils/enums');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes accessibles aux administrateurs seulement
router.get('/', 
  requireRole([RoleUtilisateur.ADMIN]), 
  queryValidation.pagination,
  handleValidationErrors,
  etablissementController.getAllEtablissements
);

router.post('/', 
  requireRole([RoleUtilisateur.ADMIN]), 
  etablissementValidation.create,
  handleValidationErrors,
  etablissementController.createEtablissement
);

// Routes accessibles aux administrateurs et directeurs
router.get('/:id', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]), 
  etablissementValidation.idParam,
  handleValidationErrors,
  etablissementController.getEtablissementById
);

router.put('/:id', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]), 
  etablissementValidation.update,
  handleValidationErrors,
  etablissementController.updateEtablissement
);

router.get('/:id/stats', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]), 
  etablissementValidation.idParam,
  handleValidationErrors,
  etablissementController.getEtablissementStats
);

router.post('/:id/generate-access-code', 
  requireRole([RoleUtilisateur.ADMIN]), 
  etablissementValidation.idParam,
  handleValidationErrors,
  etablissementController.generateNewAccessCode
);

module.exports = router;