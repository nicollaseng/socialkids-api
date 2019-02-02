const uuidv4 = require('uuid/v4');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Contas', 'identifier', {
      type: Sequelize.ENUM,
      values: ['ordinaria', 'extraordinaria', 'reserva']
    });

    const contas = await queryInterface.sequelize.query(
      'SELECT DISTINCT "condominioId" FROM "Contas" WHERE name = \'Conta Padrão\'',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (contas.length > 0) {
      await queryInterface.bulkInsert(
        'Contas',
        contas.map(conta => ({
          id: uuidv4(),
          name: 'Extraordinária',
          identifier: 'extraordinaria',
          condominioId: conta.condominioId,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );

      await queryInterface.bulkInsert(
        'Contas',
        contas.map(conta => ({
          id: uuidv4(),
          name: 'Fundo de Reserva',
          identifier: 'reserva',
          condominioId: conta.condominioId,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );

      await queryInterface.sequelize.query(
        'UPDATE "Contas" SET "name" = \'Ordinária\', "identifier" = \'ordinaria\' WHERE "name" = \'Conta Padrão\'',
        { type: queryInterface.sequelize.QueryTypes.UPDATE }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Contas', 'identifier');

    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Contas_identifier"',
      { type: queryInterface.sequelize.QueryTypes.RAW }
    );
  }
};
