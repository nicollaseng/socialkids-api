module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.createTable('DeviceTokens', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      token: {
        allowNull: false,
        type: Sequelize.STRING
      },
      userId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.dropTable('DeviceTokens');
  }
};
