module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Contatos', 'fraction', {
      type: Sequelize.STRING(30)
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.removeColumn('Contatos', 'fraction')
  )
};
