module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('Videoaulas', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      titulo: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      categoria: {
        type: Sequelize.STRING(100)
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
    queryInterface.dropTable('Videoaulas')
  )
};
