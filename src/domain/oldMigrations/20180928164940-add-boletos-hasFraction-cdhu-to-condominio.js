module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Condominios', 'idCarteira', {
      type: Sequelize.INTEGER,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','banco', {
      type: Sequelize.STRING,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','carteira', {
      type: Sequelize.STRING,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','convenio', {
      type: Sequelize.STRING,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','numeroConvenio', {
      type: Sequelize.STRING,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','numeroBoleto', {
      type: Sequelize.STRING,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','agencia', {
      type: Sequelize.STRING,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','conta', {
      type: Sequelize.STRING,
      defaultValue: null
    });
    await queryInterface.addColumn('Condominios','hasFraction', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('Condominios','cdhu', {
      type: Sequelize.STRING(100),
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Condominios', 'idCarteira');
    await queryInterface.removeColumn('Condominios', 'banco');
    await queryInterface.removeColumn('Condominios', 'carteira');
    await queryInterface.removeColumn('Condominios', 'convenio');
    await queryInterface.removeColumn('Condominios', 'numeroConvenio');
    await queryInterface.removeColumn('Condominios', 'numeroBoleto');
    await queryInterface.removeColumn('Condominios', 'agencia');
    await queryInterface.removeColumn('Condominios', 'conta');
    await queryInterface.removeColumn('Condominios', 'hasFraction');
    await queryInterface.removeColumn('Condominios', 'cdhu');
    
  }
};
