module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Memberships', 'bloco', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Memberships', 'unidade', {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Memberships', 'unidade');
    await queryInterface.removeColumn('Memberships', 'bloco');
  }
};
