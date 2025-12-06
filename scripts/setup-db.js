// scripts/setup-db.js
const { sequelize } = require('../config/database');
const { 
  Utilisateur, 
  Etablissement, 
  Classe, 
  Matiere, 
  Enseignant,
  Salle,
  Cours,
  Contrainte
} = require('../database/models');
const bcrypt = require('bcryptjs');

/**
 * Script de configuration de la base de données
 */
class DatabaseSetup {
  /**
   * Initialiser la base de données
   */
  static async initialize() {
    try {
      console.log('🚀 Initialisation de la base de données...');

      // Synchroniser les modèles
      await this.syncDatabase();
      
      // Créer les données de base
      await this.createBaseData();
      
      console.log('✅ Base de données initialisée avec succès!');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      process.exit(1);
    }
  }

  /**
   * Synchroniser la base de données
   */
  static async syncDatabase() {
    console.log('🔄 Synchronisation des modèles...');
    
    // Option force: true pour recréer les tables (en développement)
    const force = process.env.NODE_ENV === 'development';
    
    await sequelize.sync({ force });
    console.log('✅ Modèles synchronisés');
  }

  /**
   * Créer les données de base
   */
  static async createBaseData() {
    console.log('📝 Création des données de base...');

    // Créer l'établissement principal
    const etablissement = await this.createEtablissement();
    
    // Créer l'utilisateur admin
    await this.createAdminUser(etablissement);
    
    // Créer les classes
    const classes = await this.createClasses(etablissement);
    
    // Créer les matières
    const matieres = await this.createMatieres(etablissement);
    
    // Créer les enseignants
    const enseignants = await this.createEnseignants(etablissement);
    
    // Créer les salles
    const salles = await this.createSalles(etablissement);
    
    // Créer les cours
    await this.createCours(classes, matieres, enseignants, salles);
    
    // Créer les contraintes
    await this.createContraintes(etablissement);

    console.log('✅ Données de base créées');
  }

  /**
   * Créer l'établissement principal
   */
  static async createEtablissement() {
    console.log('  🏫 Création de l\'établissement...');
    
    const [etablissement, created] = await Etablissement.findOrCreate({
      where: { nom: 'Lycée Pierre de Coubertin' },
      defaults: {
        type: 'lycee',
        adresse: '123 Avenue de la République',
        ville: 'Paris',
        code_postal: '75011',
        telephone: '+33123456789',
        email: 'contact@lycee-coubertin.fr',
        site_web: 'https://lycee-coubertin.fr',
        fuseau_horaire: 'Europe/Paris',
        langue: 'fr',
        annee_scolaire_courante: '2024-2025',
        statut: 'actif'
      }
    });

    console.log(`    ${created ? 'Créé' : 'Existant'}: ${etablissement.nom}`);
    return etablissement;
  }

  /**
   * Créer l'utilisateur administrateur
   */
  static async createAdminUser(etablissement) {
    console.log('  👤 Création de l\'administrateur...');
    
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const [admin, created] = await Utilisateur.findOrCreate({
      where: { email: 'admin@lycee-coubertin.fr' },
      defaults: {
        email: 'admin@lycee-coubertin.fr',
        mot_de_passe_hash: hashedPassword,
        nom: 'Admin',
        prenom: 'Système',
        role: 'admin',
        etablissement_id: etablissement.id,
        actif: true
      }
    });

    console.log(`    ${created ? 'Créé' : 'Existant'}: ${admin.prenom} ${admin.nom}`);
    return admin;
  }

  /**
   * Créer les classes
   */
  static async createClasses(etablissement) {
    console.log('  📚 Création des classes...');
    
    const classesData = [
      { nom_classe: 'Seconde A', niveau: 'Seconde', effectif: 32, filiere: 'Générale' },
      { nom_classe: 'Seconde B', niveau: 'Seconde', effectif: 30, filiere: 'Générale' },
      { nom_classe: 'Première S', niveau: 'Première', effectif: 28, filiere: 'Scientifique' },
      { nom_classe: 'Première ES', niveau: 'Première', effectif: 26, filiere: 'Économique' },
      { nom_classe: 'Terminale S', niveau: 'Terminale', effectif: 25, filiere: 'Scientifique' },
      { nom_classe: 'Terminale ES', niveau: 'Terminale', effectif: 24, filiere: 'Économique' }
    ];

    const classes = [];
    for (const classData of classesData) {
      const [classe, created] = await Classe.findOrCreate({
        where: { 
          nom_classe: classData.nom_classe,
          etablissement_id: etablissement.id
        },
        defaults: {
          ...classData,
          annee_scolaire: '2024-2025',
          etablissement_id: etablissement.id,
          statut: 'active'
        }
      });

      console.log(`    ${created ? 'Créé' : 'Existant'}: ${classe.nom_classe}`);
      classes.push(classe);
    }

    return classes;
  }

