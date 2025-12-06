// routes/users.js
const express = require('express');
const UserRouter = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { queryValidation, handleValidationErrors } = require('../middleware/validation');
const { RoleUtilisateur } = require('../utils/enums');

// Toutes les routes nécessitent une authentification
UserRouter.use(authenticateToken);

// Routes accessibles aux administrateurs et directeurs
UserRouter.get('/', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]), 
  queryValidation.pagination,
  handleValidationErrors,
  userController.getAllUsers
);

UserRouter.get('/stats', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]), 
  userController.getUserStats
);

UserRouter.post('/', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]), 
  userController.createUser
);

// Routes accessibles à tous les utilisateurs authentifiés
UserRouter.get('/:id', 
  userController.getUserById
);

UserRouter.put('/:id', 
  requireRole([RoleUtilisateur.ADMIN, RoleUtilisateur.DIRECTEUR]), 
  userController.updateUser
);

UserRouter.delete('/:id', 
  requireRole([RoleUtilisateur.ADMIN]), 
  userController.deleteUser
);

module.exports = UserRouter;