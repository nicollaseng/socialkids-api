module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'facebookId', {
      unique: true,
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Users', 'facebookToken', {
      unique: true,
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'facebookId');
    await queryInterface.removeColumn('Users', 'facebookToken');
  }
};
