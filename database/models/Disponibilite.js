const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { JourSemaine, TypeDisponibilite } = require('../../utils/enums');

const Disponibilite = sequelize.define('Disponibilite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  enseignant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  jour_semaine: {
    type: DataTypes.ENUM(...Object.values(JourSemaine)),
    allowNull: false,
    validate: {
      isIn: [Object.values(JourSemaine)]
    }
  },
  heure_debut: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  heure_fin: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: true,
      isAfter: function(value) {
        if (this.heure_debut && value <= this.heure_debut) {
          throw new Error('L\'heure de fin doit être après l\'heure de début');
        }
      }
    }
  },
  type: {
    type: DataTypes.ENUM(...Object.values(TypeDisponibilite)),
    allowNull: false,
    validate: {
      isIn: [Object.values(TypeDisponibilite)]
    }
  },
  recurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isAfter: function(value) {
        if (this.date_debut && value <= this.date_debut) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
    }
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  }
}, {
  tableName: 'disponibilites',
  hooks: {
    beforeUpdate: (disponibilite) => {
      disponibilite.updated_at = new Date();
    }
  },
  indexes: [
    {
      fields: ['enseignant_id']
    },
    {
      fields: ['jour_semaine']
    },
    {
      fields: ['type']
    },
    {
      fields: ['recurrent']
    }
  ]
});

// Méthodes d'instance
Disponibilite.prototype.estDisponible = function() {
  return this.type === TypeDisponibilite.DISPONIBLE;
};

Disponibilite.prototype.estIndisponible = function() {
  return this.type === TypeDisponibilite.INDISPONIBLE;
};

Disponibilite.prototype.estPreference = function() {
  return this.type === TypeDisponibilite.PREFERENCE;
};

Disponibilite.prototype.getDuree = function() {
  const [debutHeures, debutMinutes] = this.heure_debut.split(':').map(Number);
  const [finHeures, finMinutes] = this.heure_fin.split(':').map(Number);
  
  const debutTotalMinutes = debutHeures * 60 + debutMinutes;
  const finTotalMinutes = finHeures * 60 + finMinutes;
  
  return finTotalMinutes - debutTotalMinutes;
};

Disponibilite.prototype.estActive = function() {
  if (!this.recurrent) {
    const aujourdhui = new Date().toISOString().split('T')[0];
    return (!this.date_debut || aujourdhui >= this.date_debut) && 
           (!this.date_fin || aujourdhui <= this.date_fin);
  }
  return true;
};

Disponibilite.prototype.chevaucheAvec = function(otherDisponibilite) {
  if (this.jour_semaine !== otherDisponibilite.jour_semaine) return false;
  
  const thisDebut = this.heure_debut;
  const thisFin = this.heure_fin;
  const otherDebut = otherDisponibilite.heure_debut;
  const otherFin = otherDisponibilite.heure_fin;
  
  return (thisDebut < otherFin && thisFin > otherDebut);
};

Disponibilite.prototype.getInformations = function() {
  return {
    id: this.id,
    jour_semaine: this.jour_semaine,
    creneau: `${this.heure_debut} - ${this.heure_fin}`,
    type: this.type,
    recurrent: this.recurrent,
    duree: this.getDuree(),
    est_active: this.estActive()
  };
};

module.exports = Disponibilite;