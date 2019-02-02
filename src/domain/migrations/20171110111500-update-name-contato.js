module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'UPDATE "Contatos" SET "name" = NULL WHERE "tipo" = \'morador\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
  },

  down: (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
