const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { TypeSalle, StatutSalle } = require('../../utils/enums');

const Salle = sequelize.define('Salle', {
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
  nom_salle: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  batiment: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  etage: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 10]
    }
  },
  type_salle: {
    type: DataTypes.ENUM(...Object.values(TypeSalle)),
    allowNull: false,
    validate: {
      isIn: [Object.values(TypeSalle)]
    }
  },
  capacite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 1000,
      isInt: true
    }
  },
  surface: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 10,
      max: 1000
    }
  },
  accessibilite_pmr: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  statut: {
    type: DataTypes.ENUM(...Object.values(StatutSalle)),
    defaultValue: StatutSalle.DISPONIBLE,
    validate: {
      isIn: [Object.values(StatutSalle)]
    }
  }
}, {
  tableName: 'salles',
  hooks: {
    beforeUpdate: (salle) => {
      salle.updated_at = new Date();
    }
  },
  indexes: [
    {
      fields: ['etablissement_id']
    },
    {
      fields: ['type_salle']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['batiment']
    }
  ]
});

// Méthodes d'instance
Salle.prototype.estDisponible = function() {
  return this.statut === StatutSalle.DISPONIBLE;
};

Salle.prototype.estSpecialisee = function() {
  const sallesSpecialisees = [
    TypeSalle.LABORATOIRE,
    TypeSalle.GYMNASE,
    TypeSalle.AMPHITHEATRE,
    TypeSalle.INFORMATIQUE,
    TypeSalle.MUSIQUE,
    TypeSalle.ARTS
  ];
  return sallesSpecialisees.includes(this.type_salle);
};

Salle.prototype.mettreEnMaintenance = function() {
  this.statut = StatutSalle.MAINTENANCE;
  return this.save();
};

Salle.prototype.rendreDisponible = function() {
  this.statut = StatutSalle.DISPONIBLE;
  return this.save();
};

Salle.prototype.getInformations = function() {
  return {
    id: this.id,
    nom_salle: this.nom_salle,
    batiment: this.batiment,
    etage: this.etage,
    type_salle: this.type_salle,
    capacite: this.capacite,
    accessibilite_pmr: this.accessibilite_pmr,
    statut: this.statut
  };
};

module.exports = Salle;