const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { StatutConnexion, TypeOperation } = require('../../utils/enums');

// Modèle pour les logs de connexion
const LogConnexion = sequelize.define('LogConnexion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  utilisateur_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  date_heure: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  adresse_ip: {
    type: DataTypes.STRING(45),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM(...Object.values(StatutConnexion)),
    allowNull: false,
    validate: {
      isIn: [Object.values(StatutConnexion)]
    }
  },
  mot_de_passe_tente: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pays: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  }
}, {
  tableName: 'logs_connexion',
  indexes: [
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['date_heure']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['adresse_ip']
    }
  ]
});

// Modèle pour les logs de modification
const LogModification = sequelize.define('LogModification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  utilisateur_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  table_concernee: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  id_entite_concernee: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  type_operation: {
    type: DataTypes.ENUM(...Object.values(TypeOperation)),
    allowNull: false,
    validate: {
      isIn: [Object.values(TypeOperation)]
    }
  },
  valeur_avant: {
    type: DataTypes.JSON,
    allowNull: true
  },
  valeur_apres: {
    type: DataTypes.JSON,
    allowNull: true
  },
  date_heure: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  adresse_ip: {
    type: DataTypes.STRING(45),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  tableName: 'logs_modification',
  indexes: [
    {
      fields: ['utilisateur_id']
    },
    {
      fields: ['table_concernee']
    },
    {
      fields: ['type_operation']
    },
    {
      fields: ['date_heure']
    }
  ]
});

// Méthodes pour LogConnexion
LogConnexion.prototype.estConnexionReussie = function() {
  return this.statut === StatutConnexion.SUCCES;
};

LogConnexion.prototype.estConnexionEchouee = function() {
  return this.statut === StatutConnexion.ECHEC;
};

LogConnexion.prototype.getInformations = function() {
  return {
    id: this.id,
    date_heure: this.date_heure,
    adresse_ip: this.adresse_ip,
    statut: this.statut,
    pays: this.pays,
    ville: this.ville,
    reussie: this.estConnexionReussie()
  };
};

// Méthodes pour LogModification
LogModification.prototype.estCreation = function() {
  return this.type_operation === TypeOperation.CREATION;
};

LogModification.prototype.estModification = function() {
  return this.type_operation === TypeOperation.MODIFICATION;
};

LogModification.prototype.estSuppression = function() {
  return this.type_operation === TypeOperation.SUPPRESSION;
};

LogModification.prototype.getInformations = function() {
  return {
    id: this.id,
    table_concernee: this.table_concernee,
    type_operation: this.type_operation,
    date_heure: this.date_heure,
    adresse_ip: this.adresse_ip
  };
};

module.exports = {
  LogConnexion,
  LogModification
};