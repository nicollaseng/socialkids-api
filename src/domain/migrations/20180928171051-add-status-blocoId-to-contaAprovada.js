module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContasAprovadas', 'status', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('ContasAprovadas','blocoId', {
      type: Sequelize.UUID,
      references: {
        model: 'Blocos',
        key: 'id'
      },
      onDelete: 'cascade'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ContasAprovadas', 'status');
    await queryInterface.removeColumn('ContasAprovadas','blocoId');
  }
};
