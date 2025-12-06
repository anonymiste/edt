// controllers/coursController.js
const { Cours, Classe, Matiere, Enseignant, Salle, CreneauCours } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { TypeCours, TypeOperation } = require('../utils/enums');

const coursController = {
  /**
   * Récupérer tous les cours
   */
  getAllCours: async (req, res) => {
    try {
      const { page = 1, limit = 10, classe_id, matiere_id, enseignant_id, type_cours } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      // Filtrer par établissement via les relations
      const includeClause = [
        {
          association: 'classe',
          where: { etablissement_id: req.utilisateur.etablissement_id },
          attributes: ['id', 'nom_classe']
        },
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
        },
        {
          association: 'salle',
          attributes: ['id', 'nom_salle', 'batiment']
        }
      ];

      if (classe_id) {
        whereClause.classe_id = classe_id;
      }

      if (matiere_id) {
        whereClause.matiere_id = matiere_id;
      }

      if (enseignant_id) {
        whereClause.enseignant_id = enseignant_id;
      }

      if (type_cours) {
        whereClause.type_cours = type_cours;
      }

      const { count, rows: cours } = await Cours.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        cours,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        code: 'COURS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération cours:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des cours',
        code: 'COURS_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Récupérer un cours par ID
   */
  getCoursById: async (req, res) => {
    try {
      const { id } = req.params;

      const cours = await Cours.findOne({
        where: { id },
        include: [
          {
            association: 'classe',
            where: { etablissement_id: req.utilisateur.etablissement_id },
            attributes: ['id', 'nom_classe', 'niveau', 'effectif']
          },
          {
            association: 'matiere',
            attributes: ['id', 'nom_matiere', 'code_matiere', 'couleur_affichage']
          },
          {
            association: 'enseignant',
            include: [{
              association: 'utilisateur',
              attributes: ['id', 'nom', 'prenom', 'email']
            }]
          },
          {
            association: 'salle',
            attributes: ['id', 'nom_salle', 'batiment', 'capacite']
          },
          {
            association: 'creneaux',
            include: [{
              association: 'emploi_temps',
              attributes: ['id', 'nom_version', 'statut']
            }]
          },
          {
            association: 'rattrapages',
            attributes: ['id', 'type_rattrapage', 'statut', 'date_demande']
          },
          {
            association: 'absences',
            attributes: ['id', 'date_debut', 'date_fin', 'statut']
          }
        ]
      });

      if (!cours) {
        return res.status(404).json({
          error: 'Cours non trouvé',
          code: 'COURS_NOT_FOUND'
        });
      }

      res.json({
        cours,
        code: 'COURS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération cours:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération du cours',
        code: 'COURS_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Créer un nouveau cours
   */
  createCours: async (req, res) => {
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
        classe_id,
        matiere_id,
        enseignant_id,
        salle_id,
        volume_horaire_hebdo,
        duree_seance_standard,
        type_cours,
        enseignement_en_ligne,
        effectif_max,
        couleur_affichage,
        groupe_id
      } = req.body;

      // Vérifier que la classe appartient à l'établissement
      const classe = await Classe.findOne({
        where: { 
          id: classe_id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!classe) {
        return res.status(404).json({
          error: 'Classe non trouvée',
          code: 'CLASS_NOT_FOUND'
        });
      }

      // Vérifier que la matière appartient à l'établissement
      const matiere = await Matiere.findOne({
        where: { 
          id: matiere_id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!matiere) {
        return res.status(404).json({
          error: 'Matière non trouvée',
          code: 'MATIERE_NOT_FOUND'
        });
      }

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

      // Vérifier que la salle appartient à l'établissement (si fournie)
      if (salle_id) {
        const salle = await Salle.findOne({
          where: { 
            id: salle_id,
            etablissement_id: req.utilisateur.etablissement_id 
          }
        });

        if (!salle) {
          return res.status(404).json({
            error: 'Salle non trouvée',
            code: 'SALLE_NOT_FOUND'
          });
        }
      }

      const cours = await Cours.create({
        classe_id,
        matiere_id,
        enseignant_id,
        salle_id,
        volume_horaire_hebdo,
        duree_seance_standard,
        type_cours,
        enseignement_en_ligne: enseignement_en_ligne || false,
        effectif_max,
        couleur_affichage,
        groupe_id
      });

      res.status(201).json({
        message: 'Cours créé avec succès',
        cours,
        code: 'COURS_CREATED'
      });

    } catch (error) {
      console.error('Erreur création cours:', error);
      res.status(500).json({
        error: 'Erreur lors de la création du cours',
        code: 'COURS_CREATION_ERROR'
      });
    }
  },

  /**
   * Mettre à jour un cours
   */
  updateCours: async (req, res) => {
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

      const cours = await Cours.findOne({
        where: { id },
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

      // Vérifier les relations si elles sont mises à jour
      if (updates.classe_id) {
        const classe = await Classe.findOne({
          where: { 
            id: updates.classe_id,
            etablissement_id: req.utilisateur.etablissement_id 
          }
        });

        if (!classe) {
          return res.status(404).json({
            error: 'Classe non trouvée',
            code: 'CLASS_NOT_FOUND'
          });
        }
      }

      if (updates.matiere_id) {
        const matiere = await Matiere.findOne({
          where: { 
            id: updates.matiere_id,
            etablissement_id: req.utilisateur.etablissement_id 
          }
        });

        if (!matiere) {
          return res.status(404).json({
            error: 'Matière non trouvée',
            code: 'MATIERE_NOT_FOUND'
          });
        }
      }

      if (updates.enseignant_id) {
        const enseignant = await Enseignant.findOne({
          where: { 
            id: updates.enseignant_id,
            etablissement_id: req.utilisateur.etablissement_id 
          }
        });

        if (!enseignant) {
          return res.status(404).json({
            error: 'Enseignant non trouvé',
            code: 'TEACHER_NOT_FOUND'
          });
        }
      }

      if (updates.salle_id) {
        const salle = await Salle.findOne({
          where: { 
            id: updates.salle_id,
            etablissement_id: req.utilisateur.etablissement_id 
          }
        });

        if (!salle) {
          return res.status(404).json({
            error: 'Salle non trouvée',
            code: 'SALLE_NOT_FOUND'
          });
        }
      }

      await cours.update(updates);

      res.json({
        message: 'Cours mis à jour avec succès',
        cours,
        code: 'COURS_UPDATED'
      });

    } catch (error) {
      console.error('Erreur mise à jour cours:', error);
      res.status(500).json({
        error: 'Erreur lors de la mise à jour du cours',
        code: 'COURS_UPDATE_ERROR'
      });
    }
  },

  /**
   * Obtenir les créneaux d'un cours
   */
  getCreneaux: async (req, res) => {
    try {
      const { id } = req.params;

      const cours = await Cours.findOne({
        where: { id },
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

      const creneaux = await CreneauCours.findAll({
        where: { cours_id: id },
        include: [
          {
            association: 'emploi_temps',
            attributes: ['id', 'nom_version', 'statut', 'periode_debut', 'periode_fin']
          },
          {
            association: 'salle',
            attributes: ['id', 'nom_salle', 'batiment']
          }
        ],
        order: [
          ['jour_semaine', 'ASC'],
          ['heure_debut', 'ASC']
        ]
      });

      res.json({
        cours: {
          id: cours.id,
          type_cours: cours.type_cours,
          volume_horaire_hebdo: cours.volume_horaire_hebdo
        },
        creneaux,
        code: 'COURS_SLOTS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération créneaux:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des créneaux',
        code: 'COURS_SLOTS_ERROR'
      });
    }
  },

  /**
   * Obtenir les statistiques d'un cours
   */
  getCoursStats: async (req, res) => {
    try {
      const { id } = req.params;

      const cours = await Cours.findOne({
        where: { id },
        include: [
          {
            association: 'classe',
            where: { etablissement_id: req.utilisateur.etablissement_id }
          },
          {
            association: 'matiere',
            attributes: ['nom_matiere']
          },
          {
            association: 'enseignant',
            include: [{
              association: 'utilisateur',
              attributes: ['nom', 'prenom']
            }]
          }
        ]
      });

      if (!cours) {
        return res.status(404).json({
          error: 'Cours non trouvé',
          code: 'COURS_NOT_FOUND'
        });
      }

      const [
        totalCreneaux,
        creneauxConfirmes,
        totalRattrapages,
        totalAbsences,
        nombreSeancesHebdo
      ] = await Promise.all([
        CreneauCours.count({ where: { cours_id: id } }),
        CreneauCours.count({ where: { cours_id: id, statut: 'confirme' } }),
        Rattrapage.count({ where: { cours_id: id } }),
        Absence.count({ where: { cours_id: id } }),
        cours.getNombreSeancesHebdo()
      ]);

      res.json({
        stats: {
          matiere: cours.matiere.nom_matiere,
          classe: cours.classe.nom_classe,
          enseignant: `${cours.enseignant.utilisateur.prenom} ${cours.enseignant.utilisateur.nom}`,
          type_cours: cours.type_cours,
          volume_horaire_hebdo: cours.volume_horaire_hebdo,
          nombre_seances_hebdo: nombreSeancesHebdo,
          total_creneaux: totalCreneaux,
          creneaux_confirmes: creneauxConfirmes,
          total_rattrapages: totalRattrapages,
          total_absences: totalAbsences,
          taux_presence: totalCreneaux > 0 ? ((totalCreneaux - totalAbsences) / totalCreneaux * 100).toFixed(2) : 0
        },
        code: 'COURS_STATS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération statistiques cours:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des statistiques',
        code: 'COURS_STATS_ERROR'
      });
    }
  }
};

module.exports = coursController;