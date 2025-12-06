// controllers/userController.js
const { Utilisateur, Etablissement, LogConnexion, LogModification } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { RoleUtilisateur, TypeOperation } = require('../utils/enums');

const userController = {
  /**
   * Récupérer tous les utilisateurs (admin seulement)
   */
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { etablissement_id: req.utilisateur.etablissement_id };
      
      if (role) {
        whereClause.role = role;
      }

      if (search) {
        whereClause[Op.or] = [
          { nom: { [Op.iLike]: `%${search}%` } },
          { prenom: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: utilisateurs } = await Utilisateur.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['mot_de_passe_hash', 'deux_fa_secret'] },
        include: [{
          association: 'etablissement',
          attributes: ['id', 'nom']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nom', 'ASC']]
      });

      res.json({
        utilisateurs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        code: 'USERS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des utilisateurs',
        code: 'USERS_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Récupérer un utilisateur par ID
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const utilisateur = await Utilisateur.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        },
        attributes: { exclude: ['mot_de_passe_hash', 'deux_fa_secret'] },
        include: [{
          association: 'etablissement',
          attributes: ['id', 'nom', 'type']
        }]
      });

      if (!utilisateur) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        utilisateur,
        code: 'USER_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'utilisateur',
        code: 'USER_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Créer un nouvel utilisateur (admin/directeur)
   */
  createUser: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { email, password, nom, prenom, role, telephone } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await Utilisateur.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Un utilisateur avec cet email existe déjà',
          code: 'USER_ALREADY_EXISTS'
        });
      }

      // Hasher le mot de passe
      const bcrypt = require('bcryptjs');
      const saltRounds = 12;
      const motDePasseHash = await bcrypt.hash(password, saltRounds);

      // Créer l'utilisateur
      const utilisateur = await Utilisateur.create({
        email,
        mot_de_passe_hash: motDePasseHash,
        nom,
        prenom,
        role,
        telephone,
        etablissement_id: req.utilisateur.etablissement_id
      });

      // Journaliser la création
      await LogModification.create({
        utilisateur_id: req.utilisateur.id,
        table_concernee: 'utilisateurs',
        id_entite_concernee: utilisateur.id,
        type_operation: TypeOperation.CREATION,
        valeur_avant: null,
        valeur_apres: { email, nom, prenom, role },
        adresse_ip: req.ip
      });

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        utilisateur: {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role,
          telephone: utilisateur.telephone
        },
        code: 'USER_CREATED'
      });

    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      res.status(500).json({
        error: 'Erreur lors de la création de l\'utilisateur',
        code: 'USER_CREATION_ERROR'
      });
    }
  },

  /**
   * Mettre à jour un utilisateur
   */
  updateUser: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { id } = req.params;
      const { nom, prenom, role, telephone, actif } = req.body;

      const utilisateur = await Utilisateur.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!utilisateur) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      // Sauvegarder les anciennes valeurs pour le log
      const anciennesValeurs = {
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role,
        telephone: utilisateur.telephone,
        actif: utilisateur.actif
      };

      await utilisateur.update({
        nom: nom || utilisateur.nom,
        prenom: prenom || utilisateur.prenom,
        role: role || utilisateur.role,
        telephone: telephone || utilisateur.telephone,
        actif: actif !== undefined ? actif : utilisateur.actif
      });

      // Journaliser la modification
      await LogModification.create({
        utilisateur_id: req.utilisateur.id,
        table_concernee: 'utilisateurs',
        id_entite_concernee: utilisateur.id,
        type_operation: TypeOperation.MODIFICATION,
        valeur_avant: anciennesValeurs,
        valeur_apres: {
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role,
          telephone: utilisateur.telephone,
          actif: utilisateur.actif
        },
        adresse_ip: req.ip
      });

      res.json({
        message: 'Utilisateur mis à jour avec succès',
        utilisateur: {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role,
          telephone: utilisateur.telephone,
          actif: utilisateur.actif
        },
        code: 'USER_UPDATED'
      });

    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      res.status(500).json({
        error: 'Erreur lors de la mise à jour de l\'utilisateur',
        code: 'USER_UPDATE_ERROR'
      });
    }
  },

  /**
   * Supprimer un utilisateur
   */
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Empêcher l'auto-suppression
      if (id === req.utilisateur.id) {
        return res.status(400).json({
          error: 'Vous ne pouvez pas supprimer votre propre compte',
          code: 'SELF_DELETION_NOT_ALLOWED'
        });
      }

      const utilisateur = await Utilisateur.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!utilisateur) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      // Sauvegarder les données pour le log
      const donneesUtilisateur = {
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role
      };

      await utilisateur.destroy();

      // Journaliser la suppression
      await LogModification.create({
        utilisateur_id: req.utilisateur.id,
        table_concernee: 'utilisateurs',
        id_entite_concernee: id,
        type_operation: TypeOperation.SUPPRESSION,
        valeur_avant: donneesUtilisateur,
        valeur_apres: null,
        adresse_ip: req.ip
      });

      res.json({
        message: 'Utilisateur supprimé avec succès',
        code: 'USER_DELETED'
      });

    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      res.status(500).json({
        error: 'Erreur lors de la suppression de l\'utilisateur',
        code: 'USER_DELETION_ERROR'
      });
    }
  },

  /**
   * Obtenir les statistiques des utilisateurs
   */
  getUserStats: async (req, res) => {
    try {
      const totalUsers = await Utilisateur.count({
        where: { etablissement_id: req.utilisateur.etablissement_id }
      });

      const usersByRole = await Utilisateur.findAll({
        where: { etablissement_id: req.utilisateur.etablissement_id },
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['role']
      });

      const activeUsers = await Utilisateur.count({
        where: { 
          etablissement_id: req.utilisateur.etablissement_id,
          actif: true 
        }
      });

      const recentLogins = await LogConnexion.count({
        where: {
          date_heure: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        },
        include: [{
          association: 'utilisateur',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }]
      });

      res.json({
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          by_role: usersByRole,
          recent_logins: recentLogins
        },
        code: 'USER_STATS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des statistiques',
        code: 'USER_STATS_ERROR'
      });
    }
  }
};

module.exports = userController;