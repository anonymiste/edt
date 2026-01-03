const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const UsageMetric = sequelize.define('UsageMetric', {
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
    periode_debut: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    periode_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    nb_utilisateurs_actifs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    nb_classes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    nb_cours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    nb_emplois_temps_generes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    stockage_utilise_mb: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: 'Stockage utilisé en mégaoctets'
    },
    date_capture: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    details_json: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Détails supplémentaires sur l\'utilisation'
    }
}, {
    tableName: 'usage_metrics',
    hooks: {
        beforeCreate: (metric) => {
            if (!metric.date_capture) {
                metric.date_capture = new Date();
            }
        }
    },
    indexes: [
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['periode_debut', 'periode_fin']
        },
        {
            fields: ['date_capture']
        }
    ]
});

// Méthodes d'instance
UsageMetric.prototype.getTotalUsage = function () {
    return {
        utilisateurs: this.nb_utilisateurs_actifs,
        classes: this.nb_classes,
        cours: this.nb_cours,
        emplois_temps: this.nb_emplois_temps_generes,
        stockage_mb: this.stockage_utilise_mb
    };
};

module.exports = UsageMetric;
