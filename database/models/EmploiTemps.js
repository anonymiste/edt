const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { StatutEmploiTemps, ModeGeneration } = require('../../utils/enums');

const EmploiTemps = sequelize.define('EmploiTemps', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  etablissement_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  classe_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  nom_version: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  periode_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  periode_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: function(value) {
        if (this.periode_debut && value <= this.periode_debut) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
    }
  },
  statut: {
    type: DataTypes.ENUM(...Object.values(StatutEmploiTemps)),
    defaultValue: StatutEmploiTemps.BROUILLON,
    validate: {
      isIn: [Object.values(StatutEmploiTemps)]
    }
  },
  score_qualite: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  date_generation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  duree_generation: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  generateur_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  mode_generation: {
    type: DataTypes.ENUM(...Object.values(ModeGeneration)),
    defaultValue: ModeGeneration.EQUILIBRE,
    validate: {
      isIn: [Object.values(ModeGeneration)]
    }
  },
  parametres_generation: {
    type: DataTypes.JSON,
    allowNull: true
  },
  commentaires: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_validation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_publication: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'emplois_du_temps',
  hooks: {
    beforeUpdate: (emploiTemps) => {
      emploiTemps.updated_at = new Date();
      
      // Mettre à jour les dates de validation/publication selon le statut
      if (emploiTemps.changed('statut')) {
        if (emploiTemps.statut === StatutEmploiTemps.VALIDE && !emploiTemps.date_validation) {
          emploiTemps.date_validation = new Date();
        }
        if (emploiTemps.statut === StatutEmploiTemps.PUBLIE && !emploiTemps.date_publication) {
          emploiTemps.date_publication = new Date();
        }
      }
    }
  },
  indexes: [
    {
      fields: ['etablissement_id']
    },
    {
      fields: ['classe_id']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['periode_debut', 'periode_fin']
    }
  ]
});

// Méthodes d'instance
EmploiTemps.prototype.valider = function() {
  this.statut = StatutEmploiTemps.VALIDE;
  this.date_validation = new Date();
  return this.save();
};

EmploiTemps.prototype.publier = function() {
  this.statut = StatutEmploiTemps.PUBLIE;
  this.date_publication = new Date();
  return this.save();
};

EmploiTemps.prototype.archiver = function() {
  this.statut = StatutEmploiTemps.ARCHIVE;
  return this.save();
};

EmploiTemps.prototype.estPublie = function() {
  return this.statut === StatutEmploiTemps.PUBLIE;
};

EmploiTemps.prototype.getDureePeriode = function() {
  const debut = new Date(this.periode_debut);
  const fin = new Date(this.periode_fin);
  const diffTime = Math.abs(fin - debut);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
};

EmploiTemps.prototype.getInformations = function() {
  return {
    id: this.id,
    nom_version: this.nom_version,
    periode: `${this.periode_debut} au ${this.periode_fin}`,
    statut: this.statut,
    score_qualite: this.score_qualite,
    duree_generation: this.duree_generation,
    mode_generation: this.mode_generation
  };
};

module.exports = EmploiTemps;