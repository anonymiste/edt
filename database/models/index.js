const { sequelize } = require('../../config/database');

// Import de tous les modèles
const Utilisateur = require('./Utilisateur');
const Etablissement = require('./Etablissement');
const Classe = require('./Classe');
const Matiere = require('./Matiere');
const Enseignant = require('./Enseignant');
const Salle = require('./Salle');
const Cours = require('./Cours');
const CreneauCours = require('./CreneauCours');
const EmploiTemps = require('./EmploiTemps');
const Rattrapage = require('./Rattrapage');
const Absence = require('./Absence');
const Disponibilite = require('./Disponibilite');
const Contrainte = require('./Contrainte');
const Notification = require('./Notification');
const { LogConnexion, LogModification } = require('./Log');
const { Sequelize } = require('sequelize');

// Définition des associations

// Utilisateur - Etablissement
Utilisateur.belongsTo(Etablissement, { 
  foreignKey: 'etablissement_id', 
  as: 'etablissement' 
});
Etablissement.hasMany(Utilisateur, { 
  foreignKey: 'etablissement_id', 
  as: 'utilisateurs' 
});

// Etablissement - Classes
Etablissement.hasMany(Classe, { 
  foreignKey: 'etablissement_id', 
  as: 'classes' 
});
Classe.belongsTo(Etablissement, { 
  foreignKey: 'etablissement_id', 
  as: 'etablissement' 
});

// Etablissement - Matières
Etablissement.hasMany(Matiere, { 
  foreignKey: 'etablissement_id', 
  as: 'matieres' 
});
Matiere.belongsTo(Etablissement, { 
  foreignKey: 'etablissement_id', 
  as: 'etablissement' 
});

// Etablissement - Salles
Etablissement.hasMany(Salle, { 
  foreignKey: 'etablissement_id', 
  as: 'salles' 
});
Salle.belongsTo(Etablissement, { 
  foreignKey: 'etablissement_id', 
  as: 'etablissement' 
});

// Enseignant - Utilisateur
Enseignant.belongsTo(Utilisateur, { 
  foreignKey: 'utilisateur_id', 
  as: 'utilisateur' 
});
Utilisateur.hasOne(Enseignant, { 
  foreignKey: 'utilisateur_id', 
  as: 'enseignant' 
});

// Enseignant - Etablissement
Enseignant.belongsTo(Etablissement, { 
  foreignKey: 'etablissement_id', 
  as: 'etablissement' 
});
Etablissement.hasMany(Enseignant, { 
  foreignKey: 'etablissement_id', 
  as: 'enseignants' 
});

// Enseignant - Matières (Many-to-Many)
const EnseignantMatiere = sequelize.define('EnseignantMatiere', {}, { 
  tableName: 'enseignants_matieres',
  timestamps: false 
});

Enseignant.belongsToMany(Matiere, { 
  through: EnseignantMatiere,
  foreignKey: 'enseignant_id',
  otherKey: 'matiere_id',
  as: 'matieres'
});
Matiere.belongsToMany(Enseignant, { 
  through: EnseignantMatiere,
  foreignKey: 'matiere_id',
  otherKey: 'enseignant_id',
  as: 'enseignants'
});

// Cours
Cours.belongsTo(Classe, { 
  foreignKey: 'classe_id', 
  as: 'classe' 
});
Classe.hasMany(Cours, { 
  foreignKey: 'classe_id', 
  as: 'cours' 
});

Cours.belongsTo(Matiere, { 
  foreignKey: 'matiere_id', 
  as: 'matiere' 
});
Matiere.hasMany(Cours, { 
  foreignKey: 'matiere_id', 
  as: 'cours' 
});

Cours.belongsTo(Enseignant, { 
  foreignKey: 'enseignant_id', 
  as: 'enseignant' 
});
Enseignant.hasMany(Cours, { 
  foreignKey: 'enseignant_id', 
  as: 'cours' 
});

Cours.belongsTo(Salle, { 
  foreignKey: 'salle_id', 
  as: 'salle' 
});
Salle.hasMany(Cours, { 
  foreignKey: 'salle_id', 
  as: 'cours' 
});

// EmploiTemps
EmploiTemps.belongsTo(Classe, { 
  foreignKey: 'classe_id', 
  as: 'classe' 
});
Classe.hasMany(EmploiTemps, { 
  foreignKey: 'classe_id', 
  as: 'emplois_temps' 
});

