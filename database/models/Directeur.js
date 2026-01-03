const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Directeur = sequelize.define('Directeur', {
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
    matricule: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [1, 50]
        }
    },
    date_nomination: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true
        }
    }
}, {
    tableName: 'directeurs',
    hooks: {
        beforeUpdate: (directeur) => {
            directeur.updated_at = new Date();
        }
    },
    indexes: [
        {
            fields: ['utilisateur_id']
        },
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['matricule']
        }
    ]
});

module.exports = Directeur;
