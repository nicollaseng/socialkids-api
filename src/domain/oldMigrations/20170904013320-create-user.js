module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      name: {
        type: Sequelize.STRING(512)
      },
      email: {
        unique: true,
        type: Sequelize.STRING
      },
      salt: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING(1024)
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
    queryInterface.dropTable('Users')
  )
};
