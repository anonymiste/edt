const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Eleve = sequelize.define('Eleve', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    utilisateur_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    etablissement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    classe_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    matricule: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [1, 50]
        }
    },
    date_naissance: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    adresse: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'eleves',
    hooks: {
        beforeUpdate: (eleve) => {
            eleve.updated_at = new Date();
        }
    },
    indexes: [
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['classe_id']
        }
    ]
});

module.exports = Eleve;
