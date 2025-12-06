// routes/enseignants.js
const express = require('express');
const router = express.Router();
const enseignantController = require('../controllers/enseignantController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { enseignantValidation, queryValidation, handleValidationErrors } = require('../middleware/validation');
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
  enseignantController.getAllEnseignants
);

router.post('/', 
  requireRole(rolesAutorises), 
  enseignantValidation.create,
  handleValidationErrors,
  enseignantController.createEnseignant
);

// Routes accessibles à tous les utilisateurs authentifiés de l'établissement
router.get('/:id', 
  enseignantController.getEnseignantById
);

router.get('/:id/schedule', 
  enseignantController.getEmploiTemps
);

router.get('/:id/stats', 
  enseignantController.getEnseignantStats
);

// Routes accessibles aux rôles autorisés seulement
router.put('/:id', 
  requireRole(rolesAutorises), 
  enseignantValidation.update,
  handleValidationErrors,
  enseignantController.updateEnseignant
);

router.post('/:id/assign-subjects', 
  requireRole(rolesAutorises), 
  enseignantController.assignMatieres
);

module.exports = router;