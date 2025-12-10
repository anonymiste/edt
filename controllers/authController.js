// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Utilisateur, Etablissement, LogConnexion } = require('../database/models');
const config = require('../config/config');
const { validationResult } = require('express-validator');
const { RoleUtilisateur, StatutConnexion } = require('../utils/enums');
const AuthService = require('../services/authService');

const authController = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register: async (req, res) => {
    try {
      // const errors = validationResult(req);
      // if (!errors.isEmpty()) {
      //   return res.status(400).json({
      //     error: 'Données invalides',
      //     details: errors.array(),
      //     code: 'VALIDATION_ERROR'
      //   });
      // }

      const { email, password, nom, prenom, role, telephone, etablissement_id } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await Utilisateur.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Un utilisateur avec cet email existe déjà',
          code: 'USER_ALREADY_EXISTS'
        });
      }

      // Vérifier l'établissement si fourni
      if (etablissement_id) {
        const etablissement = await Etablissement.findByPk(etablissement_id);
        if (!etablissement) {
          return res.status(404).json({
            error: 'Établissement non trouvé',
            code: 'ETABLISSEMENT_NOT_FOUND'
          });
        }
      }

      // Hasher le mot de passe
      const saltRounds = 12;
      const motDePasseHash = await bcrypt.hash(password, saltRounds);

      // DÉFINIR LES RÔLES QUI REQUIÈRENT LA 2FA
      const rolesRequiring2FA = [
        RoleUtilisateur.ADMIN,
        RoleUtilisateur.DIRECTEUR,
        RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE
      ];

      // Créer l'utilisateur avec activation 2FA si nécessaire
      const utilisateurData = {
        email,
        mot_de_passe_hash: motDePasseHash,
        nom,
        prenom,
        role,
        telephone,
        etablissement_id,
        deux_fa_active: rolesRequiring2FA.includes(role)
      };

      // Si le rôle nécessite la 2FA, générer un secret
      if (rolesRequiring2FA.includes(role)) {
        const twoFASecret = AuthService.generate2FASecret({ email });
        utilisateurData.deux_fa_secret = twoFASecret.secret;

        // Générer le QR Code
        const qrCodeUrl = await AuthService.generate2FAQrCode(twoFASecret.url);

        // Créer l'utilisateur
        const utilisateur = await Utilisateur.create(utilisateurData);

        // Journaliser la création de compte
        await LogConnexion.create({
          utilisateur_id: utilisateur.id,
          adresse_ip: req.ip,
          user_agent: req.get('User-Agent'),
          statut: StatutConnexion.SUCCES,
          pays: null,
          ville: null
        });

        // Générer le token JWT
        const token = jwt.sign(
          {
            id: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role
          },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        )

        res.status(201).json({
          message: 'Utilisateur créé avec succès. La 2FA est requise pour ce rôle.',
          token: token, // Pas de token immédiat car 2FA requise
          utilisateur: {
            id: utilisateur.id,
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            role: utilisateur.role,
            etablissement_id: utilisateur.etablissement_id,
            deux_fa_active: true,
            deux_fa_setup_required: true,
            qr_code_url: qrCodeUrl, // Retourner le QR Code pour configuration
            secret: twoFASecret.secret // Pour développement/test seulement
          },
          code: 'REGISTRATION_SUCCESS_2FA_REQUIRED'
        });
      } else {
        // Pour les rôles ne nécessitant pas la 2FA, créer un token normal
        const utilisateur = await Utilisateur.create(utilisateurData);

        // Générer le token JWT
        const token = jwt.sign(
          {
            id: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role
          },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );

        // Journaliser la création de compte
        await LogConnexion.create({
          utilisateur_id: utilisateur.id,
          adresse_ip: req.ip,
          user_agent: req.get('User-Agent'),
          statut: StatutConnexion.SUCCES,
          pays: null,
          ville: null
        });

        res.status(201).json({
          message: 'Utilisateur créé avec succès',
          token,
          utilisateur: {
            id: utilisateur.id,
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            role: utilisateur.role,
            etablissement_id: utilisateur.etablissement_id,
            deux_fa_active: false
          },
          code: 'REGISTRATION_SUCCESS'
        });
      }

    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'inscription',
        code: 'REGISTRATION_ERROR'
      });
    }
  },

  /**
   * Connexion utilisateur avec support 2FA
   */
  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { email, password, twoFAToken } = req.body;

      // Rechercher l'utilisateur
      const utilisateur = await Utilisateur.findOne({
        where: { email },
        include: [{
          association: 'etablissement',
          attributes: ['id', 'nom', 'type', 'statut']
        }]
      });

      // Journaliser la tentative de connexion
      await LogConnexion.create({
        utilisateur_id: utilisateur?.id || null,
        adresse_ip: req.ip,
        user_agent: req.get('User-Agent'),
        statut: utilisateur ? StatutConnexion.SUCCES : StatutConnexion.ECHEC,
        mot_de_passe_tente: password.substring(0, 3) + '***',
        pays: null,
        ville: null
      });

      if (!utilisateur) {
        return res.status(401).json({
          error: 'Email ou mot de passe incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, utilisateur.mot_de_passe_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Email ou mot de passe incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Vérifier si le compte est actif
      if (!utilisateur.actif) {
        return res.status(401).json({
          error: 'Compte désactivé',
          code: 'ACCOUNT_DISABLED'
        });
      }

      // Vérifier si l'établissement est actif
      if (utilisateur.etablissement && utilisateur.etablissement.statut !== 'actif') {
        return res.status(403).json({
          error: 'Établissement non actif',
          code: 'ETABLISSEMENT_INACTIVE'
        });
      }

      // DÉFINIR LES RÔLES QUI REQUIÈRENT LA 2FA
      const rolesRequiring2FA = [
        RoleUtilisateur.ADMIN,
        RoleUtilisateur.DIRECTEUR,
        RoleUtilisateur.RESPONSABLE_PEDAGOGIQUE
      ];

      // Vérifier si l'utilisateur nécessite la 2FA
      const requires2FA = utilisateur.deux_fa_active ||
        (rolesRequiring2FA.includes(utilisateur.role) && utilisateur.deux_fa_secret);

      if (requires2FA) {
        // Si le token 2FA n'est pas fourni, demander l'authentification 2FA
        if (!twoFAToken) {
          return res.status(200).json({
            message: 'Authentification 2FA requise',
            requires2FA: true,
            utilisateur: {
              id: utilisateur.id,
              email: utilisateur.email,
              role: utilisateur.role,
              deux_fa_active: true
            },
            code: '2FA_REQUIRED'
          });
        }

        // Vérifier le token 2FA
        const is2FATokenValid = AuthService.verify2FACode(utilisateur.deux_fa_secret, twoFAToken);
        if (!is2FATokenValid) {
          return res.status(401).json({
            error: 'Code 2FA invalide',
            code: 'INVALID_2FA_TOKEN'
          });
        }
      }

      // Mettre à jour la date de dernière connexion
      await utilisateur.update({ date_derniere_connexion: new Date() });

      // Générer le token JWT
      const tokenPayload = {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role
      };

      // Ajouter un flag 2FA dans le token si applicable
      if (requires2FA) {
        tokenPayload.twoFAVerified = true;
      }

      const token = jwt.sign(
        tokenPayload,
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        message: 'Connexion réussie',
        token,
        utilisateur: {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          role: utilisateur.role,
          etablissement: utilisateur.etablissement,
          deux_fa_active: utilisateur.deux_fa_active || requires2FA
        },
        code: 'LOGIN_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({
        error: 'Erreur lors de la connexion',
        code: 'LOGIN_ERROR'
      });
    }
  },

  /**
   * Route pour vérifier un code 2FA
   */
  verify2FA: async (req, res) => {
    try {
      const { email, twoFAToken } = req.body;

      const utilisateur = await Utilisateur.findOne({ where: { email } });

      if (!utilisateur) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!utilisateur.deux_fa_secret) {
        return res.status(400).json({
          error: '2FA non configurée pour cet utilisateur',
          code: '2FA_NOT_CONFIGURED'
        });
      }

      const isTokenValid = AuthService.verify2FACode(utilisateur.deux_fa_secret, twoFAToken);

      if (!isTokenValid) {
        return res.status(401).json({
          error: 'Code 2FA invalide',
          code: 'INVALID_2FA_TOKEN'
        });
      }

      // Générer le token JWT final
      const token = jwt.sign(
        {
          id: utilisateur.id,
          email: utilisateur.email,
          role: utilisateur.role,
          twoFAVerified: true
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        message: 'Authentification 2FA réussie',
        token,
        code: '2FA_VERIFICATION_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur vérification 2FA:', error);
      res.status(500).json({
        error: 'Erreur lors de la vérification 2FA',
        code: '2FA_VERIFICATION_ERROR'
      });
    }
  },

  /**
   * Route pour configurer la 2FA
   */
  setup2FA: async (req, res) => {
    try {
      const utilisateur = await Utilisateur.findByPk(req.utilisateur.id);

      if (utilisateur.deux_fa_active) {
        return res.status(400).json({
          error: '2FA déjà activée',
          code: '2FA_ALREADY_ACTIVE'
        });
      }

      // Générer un nouveau secret 2FA
      const twoFASecret = AuthService.generate2FASecret({ email: utilisateur.email });

      // Générer le QR Code
      const qrCodeUrl = await AuthService.generate2FAQrCode(twoFASecret.url);

      // Mettre à jour l'utilisateur avec le secret
      await utilisateur.update({
        deux_fa_secret: twoFASecret.secret
      });

      res.json({
        message: 'Configuration 2FA initialisée',
        qr_code_url: qrCodeUrl,
        secret: twoFASecret.secret, // Pour développement/test seulement
        code: '2FA_SETUP_INITIATED'
      });

    } catch (error) {
      console.error('Erreur configuration 2FA:', error);
      res.status(500).json({
        error: 'Erreur lors de la configuration de la 2FA',
        code: '2FA_SETUP_ERROR'
      });
    }
  },

  /**
   * Route pour activer la 2FA après vérification
   */
  activate2FA: async (req, res) => {
    try {

      const { twoFAToken } = req.body;
      const { userData } = req.body;
      console.log(req.body)
      const utilisateur = await Utilisateur.findByPk(userData.id);
      console.log(utilisateur);

      if (!utilisateur.deux_fa_secret) {
        return res.status(400).json({
          error: 'Veuillez d\'abord configurer la 2FA',
          code: '2FA_NOT_CONFIGURED'
        });
      }

      if (utilisateur.deux_fa_active) {
        return res.status(400).json({
          error: '2FA déjà activée',
          code: '2FA_ALREADY_ACTIVE'
        });
      }

      // Vérifier le token 2FA
      const isTokenValid = AuthService.verify2FACode(utilisateur.deux_fa_secret, twoFAToken);

      if (!isTokenValid) {
        return res.status(401).json({
          error: 'Code 2FA invalide',
          code: 'INVALID_2FA_TOKEN'
        });
      }

      // Activer la 2FA
      await utilisateur.update({
        deux_fa_active: true
      });

      res.json({
        message: '2FA activée avec succès',
        code: '2FA_ACTIVATED'
      });

    } catch (error) {
      console.error('Erreur activation 2FA:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'activation de la 2FA',
        code: '2FA_ACTIVATION_ERROR'
      });
    }
  },


  /**
   * Récupération du profil utilisateur
   */
  getProfile: async (req, res) => {
    try {
      const utilisateur = await Utilisateur.findByPk(req.utilisateur.id, {
        attributes: { exclude: ['mot_de_passe_hash', 'deux_fa_secret'] },
        include: [{
          association: 'etablissement',
          attributes: ['id', 'nom', 'type', 'ville', 'statut']
        }]
      });

      res.json({
        utilisateur,
        code: 'RECUPERATION_PROFILE_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération du profil',
        code: 'RECUPERATION_PROFILE_ERROR'
      });
    }
  },

  /**
   * Modification du profil utilisateur
   */
  updateProfile: async (req, res) => {
    try {
      const { nom, prenom, telephone } = req.body;
      const utilisateur = await Utilisateur.findByPk(req.utilisateur.id);

      await utilisateur.update({
        nom: nom || utilisateur.nom,
        prenom: prenom || utilisateur.prenom,
        telephone: telephone || utilisateur.telephone
      });

      res.json({
        message: 'Profil mis à jour avec succès',
        utilisateur: {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          telephone: utilisateur.telephone
        },
        code: 'PROFILE_UPDATED'
      });

    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({
        error: 'Erreur lors de la mise à jour du profil',
        code: 'PROFILE_UPDATE_ERROR'
      });
    }
  },

  /**
   * Changement de mot de passe
   */
  changePassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const { currentPassword, newPassword } = req.body;
      const utilisateur = await Utilisateur.findByPk(req.utilisateur.id);

      // Vérifier l'ancien mot de passe
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, utilisateur.mot_de_passe_hash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Mot de passe actuel incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await utilisateur.update({ mot_de_passe_hash: newPasswordHash });

      res.json({
        message: 'Mot de passe modifié avec succès',
        code: 'PASSWORD_CHANGED'
      });

    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({
        error: 'Erreur lors du changement de mot de passe',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  },

  /**
   * Rafraîchissement du token
   */
  refreshToken: async (req, res) => {
    try {
      const utilisateur = await Utilisateur.findByPk(req.utilisateur.id, {
        attributes: ['id', 'email', 'role']
      });

      const newToken = jwt.sign(
        {
          id: utilisateur.id,
          email: utilisateur.email,
          role: utilisateur.role
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        token: newToken,
        code: 'TOKEN_REFRESHED'
      });

    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
      res.status(500).json({
        error: 'Erreur lors du rafraîchissement du token',
        code: 'TOKEN_REFRESH_ERROR'
      });
    }
  }
};

module.exports = authController;