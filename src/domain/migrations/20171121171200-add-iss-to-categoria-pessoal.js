const uuidv4 = require('uuid/v4');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categorias = await queryInterface.sequelize.query(
      'SELECT DISTINCT "id", "condominioId" FROM "Categorias" WHERE name = \'Pessoal\'',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (categorias.length > 0) {
      await queryInterface.bulkInsert(
        'Categorias',
        categorias.map(categoria => ({
          id: uuidv4(),
          name: 'ISS',
          tipo: 'despesa',
          parentId: categoria.id,
          condominioId: categoria.condominioId,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );
    }
  },

  down: (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
