module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('RateioBlocos', 'numeroRateioBloco', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('RateioBlocos', 'numeroRateioBloco');
  }
};
