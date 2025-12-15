// controllers/emploiTempsController.js
const { EmploiTemps, Classe, Etablissement, Utilisateur, CreneauCours, Cours, Enseignant, Matiere, Salle, Eleve } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { StatutEmploiTemps, ModeGeneration, RoleUtilisateur, StatutCreneau } = require('../utils/enums');
const PDFDocument = require('pdfkit');
const { resolveScopedEtablissementId, applyEtablissementScope } = require('../utils/scope');

const emploiTempsController = {
  /**
   * Récupérer l'emploi du temps de l'utilisateur connecté
   */
  getMonEmploiTemps: async (req, res) => {
    try {
      const { semaine } = req.query;
      const utilisateur = req.utilisateur;

      let emploiTemps = null;

      // Selon le rôle, récupérer l'emploi du temps approprié
      if (utilisateur.role === RoleUtilisateur.ELEVE) {
        // Trouver l'élève et sa classe
        const eleve = await Eleve.findOne({
          where: { utilisateur_id: utilisateur.id },
          include: [{ association: 'classe', attributes: ['id'] }]
        });

        if (!eleve || !eleve.classe) {
          return res.status(404).json({
            error: 'Classe non trouvée pour cet élève',
            code: 'CLASS_NOT_FOUND'
          });
        }

        emploiTemps = await getEmploiTempsActif(eleve.classe.id, semaine, resolveScopedEtablissementId(req));
      } 
      else if (utilisateur.role === RoleUtilisateur.ENSEIGNANT) {
        const enseignant = await Enseignant.findOne({
          where: { utilisateur_id: utilisateur.id }
        });

        if (!enseignant) {
          return res.status(404).json({
            error: 'Enseignant non trouvé',
            code: 'TEACHER_NOT_FOUND'
          });
        }

        emploiTemps = await getEmploiTempsEnseignant(enseignant.id, semaine, resolveScopedEtablissementId(req));
      }
      else {
        return res.status(403).json({
          error: 'Accès non autorisé',
          code: 'ACCESS_DENIED'
        });
      }

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Aucun emploi du temps trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      res.json({
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération emploi du temps utilisateur:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'emploi du temps',
        code: 'SCHEDULE_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Récupérer l'emploi du temps d'une classe
   */
  getEmploiTempsParClasse: async (req, res) => {
    try {
      const { classeId } = req.params;
      const { semaine } = req.query;

      // Vérifier que la classe existe et appartient à l'établissement
      const classe = await Classe.findOne({
        where: applyEtablissementScope(req, { id: classeId })
      });

      if (!classe) {
        return res.status(404).json({
          error: 'Classe non trouvée',
          code: 'CLASS_NOT_FOUND'
        });
      }

      const emploiTemps = await getEmploiTempsActif(classeId, semaine, resolveScopedEtablissementId(req));

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Aucun emploi du temps publié trouvé pour cette classe',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      res.json({
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération emploi du temps classe:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'emploi du temps',
        code: 'SCHEDULE_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Récupérer l'emploi du temps d'un enseignant
   */
  getEmploiTempsParEnseignant: async (req, res) => {
    try {
      const { enseignantId } = req.params;
      const { semaine } = req.query;

      // Vérifier que l'enseignant existe
      const enseignant = await Enseignant.findOne({
        where: { id: enseignantId },
        include: [{
          association: 'utilisateur',
          where: { etablissement_id: resolveScopedEtablissementId(req) }
        }]
      });

      if (!enseignant) {
        return res.status(404).json({
          error: 'Enseignant non trouvé',
          code: 'TEACHER_NOT_FOUND'
        });
      }

      const emploiTemps = await getEmploiTempsEnseignant(enseignantId, semaine, resolveScopedEtablissementId(req));

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Aucun emploi du temps trouvé pour cet enseignant',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      res.json({
        emploi_temps: emploiTemps,
        code: 'SCHEDULE_RETRIEVED'
      });

    } catch (error) {
      console.error('Erreur récupération emploi du temps enseignant:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'emploi du temps',
        code: 'SCHEDULE_RETRIEVAL_ERROR'
      });
    }
  },

  /**
   * Récupérer tous les emplois du temps
   */
  getAllEmploisTemps: async (req, res) => {
    try {
      const { page = 1, limit = 10, classe_id, statut, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = applyEtablissementScope(req, {});
      
      if (classe_id) whereClause.classe_id = classe_id;
      if (statut) whereClause.statut = statut;
      if (search) whereClause.nom_version = { [Op.iLike]: `%${search}%` };

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

      const startTime = Date.now();
      
      const emploiTemps = await EmploiTemps.create({
        classe_id,
        nom_version,
        periode_debut,
        periode_fin,
        statut: StatutEmploiTemps.BROUILLON,
        score_qualite: Math.random() * 100,
        mode_generation: mode_generation || ModeGeneration.EQUILIBRE,
        parametres_generation: parametres_generation || {},
        commentaires,
        generateur_id: req.utilisateur.id,
        etablissement_id: req.utilisateur.etablissement_id,
        duree_generation: 0
      });

      const dureeGeneration = Date.now() - startTime;
      await emploiTemps.update({ 
        duree_generation: Math.floor(dureeGeneration / 1000)
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
        include: [{ association: 'creneaux' }]
      });

      if (!emploiTempsOriginal) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

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
          statut: StatutCreneau.PLANIFIE
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

      const totalCreneaux = emploiTemps.creneaux.length;
      const creneauxParJour = {};
      let totalHeures = 0;

      emploiTemps.creneaux.forEach(creneau => {
        const jour = creneau.jour_semaine;
        creneauxParJour[jour] = (creneauxParJour[jour] || 0) + 1;
        
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
  },

  /**
   * Créer une nouvelle séance
   */
  createSeance: async (req, res) => {
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
        emploi_temps_id,
        cours_id,
        salle_id,
        jour_semaine,
        heure_debut,
        heure_fin,
        date_debut_validite,
        date_fin_validite,
        est_rattrapage
      } = req.body;

      // Vérifier que l'emploi du temps existe
      const emploiTemps = await EmploiTemps.findOne({
        where: {
          id: emploi_temps_id,
          etablissement_id: req.utilisateur.etablissement_id
        }
      });

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Emploi du temps non trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      // Vérifier les conflits de créneaux
      const conflit = await CreneauCours.findOne({
        where: {
          emploi_temps_id,
          jour_semaine,
          [Op.or]: [
            {
              heure_debut: { [Op.between]: [heure_debut, heure_fin] }
            },
            {
              heure_fin: { [Op.between]: [heure_debut, heure_fin] }
            },
            {
              [Op.and]: [
                { heure_debut: { [Op.lte]: heure_debut } },
                { heure_fin: { [Op.gte]: heure_fin } }
              ]
            }
          ]
        }
      });

      if (conflit) {
        return res.status(409).json({
          error: 'Un créneau existe déjà sur cette plage horaire',
          code: 'TIME_SLOT_CONFLICT'
        });
      }

      const seance = await CreneauCours.create({
        emploi_temps_id,
        cours_id,
        salle_id,
        jour_semaine,
        heure_debut,
        heure_fin,
        date_debut_validite,
        date_fin_validite,
        est_rattrapage: est_rattrapage || false,
        statut: StatutCreneau.PLANIFIE
      });

      const seanceComplete = await CreneauCours.findByPk(seance.id, {
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
        ]
      });

      res.status(201).json({
        message: 'Séance créée avec succès',
        seance: seanceComplete,
        code: 'SESSION_CREATED'
      });

    } catch (error) {
      console.error('Erreur création séance:', error);
      res.status(500).json({
        error: 'Erreur lors de la création de la séance',
        code: 'SESSION_CREATION_ERROR'
      });
    }
  },

  /**
   * Mettre à jour une séance
   */
  updateSeance: async (req, res) => {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const seance = await CreneauCours.findOne({
        where: { id },
        include: [{
          association: 'emploiTemps',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }]
      });

      if (!seance) {
        return res.status(404).json({
          error: 'Séance non trouvée',
          code: 'SESSION_NOT_FOUND'
        });
      }

      const {
        cours_id,
        salle_id,
        jour_semaine,
        heure_debut,
        heure_fin,
        date_debut_validite,
        date_fin_validite,
        est_rattrapage
      } = req.body;

      // Vérifier les conflits si horaire modifié
      if (jour_semaine || heure_debut || heure_fin) {
        const conflit = await CreneauCours.findOne({
          where: {
            id: { [Op.ne]: id },
            emploi_temps_id: seance.emploi_temps_id,
            jour_semaine: jour_semaine || seance.jour_semaine,
            [Op.or]: [
              {
                heure_debut: { 
                  [Op.between]: [
                    heure_debut || seance.heure_debut, 
                    heure_fin || seance.heure_fin
                  ] 
                }
              },
              {
                heure_fin: { 
                  [Op.between]: [
                    heure_debut || seance.heure_debut, 
                    heure_fin || seance.heure_fin
                  ] 
                }
              }
            ]
          }
        });

        if (conflit) {
          return res.status(409).json({
            error: 'Un créneau existe déjà sur cette plage horaire',
            code: 'TIME_SLOT_CONFLICT'
          });
        }
      }

      await seance.update({
        cours_id: cours_id || seance.cours_id,
        salle_id: salle_id !== undefined ? salle_id : seance.salle_id,
        jour_semaine: jour_semaine || seance.jour_semaine,
        heure_debut: heure_debut || seance.heure_debut,
        heure_fin: heure_fin || seance.heure_fin,
        date_debut_validite: date_debut_validite || seance.date_debut_validite,
        date_fin_validite: date_fin_validite || seance.date_fin_validite,
        est_rattrapage: est_rattrapage !== undefined ? est_rattrapage : seance.est_rattrapage
      });

      const seanceComplete = await CreneauCours.findByPk(id, {
        include: [
          {
            association: 'cours',
            include: [
              { association: 'matiere' },
              {
                association: 'enseignant',
                include: [{ association: 'utilisateur' }]
              }
            ]
          },
          { association: 'salle' }
        ]
      });

      res.json({
        message: 'Séance mise à jour avec succès',
        seance: seanceComplete,
        code: 'SESSION_UPDATED'
      });

    } catch (error) {
      console.error('Erreur mise à jour séance:', error);
      res.status(500).json({
        error: 'Erreur lors de la mise à jour de la séance',
        code: 'SESSION_UPDATE_ERROR'
      });
    }
  },

  /**
   * Supprimer une séance
   */
  deleteSeance: async (req, res) => {
    try {
      const { id } = req.params;

      const seance = await CreneauCours.findOne({
        where: { id },
        include: [{
          association: 'emploiTemps',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }]
      });

      if (!seance) {
        return res.status(404).json({
          error: 'Séance non trouvée',
          code: 'SESSION_NOT_FOUND'
        });
      }

      await seance.destroy();

      res.json({
        message: 'Séance supprimée avec succès',
        code: 'SESSION_DELETED'
      });

    } catch (error) {
      console.error('Erreur suppression séance:', error);
      res.status(500).json({
        error: 'Erreur lors de la suppression de la séance',
        code: 'SESSION_DELETION_ERROR'
      });
    }
  },

  /**
   * Annuler une séance
   */
  annulerSeance: async (req, res) => {
    try {
      const { id } = req.params;
      const { motif } = req.body;

      const seance = await CreneauCours.findOne({
        where: { id },
        include: [{
          association: 'emploiTemps',
          where: { etablissement_id: req.utilisateur.etablissement_id }
        }]
      });

      if (!seance) {
        return res.status(404).json({
          error: 'Séance non trouvée',
          code: 'SESSION_NOT_FOUND'
        });
      }

      await seance.update({
        statut: StatutCreneau.ANNULE,
        motif_annulation: motif,
        date_annulation: new Date()
      });

      const seanceComplete = await CreneauCours.findByPk(id, {
        include: [
          {
            association: 'cours',
            include: [
              { association: 'matiere' },
              {
                association: 'enseignant',
                include: [{ association: 'utilisateur' }]
              }
            ]
          },
          { association: 'salle' }
        ]
      });

      res.json({
        message: 'Séance annulée avec succès',
        seance: seanceComplete,
        code: 'SESSION_CANCELLED'
      });

    } catch (error) {
      console.error('Erreur annulation séance:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'annulation de la séance',
        code: 'SESSION_CANCELLATION_ERROR'
      });
    }
  },

  /**
   * Exporter l'emploi du temps en PDF
   */
  exportPDF: async (req, res) => {
    try {
      const { classe_id, enseignant_id, semaine } = req.query;

      let emploiTemps;

      if (classe_id) {
        emploiTemps = await getEmploiTempsActif(classe_id, semaine, req.utilisateur.etablissement_id);
      } else if (enseignant_id) {
        emploiTemps = await getEmploiTempsEnseignant(enseignant_id, semaine, req.utilisateur.etablissement_id);
      } else {
        return res.status(400).json({
          error: 'Veuillez spécifier une classe ou un enseignant',
          code: 'MISSING_PARAMETERS'
        });
      }

      if (!emploiTemps) {
        return res.status(404).json({
          error: 'Aucun emploi du temps trouvé',
          code: 'SCHEDULE_NOT_FOUND'
        });
      }

      // Créer le PDF
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=emploi-temps-${Date.now()}.pdf`);
      
      doc.pipe(res);

      // Titre
      doc.fontSize(18).text('Emploi du Temps', { align: 'center' });
      doc.moveDown();
      
      if (classe_id) {
        doc.fontSize(12).text(`Classe: ${emploiTemps.classe?.nom_classe || 'N/A'}`, { align: 'center' });
      }
      
      doc.fontSize(10).text(`Période: ${emploiTemps.periode_debut} - ${emploiTemps.periode_fin}`, { align: 'center' });
      doc.moveDown(2);

      // Créer un tableau des créneaux
      const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
      const creneauxParJour = {};

      emploiTemps.creneaux?.forEach(creneau => {
        if (!creneauxParJour[creneau.jour_semaine]) {
          creneauxParJour[creneau.jour_semaine] = [];
        }
        creneauxParJour[creneau.jour_semaine].push(creneau);
      });

      jours.forEach(jour => {
        doc.fontSize(14).text(jour, { underline: true });
        doc.moveDown(0.5);

        const creneaux = creneauxParJour[jour] || [];
        if (creneaux.length === 0) {
          doc.fontSize(10).text('  Aucun cours', { italic: true });
        } else {
          creneaux.forEach(creneau => {
            const matiere = creneau.cours?.matiere?.nom_matiere || 'N/A';
            const enseignant = creneau.cours?.enseignant?.utilisateur ? 
              `${creneau.cours.enseignant.utilisateur.nom} ${creneau.cours.enseignant.utilisateur.prenom}` : 
              'N/A';
            const salle = creneau.salle?.nom_salle || 'N/A';
            
            doc.fontSize(10).text(
              `  ${creneau.heure_debut} - ${creneau.heure_fin} | ${matiere} | ${enseignant} | Salle: ${salle}`
            );
          });
        }
        doc.moveDown();
      });

      doc.end();

    } catch (error) {
      console.error('Erreur export PDF:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'export PDF',
        code: 'PDF_EXPORT_ERROR'
      });
    }
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère l'emploi du temps actif publié pour une classe
 */
async function getEmploiTempsActif(classeId, semaine, etablissementId) {
  const whereClause = {
    classe_id: classeId,
    etablissement_id: etablissementId,
    statut: StatutEmploiTemps.PUBLIE
  };

  if (semaine) {
    const [annee, semaineNum] = semaine.split('-W');
    const dateDebut = getDateFromWeek(parseInt(annee), parseInt(semaineNum));
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 6);

    whereClause.periode_debut = { [Op.lte]: dateFin };
    whereClause.periode_fin = { [Op.gte]: dateDebut };
  }

  return await EmploiTemps.findOne({
    where: whereClause,
    include: [
      {
        association: 'classe',
        attributes: ['id', 'nom_classe', 'niveau', 'effectif']
      },
      {
        association: 'creneaux',
        where: semaine ? getCreneauWhereClause(semaine) : {},
        required: false,
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
    ],
    order: [['created_at', 'DESC']]
  });
}

/**
 * Récupère l'emploi du temps consolidé d'un enseignant
 */
async function getEmploiTempsEnseignant(enseignantId, semaine, etablissementId) {
  const whereClause = {
    etablissement_id: etablissementId,
    statut: StatutEmploiTemps.PUBLIE
  };

  if (semaine) {
    const [annee, semaineNum] = semaine.split('-W');
    const dateDebut = getDateFromWeek(parseInt(annee), parseInt(semaineNum));
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 6);

    whereClause.periode_debut = { [Op.lte]: dateFin };
    whereClause.periode_fin = { [Op.gte]: dateDebut };
  }

  const emploisTemps = await EmploiTemps.findAll({
    where: whereClause,
    include: [
      {
        association: 'classe',
        attributes: ['id', 'nom_classe', 'niveau']
      },
      {
        association: 'creneaux',
        where: {
          ...(semaine ? getCreneauWhereClause(semaine) : {})
        },
        required: true,
        include: [
          {
            association: 'cours',
            where: { enseignant_id: enseignantId },
            required: true,
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
        ]
      }
    ]
  });

  if (emploisTemps.length === 0) {
    return null;
  }

  // Fusionner tous les créneaux de tous les emplois du temps
  const tousLesCreneaux = [];
  emploisTemps.forEach(et => {
    et.creneaux.forEach(creneau => {
      tousLesCreneaux.push({
        ...creneau.toJSON(),
        classe: et.classe
      });
    });
  });

  // Retourner un objet consolidé
  return {
    id: 'enseignant-' + enseignantId,
    nom_version: 'Planning Enseignant',
    periode_debut: emploisTemps[0].periode_debut,
    periode_fin: emploisTemps[0].periode_fin,
    statut: StatutEmploiTemps.PUBLIE,
    creneaux: tousLesCreneaux.sort((a, b) => {
      if (a.jour_semaine !== b.jour_semaine) {
        return a.jour_semaine.localeCompare(b.jour_semaine);
      }
      return a.heure_debut.localeCompare(b.heure_debut);
    })
  };
}

/**
 * Génère la clause WHERE pour filtrer les créneaux par semaine
 */
function getCreneauWhereClause(semaine) {
  const [annee, semaineNum] = semaine.split('-W');
  const dateDebut = getDateFromWeek(parseInt(annee), parseInt(semaineNum));
  const dateFin = new Date(dateDebut);
  dateFin.setDate(dateFin.getDate() + 6);

  return {
    [Op.or]: [
      {
        date_debut_validite: { [Op.lte]: dateFin },
        date_fin_validite: { [Op.gte]: dateDebut }
      },
      {
        date_debut_validite: null,
        date_fin_validite: null
      }
    ]
  };
}

/**
 * Convertit une semaine ISO (année, numéro de semaine) en date
 */
function getDateFromWeek(year, week) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7;
  const firstMonday = new Date(firstDayOfYear);
  
  // Trouver le premier lundi de l'année
  const dayOfWeek = firstDayOfYear.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
  firstMonday.setDate(firstDayOfYear.getDate() + daysToMonday);
  
  // Ajouter les semaines
  firstMonday.setDate(firstMonday.getDate() + daysOffset);
  
  return firstMonday;
}

module.exports = emploiTempsController;