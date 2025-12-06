const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'edt_generator',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    timezone: '+01:00'
  }
);

// Test de connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès');
    
    // Vérifier les tables
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log(`📊 Nombre de tables: ${tables.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error.message);
    
    if (error.original?.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Conseil: Créez la base de données MySQL:');
      console.log('   CREATE DATABASE edt_generator;');
    }
    
    throw error;
  }
};

module.exports = { sequelize, testConnection };