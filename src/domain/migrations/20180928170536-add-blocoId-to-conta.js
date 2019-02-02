module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Contas', 'blocoId', {
      type: Sequelize.UUID,
      references: {
        model: 'Blocos',
        key: 'id'
      },
      onDelete: 'cascade'
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.removeColumn('Contas', 'blocoId')
  )
};
