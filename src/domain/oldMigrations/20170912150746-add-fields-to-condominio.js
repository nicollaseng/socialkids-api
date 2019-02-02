module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Condominios', 'name', {
      allowNull: false,
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Condominios', 'cnpj', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Condominios', 'quantidadeBlocos', {
      type: Sequelize.INTEGER
    });

    await queryInterface.addColumn('Condominios', 'quantidadeUnidades', {
      allowNull: false,
      type: Sequelize.INTEGER
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Condominios', 'quantidadeUnidades');
    await queryInterface.removeColumn('Condominios', 'quantidadeBlocos');
    await queryInterface.removeColumn('Condominios', 'cnpj');
    await queryInterface.changeColumn('Condominios', 'name', { type: Sequelize.STRING });
  }
};
