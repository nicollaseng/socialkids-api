module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Set order Categorias
    // Despesa Pessoal
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Pessoal\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    // Subcategorias Pessoal
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Salário\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 2 WHERE "name" = \'Adiantamento\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 3 WHERE "name" = \'INSS\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 4 WHERE "name" = \'FGTS\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 5 WHERE "name" = \'PIS\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 6 WHERE "name" = \'ISS\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 7 WHERE "name" = \'Vale Refeição\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 8 WHERE "name" = \'Outras Despesas com Pessoal\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );


    // Despesa Consumo
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 2 WHERE "name" = \'Consumo\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    // Subcategorias Consumo
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Água e Esgoto\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 2 WHERE "name" = \'Luz\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 3 WHERE "name" = \'Gás\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 4 WHERE "name" = \'Outros Consumos\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );


    // Despesa Manutenção e Conservação
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 3 WHERE "name" = \'Manutenção e Conservação\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    // Subcategorias Manutenção e Conservação
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Bombas\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 2 WHERE "name" = \'Portões e Interfones\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 3 WHERE "name" = \'Jardinagem\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 4 WHERE "name" = \'Outras Manutenções\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );


    // Despesa Material de Consumo
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 4 WHERE "name" = \'Material de Consumo\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    // Subcategorias Material de Consumo
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Material de Limpeza\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 2 WHERE "name" = \'Outros Materiais\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );


    // Despesa Despesas Diversas
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 5 WHERE "name" = \'Despesas Diversas\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    // Subcategorias Despesas Diversas
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Despesas com Administração\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 2 WHERE "name" = \'Despesas Bancárias\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 3 WHERE "name" = \'Outras Despesas\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );


    // Receita Cotas Condominiais
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Cotas Condominiais\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    // Subcategoria Cotas Condominiais
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 1 WHERE "name" = \'Condomínio\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 2 WHERE "name" = \'Condomínio Atrasado\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 3 WHERE "name" = \'Multa por Atraso\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 4 WHERE "name" = \'Rateio Extra\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 5 WHERE "name" = \'Obras e Melhorias\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
    await queryInterface.sequelize.query(
      'UPDATE "Categorias" SET "order" = 6 WHERE "name" = \'Outras Receitas\'',
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
  },

  down: (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
