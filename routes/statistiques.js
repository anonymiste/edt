// routes/statistiques.js
const express = require('express');
const router = express.Router();
const statistiqueController = require('../controllers/statistiqueController');
const { authenticateToken, requireRole, logAccess } = require('../middleware/auth');
const { queryValidation, handleValidationErrors } = require('../middleware/validation');
const { RoleUtilisateur } = require('../utils/enums');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);
router.use(logAccess('statistiques'));

// Routes accessibles aux administrateurs, directeurs et responsables pédagogiques
const rolesAutorises = [
  RoleUtilisateur.ADMIN, 
  RoleUtilisateur.DIRECTEUR, 
  RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE
];

router.get('/general', 
  requireRole(rolesAutorises), 
  statistiqueController.getStatistiquesGenerales
);

router.get('/periodic', 
  requireRole(rolesAutorises), 
  queryValidation.dateRange,
  handleValidationErrors,
  statistiqueController.getStatistiquesPeriodiques
);

router.get('/classes', 
  requireRole(rolesAutorises), 
  statistiqueController.getStatistiquesParClasse
);

router.get('/enseignants', 
  requireRole(rolesAutorises), 
  statistiqueController.getStatistiquesEnseignants
);

router.get('/dashboard', 
  requireRole(rolesAutorises), 
  statistiqueController.getTableauDeBord
);

module.exports = router;