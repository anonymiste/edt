const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Periode = sequelize.define('Periode', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    libelle: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Ex: Trimestre 1, Semestre 2'
    },
    date_debut: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    date_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    etablissement_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    actif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    annee_scolaire: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Ex: 2023-2024'
    }
}, {
    tableName: 'periodes',
    indexes: [
        {
            fields: ['etablissement_id']
        },
        {
            fields: ['date_debut', 'date_fin']
        }
    ]
});

module.exports = Periode;
