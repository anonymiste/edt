// routes/matieres.js
const express = require('express');
const router = express.Router();
const matiereController = require('../controllers/matiereController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { matiereValidation, queryValidation, handleValidationErrors } = require('../middleware/validation');
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
  matiereController.getAllMatieres
);

router.post('/', 
  requireRole(rolesAutorises), 
  matiereValidation.create,
  handleValidationErrors,
  matiereController.createMatiere
);

// Routes accessibles à tous les utilisateurs authentifiés de l'établissement
router.get('/:id', 
  matiereController.getMatiereById
);

router.get('/:id/stats', 
  matiereController.getMatiereStats
);

// Routes accessibles aux rôles autorisés seulement
router.put('/:id', 
  requireRole(rolesAutorises), 
  matiereValidation.update,
  handleValidationErrors,
  matiereController.updateMatiere
);

router.post('/:id/assign-teachers', 
  requireRole(rolesAutorises), 
  matiereController.assignEnseignants
);

module.exports = router;