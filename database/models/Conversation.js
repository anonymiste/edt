const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('DIRECT', 'GROUP'),
        defaultValue: 'DIRECT',
        allowNull: false
    },
    last_message_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['last_message_at']
        }
    ]
});

module.exports = Conversation;
