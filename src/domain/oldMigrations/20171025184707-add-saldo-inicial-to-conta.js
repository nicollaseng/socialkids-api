module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Contas', 'saldoInicial', {
      type: Sequelize.INTEGER
    });

    await queryInterface.addColumn('Contas', 'saldoInicialData', {
      type: Sequelize.DATEONLY
    });

    await queryInterface.addColumn('Contas', 'saldoInicialEstado', {
      type: Sequelize.ENUM,
      values: ['positivo', 'negativo']
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Contas', 'saldoInicialEstado');
    await queryInterface.removeColumn('Contas', 'saldoInicialData');
    await queryInterface.removeColumn('Contas', 'saldoInicial');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Contas_saldoInicialEstado"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
