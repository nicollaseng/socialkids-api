module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Memberships', ['userId', 'condominioId'], {
      type: 'unique',
      name: 'Memberships_userId_condominioId_key'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Memberships', 'Memberships_userId_condominioId_key');
  }
};
