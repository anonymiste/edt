const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const RepartitionSalle = sequelize.define('RepartitionSalle', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    session_examen_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    salle_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    surveillant_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Enseignant surveillant'
    },
    eleves_assignes: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Array of student IDs assigned to this room'
    },
    nombre_places_utilisees: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'repartitions_salle',
    indexes: [
        {
            fields: ['session_examen_id']
        },
        {
            fields: ['salle_id']
        },
        {
            fields: ['surveillant_id']
        }
    ]
});

module.exports = RepartitionSalle;
