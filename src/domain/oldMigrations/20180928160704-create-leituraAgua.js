module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('LeituraAguas', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      leituraAnterior: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      leituraAtual: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      valorConsumido: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      picture: {
        type: Sequelize.STRING
      },
      referencia: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      contatoId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Contatos',
          key: 'id'
        },
        onDelete: 'cascade'
      },
      rateioBlocoId: {
        type: Sequelize.UUID,
        references: {
          model: 'RateioBlocos',
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
    })
  ),

  down: (queryInterface, Sequelize) => (
    queryInterface.dropTable('LeituraAguas')
  )
};
