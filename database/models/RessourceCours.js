const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const RessourceCours = sequelize.define('RessourceCours', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('PDF', 'VIDEO', 'IMAGE', 'LIEN', 'AUTRE'),
        defaultValue: 'AUTRE'
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Chemin relatif du fichier ou URL externe'
    },
    cours_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    enseignant_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    date_ajout: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'ressources_cours',
    indexes: [
        {
            fields: ['cours_id']
        },
        {
            fields: ['enseignant_id']
        }
    ]
});

module.exports = RessourceCours;
