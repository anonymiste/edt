// services/generationService.js
const { Cours, Classe, Enseignant, Salle, Disponibilite, Contrainte } = require('../database/models');
const { TypeCours, JourSemaine, ModeGeneration } = require('../utils/enums');
const CSPAlgorithm = require('./algorithmes/cspAlgorithm');
const GeneticAlgorithm = require('./algorithmes/geneticAlgorithm');
const ConstraintEngine = require('./algorithmes/constraintEngine');

class GenerationService {
  /**
   * Générer un emploi du temps pour une classe
   */
  static async genererEmploiTemps(classeId, parametres = {}) {
    try {
      // Récupérer les données nécessaires
      const [cours, enseignants, salles, contraintes] = await Promise.all([
        this.getCoursParClasse(classeId),
        this.getEnseignantsDisponibles(),
        this.getSallesDisponibles(),
        this.getContraintesEtablissement()
      ]);

      // Préparer les données pour l'algorithme
      const donneesGeneration = {
        cours,
        enseignants,
        salles,
        contraintes,
        parametres
      };

      // Choisir l'algorithme en fonction des paramètres
      const algorithme = this.choisirAlgorithme(parametres.mode_generation);
      
      // Générer l'emploi du temps
      const resultat = await algorithme.generer(donneesGeneration);

      return this.formaterResultat(resultat, classeId, parametres);

    } catch (error) {
      console.error('Erreur génération emploi du temps:', error);
      throw new Error(`Échec de la génération: ${error.message}`);
    }
  }

