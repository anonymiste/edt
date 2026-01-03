const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const SeanceVirtuelle = sequelize.define('SeanceVirtuelle', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Cours en ligne'
    },
    cours_id: {
        type: DataTypes.UUID,
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
    lien_visio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    plateforme: {
        type: DataTypes.STRING,
        defaultValue: 'Google Meet', // ou Zoom, Teams
        comment: 'Information indicative'
    },
    statut: {
        type: DataTypes.ENUM('PROGRAMMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'),
        defaultValue: 'PROGRAMMEE'
    }
}, {
    tableName: 'seances_virtuelles',
    indexes: [
        {
            fields: ['cours_id']
        },
        {
            fields: ['date_debut']
        }
    ]
});

module.exports = SeanceVirtuelle;
