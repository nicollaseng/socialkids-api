module.exports = {
  up: async (queryInterface, Sequelize) => {
    const constraintRateios = await queryInterface.sequelize.query(
      'SELECT * FROM information_schema.constraint_table_usage WHERE constraint_name = \'Rateios_data_rateioBlocoId_contatoId_condominioId_key\'',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const constraintRateioBlocos = await queryInterface.sequelize.query(
      'SELECT * FROM information_schema.constraint_table_usage WHERE constraint_name = \'RateioBlocos_data_blocoId_condominioId_key\'',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (constraintRateios > 0) {
      await queryInterface.removeConstraint('Rateios', 'Rateios_data_rateioBlocoId_contatoId_condominioId_key');
    }

    if (constraintRateioBlocos > 0) {
      await queryInterface.removeConstraint('RateioBlocos', 'RateioBlocos_data_blocoId_condominioId_key');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
