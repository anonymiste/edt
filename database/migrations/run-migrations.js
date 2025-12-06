const { sequelize } = require('../../config/database');
const migration = require('./001-create-tables');

async function runMigrations() {
  try {
    console.log('🚀 Démarrage des migrations...');
    
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Exécution de la migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('🎉 Migrations terminées avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;