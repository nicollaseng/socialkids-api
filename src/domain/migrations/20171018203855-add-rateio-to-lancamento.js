module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Lancamentos', 'rateioId', {
      type: Sequelize.UUID,
      references: {
        model: 'Rateios',
        key: 'id'
      },
      onDelete: 'cascade'
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.removeColumn('Lancamentos', 'rateioId')
  )
};
