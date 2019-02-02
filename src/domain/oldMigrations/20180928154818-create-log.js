module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      action: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ['login', 'logout'],
        defaultValue: 'login'
      },
      origin: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ['mobile', 'web'],
        defaultValue: 'mobile'
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
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Logs');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Logs_action"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Logs_origin"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
