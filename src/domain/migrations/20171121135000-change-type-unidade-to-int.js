module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.changeColumn('Contatos', 'unidade', {
      type: 'INTEGER USING CAST("unidade" as INTEGER)'
    });

    queryInterface.changeColumn('Memberships', 'unidade', {
      type: 'INTEGER USING CAST("unidade" as INTEGER)'
    });
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.changeColumn('Contatos', 'unidade', {
      type: 'VARCHAR(255) USING CAST("unidade" as VARCHAR(255))'
    });

    queryInterface.changeColumn('Memberships', 'unidade', {
      type: 'VARCHAR(255) USING CAST("unidade" as VARCHAR(255))'
    });
  }
};
