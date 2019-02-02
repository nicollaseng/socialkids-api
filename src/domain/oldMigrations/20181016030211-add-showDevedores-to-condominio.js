module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Condominios', 'showDevedores', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    })
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Condominios', 'showDevedores')
  }
};
