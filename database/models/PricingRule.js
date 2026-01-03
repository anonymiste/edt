const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const { TypeMetrique } = require('../../utils/enums');

const PricingRule = sequelize.define('PricingRule', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type_metrique: {
        type: DataTypes.ENUM(...Object.values(TypeMetrique)),
        allowNull: false,
        validate: {
            isIn: [Object.values(TypeMetrique)]
        }
    },
    prix_unitaire: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        },
        comment: 'Prix par unité de métrique'
    },
    seuil_min: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0
        },
        comment: 'Seuil minimum pour appliquer cette règle'
    },
    seuil_max: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0
        },
        comment: 'Seuil maximum pour appliquer cette règle'
    },
    actif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    ordre: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Ordre d\'application des règles'
    }
}, {
    tableName: 'pricing_rules',
    hooks: {
        beforeUpdate: (rule) => {
            rule.updated_at = new Date();
        }
    },
    indexes: [
        {
            fields: ['type_metrique']
        },
        {
            fields: ['actif']
        },
        {
            fields: ['ordre']
        }
    ]
});

// Méthodes d'instance
PricingRule.prototype.appliesTo = function (quantity) {
    if (!this.actif) return false;

    if (this.seuil_min !== null && quantity < this.seuil_min) {
        return false;
    }

    if (this.seuil_max !== null && quantity > this.seuil_max) {
        return false;
    }

    return true;
};

PricingRule.prototype.calculatePrice = function (quantity) {
    if (!this.appliesTo(quantity)) return 0;

    let billableQuantity = quantity;

    // Si il y a un seuil min, on ne facture que ce qui dépasse
    if (this.seuil_min !== null) {
        billableQuantity = Math.max(0, quantity - this.seuil_min);
    }

    return billableQuantity * parseFloat(this.prix_unitaire);
};

module.exports = PricingRule;
