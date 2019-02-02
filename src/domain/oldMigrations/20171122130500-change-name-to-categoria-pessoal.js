module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "name" = \'Pessoal/Prestadores\' WHERE "name" = \'Pessoal\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
  },
  down: (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
