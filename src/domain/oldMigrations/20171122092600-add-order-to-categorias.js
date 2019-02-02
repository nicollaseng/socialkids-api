module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Categorias', 'order', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Categorias', 'order');
  }
};