EmploiTemps.belongsTo(Etablissement, { 
  foreignKey: 'etablissement_id', 
  as: 'etablissement' 
});
Etablissement.hasMany(EmploiTemps, { 
  foreignKey: 'etablissement_id', 
  as: 'emplois_temps' 
});

EmploiTemps.belongsTo(Utilisateur, { 
  foreignKey: 'generateur_id', 
  as: 'generateur' 
});
Utilisateur.hasMany(EmploiTemps, { 
  foreignKey: 'generateur_id', 
  as: 'emplois_temps_generes' 
});

// CreneauCours
CreneauCours.belongsTo(EmploiTemps, { 
  foreignKey: 'emploi_temps_id', 
  as: 'emploi_temps' 
});
EmploiTemps.hasMany(CreneauCours, { 
  foreignKey: 'emploi_temps_id', 
  as: 'creneaux' 
});

CreneauCours.belongsTo(Cours, { 
  foreignKey: 'cours_id', 
  as: 'cours' 
});
Cours.hasMany(CreneauCours, { 
  foreignKey: 'cours_id', 
  as: 'creneaux' 
});

CreneauCours.belongsTo(Salle, { 
  foreignKey: 'salle_id', 
  as: 'salle' 
});
Salle.hasMany(CreneauCours, { 
  foreignKey: 'salle_id', 
  as: 'creneaux' 
});

// Rattrapage
Rattrapage.belongsTo(Cours, { 
  foreignKey: 'cours_id', 
  as: 'cours' 
});
Cours.hasMany(Rattrapage, { 
  foreignKey: 'cours_id', 
  as: 'rattrapages' 
});

Rattrapage.belongsTo(CreneauCours, { 
  foreignKey: 'creneau_planifie_id', 
  as: 'creneau_planifie' 
});
CreneauCours.hasOne(Rattrapage, { 
  foreignKey: 'creneau_planifie_id', 
  as: 'rattrapage' 
});

// Absence
Absence.belongsTo(Enseignant, { 
  foreignKey: 'enseignant_id', 
  as: 'enseignant' 
});
Enseignant.hasMany(Absence, { 
  foreignKey: 'enseignant_id', 
  as: 'absences' 
});

Absence.belongsTo(Cours, { 
  foreignKey: 'cours_id', 
  as: 'cours' 
});
Cours.hasMany(Absence, { 
  foreignKey: 'cours_id', 
  as: 'absences' 
});

// Disponibilite
Disponibilite.belongsTo(Enseignant, { 
  foreignKey: 'enseignant_id', 
  as: 'enseignant' 
});
Enseignant.hasMany(Disponibilite, { 
  foreignKey: 'enseignant_id', 
  as: 'disponibilites' 
});

// Notification
Notification.belongsTo(Utilisateur, { 
  foreignKey: 'utilisateur_id', 
  as: 'utilisateur' 
});
Utilisateur.hasMany(Notification, { 
  foreignKey: 'utilisateur_id', 
  as: 'notifications' 
});

// Contrainte
Contrainte.belongsTo(Etablissement, { 
  foreignKey: 'etablissement_id', 
  as: 'etablissement' 
});
Etablissement.hasMany(Contrainte, { 
  foreignKey: 'etablissement_id', 
  as: 'contraintes' 
});

// LogConnexion
LogConnexion.belongsTo(Utilisateur, { 
  foreignKey: 'utilisateur_id', 
  as: 'utilisateur' 
});
Utilisateur.hasMany(LogConnexion, { 
  foreignKey: 'utilisateur_id', 
  as: 'logs_connexion' 
});

// LogModification
LogModification.belongsTo(Utilisateur, { 
  foreignKey: 'utilisateur_id', 
  as: 'utilisateur' 
});
Utilisateur.hasMany(LogModification, { 
  foreignKey: 'utilisateur_id', 
  as: 'logs_modification' 
});

module.exports = {
  Sequelize,
  Utilisateur,
  Etablissement,
  Classe,
  Matiere,
  Enseignant,
  Salle,
  Cours,
  CreneauCours,
  EmploiTemps,
  Rattrapage,
  Absence,
  Disponibilite,
  Contrainte,
  Notification,
  LogConnexion,
  LogModification,
  EnseignantMatiere
};