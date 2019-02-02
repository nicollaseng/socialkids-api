module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fixing Memberships primary key first
    await queryInterface.removeConstraint('Memberships', 'Memberships_pkey');

    await queryInterface.addConstraint('Memberships', ['id'], {
      type: 'unique',
      name: 'Memberships_pkey'
    });

    await queryInterface.createTable('Messages', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      categoria: {
        allowNull: false,
        type: Sequelize.STRING
      },
      assunto: {
        allowNull: false,
        type: Sequelize.STRING
      },
      mensagem: {
        allowNull: false,
        type: Sequelize.STRING
      },
      membershipId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Memberships',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      condominioId: {
        allowNull: false,
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
    });

    await queryInterface.createTable('MessageRecipients', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      messageId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Messages',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      membershipId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Memberships',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      condominioId: {
        allowNull: false,
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
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MessageRecipients');
    await queryInterface.dropTable('Messages');
  }
};
