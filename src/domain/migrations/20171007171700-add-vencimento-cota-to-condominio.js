module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Condominios', 'vencimentoCota', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.removeColumn('Condominios', 'vencimentoCota')
  )
};
