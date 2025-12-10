// routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { bodyValidation, queryValidation, handleValidationErrors, notificationValidation } = require('../middleware/validation');
const { RoleUtilisateur } = require('../utils/enums');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour tous les utilisateurs authentifiés
router.get('/',
  queryValidation.pagination,
  queryValidation.boolean('lue'),
  handleValidationErrors,
  notificationController.getMyNotifications
);

router.get('/unread-count',
  notificationController.getUnreadCount
);

router.get('/:id',
  notificationValidation.idParam,
  handleValidationErrors,
  notificationController.getNotificationById
);

router.put('/:id/read',
  notificationValidation.idParam,
  handleValidationErrors,
  notificationController.markAsRead
);

router.put('/mark-all-read',
  notificationController.markAllAsRead
);

router.delete('/:id',
  notificationValidation.idParam,
  handleValidationErrors,
  notificationController.deleteNotification
);

// Routes réservées aux administrateurs et directeurs
router.post('/',
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]),
  ...notificationValidation.create,
  handleValidationErrors,
  notificationController.createNotification
);

// Route réservée aux administrateurs pour le nettoyage
router.post('/cleanup',
  requireRole([RoleUtilisateur.ADMIN]),
  ...notificationValidation.cleanup,
  handleValidationErrors,
  notificationController.cleanupOldNotifications
);

module.exports = router;