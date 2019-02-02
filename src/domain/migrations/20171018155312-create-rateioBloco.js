module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('RateioBlocos', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      data: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      valorOrdinaria: {
        type: Sequelize.INTEGER
      },
      valorExtraordinaria: {
        type: Sequelize.INTEGER
      },
      valorFundoReserva: {
        type: Sequelize.INTEGER
      },
      blocoId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Blocos',
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
    queryInterface.dropTable('RateioBlocos')
  )
};
