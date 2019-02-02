module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.changeColumn('Lancamentos', 'data', {
      allowNull: false,
      type: Sequelize.DATEONLY
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.changeColumn('Lancamentos', 'data', {
      allowNull: false,
      type: Sequelize.DATE
    })
  )
};
