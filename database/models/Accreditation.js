const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Accreditation = sequelize.define('Accreditation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    utilisateur_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'utilisateurs',
            key: 'id'
        }
    },
    etablissement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'etablissements',
            key: 'id'
        }
    },
    module: {
        type: DataTypes.ENUM('NOTES', 'ABSENCES', 'EMPLOI_TEMPS', 'FACTURATION', 'ELEVES'),
        allowNull: false
    },
    date_debut: {
        type: DataTypes.DATE,
        allowNull: false
    },
    date_fin: {
        type: DataTypes.DATE,
        allowNull: false
    },
    statut: {
        type: DataTypes.ENUM('actif', 'suspendu', 'expire'),
        defaultValue: 'actif'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'accreditations',
    timestamps: true,
    indexes: [
        {
            fields: ['utilisateur_id']
        },
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['module']
        },
        {
            fields: ['statut']
        }
    ]
});

module.exports = Accreditation;
