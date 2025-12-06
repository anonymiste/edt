// routes/salles.js
const express = require('express');
const router = express.Router();
const salleController = require('../controllers/salleController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { salleValidation, queryValidation, handleValidationErrors } = require('../middleware/validation');
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
  salleController.getAllSalles
);

router.post('/', 
  requireRole(rolesAutorises), 
  salleValidation.create,
  handleValidationErrors,
  salleController.createSalle
);

// Routes accessibles à tous les utilisateurs authentifiés de l'établissement
router.get('/:id', 
  salleController.getSalleById
);

router.get('/:id/stats', 
  salleController.getSalleStats
);

router.post('/:id/check-availability', 
  salleController.checkDisponibilite
);

// Routes accessibles aux rôles autorisés seulement
router.put('/:id', 
  requireRole(rolesAutorises), 
  salleValidation.update,
  handleValidationErrors,
  salleController.updateSalle
);

router.post('/:id/maintenance', 
  requireRole(rolesAutorises), 
  salleController.setMaintenance
);

router.post('/:id/available', 
  requireRole(rolesAutorises), 
  salleController.setDisponible
);

module.exports = router;