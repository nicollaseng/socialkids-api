module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.addColumn('Users', 'status', {
      type: Sequelize.ENUM,
      values: ['invited', 'active', 'pending', 'inactive', 'deleted'],
      defaultValue: 'active'
    })
  ),

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'status');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Users_status"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
