const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { TypeCours } = require('../../utils/enums');

const Cours = sequelize.define('Cours', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  classe_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  matiere_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  enseignant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  salle_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  volume_horaire_hebdo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 30,
      max: 600,
      isInt: true
    }
  },
  duree_seance_standard: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 30,
      max: 240,
      isInt: true
    }
  },
  type_cours: {
    type: DataTypes.ENUM(...Object.values(TypeCours)),
    allowNull: false,
    validate: {
      isIn: [Object.values(TypeCours)]
    }
  },
  enseignement_en_ligne: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  effectif_max: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 500,
      isInt: true
    }
  },
  couleur_affichage: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  groupe_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'cours',
  hooks: {
    beforeCreate: (cours) => {
      // Si pas de couleur définie, utiliser celle de la matière
      if (!cours.couleur_affichage) {
        // Cette logique sera complétée après l'association
      }
    },
    beforeUpdate: (cours) => {
      cours.updated_at = new Date();
    }
  },
  indexes: [
    {
      fields: ['classe_id']
    },
    {
      fields: ['matiere_id']
    },
    {
      fields: ['enseignant_id']
    },
    {
      fields: ['salle_id']
    },
    {
      fields: ['type_cours']
    }
  ]
});

// Méthodes d'instance
Cours.prototype.getNombreSeancesHebdo = function() {
  return Math.ceil(this.volume_horaire_hebdo / this.duree_seance_standard);
};

Cours.prototype.estCoursMagistral = function() {
  return this.type_cours === TypeCours.COURS_MAGISTRAL;
};

Cours.prototype.estTP = function() {
  return this.type_cours === TypeCours.TP;
};

Cours.prototype.getInformations = function() {
  return {
    id: this.id,
    volume_horaire_hebdo: this.volume_horaire_hebdo,
    duree_seance_standard: this.duree_seance_standard,
    type_cours: this.type_cours,
    enseignement_en_ligne: this.enseignement_en_ligne,
    nombre_seances: this.getNombreSeancesHebdo()
  };
};

module.exports = Cours;