// routes/absences.js
const express = require('express');
const router = express.Router();
const absenceController = require('../controllers/absenceController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { queryValidation, handleValidationErrors } = require('../middleware/validation');
const { RoleUtilisateur } = require('../utils/enums');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes accessibles aux administrateurs, directeurs, responsables pédagogiques et enseignants
const rolesAutorises = [
  RoleUtilisateur.ADMIN, 
  RoleUtilisateur.DIRECTEUR, 
  RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE,
  RoleUtilisateur.ENSEIGNANT
];

router.get('/', 
  requireRole(rolesAutorises), 
  queryValidation.pagination,
  handleValidationErrors,
  absenceController.getAllAbsences
);

router.post('/', 
  requireRole(rolesAutorises), 
  absenceController.declarerAbsence
);

// Routes accessibles à tous les utilisateurs authentifiés de l'établissement
router.get('/:id', 
  absenceController.getAbsenceById
);

// Routes accessibles aux rôles autorisés seulement
router.post('/:id/validate', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR, RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE]), 
  absenceController.validerAbsence
);

router.post('/:id/refuse', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR, RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE]), 
  absenceController.refuserAbsence
);

// Routes statistiques
router.get('/stats/current', 
  requireRole(rolesAutorises), 
  absenceController.getAbsencesEnCours
);

router.get('/stats/overview', 
  requireRole(rolesAutorises), 
  absenceController.getAbsenceStats
);

module.exports = router;