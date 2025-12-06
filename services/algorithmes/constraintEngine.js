// services/algorithmes/constraintEngine.js
const { TypeContrainte, CategorieContrainte } = require('../../utils/enums');

class ConstraintEngine {
  /**
   * Moteur de contraintes pour évaluer et appliquer les contraintes
   */
  constructor() {
    this.contraintes = [];
    this.penalites = new Map();
  }

  /**
   * Charger les contraintes depuis la base de données
   */
  chargerContraintes(contraintes) {
    this.contraintes = contraintes.map(contrainte => ({
      id: contrainte.id,
      nom: contrainte.nom,
      type: contrainte.type,
      categorie: contrainte.categorie,
      poids: contrainte.poids,
      parametres: contrainte.parametres,
      active: contrainte.active,
      fonction: this.getFonctionContrainte(contrainte)
    }));
  }

  /**
   * Obtenir la fonction d'évaluation pour une contrainte
   */
  getFonctionContrainte(contrainte) {
    const fonctions = {
      // Contraintes temporelles
      'intervalle_entre_cours': this.contrainteIntervalleEntreCours.bind(this),
      'cours_meme_jour': this.contrainteCoursMemeJour.bind(this),
      'repartition_hebdomadaire': this.contrainteRepartitionHebdomadaire.bind(this),
      
      // Contraintes de ressources
      'salle_specifique': this.contrainteSalleSpecifique.bind(this),
      'enseignant_disponible': this.contrainteEnseignantDisponible.bind(this),
      'equipement_requis': this.contrainteEquipementRequis.bind(this),
      
      // Contraintes pédagogiques
      'cours_consecutifs_max': this.contrainteCoursConsecutifsMax.bind(this),
      'charge_enseignant': this.contrainteChargeEnseignant.bind(this),
      'preference_horaire': this.contraintePreferenceHoraire.bind(this)
    };

    return fonctions[contrainte.nom] || this.contrainteGenerique.bind(this);
  }

  /**
   * Évaluer une solution contre toutes les contraintes
   */
  evaluerSolution(solution, donnees) {
    this.penalites.clear();
    let scoreTotal = 1000; // Score de base

    this.contraintes.forEach(contrainte => {
      if (!contrainte.active) return;

      const resultat = contrainte.fonction(solution, donnees, contrainte.parametres);
      const penalite = resultat.violations * contrainte.poids * 10;
      
      scoreTotal -= penalite;
      this.penalites.set(contrainte.id, {
        contrainte: contrainte.nom,
        violations: resultat.violations,
        penalite,
        details: resultat.details
      });
    });

    return {
      score: Math.max(0, scoreTotal),
      penalites: Array.from(this.penalites.values()),
      respect_contraintes: this.calculerTauxRespect()
    };
  }

  /**
   * Calculer le taux de respect des contraintes
   */
  calculerTauxRespect() {
    const contraintesActives = this.contraintes.filter(c => c.active);
    if (contraintesActives.length === 0) return 100;

    const contraintesRespectees = Array.from(this.penalites.values())
      .filter(penalite => penalite.violations === 0).length;

    return (contraintesRespectees / contraintesActives.length) * 100;
  }

  /**
   * Contrainte : Intervalle minimum entre certains cours
   */
  contrainteIntervalleEntreCours(solution, donnees, parametres) {
    const { cours_ids, intervalle_min } = parametres;
    let violations = 0;
    const details = [];

    const creneauxConcernes = solution.creneaux.filter(creneau =>
      cours_ids.includes(creneau.cours_id)
    );

    for (let i = 0; i < creneauxConcernes.length; i++) {
      for (let j = i + 1; j < creneauxConcernes.length; j++) {
        const c1 = creneauxConcernes[i];
        const c2 = creneauxConcernes[j];

        if (c1.jour_semaine === c2.jour_semaine) {
          const intervalle = this.calculerIntervalle(c1, c2);
          if (intervalle < intervalle_min) {
            violations++;
            details.push(`Intervalle de ${intervalle}min entre ${c1.cours_id} et ${c2.cours_id}`);
          }
        }
      }
    }

    return { violations, details };
  }

  /**
   * Contrainte : Cours devant avoir lieu le même jour
   */
  contrainteCoursMemeJour(solution, donnees, parametres) {
    const { cours_ids } = parametres;
    let violations = 0;
    const details = [];

    const joursUtilises = new Set();
    solution.creneaux
      .filter(creneau => cours_ids.includes(creneau.cours_id))
      .forEach(creneau => joursUtilises.add(creneau.jour_semaine));

    if (joursUtilises.size > 1) {
      violations = 1;
      details.push(`Cours ${cours_ids.join(', ')} répartis sur ${joursUtilises.size} jours`);
    }

    return { violations, details };
  }

