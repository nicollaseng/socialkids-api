module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Users', 'phone', {
      unique: true,
      type: Sequelize.STRING
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.removeColumn('Users', 'phone')
  )
};
