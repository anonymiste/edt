// routes/emplois-temps.js
const express = require('express');
const router = express.Router();
const emploiTempsController = require('../controllers/emploiTempsController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { emploiTempsValidation, queryValidation, handleValidationErrors } = require('../middleware/validation');
const { RoleUtilisateur } = require('../utils/enums');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes accessibles aux administrateurs, directeurs et responsables pédagogiques
const rolesAutorises = [
  RoleUtilisateur.ADMIN, 
  RoleUtilisateur.DIRECTEUR, 
  RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE
];

router.get('/', 
  requireRole(rolesAutorises), 
  queryValidation.pagination,
  handleValidationErrors,
  emploiTempsController.getAllEmploisTemps
);

router.post('/generate', 
  requireRole(rolesAutorises), 
  emploiTempsValidation.generer,
  handleValidationErrors,
  emploiTempsController.genererEmploiTemps
);

// Routes accessibles à tous les utilisateurs authentifiés de l'établissement
router.get('/:id', 
  emploiTempsController.getEmploiTempsById
);

router.get('/:id/stats', 
  emploiTempsController.getEmploiTempsStats
);

// Routes accessibles aux rôles autorisés seulement
router.post('/:id/validate', 
  requireRole(rolesAutorises), 
  emploiTempsController.validerEmploiTemps
);

router.post('/:id/publish', 
  requireRole(rolesAutorises), 
  emploiTempsController.publierEmploiTemps
);

router.post('/:id/archive', 
  requireRole(rolesAutorises), 
  emploiTempsController.archiverEmploiTemps
);

router.post('/:id/duplicate', 
  requireRole(rolesAutorises), 
  emploiTempsController.dupliquerEmploiTemps
);

module.exports = router;