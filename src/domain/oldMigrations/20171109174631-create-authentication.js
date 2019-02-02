module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.createTable('Authentications', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      refreshToken: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      userId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'cascade'
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
    queryInterface.dropTable('Authentications');
  }
};
