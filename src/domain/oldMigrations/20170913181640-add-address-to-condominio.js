module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Condominios', 'enderecoCep', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Condominios', 'enderecoLogradouro', {
      allowNull: false,
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Condominios', 'enderecoNumero', {
      allowNull: false,
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Condominios', 'enderecoBairro', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Condominios', 'enderecoLocalidade', {
      allowNull: false,
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Condominios', 'enderecoEstado', {
      allowNull: false,
      type: Sequelize.ENUM,
      values: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Condominios', 'enderecoEstado');
    await queryInterface.removeColumn('Condominios', 'enderecoLocalidade');
    await queryInterface.removeColumn('Condominios', 'enderecoBairro');
    await queryInterface.removeColumn('Condominios', 'enderecoNumero');
    await queryInterface.removeColumn('Condominios', 'enderecoLogradouro');
    await queryInterface.removeColumn('Condominios', 'enderecoCep');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Condominios_enderecoEstado"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
