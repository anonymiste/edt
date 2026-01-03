const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { PlanType, StatutSubscription } = require('../../utils/enums');

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    etablissement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'etablissements',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    plan_type: {
        type: DataTypes.ENUM(...Object.values(PlanType)),
        allowNull: false,
        defaultValue: PlanType.TRIAL,
        validate: {
            isIn: [Object.values(PlanType)]
        }
    },
    statut: {
        type: DataTypes.ENUM(...Object.values(StatutSubscription)),
        allowNull: false,
        defaultValue: StatutSubscription.ACTIVE,
        validate: {
            isIn: [Object.values(StatutSubscription)]
        }
    },
    date_debut: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    date_fin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Null pour abonnements sans limite de temps'
    },
    prix_base_mensuel: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    },
    date_prochaine_facturation: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    auto_renew: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Renouvellement automatique'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes internes sur l\'abonnement'
    }
}, {
    tableName: 'subscriptions',
    hooks: {
        beforeCreate: (subscription) => {
            // Définir la date de fin pour les abonnements TRIAL (30 jours)
            if (subscription.plan_type === PlanType.TRIAL && !subscription.date_fin) {
                const dateFin = new Date(subscription.date_debut);
                dateFin.setDate(dateFin.getDate() + 30);
                subscription.date_fin = dateFin;
            }

            // Définir la première date de facturation (1 mois après le début)
            if (!subscription.date_prochaine_facturation) {
                const nextBilling = new Date(subscription.date_debut);
                nextBilling.setMonth(nextBilling.getMonth() + 1);
                subscription.date_prochaine_facturation = nextBilling;
            }

            // Définir le prix de base selon le plan
            if (subscription.prix_base_mensuel === 0) {
                const prixBase = {
                    [PlanType.TRIAL]: 0,
                    [PlanType.BASIC]: 10,
                    [PlanType.PREMIUM]: 50,
                    [PlanType.ENTERPRISE]: 0 // Sur devis
                };
                subscription.prix_base_mensuel = prixBase[subscription.plan_type] || 0;
            }
        },
        beforeUpdate: (subscription) => {
            subscription.updated_at = new Date();
        }
    },
    indexes: [
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['statut']
        },
        {
            fields: ['date_prochaine_facturation']
        }
    ]
});

// Méthodes d'instance
Subscription.prototype.isActive = function () {
    return this.statut === StatutSubscription.ACTIVE;
};

Subscription.prototype.isExpired = function () {
    if (!this.date_fin) return false;
    return new Date() > new Date(this.date_fin);
};

Subscription.prototype.suspend = function () {
    this.statut = StatutSubscription.SUSPENDED;
    return this.save();
};

Subscription.prototype.cancel = function () {
    this.statut = StatutSubscription.CANCELLED;
    this.auto_renew = false;
    return this.save();
};

Subscription.prototype.reactivate = function () {
    this.statut = StatutSubscription.ACTIVE;
    return this.save();
};

module.exports = Subscription;
