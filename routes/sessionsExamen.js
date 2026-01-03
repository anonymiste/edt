const express = require('express');
const router = express.Router();
const sessionExamenController = require('../controllers/sessionExamenController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { RoleUtilisateur } = require('../utils/enums');

router.use(authenticateToken);

router.get('/classe/:classeId', sessionExamenController.getSessionsByClasse);
router.get('/calendrier', sessionExamenController.getCalendrier);

router.post('/',
    requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR, RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE]),
    sessionExamenController.createSession
);

router.put('/:id',
    requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR, RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE]),
    sessionExamenController.updateSession
);

router.delete('/:id',
    requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR, RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE]),
    sessionExamenController.deleteSession
);

module.exports = router;
