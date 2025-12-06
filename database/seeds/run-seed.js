require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

async function runSeed() {
  try {
    // Configuration MySQL depuis .env
    const sequelize = new Sequelize({
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'edt_generator',
      logging: console.log,
      dialectOptions: {
        // Options supplémentaires si nécessaire
        connectTimeout: 60000
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
      }
    });

    // Test de la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion MySQL établie avec succès');

    // Import dynamique du seed
    const seed = require('./test-data.js');
    
    // Création du queryInterface
    const queryInterface = sequelize.getQueryInterface();
    
    // Mock pour les options de transaction
    const mockSequelize = {
      transaction: async (callback) => {
        const transaction = await sequelize.transaction();
        try {
          const result = await callback(transaction);
          await transaction.commit();
          return result;
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      }
    };

    // Exécution du seed
    console.log('🌱 Démarrage du seeding...');
    await seed.up(queryInterface, mockSequelize);
    console.log('🎉 Seeding terminé avec succès!');

    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
}

runSeed();