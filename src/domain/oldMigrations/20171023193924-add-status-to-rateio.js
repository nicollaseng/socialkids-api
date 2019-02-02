module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Rateios', 'status', {
      type: Sequelize.ENUM,
      values: ['pendente', 'lancado', 'cancelado'],
      defaultValue: 'pendente'
    });

    await queryInterface.addColumn('RateioBlocos', 'status', {
      type: Sequelize.ENUM,
      values: ['pendente', 'lancado', 'cancelado'],
      defaultValue: 'pendente'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('RateioBlocos', 'status');
    await queryInterface.removeColumn('Rateios', 'status');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Rateios_status"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_RateioBlocos_status"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
