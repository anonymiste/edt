const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { CategorieMatiere, TypeCours } = require('../../utils/enums');

const Matiere = sequelize.define('Matiere', {
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
  nom_matiere: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  code_matiere: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 20],
      isUppercase: true
    }
  },
  categorie: {
    type: DataTypes.ENUM(...Object.values(CategorieMatiere)),
    allowNull: false,
    validate: {
      isIn: [Object.values(CategorieMatiere)]
    }
  },
  coefficient: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    validate: {
      min: 0.1,
      max: 10.0
    }
  },
  couleur_affichage: {
    type: DataTypes.STRING(7),
    defaultValue: '#3B82F6',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  type_cours: {
    type: DataTypes.ENUM(...Object.values(TypeCours)),
    allowNull: false,
    validate: {
      isIn: [Object.values(TypeCours)]
    }
  },
  duree_standard: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 30,
      max: 240,
      isInt: true
    }
  },
  necessite_equipement_special: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  peut_etre_en_ligne: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  volume_horaire_hebdo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 30,
      max: 600,
      isInt: true
    }
  }
}, {
  tableName: 'matieres',
  hooks: {
    beforeCreate: (matiere) => {
      // S'assurer que le code matière est en majuscules
      if (matiere.code_matiere) {
        matiere.code_matiere = matiere.code_matiere.toUpperCase();
      }
    },
    beforeUpdate: (matiere) => {
      matiere.updated_at = new Date();
      if (matiere.code_matiere) {
        matiere.code_matiere = matiere.code_matiere.toUpperCase();
      }
    }
  },
  indexes: [
    {
      fields: ['etablissement_id']
    },
    {
      fields: ['code_matiere']
    },
    {
      fields: ['categorie']
    },
    {
      fields: ['type_cours']
    }
  ]
});

// Méthodes d'instance
Matiere.prototype.estFondamentale = function() {
  return this.categorie === CategorieMatiere.FONDAMENTALE;
};

Matiere.prototype.estOptionnelle = function() {
  return this.categorie === CategorieMatiere.OPTION;
};

Matiere.prototype.getInformations = function() {
  return {
    id: this.id,
    nom_matiere: this.nom_matiere,
    code_matiere: this.code_matiere,
    categorie: this.categorie,
    coefficient: this.coefficient,
    type_cours: this.type_cours,
    duree_standard: this.duree_standard,
    volume_horaire_hebdo: this.volume_horaire_hebdo
  };
};

module.exports = Matiere;