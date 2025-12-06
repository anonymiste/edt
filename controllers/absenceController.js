// controllers/absenceController.js
const { Absence, Enseignant, Cours, Utilisateur } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { StatutAbsence, TypeOperation } = require('../utils/enums');

const absenceController = {
  /**
   * Récupérer toutes les absences
   */
  getAllAbsences: async (req, res) => {
    try {
      const { page = 1, limit = 10, enseignant_id, statut, date_debut, date_fin } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      // Filtrer par établissement via les relations
      const includeClause = [
        {
          association: 'enseignant',
          where: { etablissement_id: req.utilisateur.etablissement_id },
          include: [{
            association: 'utilisateur',
            attributes: ['id', 'nom', 'prenom']
          }]
        }
      ];

      if (enseignant_id) {
        whereClause.enseignant_id = enseignant_id;
      }

      if (statut) {
        whereClause.statut = statut;
      }

      if (date_debut && date_fin) {
        whereClause[Op.and] = [
          { date_debut: { [Op.lte]: date_fin } },
          { date_fin: { [Op.gte]: date_debut } }
        ];
      }

      const { count, rows: absences } = await Absence.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['date_debut', 'DESC']]
      });

      res.json({
        absences,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        code: 'ABSENCES_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération absences:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des absences',
        code: 'ABSENCES_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Récupérer une absence par ID
   */
  getAbsenceById: async (req, res) => {
    try {
      const { id } = req.params;

      const absence = await Absence.findOne({
        where: { id },
        include: [
          {
            association: 'enseignant',
            where: { etablissement_id: req.utilisateur.etablissement_id },
            include: [{
              association: 'utilisateur',
              attributes: ['id', 'nom', 'prenom', 'email', 'telephone']
            }]
          },
          {
            association: 'cours',
            include: [
              {
                association: 'classe',
                attributes: ['id', 'nom_classe', 'niveau']
              },
              {
                association: 'matiere',
                attributes: ['id', 'nom_matiere', 'code_matiere']
              }
            ]
          }
        ]
      });

      if (!absence) {
        return res.status(404).json({
          error: 'Absence non trouvée',
          code: 'ABSENCE_NOT_FOUND'
        });
      }

      res.json({
        absence,
        code: 'ABSENCE_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération absence:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'absence',
        code: 'ABSENCE_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Déclarer une nouvelle absence
   */
  declarerAbsence: async (req, res) => {
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
        enseignant_id,
        cours_id,
        date_debut,
        date_fin,
        motif,
        necessite_remplacement,
        cours_concernes
      } = req.body;

      // Vérifier que l'enseignant appartient à l'établissement
      const enseignant = await Enseignant.findOne({
        where: { 
          id: enseignant_id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!enseignant) {
        return res.status(404).json({
          error: 'Enseignant non trouvé',
          code: 'TEACHER_NOT_FOUND'
        });
      }

      // Vérifier que le cours appartient à l'établissement (si fourni)
      if (cours_id) {
        const cours = await Cours.findOne({
          where: { id: cours_id },
          include: [{
            association: 'classe',
            where: { etablissement_id: req.utilisateur.etablissement_id }
          }]
        });

        if (!cours) {
          return res.status(404).json({
            error: 'Cours non trouvé',
            code: 'COURS_NOT_FOUND'
          });
        }
      }

      const absence = await Absence.create({
        enseignant_id,
        cours_id,
        date_debut,
        date_fin,
        motif,
        necessite_remplacement: necessite_remplacement || false,
        cours_concernes,
        statut: StatutAbsence.DECLAREE
      });

      res.status(201).json({
        message: 'Absence déclarée avec succès',
        absence,
        code: 'ABSENCE_DECLARED'
      });

    } catch (error) {
      console.error('Erreur déclaration absence:', error);
      res.status(500).json({
        error: 'Erreur lors de la déclaration de l\'absence',
        code: 'ABSENCE_DECLARATION_ERROR'
      });
    }
  },

  /**
   * Valider une absence
   */
  validerAbsence: async (req, res) => {
    try {
      const { id } = req.params;

      const absence = await Absence.findOne({
        where: { id },
        include: [{
          association: 'enseignant',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }]
      });

      if (!absence) {
        return res.status(404).json({
          error: 'Absence non trouvée',
          code: 'ABSENCE_NOT_FOUND'
        });
      }

      await absence.valider();

      res.json({
        message: 'Absence validée avec succès',
        absence,
        code: 'ABSENCE_VALIDATED'
      });

    } catch (error) {
      console.error('Erreur validation absence:', error);
      res.status(500).json({
        error: 'Erreur lors de la validation de l\'absence',
        code: 'ABSENCE_VALIDATION_ERROR'
      });
    }
  },

  /**
   * Refuser une absence
   */
  refuserAbsence: async (req, res) => {
    try {
      const { id } = req.params;
      const { raison } = req.body;

      const absence = await Absence.findOne({
        where: { id },
        include: [{
          association: 'enseignant',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }]
      });

      if (!absence) {
        return res.status(404).json({
          error: 'Absence non trouvée',
          code: 'ABSENCE_NOT_FOUND'
        });
      }

      await absence.refuser(raison);

      res.json({
        message: 'Absence refusée avec succès',
        absence,
        code: 'ABSENCE_REFUSED'
      });

    } catch (error) {
      console.error('Erreur refus absence:', error);
      res.status(500).json({
        error: 'Erreur lors du refus de l\'absence',
        code: 'ABSENCE_REFUSAL_ERROR'
      });
    }
  },

  /**
   * Obtenir les absences en cours
   */
  getAbsencesEnCours: async (req, res) => {
    try {
      const aujourdhui = new Date().toISOString().split('T')[0];

      const absences = await Absence.findAll({
        where: {
          date_debut: { [Op.lte]: aujourdhui },
          date_fin: { [Op.gte]: aujourdhui },
          statut: StatutAbsence.VALIDEE
        },
        include: [
          {
            association: 'enseignant',
            where: { etablissement_id: req.utilisateur.etablissement_id },
            include: [{
              association: 'utilisateur',
              attributes: ['id', 'nom', 'prenom']
            }]
          },
          {
            association: 'cours',
            include: [
              {
                association: 'classe',
                attributes: ['id', 'nom_classe']
              },
              {
                association: 'matiere',
                attributes: ['id', 'nom_matiere']
              }
            ]
          }
        ],
        order: [['date_fin', 'ASC']]
      });

      res.json({
        absences_en_cours: absences,
        total: absences.length,
        code: 'CURRENT_ABSENCES_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération absences en cours:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des absences en cours',
        code: 'CURRENT_ABSENCES_ERROR'
      });
    }
  },

  /**
   * Obtenir les statistiques des absences
   */
  getAbsenceStats: async (req, res) => {
    try {
      const { periode_debut, periode_fin } = req.query;
      
      const whereClause = {};
      
      if (periode_debut && periode_fin) {
        whereClause.date_debut = {
          [Op.between]: [periode_debut, periode_fin]
        };
      }

      const stats = await Absence.findAll({
        where: whereClause,
        include: [{
          association: 'enseignant',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }],
        attributes: [
          'statut',
          'necessite_remplacement',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['statut', 'necessite_remplacement']
      });

      const total = await Absence.count({
        where: whereClause,
        include: [{
          association: 'enseignant',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }]
      });

      const moyenneDuree = await Absence.findOne({
        where: whereClause,
        include: [{
          association: 'enseignant',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }],
        attributes: [
          [sequelize.fn('AVG', 
            sequelize.literal(`EXTRACT(EPOCH FROM (date_fin - date_debut)) / 86400`)
          ), 'moyenne_duree']
        ]
      });

      res.json({
        stats: {
          total,
          par_statut_remplacement: stats,
          moyenne_duree_jours: moyenneDuree?.dataValues.moyenne_duree || 0
        },
        code: 'ABSENCES_STATS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération statistiques absences:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des statistiques',
        code: 'ABSENCES_STATS_ERROR'
      });
    }
  }
};

module.exports = absenceController;