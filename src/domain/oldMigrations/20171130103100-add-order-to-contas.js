module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Contas', 'order', {
      type: Sequelize.INTEGER,
      defaultValue: null
    });

    await queryInterface.sequelize.query(
      'UPDATE "Contas" SET "order" = 1 WHERE "identifier" = \'ordinaria\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Contas" SET "order" = 2 WHERE "identifier" = \'reserva\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Contas" SET "order" = 3 WHERE "identifier" = \'extraordinaria\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Contas', 'order');
  }
};
