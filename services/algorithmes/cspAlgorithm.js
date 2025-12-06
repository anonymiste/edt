// services/algorithmes/cspAlgorithm.js
const { JourSemaine, TypeCours, TypeSalle } = require('../../utils/enums');

class CSPAlgorithm {
  /**
   * Algorithme CSP (Constraint Satisfaction Problem) pour la génération d'emploi du temps
   * Méthode basée sur le backtracking avec forward checking
   */
  constructor() {
    this.variables = []; // Cours à planifier
    this.domains = {}; // Domaines pour chaque variable
    this.constraints = []; // Contraintes à respecter
    this.solution = []; // Solution trouvée
    this.iterations = 0;
    this.maxIterations = 10000;
  }

  /**
   * Générer un emploi du temps avec l'algorithme CSP
   */
  async generer(donnees) {
    console.log('Début génération CSP...');
    
    this.initialiserProbleme(donnees);
    this.initialiserDomaines(donnees);
    this.definirContraintes(donnees);

    const debut = Date.now();
    const solutionTrouvee = this.backtrackingSearch();
    const duree = Date.now() - debut;

    if (solutionTrouvee) {
      console.log(`Solution CSP trouvée en ${duree}ms (${this.iterations} itérations)`);
      return this.formaterSolution(donnees);
    } else {
      console.log(`Aucune solution CSP trouvée en ${duree}ms`);
      throw new Error('Aucune solution satisfaisante trouvée avec les contraintes actuelles');
    }
  }

  /**
   * Initialiser le problème avec les cours à planifier
   */
  initialiserProbleme(donnees) {
    this.variables = [];
    
    donnees.cours.forEach(cours => {
      const nombreSeances = Math.ceil(cours.volume_horaire_hebdo / cours.matiere.duree_standard);
      
      for (let i = 0; i < nombreSeances; i++) {
        this.variables.push({
          id: `${cours.id}-${i}`,
          cours_id: cours.id,
          matiere: cours.matiere,
          enseignant: cours.enseignant,
          classe_id: cours.classe_id,
          duree: cours.matiere.duree_standard,
          type_cours: cours.matiere.type_cours,
          sequence: i
        });
      }
    });

    console.log(`${this.variables.length} séances à planifier`);
  }

  /**
   * Initialiser les domaines de valeurs possibles pour chaque variable
   */
  initialiserDomaines(donnees) {
    this.domains = {};

    // Créneaux possibles : 5 jours × 8 créneaux par jour
    const jours = Object.values(JourSemaine).slice(0, 5); // Lundi à Vendredi
    const creneaux = this.genererCreneauxDisponibles();

    this.variables.forEach(variable => {
      const domainesPossibles = [];

      jours.forEach(jour => {
        creneaux.forEach(creneau => {
          donnees.salles.forEach(salle => {
            if (this.salleCompatible(salle, variable)) {
              domainesPossibles.push({
                jour,
                heure_debut: creneau.heure_debut,
                heure_fin: creneau.heure_fin,
                salle_id: salle.id,
                salle_nom: salle.nom_salle
              });
            }
          });
        });
      });

      this.domains[variable.id] = this.filtrerParDisponibiliteEnseignant(
        domainesPossibles, 
        variable.enseignant, 
        donnees.enseignants
      );
    });

    // Vérifier les domaines vides
    const variablesSansSolution = this.variables.filter(v => 
      !this.domains[v.id] || this.domains[v.id].length === 0
    );

    if (variablesSansSolution.length > 0) {
      console.warn(`${variablesSansSolution.length} variables sans solution possible`);
    }
  }

