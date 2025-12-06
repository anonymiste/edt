const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { JourSemaine } = require('../../utils/enums');

const CreneauCours = sequelize.define('CreneauCours', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  emploi_temps_id: {
    type: DataTypes.UUID,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  cours_id: {
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
  date_debut_validite: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  date_fin_validite: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: function(value) {
        if (this.date_debut_validite && value <= this.date_debut_validite) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
    }
  },
  sequence_type: {
    type: DataTypes.STRING(1),
    allowNull: true,
    validate: {
      isIn: [['A', 'B', 'C', null]]
    }
  },
  est_rattrapage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  statut: {
    type: DataTypes.ENUM('planifie', 'confirme', 'annule'),
    defaultValue: 'planifie',
    validate: {
      isIn: [['planifie', 'confirme', 'annule']]
    }
  }
}, {
  tableName: 'creneaux_cours',
  hooks: {
    beforeUpdate: (creneau) => {
      creneau.updated_at = new Date();
    }
  },
  indexes: [
    {
      fields: ['emploi_temps_id']
    },
    {
      fields: ['cours_id']
    },
    {
      fields: ['salle_id']
    },
    {
      fields: ['jour_semaine', 'heure_debut', 'heure_fin']
    },
    {
      fields: ['date_debut_validite', 'date_fin_validite']
    },
    {
      fields: ['statut']
    }
  ]
});

// Méthodes d'instance
CreneauCours.prototype.getDuree = function() {
  const [debutHeures, debutMinutes] = this.heure_debut.split(':').map(Number);
  const [finHeures, finMinutes] = this.heure_fin.split(':').map(Number);
  
  const debutTotalMinutes = debutHeures * 60 + debutMinutes;
  const finTotalMinutes = finHeures * 60 + finMinutes;
  
  return finTotalMinutes - debutTotalMinutes;
};

CreneauCours.prototype.confirmer = function() {
  this.statut = 'confirme';
  return this.save();
};

CreneauCours.prototype.annuler = function() {
  this.statut = 'annule';
  return this.save();
};

CreneauCours.prototype.estConfirme = function() {
  return this.statut === 'confirme';
};

CreneauCours.prototype.estAnnule = function() {
  return this.statut === 'annule';
};

CreneauCours.prototype.estPlanifie = function() {
  return this.statut === 'planifie';
};

CreneauCours.prototype.chevaucheAvec = function(otherCreneau) {
  if (this.jour_semaine !== otherCreneau.jour_semaine) return false;
  
  const thisDebut = this.heure_debut;
  const thisFin = this.heure_fin;
  const otherDebut = otherCreneau.heure_debut;
  const otherFin = otherCreneau.heure_fin;
  
  return (thisDebut < otherFin && thisFin > otherDebut);
};

CreneauCours.prototype.estValide = function() {
  const aujourdhui = new Date().toISOString().split('T')[0];
  return aujourdhui >= this.date_debut_validite && aujourdhui <= this.date_fin_validite;
};

CreneauCours.prototype.getInformations = function() {
  return {
    id: this.id,
    jour_semaine: this.jour_semaine,
    creneau: `${this.heure_debut} - ${this.heure_fin}`,
    duree: this.getDuree(),
    statut: this.statut,
    est_rattrapage: this.est_rattrapage,
    est_valide: this.estValide()
  };
};

module.exports = CreneauCours;