  /**
   * Récupérer les cours d'une classe
   */
  static async getCoursParClasse(classeId) {
    return await Cours.findAll({
      where: { classe_id: classeId },
      include: [
        {
          association: 'matiere',
          attributes: ['id', 'nom_matiere', 'duree_standard', 'type_cours']
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
  }

  /**
   * Récupérer les enseignants disponibles
   */
  static async getEnseignantsDisponibles() {
    const enseignants = await Enseignant.findAll({
      include: [
        {
          association: 'utilisateur',
          attributes: ['nom', 'prenom']
        },
        {
          association: 'disponibilites',
          attributes: ['jour_semaine', 'heure_debut', 'heure_fin', 'type']
        },
        {
          association: 'cours',
          attributes: ['id', 'volume_horaire_hebdo']
        }
      ]
    });

    return enseignants.map(enseignant => ({
      id: enseignant.id,
      nom_complet: `${enseignant.utilisateur.prenom} ${enseignant.utilisateur.nom}`,
      heures_contractuelles: enseignant.heures_contractuelles_hebdo,
      heures_actuelles: enseignant.cours.reduce((total, cours) => total + cours.volume_horaire_hebdo, 0),
      disponibilites: enseignant.disponibilites,
      cours_consecutifs_max: enseignant.cours_consecutifs_max,
      preference_horaire: enseignant.preference_horaire
    }));
  }

  /**
   * Récupérer les salles disponibles
   */
  static async getSallesDisponibles() {
    return await Salle.findAll({
      where: { statut: 'disponible' },
      attributes: ['id', 'nom_salle', 'type_salle', 'capacite', 'batiment']
    });
  }

  /**
   * Récupérer les contraintes de l'établissement
   */
  static async getContraintesEtablissement() {
    return await Contrainte.findAll({
      where: { active: true },
      attributes: ['id', 'nom', 'type', 'categorie', 'poids', 'parametres']
    });
  }

  /**
   * Choisir l'algorithme de génération
   */
  static choisirAlgorithme(mode = ModeGeneration.EQUILIBRE) {
    const algorithmes = {
      [ModeGeneration.RAPIDE]: CSPAlgorithm,
      [ModeGeneration.EQUILIBRE]: GeneticAlgorithm,
      [ModeGeneration.OPTIMAL]: GeneticAlgorithm // Avec plus d'itérations
    };

    return algorithmes[mode] || GeneticAlgorithm;
  }

  /**
   * Formater le résultat de la génération
   */
  static formaterResultat(resultat, classeId, parametres) {
    return {
      classe_id: classeId,
      creneaux: resultat.creneaux,
      score_qualite: resultat.score,
      conflits: resultat.conflits || [],
      statistiques: {
        total_creneaux: resultat.creneaux.length,
        taux_remplissage: this.calculerTauxRemplissage(resultat.creneaux),
        respect_contraintes: this.calculerRespectContraintes(resultat),
        equilibre_charge: this.calculerEquilibreCharge(resultat)
      },
      parametres_utilises: parametres,
      date_generation: new Date()
    };
  }

  /**
   * Calculer le taux de remplissage
   */
  static calculerTauxRemplissage(creneaux) {
    if (!creneaux || creneaux.length === 0) return 0;
    
    const totalSlots = 5 * 8; // 5 jours × 8 créneaux par jour
    const slotsUtilises = new Set();
    
    creneaux.forEach(creneau => {
      const slotKey = `${creneau.jour}-${creneau.creneau}`;
      slotsUtilises.add(slotKey);
    });

    return (slotsUtilises.size / totalSlots) * 100;
  }

  /**
   * Calculer le respect des contraintes
   */
  static calculerRespectContraintes(resultat) {
    const contraintesTotal = resultat.contraintes_evaluees?.length || 0;
    const contraintesRespectees = resultat.contraintes_respectees?.length || 0;
    
    return contraintesTotal > 0 ? (contraintesRespectees / contraintesTotal) * 100 : 100;
  }

  /**
   * Calculer l'équilibre de charge
   */
  static calculerEquilibreCharge(resultat) {
    // Implémentation simplifiée - calculer la variance de la charge entre enseignants
    const charges = Object.values(resultat.charge_enseignants || {});
    if (charges.length === 0) return 100;

    const moyenne = charges.reduce((a, b) => a + b, 0) / charges.length;
    const variance = charges.reduce((acc, charge) => acc + Math.pow(charge - moyenne, 2), 0) / charges.length;
    
    // Score basé sur l'inverse de la variance (plus c'est bas, mieux c'est)
    const score = Math.max(0, 100 - (variance * 10));
    return Math.min(100, score);
  }

  /**
   * Vérifier la faisabilité avant génération
   */
  static async verifierFaisabilite(classeId) {
    const [cours, enseignants, salles] = await Promise.all([
      this.getCoursParClasse(classeId),
      this.getEnseignantsDisponibles(),
      this.getSallesDisponibles()
    ]);

    const problems = [];

    // Vérifier la charge des enseignants
    enseignants.forEach(enseignant => {
      const chargeActuelle = enseignant.heures_actuelles;
      const chargeMax = enseignant.heures_contractuelles;
      
      if (chargeActuelle >= chargeMax) {
        problems.push(`Enseignant ${enseignant.nom_complet} a atteint sa charge maximale`);
      }
    });

    // Vérifier les salles spécialisées
    const coursSpeciaux = cours.filter(c => 
      c.matiere.type_cours === TypeCours.TP || 
      c.matiere.necessite_equipement_special
    );

    const sallesSpecialisees = salles.filter(s => 
      s.type_salle !== 'standard'
    );

    if (coursSpeciaux.length > sallesSpecialisees.length) {
      problems.push('Nombre insuffisant de salles spécialisées pour les TP');
    }

    // Vérifier les disponibilités
    const totalHeuresNecessaires = cours.reduce((total, c) => 
      total + c.volume_horaire_hebdo, 0
    );

    const heuresDisponibles = enseignants.reduce((total, e) => 
      total + (e.heures_contractuelles - e.heures_actuelles), 0
    );

    if (totalHeuresNecessaires > heuresDisponibles) {
      problems.push('Heures disponibles insuffisantes pour couvrir tous les cours');
    }

    return {
      faisable: problems.length === 0,
      problems,
      resume: {
        total_cours: cours.length,
        total_heures: totalHeuresNecessaires,
        heures_disponibles: heuresDisponibles,
        enseignants_disponibles: enseignants.length,
        salles_disponibles: salles.length
      }
    };
  }

  /**
   * Optimiser un emploi du temps existant
   */
  static async optimiserEmploiTemps(emploiTempsId, objectifs = {}) {
    // Implémentation de l'optimisation
    // Cette méthode pourrait réorganiser les créneaux pour améliorer le score
    // en respectant les contraintes supplémentaires
    
    throw new Error('Non implémenté');
  }
}

module.exports = GenerationService;