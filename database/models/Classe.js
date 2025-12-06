const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { StatutClasse } = require('../../utils/enums');

const Classe = sequelize.define('Classe', {
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
  nom_classe: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  niveau: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  filiere: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  effectif: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 500,
      isInt: true
    }
  },
  annee_scolaire: {
    type: DataTypes.STRING(9),
    allowNull: false,
    validate: {
      is: /^\d{4}-\d{4}$/
    }
  },
  salle_principale: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  statut: {
    type: DataTypes.ENUM(...Object.values(StatutClasse)),
    defaultValue: StatutClasse.ACTIVE,
    validate: {
      isIn: [Object.values(StatutClasse)]
    }
  }
}, {
  tableName: 'classes',
  hooks: {
    beforeUpdate: (classe) => {
      classe.updated_at = new Date();
    }
  },
  indexes: [
    {
      fields: ['etablissement_id']
    },
    {
      fields: ['niveau']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['nom_classe']
    }
  ]
});

// Méthodes d'instance
Classe.prototype.archiver = function() {
  this.statut = StatutClasse.ARCHIVEE;
  return this.save();
};

Classe.prototype.activer = function() {
  this.statut = StatutClasse.ACTIVE;
  return this.save();
};

Classe.prototype.getInformations = function() {
  return {
    id: this.id,
    nom_classe: this.nom_classe,
    niveau: this.niveau,
    filiere: this.filiere,
    effectif: this.effectif,
    annee_scolaire: this.annee_scolaire,
    statut: this.statut
  };
};

module.exports = Classe;