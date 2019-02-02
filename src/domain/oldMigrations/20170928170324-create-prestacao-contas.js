module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Categorias', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      tipo: {
        allowNull: false,
        type: Sequelize.ENUM,
        values: ['receita', 'despesa']
      },
      parentId: {
        type: Sequelize.UUID,
        references: {
          model: 'Categorias',
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

    await queryInterface.createTable('Contas', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
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

    await queryInterface.createTable('Contatos', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
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

    await queryInterface.createTable('Lancamentos', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      data: {
        allowNull: false,
        type: Sequelize.DATE
      },
      descricao: {
        allowNull: false,
        type: Sequelize.STRING
      },
      valor: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      pago: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      tipo: {
        type: Sequelize.ENUM,
        values: ['debito', 'credito'],
        allowNull: false
      },
      notas: {
        type: Sequelize.STRING
      },
      categoriaId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Categorias',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      contaId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Contas',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      contatoId: {
        type: Sequelize.UUID,
        references: {
          model: 'Contatos',
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
    await queryInterface.dropTable('Lancamentos');
    await queryInterface.dropTable('Contatos');
    await queryInterface.dropTable('Contas');
    await queryInterface.dropTable('Categorias');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Categorias_tipo"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Lancamentos_tipo"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