  /**
   * Contrainte : Répartition hebdomadaire équilibrée
   */
  contrainteRepartitionHebdomadaire(solution, donnees, parametres) {
    const { cours_id, jours_min, jours_max } = parametres;
    let violations = 0;
    const details = [];

    const joursUtilises = new Set();
    solution.creneaux
      .filter(creneau => creneau.cours_id === cours_id)
      .forEach(creneau => joursUtilises.add(creneau.jour_semaine));

    if (joursUtilises.size < jours_min) {
      violations++;
      details.push(`Cours ${cours_id} sur seulement ${joursUtilises.size} jours (min: ${jours_min})`);
    }

    if (joursUtilises.size > jours_max) {
      violations++;
      details.push(`Cours ${cours_id} sur ${joursUtilises.size} jours (max: ${jours_max})`);
    }

    return { violations, details };
  }

  /**
   * Contrainte : Salle spécifique requise
   */
  contrainteSalleSpecifique(solution, donnees, parametres) {
    const { cours_id, salle_id } = parametres;
    let violations = 0;
    const details = [];

    const creneauxCours = solution.creneaux.filter(creneau => creneau.cours_id === cours_id);
    const creneauxMauvaiseSalle = creneauxCours.filter(creneau => creneau.salle_id !== salle_id);

    violations = creneauxMauvaiseSalle.length;
    if (violations > 0) {
      details.push(`${creneauxMauvaiseSalle.length} séances du cours ${cours_id} dans une mauvaise salle`);
    }

    return { violations, details };
  }

  /**
   * Contrainte : Enseignant disponible
   */
  contrainteEnseignantDisponible(solution, donnees, parametres) {
    const { enseignant_id, disponibilites } = parametres;
    let violations = 0;
    const details = [];

    const creneauxEnseignant = solution.creneaux.filter(creneau => 
      creneau.enseignant_id === enseignant_id
    );

    creneauxEnseignant.forEach(creneau => {
      const estDisponible = disponibilites.some(dispo =>
        dispo.jour === creneau.jour_semaine &&
        this.creneauDansPlage(creneau, dispo)
      );

      if (!estDisponible) {
        violations++;
        details.push(`Enseignant ${enseignant_id} indisponible le ${creneau.jour_semaine} à ${creneau.heure_debut}`);
      }
    });

    return { violations, details };
  }

  /**
   * Contrainte : Équipement requis
   */
  contrainteEquipementRequis(solution, donnees, parametres) {
    const { cours_id, equipements } = parametres;
    let violations = 0;
    const details = [];

    const creneauxCours = solution.creneaux.filter(creneau => creneau.cours_id === cours_id);

    creneauxCours.forEach(creneau => {
      const salle = donnees.salles.find(s => s.id === creneau.salle_id);
      const equipementsManquants = equipements.filter(equipement =>
        !salle.equipements || !salle.equipements.includes(equipement)
      );

      if (equipementsManquants.length > 0) {
        violations++;
        details.push(`Salle ${creneau.salle_nom} manque: ${equipementsManquants.join(', ')}`);
      }
    });

    return { violations, details };
  }

  /**
   * Contrainte : Maximum de cours consécutifs
   */
  contrainteCoursConsecutifsMax(solution, donnees, parametres) {
    const { enseignant_id, max_consecutifs } = parametres;
    let violations = 0;
    const details = [];

    const creneauxEnseignant = solution.creneaux
      .filter(creneau => creneau.enseignant_id === enseignant_id)
      .sort((a, b) => this.heureEnMinutes(a.heure_debut) - this.heureEnMinutes(b.heure_debut));

    const creneauxParJour = this.grouperParJour(creneauxEnseignant);

    for (const [jour, creneaux] of creneauxParJour) {
      let sequenceActuelle = 1;

      for (let i = 1; i < creneaux.length; i++) {
        const intervalle = this.calculerIntervalle(creneaux[i-1], creneaux[i]);
        
        if (intervalle <= 15) { // 15 minutes de pause maximum
          sequenceActuelle++;
        } else {
          sequenceActuelle = 1;
        }

        if (sequenceActuelle > max_consecutifs) {
          violations++;
          details.push(`Enseignant ${enseignant_id}: ${sequenceActuelle} cours consécutifs le ${jour}`);
        }
      }
    }

    return { violations, details };
  }