  /**
   * Générer les créneaux horaires disponibles
   */
  genererCreneauxDisponibles() {
    const creneaux = [];
    const heureDebut = 8 * 60; // 8h00 en minutes
    const heureFin = 18 * 60; // 18h00 en minutes
    const dureeCreneau = 60; // 1 heure

    for (let heure = heureDebut; heure <= heureFin - dureeCreneau; heure += dureeCreneau) {
      const heures = Math.floor(heure / 60);
      const minutes = heure % 60;
      const heureDebutStr = `${heures.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const heureFinCalc = heure + dureeCreneau;
      const heuresFin = Math.floor(heureFinCalc / 60);
      const minutesFin = heureFinCalc % 60;
      const heureFinStr = `${heuresFin.toString().padStart(2, '0')}:${minutesFin.toString().padStart(2, '0')}`;

      creneaux.push({
        heure_debut: heureDebutStr,
        heure_fin: heureFinStr,
        duree: dureeCreneau
      });
    }

    return creneaux;
  }

  /**
   * Vérifier la compatibilité salle/cours
   */
  salleCompatible(salle, variable) {
    // Vérifier la capacité
    if (salle.capacite < variable.matiere.effectif_estime) {
      return false;
    }

    // Vérifier le type de salle
    const besoinsSalle = {
      [TypeCours.TP]: [TypeSalle.LABORATOIRE, TypeSalle.INFORMATIQUE, TypeSalle.ATELIER],
      [TypeCours.ATELIER]: [TypeSalle.ATELIER, TypeSalle.ARTS, TypeSalle.MUSIQUE],
      [TypeCours.COURS_MAGISTRAL]: [TypeSalle.STANDARD, TypeSalle.AMPHITHEATRE],
      [TypeCours.TD]: [TypeSalle.STANDARD]
    };

    const sallesAcceptees = besoinsSalle[variable.type_cours] || [TypeSalle.STANDARD];
    return sallesAcceptees.includes(salle.type_salle);
  }

  /**
   * Filtrer par disponibilité de l'enseignant
   */
  filtrerParDisponibiliteEnseignant(domaines, enseignant, enseignants) {
    const enseignantData = enseignants.find(e => e.id === enseignant.id);
    if (!enseignantData || !enseignantData.disponibilites) {
      return domaines;
    }

    return domaines.filter(domaine => {
      return enseignantData.disponibilites.some(dispo =>
        dispo.jour_semaine === domaine.jour &&
        this.creneauxCompatibles(dispo, domaine)
      );
    });
  }

  /**
   * Vérifier la compatibilité des créneaux
   */
  creneauxCompatibles(disponibilite, creneau) {
    if (disponibilite.type === 'indisponible') {
      return false;
    }

    const dispoDebut = this.heureEnMinutes(disponibilite.heure_debut);
    const dispoFin = this.heureEnMinutes(disponibilite.heure_fin);
    const creneauDebut = this.heureEnMinutes(creneau.heure_debut);
    const creneauFin = this.heureEnMinutes(creneau.heure_fin);

    return creneauDebut >= dispoDebut && creneauFin <= dispoFin;
  }

  /**
   * Convertir une heure en minutes
   */
  heureEnMinutes(heure) {
    const [heures, minutes] = heure.split(':').map(Number);
    return heures * 60 + minutes;
  }

  /**
   * Définir les contraintes du problème
   */
  definirContraintes(donnees) {
    this.constraints = [
      // Contrainte : Pas deux cours en même temps dans la même salle
      this.contrainteSalleUnique.bind(this),
      
      // Contrainte : Pas deux cours en même temps pour le même enseignant
      this.contrainteEnseignantUnique.bind(this),
      
      // Contrainte : Pas deux cours en même temps pour la même classe
      this.contrainteClasseUnique.bind(this),
      
      // Contrainte : Respect des préférences horaires
      this.contraintePreferencesHoraires.bind(this),
      
      // Contrainte : Éviter les cours consécutifs trop nombreux
      this.contrainteCoursConsecutifs.bind(this)
    ];
  }

  /**
   * Contrainte : Salle unique à un moment donné
   */
  contrainteSalleUnique(variable1, valeur1, variable2, valeur2) {
    if (variable1.id === variable2.id) return true;
    
    return !(
      valeur1.jour === valeur2.jour &&
      valeur1.salle_id === valeur2.salle_id &&
      this.creneauxSeChevauchent(valeur1, valeur2)
    );
  }

  /**
   * Contrainte : Enseignant unique à un moment donné
   */
  contrainteEnseignantUnique(variable1, valeur1, variable2, valeur2) {
    if (variable1.id === variable2.id) return true;
    if (variable1.enseignant.id !== variable2.enseignant.id) return true;
    
    return !(
      valeur1.jour === valeur2.jour &&
      this.creneauxSeChevauchent(valeur1, valeur2)
    );
  }

  /**
   * Contrainte : Classe unique à un moment donné
   */
  contrainteClasseUnique(variable1, valeur1, variable2, valeur2) {
    if (variable1.id === variable2.id) return true;
    if (variable1.classe_id !== variable2.classe_id) return true;
    
    return !(
      valeur1.jour === valeur2.jour &&
      this.creneauxSeChevauchent(valeur1, valeur2)
    );
  }

  /**
   * Contrainte : Préférences horaires des enseignants
   */
  contraintePreferencesHoraires(variable, valeur) {
    // Implémentation simplifiée
    // Dans la réalité, vous vérifieriez les préférences de l'enseignant
    const heure = this.heureEnMinutes(valeur.heure_debut);
    
    // Préférence pour le matin (8h-12h)
    if (variable.enseignant.preference_horaire === 'matin') {
      return heure >= 8 * 60 && heure < 12 * 60;
    }
    
    // Préférence pour l'après-midi (13h-18h)
    if (variable.enseignant.preference_horaire === 'apres_midi') {
      return heure >= 13 * 60 && heure < 18 * 60;
    }
    
    return true; // Indifférent
  }

  /**
   * Contrainte : Limite de cours consécutifs
   */
  contrainteCoursConsecutifs(variable, valeur, assignations) {
    const coursMemeJour = assignations.filter(([v, val]) =>
      v.enseignant.id === variable.enseignant.id &&
      val.jour === valeur.jour
    );

    if (coursMemeJour.length === 0) return true;

    // Trier les cours par heure
    const coursTries = coursMemeJour.sort((a, b) =>
      this.heureEnMinutes(a[1].heure_debut) - this.heureEnMinutes(b[1].heure_debut)
    );

    // Vérifier les séquences consécutives
    let sequenceActuelle = 1;
    for (let i = 1; i < coursTries.length; i++) {
      const heurePrecedente = this.heureEnMinutes(coursTries[i-1][1].heure_fin);
      const heureActuelle = this.heureEnMinutes(coursTries[i][1].heure_debut);
      
      if (heureActuelle - heurePrecedente <= 15) { // 15 minutes de pause max
        sequenceActuelle++;
      } else {
        sequenceActuelle = 1;
      }
      
      if (sequenceActuelle > variable.enseignant.cours_consecutifs_max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Vérifier si deux créneaux se chevauchent
   */
  creneauxSeChevauchent(creneau1, creneau2) {
    const debut1 = this.heureEnMinutes(creneau1.heure_debut);
    const fin1 = this.heureEnMinutes(creneau1.heure_fin);
    const debut2 = this.heureEnMinutes(creneau2.heure_debut);
    const fin2 = this.heureEnMinutes(creneau2.heure_fin);

    return (debut1 < fin2 && fin1 > debut2);
  }

  /**
   * Algorithme de backtracking avec forward checking
   */
  backtrackingSearch(assignations = new Map()) {
    this.iterations++;

    if (this.iterations > this.maxIterations) {
      return false; // Éviter les boucles infinies
    }

    if (assignations.size === this.variables.length) {
      this.solution = Array.from(assignations.entries());
      return true;
    }

    const variable = this.choisirVariableNonAssignee(assignations);
    const valeursOrdonnees = this.ordonnerValeurs(variable, assignations);

    for (const valeur of valeursOrdonnees) {
      if (this.estConsistant(variable, valeur, assignations)) {
        assignations.set(variable, valeur);
        
        // Forward checking
        const domainesSauvegardes = this.sauvegarderDomaines();
        this.forwardChecking(variable, valeur, assignations);

        const resultat = this.backtrackingSearch(assignations);
        if (resultat) {
          return true;
        }

        // Backtrack
        assignations.delete(variable);
        this.restaurerDomaines(domainesSauvegardes);
      }
    }

    return false;
  }

  /**
   * Choisir la prochaine variable à assigner (MRV - Minimum Remaining Values)
   */
  choisirVariableNonAssignee(assignations) {
    const variablesNonAssignees = this.variables.filter(v => !assignations.has(v));
    
    // MRV : choisir la variable avec le moins de valeurs possibles
    return variablesNonAssignees.reduce((minVar, variable) => {
      const domainesVar = this.domains[variable.id] || [];
      const domainesMin = this.domains[minVar.id] || [];
      return domainesVar.length < domainesMin.length ? variable : minVar;
    });
  }

  /**
   * Ordonner les valeurs (Least Constraining Value)
   */
  ordonnerValeurs(variable, assignations) {
    const domaines = this.domains[variable.id] || [];
    
    // LCV : choisir les valeurs qui contraignent le moins les autres variables
    return domaines.sort((a, b) => {
      const impactA = this.calculerImpact(variable, a, assignations);
      const impactB = this.calculerImpact(variable, b, assignations);
      return impactA - impactB;
    });
  }

  /**
   * Calculer l'impact d'une valeur sur les autres variables
   */
  calculerImpact(variable, valeur, assignations) {
    let impact = 0;
    
    const autresVariables = this.variables.filter(v => 
      !assignations.has(v) && v.id !== variable.id
    );

    autresVariables.forEach(autreVar => {
      const domainesAutreVar = this.domains[autreVar.id] || [];
      const domainesApresFiltrage = domainesAutreVar.filter(domaine =>
        this.estConsistant(autreVar, domaine, new Map([...assignations, [variable, valeur]]))
      );
      
      impact += domainesAutreVar.length - domainesApresFiltrage.length;
    });

    return impact;
  }

  /**
   * Vérifier la consistance d'une assignation
   */
  estConsistant(variable, valeur, assignations) {
    for (const [autreVar, autreValeur] of assignations) {
      for (const contrainte of this.constraints) {
        if (!contrainte(variable, valeur, autreVar, autreValeur, assignations)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Forward checking
   */
  forwardChecking(variable, valeur, assignations) {
    const autresVariables = this.variables.filter(v => !assignations.has(v));
    
    autresVariables.forEach(autreVar => {
      this.domains[autreVar.id] = (this.domains[autreVar.id] || []).filter(domaine =>
        this.estConsistant(autreVar, domaine, new Map([...assignations, [variable, valeur]]))
      );
    });
  }

  /**
   * Sauvegarder les domaines avant modification
   */
  sauvegarderDomaines() {
    const sauvegarde = {};
    Object.keys(this.domains).forEach(key => {
      sauvegarde[key] = [...this.domains[key]];
    });
    return sauvegarde;
  }

  /**
   * Restaurer les domaines
   */
  restaurerDomaines(sauvegarde) {
    Object.keys(sauvegarde).forEach(key => {
      this.domains[key] = sauvegarde[key];
    });
  }

  /**
   * Formater la solution pour l'API
   */
  formaterSolution(donnees) {
    const creneaux = this.solution.map(([variable, valeur]) => ({
      cours_id: variable.cours_id,
      salle_id: valeur.salle_id,
      salle_nom: valeur.salle_nom,
      jour_semaine: valeur.jour,
      heure_debut: valeur.heure_debut,
      heure_fin: valeur.heure_fin,
      duree: variable.duree,
      sequence_type: variable.sequence === 0 ? 'A' : null
    }));

    // Calculer le score de qualité
    const score = this.calculerScoreQualite(creneaux, donnees);

    return {
      creneaux,
      score,
      conflits: this.detecterConflits(creneaux),
      statistiques: {
        total_creneaux: creneaux.length,
        taux_remplissage: this.calculerTauxRemplissage(creneaux),
        respect_contraintes: score
      }
    };
  }

  /**
   * Calculer le score de qualité
   */
  calculerScoreQualite(creneaux, donnees) {
    let score = 100;
    const penalites = [];

    // Pénalité pour les préférences horaires non respectées
    creneaux.forEach(creneau => {
      const variable = this.variables.find(v => 
        `${v.cours_id}-${v.sequence}` === creneau.cours_id
      );
      
      if (variable && variable.enseignant.preference_horaire !== 'indifferent') {
        const heure = this.heureEnMinutes(creneau.heure_debut);
        const estMatin = heure >= 8 * 60 && heure < 12 * 60;
        const estApresMidi = heure >= 13 * 60 && heure < 18 * 60;
        
        if (variable.enseignant.preference_horaire === 'matin' && !estMatin) {
          penalites.push('Preference horaire matin non respectee');
          score -= 5;
        } else if (variable.enseignant.preference_horaire === 'apres_midi' && !estApresMidi) {
          penalites.push('Preference horaire apres-midi non respectee');
          score -= 5;
        }
      }
    });

    // Pénalité pour les salles sous-utilisées
    const utilisationSalles = new Map();
    creneaux.forEach(creneau => {
      utilisationSalles.set(creneau.salle_id, (utilisationSalles.get(creneau.salle_id) || 0) + 1);
    });

    const sallesDisponibles = donnees.salles.length;
    const sallesUtilisees = utilisationSalles.size;
    const tauxUtilisation = (sallesUtilisees / sallesDisponibles) * 100;

    if (tauxUtilisation < 60) {
      penalites.push('Taux d utilisation des salles trop faible');
      score -= (60 - tauxUtilisation) / 2;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Calculer le taux de remplissage
   */
  calculerTauxRemplissage(creneaux) {
    const totalSlots = 5 * 8; // 5 jours × 8 créneaux par jour
    const slotsUtilises = new Set();
    
    creneaux.forEach(creneau => {
      const slotKey = `${creneau.jour_semaine}-${creneau.heure_debut}`;
      slotsUtilises.add(slotKey);
    });

    return (slotsUtilises.size / totalSlots) * 100;
  }

  /**
   * Détecter les conflits résiduels
   */
  detecterConflits(creneaux) {
    const conflits = [];

    for (let i = 0; i < creneaux.length; i++) {
      for (let j = i + 1; j < creneaux.length; j++) {
        const creneau1 = creneaux[i];
        const creneau2 = creneaux[j];

        if (this.creneauxSeChevauchentFormat(creneau1, creneau2)) {
          if (creneau1.salle_id === creneau2.salle_id) {
            conflits.push(`Conflit salle: ${creneau1.salle_nom} le ${creneau1.jour_semaine}`);
          }
        }
      }
    }

    return conflits;
  }

  /**
   * Vérifier le chevauchement entre deux créneaux formatés
   */
  creneauxSeChevauchentFormat(creneau1, creneau2) {
    if (creneau1.jour_semaine !== creneau2.jour_semaine) return false;

    const debut1 = this.heureEnMinutes(creneau1.heure_debut);
    const fin1 = this.heureEnMinutes(creneau1.heure_fin);
    const debut2 = this.heureEnMinutes(creneau2.heure_debut);
    const fin2 = this.heureEnMinutes(creneau2.heure_fin);

    return (debut1 < fin2 && fin1 > debut2);
  }
}

module.exports = CSPAlgorithm;