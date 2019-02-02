module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('Rateios', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      data: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      valorAgua: {
        type: Sequelize.INTEGER
      },
      rateioBlocoId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'RateioBlocos',
          key: 'id'
        },
        onDelete: 'cascade'
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
    queryInterface.dropTable('Rateios')
  )
};
