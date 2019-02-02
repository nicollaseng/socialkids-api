module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Contatos', 'bloco', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Contatos', 'unidade', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Contatos', 'tipo', {
      type: Sequelize.ENUM,
      values: ['externo', 'morador'],
      allowNull: false,
      defaultValue: 'externo'
    });

    await queryInterface.changeColumn('Contatos', 'name', {
      type: Sequelize.STRING
    });

    await queryInterface.addConstraint('Contatos', ['bloco', 'unidade', 'condominioId'], {
      type: 'unique',
      name: 'Contatos_bloco_unidade_condominioId_key'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Contatos', 'Contatos_bloco_unidade_condominioId_key');
    await queryInterface.changeColumn('Contatos', 'name', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.removeColumn('Contatos', 'tipo');
    await queryInterface.removeColumn('Contatos', 'unidade');
    await queryInterface.removeColumn('Contatos', 'bloco');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Contatos_tipo"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
