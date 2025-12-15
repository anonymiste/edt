// controllers/classeController.js
const { Classe, Etablissement, Cours, EmploiTemps, LogModification } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { StatutClasse, TypeOperation } = require('../utils/enums');
const { applyEtablissementScope, resolveScopedEtablissementId } = require('../utils/scope');

const classeController = {
  /**
   * Récupérer toutes les classes
   */
  getAllClasses: async (req, res) => {
    try {
      const { page = 1, limit = 10, niveau, statut, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = applyEtablissementScope(req, {});
      
      if (niveau) {
        whereClause.niveau = niveau;
      }

      if (statut) {
        whereClause.statut = statut;
      }

      if (search) {
        whereClause[Op.or] = [
          { nom_classe: { [Op.iLike]: `%${search}%` } },
          { filiere: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: classes } = await Classe.findAndCountAll({
        where: whereClause,
        include: [{
          association: 'etablissement',
          attributes: ['id', 'nom']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['niveau', 'ASC'], ['nom_classe', 'ASC']]
      });

      res.json({
        classes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        code: 'RECUPERATION_CLASSES_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération classes:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des classes',
        code: 'RECUPERATION_CLASSES_ERROR'
      });
    }
  },

  /**
   * Récupérer une classe par ID
   */
  getClasseById: async (req, res) => {
    try {
      const { id } = req.params;

      const classe = await Classe.findOne({
        where: applyEtablissementScope(req, { id }),
        include: [
          {
            association: 'etablissement',
            attributes: ['id', 'nom', 'ville']
          },
          {
            association: 'cours',
            include: [
              {
                association: 'matiere',
                attributes: ['id', 'nom_matiere', 'code_matiere']
              },
              {
                association: 'enseignant',
                include: [{
                  association: 'utilisateur',
                  attributes: ['id', 'nom', 'prenom']
                }]
              }
            ]
          },
          {
            association: 'emplois_temps',
            limit: 5,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!classe) {
        return res.status(404).json({
          error: 'Classe non trouvée',
          code: 'CLASS_NOT_FOUND'
        });
      }

      res.json({
        classe,
        code: 'RECUPERATION_CLASS_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération classe:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de la classe',
        code: 'RECUPERATION_CLASS_ERROR'
      });
    }
  },

  /**
   * Créer une nouvelle classe
   */
  createClasse: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const {
        nom_classe,
        niveau,
        filiere,
        effectif,
        annee_scolaire,
        salle_principale,
        statut,
        etablissement_id
      } = req.body;

      const scopedEtablissementId = resolveScopedEtablissementId(req);

      if (!scopedEtablissementId) {
        return res.status(400).json({
          error: 'Établissement requis pour créer une classe',
          code: 'ESTABLISSEMENT_REQUIRED'
        });
      }

      const classe = await Classe.create({
        nom_classe,
        niveau,
        filiere,
        effectif,
        annee_scolaire,
        salle_principale,
        statut: statut || StatutClasse.ACTIVE,
        etablissement_id: etablissement_id || scopedEtablissementId
      });

      await LogModification.create({
        utilisateur_id: req.utilisateur.id,
        table_concernee: 'classes',
        id_entite_concernee: classe.id,
        type_operation: TypeOperation.CREATION,
        valeur_avant: null,
        valeur_apres: {
          nom_classe,
          niveau,
          filiere,
          etablissement_id: classe.etablissement_id
        },
        adresse_ip: req.ip
      });

      res.status(201).json({
        message: 'Classe créée avec succès',
        classe,
        code: 'CLASS_CREATED'
      });

    } catch (error) {
      console.error('Erreur création classe:', error);
      res.status(500).json({
        error: `Erreur lors de la création de la classe: ${error}`,
        code: 'CLASS_CREATION_ERROR'
      });
    }
  },

  /**
   * Mettre à jour une classe
   */
  updateClasse: async (req, res) => {
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
      const updates = req.body;

      const classe = await Classe.findOne({
        where: applyEtablissementScope(req, { id })
      });

      if (!classe) {
        return res.status(404).json({
          error: 'Classe non trouvée',
          code: 'CLASS_NOT_FOUND'
        });
      }

      await classe.update(updates);

      await LogModification.create({
        utilisateur_id: req.utilisateur.id,
        table_concernee: 'classes',
        id_entite_concernee: classe.id,
        type_operation: TypeOperation.MODIFICATION,
        valeur_avant: { id: classe.id },
        valeur_apres: updates,
        adresse_ip: req.ip
      });

      res.json({
        message: 'Classe mise à jour avec succès',
        classe,
        code: 'CLASS_UPDATED'
      });

    } catch (error) {
      console.error('Erreur mise à jour classe:', error);
      res.status(500).json({
        error: 'Erreur lors de la mise à jour de la classe',
        code: 'CLASS_UPDATE_ERROR'
      });
    }
  },

  /**
   * Archiver une classe
   */
  archiveClasse: async (req, res) => {
    try {
      const { id } = req.params;

      const classe = await Classe.findOne({
        where: applyEtablissementScope(req, { id })
      });

      if (!classe) {
        return res.status(404).json({
          error: 'Classe non trouvée',
          code: 'CLASS_NOT_FOUND'
        });
      }

      await classe.archiver();

      await LogModification.create({
        utilisateur_id: req.utilisateur.id,
        table_concernee: 'classes',
        id_entite_concernee: classe.id,
        type_operation: TypeOperation.MODIFICATION,
        valeur_avant: { statut: classe.statut },
        valeur_apres: { statut: StatutClasse.ARCHIVEE },
        adresse_ip: req.ip
      });

      res.json({
        message: 'Classe archivée avec succès',
        classe,
        code: 'CLASS_ARCHIVED'
      });

    } catch (error) {
      console.error('Erreur archivage classe:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'archivage de la classe',
        code: 'CLASS_ARCHIVE_ERROR'
      });
    }
  },

  /**
   * Activer une classe
   */
  activateClasse: async (req, res) => {
    try {
      const { id } = req.params;

      const classe = await Classe.findOne({
        where: applyEtablissementScope(req, { id })
      });

      if (!classe) {
        return res.status(404).json({
          error: 'Classe non trouvée',
          code: 'CLASS_NOT_FOUND'
        });
      }

      await classe.activer();

      await LogModification.create({
        utilisateur_id: req.utilisateur.id,
        table_concernee: 'classes',
        id_entite_concernee: classe.id,
        type_operation: TypeOperation.MODIFICATION,
        valeur_avant: { statut: classe.statut },
        valeur_apres: { statut: StatutClasse.ACTIVE },
        adresse_ip: req.ip
      });

      res.json({
        message: 'Classe activée avec succès',
        classe,
        code: 'CLASS_ACTIVATED'
      });

    } catch (error) {
      console.error('Erreur activation classe:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'activation de la classe',
        code: 'CLASS_ACTIVATION_ERROR'
      });
    }
  },

  /**
   * Obtenir les statistiques d'une classe
   */
  getClasseStats: async (req, res) => {
    try {
      const { id } = req.params;

      const classe = await Classe.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!classe) {
        return res.status(404).json({
          error: 'Classe non trouvée',
          code: 'CLASS_NOT_FOUND'
        });
      }

      const [
        totalCours,
        totalEmploisTemps,
        activeEmploisTemps,
        totalHeuresHebdo
      ] = await Promise.all([
        Cours.count({ where: { classe_id: id } }),
        EmploiTemps.count({ where: { classe_id: id } }),
        EmploiTemps.count({ 
          where: { 
            classe_id: id,
            statut: 'PUBLIE' 
          } 
        }),
        Cours.sum('volume_horaire_hebdo', { where: { classe_id: id } })
      ]);

      res.json({
        stats: {
          effectif: classe.effectif,
          total_cours: totalCours,
          total_emplois_temps: totalEmploisTemps,
          active_emplois_temps: activeEmploisTemps,
          total_heures_hebdo: totalHeuresHebdo || 0
        },
        code: 'RECUPERATION_CLASS_STATS_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération statistiques classe:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des statistiques',
        code: 'RECUPERATION_CLASS_STATS_ERROR'
      });
    }
  }
};

module.exports = classeController;