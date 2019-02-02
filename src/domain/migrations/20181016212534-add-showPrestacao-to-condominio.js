module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Condominios', 'showPrestacao', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    })
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Condominios', 'showPrestacao')
  }
};