  /**
   * Contrainte : Charge maximale de l'enseignant
   */
  contrainteChargeEnseignant(solution, donnees, parametres) {
    const { enseignant_id, heures_max } = parametres;
    let violations = 0;
    const details = [];

    const creneauxEnseignant = solution.creneaux.filter(creneau => 
      creneau.enseignant_id === enseignant_id
    );

    const totalHeures = creneauxEnseignant.reduce((total, creneau) => 
      total + (creneau.duree / 60), 0
    );

    if (totalHeures > heures_max) {
      violations = 1;
      details.push(`Enseignant ${enseignant_id}: ${totalHeures.toFixed(1)}h (max: ${heures_max}h)`);
    }

    return { violations, details };
  }

  /**
   * Contrainte : Préférence horaire
   */
  contraintePreferenceHoraire(solution, donnees, parametres) {
    const { enseignant_id, preference } = parametres;
    let violations = 0;
    const details = [];

    const creneauxEnseignant = solution.creneaux.filter(creneau => 
      creneau.enseignant_id === enseignant_id
    );

    creneauxEnseignant.forEach(creneau => {
      const heure = this.heureEnMinutes(creneau.heure_debut);
      const estMatin = heure >= 8 * 60 && heure < 12 * 60;
      const estApresMidi = heure >= 13 * 60 && heure < 18 * 60;

      if (preference === 'matin' && !estMatin) {
        violations++;
        details.push(`Enseignant ${enseignant_id}: cours l'après-midi alors que préférence matin`);
      } else if (preference === 'apres_midi' && !estApresMidi) {
        violations++;
        details.push(`Enseignant ${enseignant_id}: cours le matin alors que préférence après-midi`);
      }
    });

    return { violations, details };
  }

  /**
   * Contrainte générique (fallback)
   */
  contrainteGenerique(solution, donnees, parametres) {
    // Implémentation par défaut pour les contraintes non reconnues
    return { violations: 0, details: [] };
  }

  /**
   * Méthodes utilitaires
   */

  calculerIntervalle(creneau1, creneau2) {
    const fin1 = this.heureEnMinutes(creneau1.heure_fin);
    const debut2 = this.heureEnMinutes(creneau2.heure_debut);
    return Math.abs(debut2 - fin1);
  }

  heureEnMinutes(heure) {
    const [heures, minutes] = heure.split(':').map(Number);
    return heures * 60 + minutes;
  }

  creneauDansPlage(creneau, plage) {
    const debutCreneau = this.heureEnMinutes(creneau.heure_debut);
    const finCreneau = this.heureEnMinutes(creneau.heure_fin);
    const debutPlage = this.heureEnMinutes(plage.heure_debut);
    const finPlage = this.heureEnMinutes(plage.heure_fin);

    return debutCreneau >= debutPlage && finCreneau <= finPlage;
  }

  grouperParJour(creneaux) {
    const groupes = new Map();
    
    creneaux.forEach(creneau => {
      if (!groupes.has(creneau.jour_semaine)) {
        groupes.set(creneau.jour_semaine, []);
      }
      groupes.get(creneau.jour_semaine).push(creneau);
    });

    return groupes;
  }

  /**
   * Obtenir un rapport détaillé des contraintes
   */
  getRapportContraintes() {
    return {
      total_contraintes: this.contraintes.length,
      contraintes_actives: this.contraintes.filter(c => c.active).length,
      penalites_total: Array.from(this.penalites.values()).reduce((sum, p) => sum + p.penalite, 0),
      details_penalites: Array.from(this.penalites.values())
    };
  }

  /**
   * Suggérer des améliorations pour une solution
   */
  suggererAmeliorations(solution, donnees) {
    const suggestions = [];

    this.penalites.forEach((penalite, contrainteId) => {
      if (penalite.violations > 0) {
        const contrainte = this.contraintes.find(c => c.id === contrainteId);
        suggestions.push({
          contrainte: contrainte.nom,
          probleme: `Violation détectée (${penalite.violations} occurrence(s))`,
          suggestion: this.genererSuggestion(contrainte, penalite.details),
          priorite: contrainte.poids
        });
      }
    });

    return suggestions.sort((a, b) => b.priorite - a.priorite);
  }

  /**
   * Générer une suggestion d'amélioration
   */
  genererSuggestion(contrainte, details) {
    const suggestionsGeneriques = {
      'intervalle_entre_cours': 'Augmenter l intervalle entre les cours concernés',
      'cours_meme_jour': 'Regrouper les cours sur le même jour',
      'salle_specifique': 'Utiliser la salle spécifiée pour ce cours',
      'enseignant_disponible': 'Vérifier les disponibilités de l enseignant',
      'cours_consecutifs_max': 'Réduire le nombre de cours consécutifs',
      'charge_enseignant': 'Réduire la charge horaire de l enseignant',
      'preference_horaire': 'Respecter les préférences horaires'
    };

    return suggestionsGeneriques[contrainte.nom] || 'Revoir la planification de ce cours';
  }
}

module.exports = ConstraintEngine;