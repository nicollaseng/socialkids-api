module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Condominios', 'codigo', {
      allowNull: false,
      autoIncrement: true,
      type: Sequelize.INTEGER
    })
  ),

  down: (queryInterface, Sequelize) => (
    // FIXME: find a way to remove sequence from `codigo` here
    queryInterface.removeColumn('Condominios', 'codigo')
  )
};
