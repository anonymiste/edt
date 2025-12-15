// routes/emplois-temps.js
const express = require('express');
const router = express.Router();
const emploiTempsController = require('../controllers/emploiTempsController');
const { authenticateToken, requireRole, requireEtablissementAccessCode, logAccess } = require('../middleware/auth');
const { emploiTempsValidation, queryValidation, handleValidationErrors } = require('../middleware/validation');
const { RoleUtilisateur } = require('../utils/enums');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);
router.use(logAccess('emplois_temps'));

// Roles autorisés pour la gestion
const rolesAutorises = [
  RoleUtilisateur.ADMIN, 
  RoleUtilisateur.DIRECTEUR, 
  RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE
];

// Routes publiques (pour utilisateurs authentifiés)
router.get('/me', 
  emploiTempsController.getMonEmploiTemps
);

router.get('/classe/:classeId', 
  emploiTempsController.getEmploiTempsParClasse
);

router.get('/enseignant/:enseignantId', 
  emploiTempsController.getEmploiTempsParEnseignant
);

// Routes administratives
router.get('/', 
  requireRole(rolesAutorises), 
  queryValidation.pagination,
  handleValidationErrors,
  emploiTempsController.getAllEmploisTemps
);

router.post('/generate', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsValidation.generer,
  handleValidationErrors,
  emploiTempsController.genererEmploiTemps
);

router.get('/:id', 
  emploiTempsController.getEmploiTempsById
);

router.get('/:id/stats', 
  emploiTempsController.getEmploiTempsStats
);

router.post('/:id/validate', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsController.validerEmploiTemps
);

router.post('/:id/publish', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsController.publierEmploiTemps
);

router.post('/:id/archive', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsController.archiverEmploiTemps
);

router.post('/:id/duplicate', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsController.dupliquerEmploiTemps
);

// Gestion des séances
router.post('/seances', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsValidation.seance,
  handleValidationErrors,
  emploiTempsController.createSeance
);

router.put('/seances/:id', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsValidation.seance,
  handleValidationErrors,
  emploiTempsController.updateSeance
);

router.delete('/seances/:id', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsController.deleteSeance
);

router.put('/seances/:id/annuler', 
  requireRole(rolesAutorises),
  requireEtablissementAccessCode,
  emploiTempsValidation.annulation,
  handleValidationErrors,
  emploiTempsController.annulerSeance
);

// Export
router.get('/export/pdf', 
  emploiTempsController.exportPDF
);

module.exports = router;