  /**
   * Créer les matières
   */
  static async createMatieres(etablissement) {
    console.log('  📖 Création des matières...');
    
    const matieresData = [
      { nom_matiere: 'Mathématiques', code_matiere: 'MATH', categorie: 'fondamentale', type_cours: 'cours_magistral', duree_standard: 60, volume_horaire_hebdo: 180, coefficient: 4.0 },
      { nom_matiere: 'Physique-Chimie', code_matiere: 'PHYS', categorie: 'fondamentale', type_cours: 'cours_magistral', duree_standard: 60, volume_horaire_hebdo: 150, coefficient: 3.0 },
      { nom_matiere: 'Sciences de la Vie et de la Terre', code_matiere: 'SVT', categorie: 'fondamentale', type_cours: 'cours_magistral', duree_standard: 60, volume_horaire_hebdo: 120, coefficient: 2.0 },
      { nom_matiere: 'Français', code_matiere: 'FRAN', categorie: 'fondamentale', type_cours: 'cours_magistral', duree_standard: 60, volume_horaire_hebdo: 180, coefficient: 4.0 },
      { nom_matiere: 'Histoire-Géographie', code_matiere: 'HIST', categorie: 'fondamentale', type_cours: 'cours_magistral', duree_standard: 60, volume_horaire_hebdo: 120, coefficient: 2.0 },
      { nom_matiere: 'Anglais', code_matiere: 'ANG', categorie: 'fondamentale', type_cours: 'cours_magistral', duree_standard: 60, volume_horaire_hebdo: 90, coefficient: 2.0 },
      { nom_matiere: 'Éducation Physique et Sportive', code_matiere: 'EPS', categorie: 'option', type_cours: 'tp', duree_standard: 120, volume_horaire_hebdo: 120, coefficient: 1.0 },
      { nom_matiere: 'Informatique', code_matiere: 'INFO', categorie: 'option', type_cours: 'tp', duree_standard: 120, volume_horaire_hebdo: 90, coefficient: 1.0, necessite_equipement_special: true }
    ];

    const matieres = [];
    for (const matiereData of matieresData) {
      const [matiere, created] = await Matiere.findOrCreate({
        where: { 
          code_matiere: matiereData.code_matiere,
          etablissement_id: etablissement.id
        },
        defaults: {
          ...matiereData,
          etablissement_id: etablissement.id,
          couleur_affichage: '#3B82F6'
        }
      });

      console.log(`    ${created ? 'Créé' : 'Existant'}: ${matiere.nom_matiere}`);
      matieres.push(matiere);
    }

    return matieres;
  }

  /**
   * Créer les enseignants
   */
  static async createEnseignants(etablissement) {
    console.log('  👨‍🏫 Création des enseignants...');
    
    // Créer d'abord les utilisateurs
    const usersData = [
      { email: 'dupont@lycee-coubertin.fr', nom: 'Dupont', prenom: 'Marie', role: 'enseignant' },
      { email: 'martin@lycee-coubertin.fr', nom: 'Martin', prenom: 'Pierre', role: 'enseignant' },
      { email: 'bernard@lycee-coubertin.fr', nom: 'Bernard', prenom: 'Sophie', role: 'enseignant' },
      { email: 'durand@lycee-coubertin.fr', nom: 'Durand', prenom: 'Luc', role: 'enseignant' },
      { email: 'leroy@lycee-coubertin.fr', nom: 'Leroy', prenom: 'Isabelle', role: 'enseignant' }
    ];

    const enseignants = [];
    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      const hashedPassword = await bcrypt.hash('Password123!', 12);

      const [user, userCreated] = await Utilisateur.findOrCreate({
        where: { email: userData.email },
        defaults: {
          ...userData,
          mot_de_passe_hash: hashedPassword,
          etablissement_id: etablissement.id,
          actif: true
        }
      });

      // Créer le profil enseignant
      const matricule = `EN${(i + 1).toString().padStart(4, '0')}`;
      const [enseignant, enseignantCreated] = await Enseignant.findOrCreate({
        where: { matricule },
        defaults: {
          utilisateur_id: user.id,
          matricule,
          statut: 'titulaire',
          date_embauche: new Date('2020-09-01'),
          heures_contractuelles_hebdo: 1800, // 30 heures
          heures_max_journalieres: 480, // 8 heures
          cours_consecutifs_max: 4,
          preference_horaire: 'indifferent',
          multi_sites: false,
          etablissement_id: etablissement.id
        }
      });

      console.log(`    ${enseignantCreated ? 'Créé' : 'Existant'}: ${user.prenom} ${user.nom}`);
      enseignants.push(enseignant);
    }

