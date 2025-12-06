// controllers/enseignantController.js
const { Enseignant, Utilisateur, Etablissement, Cours, Disponibilite, Matiere } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { StatutProfessionnel, PreferenceHoraire, TypeOperation } = require('../utils/enums');

const enseignantController = {
  /**
   * Récupérer tous les enseignants
   */
  getAllEnseignants: async (req, res) => {
    try {
      const { page = 1, limit = 10, statut, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { etablissement_id: req.utilisateur.etablissement_id };
      
      if (statut) {
        whereClause.statut = statut;
      }

      if (search) {
        whereClause[Op.or] = [
          { '$utilisateur.nom$': { [Op.iLike]: `%${search}%` } },
          { '$utilisateur.prenom$': { [Op.iLike]: `%${search}%` } },
          { matricule: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: enseignants } = await Enseignant.findAndCountAll({
        where: whereClause,
        include: [
          {
            association: 'utilisateur',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone']
          },
          {
            association: 'etablissement',
            attributes: ['id', 'nom']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        enseignants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        code: 'RECUPERATION_TEACHERS_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération enseignants:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des enseignants',
        code: 'RECUPERATION_TEACHERS_ERROR'
      });
    }
  },

  /**
   * Récupérer un enseignant par ID
   */
  getEnseignantById: async (req, res) => {
    try {
      const { id } = req.params;

      const enseignant = await Enseignant.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        },
        include: [
          {
            association: 'utilisateur',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'photo_url']
          },
          {
            association: 'etablissement',
            attributes: ['id', 'nom']
          },
          {
            association: 'cours',
            include: [
              {
                association: 'matiere',
                attributes: ['id', 'nom_matiere', 'code_matiere']
              },
              {
                association: 'classe',
                attributes: ['id', 'nom_classe', 'niveau']
              }
            ]
          },
          {
            association: 'matieres',
            through: { attributes: [] },
            attributes: ['id', 'nom_matiere', 'code_matiere']
          },
          {
            association: 'disponibilites',
            attributes: ['id', 'jour_semaine', 'heure_debut', 'heure_fin', 'type', 'recurrent']
          }
        ]
      });

      if (!enseignant) {
        return res.status(404).json({
          error: 'Enseignant non trouvé',
          code: 'TEACHER_NOT_FOUND'
        });
      }

      res.json({
        enseignant,
        code: 'RECUPERATION_TEACHER_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération enseignant:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'enseignant',
        code: 'RECUPERATION_TEACHER_ERROR'
      });
    }
  },

  /**
   * Créer un nouvel enseignant
   */
  createEnseignant: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }
      console.log(req.body);
      

      const {
        utilisateur_id,
        matricule,
        statut,
        date_embauche,
        heures_contractuelles_hebdo,
        heures_max_journalieres,
        cours_consecutifs_max,
        preference_horaire,
        multi_sites
      } = req.body;

      // Vérifier si le matricule existe déjà
      const existingEnseignant = await Enseignant.findOne({ 
        where: { 
          matricule,
          etablissement_id: req.utilisateur.etablissement_id
        } 
      });

      if (existingEnseignant) {
        return res.status(409).json({
          error: 'Un enseignant avec ce matricule existe déjà',
          code: 'TEACHER_MATRICULE_EXISTS'
        });
      }

      // Vérifier que l'utilisateur existe
      const utilisateur = await Utilisateur.findOne({
        where: { 
          id: utilisateur_id,
          etablissement_id: req.utilisateur.etablissement_id
        }
      });

      if (!utilisateur) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      const enseignant = await Enseignant.create({
        utilisateur_id,
        matricule,
        statut,
        date_embauche,
        heures_contractuelles_hebdo,
        heures_max_journalieres: heures_max_journalieres || 480,
        cours_consecutifs_max: cours_consecutifs_max || 4,
        preference_horaire: preference_horaire || PreferenceHoraire.INDIFFERENT,
        multi_sites: multi_sites || false,
        etablissement_id: req.utilisateur.etablissement_id
      });

      res.status(201).json({
        message: 'Enseignant créé avec succès',
        enseignant,
        code: 'TEACHER_CREATED'
      });

    } catch (error) {
      console.error('Erreur création enseignant:', error);
      res.status(500).json({
        error: 'Erreur lors de la création de l\'enseignant',
        code: 'TEACHER_CREATION_ERROR'
      });
    }
  },

  /**
   * Mettre à jour un enseignant
   */
  updateEnseignant: async (req, res) => {
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

      const enseignant = await Enseignant.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!enseignant) {
        return res.status(404).json({
          error: 'Enseignant non trouvé',
          code: 'TEACHER_NOT_FOUND'
        });
      }

      // Vérifier si le nouveau matricule existe déjà (sauf pour cet enseignant)
      if (updates.matricule && updates.matricule !== enseignant.matricule) {
        const existingEnseignant = await Enseignant.findOne({ 
          where: { 
            matricule: updates.matricule,
            etablissement_id: req.utilisateur.etablissement_id,
            id: { [Op.ne]: id }
          } 
        });

        if (existingEnseignant) {
          return res.status(409).json({
            error: 'Un enseignant avec ce matricule existe déjà',
            code: 'TEACHER_MATRICULE_EXISTS'
          });
        }
      }

      await enseignant.update(updates);

      res.json({
        message: 'Enseignant mis à jour avec succès',
        enseignant,
        code: 'TEACHER_UPDATED'
      });

    } catch (error) {
      console.error('Erreur mise à jour enseignant:', error);
      res.status(500).json({
        error: 'Erreur lors de la mise à jour de l\'enseignant',
        code: 'TEACHER_UPDATE_ERROR'
      });
    }
  },

  /**
   * Associer des matières à un enseignant
   */
  assignMatieres: async (req, res) => {
    try {
      const { id } = req.params;
      const { matiere_ids } = req.body;

      const enseignant = await Enseignant.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!enseignant) {
        return res.status(404).json({
          error: 'Enseignant non trouvé',
          code: 'TEACHER_NOT_FOUND'
        });
      }

      // Vérifier que toutes les matières existent dans le même établissement
      const matieres = await Matiere.findAll({
        where: { 
          id: matiere_ids,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (matieres.length !== matiere_ids.length) {
        return res.status(404).json({
          error: 'Une ou plusieurs matières non trouvées',
          code: 'MATIERES_NOT_FOUND'
        });
      }

      await enseignant.setMatieres(matieres);

      res.json({
        message: 'Matières associées à l\'enseignant avec succès',
        code: 'MATIERES_ASSIGNED'
      });

    } catch (error) {
      console.error('Erreur association matières:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'association des matières',
        code: 'MATIERES_ASSIGNMENT_ERROR'
      });
    }
  },

  /**
   * Obtenir l'emploi du temps d'un enseignant
   */
  getEmploiTemps: async (req, res) => {
    try {
      const { id } = req.params;
      const { date_debut, date_fin } = req.query;

      const enseignant = await Enseignant.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!enseignant) {
        return res.status(404).json({
          error: 'Enseignant non trouvé',
          code: 'TEACHER_NOT_FOUND'
        });
      }

      const whereClause = { enseignant_id: id };
      
      if (date_debut && date_fin) {
        whereClause[Op.and] = [
          { date_fin_validite: { [Op.gte]: date_debut } },
          { date_debut_validite: { [Op.lte]: date_fin } }
        ];
      }

      const creneaux = await CreneauCours.findAll({
        where: whereClause,
        include: [
          {
            association: 'cours',
            include: [
              {
                association: 'matiere',
                attributes: ['id', 'nom_matiere', 'code_matiere', 'couleur_affichage']
              },
              {
                association: 'classe',
                attributes: ['id', 'nom_classe', 'niveau']
              },
              {
                association: 'salle',
                attributes: ['id', 'nom_salle', 'batiment']
              }
            ]
          },
          {
            association: 'emploi_temps',
            attributes: ['id', 'nom_version', 'statut']
          }
        ],
        order: [
          ['jour_semaine', 'ASC'],
          ['heure_debut', 'ASC']
        ]
      });

      res.json({
        enseignant: {
          id: enseignant.id,
          nom_complet: `${enseignant.utilisateur.prenom} ${enseignant.utilisateur.nom}`,
          matricule: enseignant.matricule
        },
        creneaux,
        code: 'RECUPERATION_TEACHER_SCHEDULE_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'emploi du temps',
        code: 'RECUPERATION_TEACHER_SCHEDULE_ERROR'
      });
    }
  },

  /**
   * Obtenir les statistiques d'un enseignant
   */
  getEnseignantStats: async (req, res) => {
    try {
      const { id } = req.params;

      const enseignant = await Enseignant.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        },
        include: [{
          association: 'utilisateur',
          attributes: ['nom', 'prenom']
        }]
      });

      if (!enseignant) {
        return res.status(404).json({
          error: 'Enseignant non trouvé',
          code: 'TEACHER_NOT_FOUND'
        });
      }

      const [
        totalCours,
        totalMatieres,
        totalClasses,
        totalHeuresHebdo,
        totalDisponibilites
      ] = await Promise.all([
        Cours.count({ where: { enseignant_id: id } }),
        enseignant.countMatieres(),
        Cours.count({ 
          where: { enseignant_id: id },
          distinct: true,
          col: 'classe_id'
        }),
        Cours.sum('volume_horaire_hebdo', { where: { enseignant_id: id } }),
        Disponibilite.count({ where: { enseignant_id: id } })
      ]);

      res.json({
        stats: {
          nom_complet: `${enseignant.utilisateur.prenom} ${enseignant.utilisateur.nom}`,
          matricule: enseignant.matricule,
          statut: enseignant.statut,
          heures_contractuelles: enseignant.heures_contractuelles_hebdo,
          total_cours: totalCours,
          total_matieres: totalMatieres,
          total_classes: totalClasses,
          total_heures_hebdo: totalHeuresHebdo || 0,
          total_disponibilites: totalDisponibilites
        },
        code: 'RECUPERATION_TEACHER_STATS_SUCCESS'
      });

    } catch (error) {
      console.error('Erreur récupération statistiques enseignant:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des statistiques',
        code: 'RECUPERATION_TEACHER_STATS_ERROR'
      });
    }
  }
};

module.exports = enseignantController;