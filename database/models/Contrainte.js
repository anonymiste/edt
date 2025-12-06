const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { TypeContrainte, CategorieContrainte, PrioriteContrainte } = require('../../utils/enums');

const Contrainte = sequelize.define('Contrainte', {
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
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  type: {
    type: DataTypes.ENUM(...Object.values(TypeContrainte)),
    allowNull: false,
    validate: {
      isIn: [Object.values(TypeContrainte)]
    }
  },
  categorie: {
    type: DataTypes.ENUM(...Object.values(CategorieContrainte)),
    allowNull: false,
    validate: {
      isIn: [Object.values(CategorieContrainte)]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  poids: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    validate: {
      min: 0.1,
      max: 10.0
    }
  },
  severite: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10,
      isInt: true
    }
  },
  priorite: {
    type: DataTypes.ENUM(...Object.values(PrioriteContrainte)),
    defaultValue: PrioriteContrainte.MOYENNE,
    validate: {
      isIn: [Object.values(PrioriteContrainte)]
    }
  },
  parametres: {
    type: DataTypes.JSON,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'contraintes',
  hooks: {
    beforeUpdate: (contrainte) => {
      contrainte.updated_at = new Date();
    }
  },
  indexes: [
    {
      fields: ['etablissement_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['categorie']
    },
    {
      fields: ['priorite']
    },
    {
      fields: ['active']
    }
  ]
});

// Méthodes d'instance
Contrainte.prototype.estContrainteDure = function() {
  return this.type === TypeContrainte.DURE;
};

Contrainte.prototype.estContrainteSouple = function() {
  return this.type === TypeContrainte.SOUPLE;
};

Contrainte.prototype.estActive = function() {
  return this.active;
};

Contrainte.prototype.desactiver = function() {
  this.active = false;
  return this.save();
};

Contrainte.prototype.activer = function() {
  this.active = true;
  return this.save();
};

Contrainte.prototype.getScoreImpact = function() {
  // Calculer l'impact de la contrainte sur le score global
  let baseScore = this.severite * this.poids;
  if (this.estContrainteDure()) {
    baseScore *= 10; // Les contraintes dures ont plus d'impact
  }
  return baseScore;
};

Contrainte.prototype.getInformations = function() {
  return {
    id: this.id,
    nom: this.nom,
    type: this.type,
    categorie: this.categorie,
    priorite: this.priorite,
    poids: this.poids,
    severite: this.severite,
    active: this.active,
    score_impact: this.getScoreImpact()
  };
};

module.exports = Contrainte;