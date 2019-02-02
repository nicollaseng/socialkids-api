module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('Memberships', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      permissions: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      role: {
        type: Sequelize.ENUM,
        values: ['sindico', 'morador'],
        defaultValue: 'morador'
      },
      status: {
        type: Sequelize.ENUM,
        values: ['active', 'pending', 'inactive', 'deleted'],
        defaultValue: 'pending'
      },
      userId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      condominioId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: {
          model: 'Condominios',
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
    })
  ),

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Memberships');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Memberships_role"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Memberships_status"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