    return enseignants;
  }

  /**
   * Créer les salles
   */
  static async createSalles(etablissement) {
    console.log('  🏠 Création des salles...');
    
    const sallesData = [
      { nom_salle: 'Salle 101', type_salle: 'standard', capacite: 35, batiment: 'Bâtiment A', etage: '1' },
      { nom_salle: 'Salle 102', type_salle: 'standard', capacite: 30, batiment: 'Bâtiment A', etage: '1' },
      { nom_salle: 'Salle 201', type_salle: 'standard', capacite: 25, batiment: 'Bâtiment A', etage: '2' },
      { nom_salle: 'Labo Physique', type_salle: 'laboratoire', capacite: 24, batiment: 'Bâtiment B', etage: '1', accessibilite_pmr: true },
      { nom_salle: 'Labo Informatique', type_salle: 'informatique', capacite: 20, batiment: 'Bâtiment B', etage: '1', accessibilite_pmr: true },
      { nom_salle: 'Amphithéâtre', type_salle: 'amphitheatre', capacite: 100, batiment: 'Bâtiment C', etage: '0' },
      { nom_salle: 'Gymnase', type_salle: 'gymnase', capacite: 200, batiment: 'Bâtiment D', etage: '0' }
    ];

    const salles = [];
    for (const salleData of sallesData) {
      const [salle, created] = await Salle.findOrCreate({
        where: { 
          nom_salle: salleData.nom_salle,
          etablissement_id: etablissement.id
        },
        defaults: {
          ...salleData,
          etablissement_id: etablissement.id,
          statut: 'disponible'
        }
      });

      console.log(`    ${created ? 'Créé' : 'Existant'}: ${salle.nom_salle}`);
      salles.push(salle);
    }

    return salles;
  }

  /**
   * Créer les cours
   */
  static async createCours(classes, matieres, enseignants, salles) {
    console.log('  📅 Création des cours...');
    
    const coursData = [
      { classe: 'Seconde A', matiere: 'Mathématiques', enseignant: 0, volume_horaire: 180 },
      { classe: 'Seconde A', matiere: 'Français', enseignant: 1, volume_horaire: 180 },
      { classe: 'Seconde B', matiere: 'Mathématiques', enseignant: 0, volume_horaire: 180 },
      { classe: 'Première S', matiere: 'Physique-Chimie', enseignant: 2, volume_horaire: 150 },
      { classe: 'Première S', matiere: 'Mathématiques', enseignant: 0, volume_horaire: 180 },
      { classe: 'Terminale S', matiere: 'Physique-Chimie', enseignant: 2, volume_horaire: 150 },
      { classe: 'Terminale S', matiere: 'SVT', enseignant: 3, volume_horaire: 120 }
    ];

    let coursCount = 0;
    for (const coursInfo of coursData) {
      const classe = classes.find(c => c.nom_classe === coursInfo.classe);
      const matiere = matieres.find(m => m.nom_matiere === coursInfo.matiere);
      const enseignant = enseignants[coursInfo.enseignant];

      if (classe && matiere && enseignant) {
        const [cours, created] = await Cours.findOrCreate({
          where: {
            classe_id: classe.id,
            matiere_id: matiere.id,
            enseignant_id: enseignant.id
          },
          defaults: {
            classe_id: classe.id,
            matiere_id: matiere.id,
            enseignant_id: enseignant.id,
            salle_id: salles[0].id, // Première salle par défaut
            volume_horaire_hebdo: coursInfo.volume_horaire,
            duree_seance_standard: matiere.duree_standard,
            type_cours: matiere.type_cours,
            enseignement_en_ligne: false,
            effectif_max: classe.effectif,
            couleur_affichage: matiere.couleur_affichage
          }
        });

        if (created) {
          coursCount++;
        }
      }
    }

    console.log(`    ${coursCount} cours créés`);
  }

  /**
   * Créer les contraintes
   */
  static async createContraintes(etablissement) {
    console.log('  ⚙️ Création des contraintes...');
    
    const contraintesData = [
      {
        nom: 'intervalle_min_entre_cours',
        type: 'dure',
        categorie: 'temporelle',
        description: 'Intervalle minimum de 15 minutes entre deux cours',
        poids: 2.0,
        severite: 8,
        priorite: 'haute',
        parametres: { intervalle_min: 15 }
      },
      {
        nom: 'cours_consecutifs_max',
        type: 'dure',
        categorie: 'pedagogique',
        description: 'Maximum 4 cours consécutifs pour un enseignant',
        poids: 1.5,
        severite: 7,
        priorite: 'moyenne',
        parametres: { max_consecutifs: 4 }
      },
      {
        nom: 'charge_enseignant_max',
        type: 'dure',
        categorie: 'ressource',
        description: 'Respect de la charge horaire contractuelle',
        poids: 2.0,
        severite: 9,
        priorite: 'haute',
        parametres: { respect_charge: true }
      },
      {
        nom: 'salle_compatible',
        type: 'dure',
        categorie: 'ressource',
        description: 'Cours dans une salle compatible avec le type d\'enseignement',
        poids: 1.8,
        severite: 8,
        priorite: 'haute',
        parametres: { verification_type: true }
      }
    ];

    let contraintesCount = 0;
    for (const contrainteData of contraintesData) {
      const [contrainte, created] = await Contrainte.findOrCreate({
        where: { 
          nom: contrainteData.nom,
          etablissement_id: etablissement.id
        },
        defaults: {
          ...contrainteData,
          etablissement_id: etablissement.id,
          active: true
        }
      });

      if (created) {
        contraintesCount++;
      }
    }

    console.log(`    ${contraintesCount} contraintes créées`);
  }

  /**
   * Réinitialiser la base de données
   */
  static async resetDatabase() {
    console.log('🔄 Réinitialisation de la base de données...');
    
    try {
      await sequelize.sync({ force: true });
      console.log('✅ Base de données réinitialisée');
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'état de la base de données
   */
  static async checkDatabaseStatus() {
    console.log('🔍 Vérification de l\'état de la base de données...');
    
    try {
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données: OK');

      // Compter les enregistrements
      const counts = await Promise.all([
        Etablissement.count(),
        Utilisateur.count(),
        Classe.count(),
        Matiere.count(),
        Enseignant.count(),
        Salle.count(),
        Cours.count()
      ]);

      console.log('📊 Statistiques de la base:');
      console.log(`   🏫 Établissements: ${counts[0]}`);
      console.log(`   👥 Utilisateurs: ${counts[1]}`);
      console.log(`   📚 Classes: ${counts[2]}`);
      console.log(`   📖 Matières: ${counts[3]}`);
      console.log(`   👨‍🏫 Enseignants: ${counts[4]}`);
      console.log(`   🏠 Salles: ${counts[5]}`);
      console.log(`   📅 Cours: ${counts[6]}`);

    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error.message);
    }
  }
}

// Gestion des arguments de ligne de commande
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      DatabaseSetup.initialize();
      break;
    case 'reset':
      DatabaseSetup.resetDatabase().then(() => DatabaseSetup.initialize());
      break;
    case 'status':
      DatabaseSetup.checkDatabaseStatus();
      break;
    case 'help':
    default:
      console.log(`
Usage: node setup-db.js [command]

Commands:
  init    - Initialiser la base de données avec les données de base
  reset   - Réinitialiser complètement la base de données
  status  - Vérifier l'état de la base de données
  help    - Afficher cette aide
      `);
      break;
  }
}

module.exports = DatabaseSetup;