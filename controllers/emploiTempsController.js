// controllers/emploiTempsController.js
const { EmploiTemps, Classe, Etablissement, Utilisateur, CreneauCours, Cours } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { StatutEmploiTemps, ModeGeneration, TypeOperation } = require('../utils/enums');

const emploiTempsController = {
  /**
   * Récupérer tous les emplois du temps
   */
  getAllEmploisTemps: async (req, res) => {
    try {
      const { page = 1, limit = 10, classe_id, statut, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { etablissement_id: req.utilisateur.etablissement_id };
      
      if (classe_id) {
        whereClause.classe_id = classe_id;
      }

      if (statut) {
        whereClause.statut = statut;
      }

      if (search) {
        whereClause.nom_version = { [Op.iLike]: `%${search}%` };
      }

      const { count, rows: emploisTemps } = await EmploiTemps.findAndCountAll({
        where: whereClause,
        include: [
          {
            association: 'classe',
            attributes: ['id', 'nom_classe', 'niveau']
          },
          {
            association: 'etablissement',
            attributes: ['id', 'nom']
          },
          {
            association: 'generateur',
            attributes: ['id', 'nom', 'prenom']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        emplois_temps: emploisTemps,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        code: 'SCHEDULES_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération emplois du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des emplois du temps',
        code: 'SCHEDULES_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Récupérer un emploi du temps par ID
   */
  getEmploiTempsById: async (req, res) => {
    try {
      const { id } = req.params;

      const emploiTemps = await EmploiTemps.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        },
        include: [
          {
            association: 'classe',
            attributes: ['id', 'nom_classe', 'niveau', 'effectif']
          },
          {
            association: 'etablissement',
            attributes: ['id', 'nom']
          },
          {
            association: 'generateur',
            attributes: ['id', 'nom', 'prenom']
          },
          {
            association: 'creneaux',
            include: [
              {
                association: 'cours',
                include: [
                  {
                    association: 'matiere',
                    attributes: ['id', 'nom_matiere', 'code_matiere', 'couleur_affichage']
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
                association: 'salle',
                attributes: ['id', 'nom_salle', 'batiment', 'capacite']
              }
            ],
            order: [
              ['jour_semaine', 'ASC'],
              ['heure_debut', 'ASC']
            ]
          }
        ]
      });

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      res.json({
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'emploi du temps',
        code: 'SCHEDULE_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Générer un nouvel emploi du temps
   */
  genererEmploiTemps: async (req, res) => {
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
        nom_version,
        periode_debut,
        periode_fin,
        mode_generation,
        parametres_generation,
        commentaires
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

      // Vérifier s'il existe déjà un emploi du temps avec le même nom
      const existingEmploiTemps = await EmploiTemps.findOne({
        where: { 
          nom_version,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (existingEmploiTemps) {
        return res.status(409).json({
          error: 'Un emploi du temps avec ce nom existe déjà',
          code: 'SCHEDULE_NAME_EXISTS'
        });
      }

      // Simuler la génération (dans la réalité, vous utiliseriez un algorithme de génération)
      const startTime = Date.now();
      
      // Ici, vous intégreriez votre algorithme de génération d'emploi du temps
      // Pour l'instant, on simule juste la création
      const emploiTemps = await EmploiTemps.create({
        classe_id,
        nom_version,
        periode_debut,
        periode_fin,
        statut: StatutEmploiTemps.BROUILLON,
        score_qualite: Math.random() * 100, // Score simulé
        mode_generation: mode_generation || ModeGeneration.EQUILIBRE,
        parametres_generation: parametres_generation || {},
        commentaires,
        generateur_id: req.utilisateur.id,
        etablissement_id: req.utilisateur.etablissement_id,
        duree_generation: 0 // Sera mis à jour après génération
      });

      // Simulation de génération de créneaux
      // Dans la réalité, vous généreriez les créneaux basés sur les cours de la classe
      const dureeGeneration = Date.now() - startTime;
      await emploiTemps.update({ 
        duree_generation: Math.floor(dureeGeneration / 1000) // en secondes
      });

      res.status(201).json({
        message: 'Emploi du temps généré avec succès',
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_GENERATED'
      });

    } catch (error) {
      console.error('Erreur génération emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la génération de l\'emploi du temps',
        code: 'SCHEDULE_GENERATION_ERROR'
      });
    }
  },

  /**
   * Valider un emploi du temps
   */
  validerEmploiTemps: async (req, res) => {
    try {
      const { id } = req.params;

      const emploiTemps = await EmploiTemps.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      await emploiTemps.valider();

      res.json({
        message: 'Emploi du temps validé avec succès',
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_VALIDATED'
      });

    } catch (error) {
      console.error('Erreur validation emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la validation de l\'emploi du temps',
        code: 'SCHEDULE_VALIDATION_ERROR'
      });
    }
  },

  /**
   * Publier un emploi du temps
   */
  publierEmploiTemps: async (req, res) => {
    try {
      const { id } = req.params;

      const emploiTemps = await EmploiTemps.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      // Vérifier que l'emploi du temps est validé avant publication
      if (emploiTemps.statut !== StatutEmploiTemps.VALIDE) {
        return res.status(400).json({
          error: 'L\'emploi du temps doit être validé avant publication',
          code: 'SCHEDULE_NOT_VALIDATED'
        });
      }

      await emploiTemps.publier();

      res.json({
        message: 'Emploi du temps publié avec succès',
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_PUBLISHED'
      });

    } catch (error) {
      console.error('Erreur publication emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la publication de l\'emploi du temps',
        code: 'SCHEDULE_PUBLICATION_ERROR'
      });
    }
  },

  /**
   * Archiver un emploi du temps
   */
  archiverEmploiTemps: async (req, res) => {
    try {
      const { id } = req.params;

      const emploiTemps = await EmploiTemps.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      await emploiTemps.archiver();

      res.json({
        message: 'Emploi du temps archivé avec succès',
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_ARCHIVED'
      });

    } catch (error) {
      console.error('Erreur archivage emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'archivage de l\'emploi du temps',
        code: 'SCHEDULE_ARCHIVE_ERROR'
      });
    }
  },

  /**
   * Dupliquer un emploi du temps
   */
  dupliquerEmploiTemps: async (req, res) => {
    try {
      const { id } = req.params;
      const { nom_nouvelle_version } = req.body;

      const emploiTempsOriginal = await EmploiTemps.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        },
        include: [{
          association: 'creneaux'
        }]
      });

      if (!emploiTempsOriginal) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      // Vérifier si le nom existe déjà
      const existingEmploiTemps = await EmploiTemps.findOne({
        where: { 
          nom_version: nom_nouvelle_version,
          etablissement_id: req.utilisateur.etablissement_id 
        }
      });

      if (existingEmploiTemps) {
        return res.status(409).json({
          error: 'Un emploi du temps avec ce nom existe déjà',
          code: 'SCHEDULE_NAME_EXISTS'
        });
      }

      // Créer la copie
      const nouvelEmploiTemps = await EmploiTemps.create({
        classe_id: emploiTempsOriginal.classe_id,
        nom_version: nom_nouvelle_version,
        periode_debut: emploiTempsOriginal.periode_debut,
        periode_fin: emploiTempsOriginal.periode_fin,
        statut: StatutEmploiTemps.BROUILLON,
        score_qualite: emploiTempsOriginal.score_qualite,
        mode_generation: emploiTempsOriginal.mode_generation,
        parametres_generation: emploiTempsOriginal.parametres_generation,
        commentaires: `Copie de ${emploiTempsOriginal.nom_version}`,
        generateur_id: req.utilisateur.id,
        etablissement_id: req.utilisateur.etablissement_id
      });

      // Copier les créneaux
      if (emploiTempsOriginal.creneaux && emploiTempsOriginal.creneaux.length > 0) {
        const creneauxCopies = emploiTempsOriginal.creneaux.map(creneau => ({
          emploi_temps_id: nouvelEmploiTemps.id,
          cours_id: creneau.cours_id,
          salle_id: creneau.salle_id,
          jour_semaine: creneau.jour_semaine,
          heure_debut: creneau.heure_debut,
          heure_fin: creneau.heure_fin,
          date_debut_validite: creneau.date_debut_validite,
          date_fin_validite: creneau.date_fin_validite,
          sequence_type: creneau.sequence_type,
          est_rattrapage: creneau.est_rattrapage,
          statut: 'planifie'
        }));

        await CreneauCours.bulkCreate(creneauxCopies);
      }

      res.status(201).json({
        message: 'Emploi du temps dupliqué avec succès',
        emploi_temps: nouvelEmploiTemps,
        code: 'SCHEDULE_DUPLICATED'
      });

    } catch (error) {
      console.error('Erreur duplication emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la duplication de l\'emploi du temps',
        code: 'SCHEDULE_DUPLICATION_ERROR'
      });
    }
  },

  /**
   * Obtenir les statistiques d'un emploi du temps
   */
  getEmploiTempsStats: async (req, res) => {
    try {
      const { id } = req.params;

      const emploiTemps = await EmploiTemps.findOne({
        where: { 
          id,
          etablissement_id: req.utilisateur.etablissement_id 
        },
        include: [
          {
            association: 'classe',
            attributes: ['nom_classe', 'effectif']
          },
          {
            association: 'creneaux',
            attributes: ['id', 'jour_semaine', 'heure_debut', 'heure_fin']
          }
        ]
      });

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      // Calculer les statistiques
      const totalCreneaux = emploiTemps.creneaux.length;
      const creneauxParJour = {};
      let totalHeures = 0;

      emploiTemps.creneaux.forEach(creneau => {
        const jour = creneau.jour_semaine;
        creneauxParJour[jour] = (creneauxParJour[jour] || 0) + 1;
        
        // Calculer la durée du créneau
        const [debutHeures, debutMinutes] = creneau.heure_debut.split(':').map(Number);
        const [finHeures, finMinutes] = creneau.heure_fin.split(':').map(Number);
        const duree = (finHeures * 60 + finMinutes) - (debutHeures * 60 + debutMinutes);
        totalHeures += duree;
      });

      const heuresTotales = (totalHeures / 60).toFixed(2);

      res.json({
        stats: {
          nom_version: emploiTemps.nom_version,
          classe: emploiTemps.classe.nom_classe,
          effectif: emploiTemps.classe.effectif,
          periode: `${emploiTemps.periode_debut} au ${emploiTemps.periode_fin}`,
          statut: emploiTemps.statut,
          score_qualite: emploiTemps.score_qualite,
          total_creneaux: totalCreneaux,
          creneaux_par_jour: creneauxParJour,
          heures_totales: heuresTotales,
          duree_generation: emploiTemps.duree_generation
        },
        code: 'SCHEDULE_STATS_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération statistiques emploi du temps:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des statistiques',
        code: 'SCHEDULE_STATS_ERROR'
      });
    }
  }
};

module.exports = emploiTempsController;