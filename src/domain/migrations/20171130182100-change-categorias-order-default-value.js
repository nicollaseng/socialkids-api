module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Categorias', 'order', {
      type: Sequelize.INTEGER,
      defaultValue: null
    });
  },
  down: (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
