module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Users', 'cpf', {
      unique: true,
      type: Sequelize.STRING
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.removeColumn('Users', 'cpf')
  )
};
