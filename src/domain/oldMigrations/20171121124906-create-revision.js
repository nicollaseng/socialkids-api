module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.createTable('Revisions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      model: {
        allowNull: false,
        type: Sequelize.STRING
      },
      documentId: {
        allowNull: false,
        type: Sequelize.UUID
      },
      document: {
        allowNull: false,
        type: Sequelize.JSONB
      },
      diff: {
        allowNull: false,
        type: Sequelize.JSONB
      },
      revision: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      userId: {
        allowNull: true,
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
    queryInterface.dropTable('Revisions');
  }
};
