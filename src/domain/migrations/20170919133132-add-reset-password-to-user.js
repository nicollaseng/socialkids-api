module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'resetPasswordToken', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Users', 'resetPasswordExpiresAt', {
      type: Sequelize.DATE
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'resetPasswordExpiresAt');
    await queryInterface.removeColumn('Users', 'resetPasswordToken');
  }
};
