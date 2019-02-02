module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('Condominios', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      name: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.dropTable('Condominios')
  )
};
