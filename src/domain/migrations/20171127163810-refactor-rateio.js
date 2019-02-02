const _ = require('lodash');
const uuidv4 = require('uuid/v4');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    //  Renomear tabela OK
    await queryInterface.renameTable('Rateios', 'RateioUnidades');
    await queryInterface.renameColumn('Lancamentos', 'rateioId', 'rateioUnidadeId');

    await queryInterface.removeConstraint('Lancamentos', 'Lancamentos_rateioId_fkey');
    await queryInterface.removeConstraint('RateioUnidades', 'Rateios_pkey');

    await queryInterface.addConstraint('RateioUnidades', ['id'], {
      type: 'primary key',
      name: 'RateioUnidades_pkey'
    });

    await queryInterface.addConstraint('Lancamentos', ['rateioUnidadeId'], {
      type: 'foreign key',
      name: 'Lancamentos_rateioUnidadeId_fkey',
      references: {
        table: 'RateioUnidades',
        field: 'id'
      }
    });

    await queryInterface.removeConstraint('RateioUnidades', 'Rateios_condominioId_fkey');
    await queryInterface.addConstraint('RateioUnidades', ['condominioId'], {
      type: 'foreign key',
      name: 'RateioUnidades_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    await queryInterface.removeConstraint('RateioUnidades', 'Rateios_contatoId_fkey');
    await queryInterface.addConstraint('RateioUnidades', ['contatoId'], {
      type: 'foreign key',
      name: 'RateioUnidades_contatoId_fkey',
      references: {
        table: 'Contatos',
        field: 'id'
      }
    });

    await queryInterface.removeConstraint('RateioUnidades', 'Rateios_rateioBlocoId_fkey');
    await queryInterface.addConstraint('RateioUnidades', ['rateioBlocoId'], {
      type: 'foreign key',
      name: 'RateioUnidades_rateioBlocoId_fkey',
      references: {
        table: 'RateioBlocos',
        field: 'id'
      }
    });

    // Criar nova tabela Rateios OK
    await queryInterface.createTable('Rateios', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      competencia: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      condominioId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Condominios',
          key: 'id'
        }
      },
      numeroRateioBloco: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Adicionar coluna rateioId OK
    await queryInterface.addColumn('RateioBlocos', 'rateioId', {
      allowNull: true,
      type: Sequelize.UUID,
      references: {
        model: 'Rateios',
        key: 'id'
      }
    });

    const rateioBlocos = await queryInterface.sequelize.query(
      'SELECT * FROM "RateioBlocos"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const rateios = [];

    let condominioId;
    let competencia;
    let numeroRateioBloco;

    rateioBlocos.forEach((rateioBloco) => {
      if (condominioId !== rateioBloco.condominioId ||
          competencia !== rateioBloco.data ||
          numeroRateioBloco !== rateioBloco.numeroRateioBloco) {
        condominioId = rateioBloco.condominioId;
        competencia = rateioBloco.data;
        numeroRateioBloco = rateioBloco.numeroRateioBloco;

        rateios.push({
          id: uuidv4(),
          competencia,
          condominioId,
          numeroRateioBloco
        });
      }
    });

    if (rateios.length > 0) {
      await queryInterface.bulkInsert(
        'Rateios',
        rateios.map(rateio => ({
          id: rateio.id,
          competencia: rateio.competencia,
          condominioId: rateio.condominioId,
          numeroRateioBloco: rateio.numeroRateioBloco,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );
    }

    rateioBlocos.forEach((rateioBloco) => {
      const rateio = _.find(rateios, {
        competencia: rateioBloco.data,
        condominioId: rateioBloco.condominioId,
        numeroRateioBloco: rateioBloco.numeroRateioBloco
      });

      queryInterface.sequelize.query(
        `UPDATE "RateioBlocos" SET "rateioId" = '${rateio.id}' WHERE "id" = '${rateioBloco.id}'`,
        { type: queryInterface.sequelize.QueryTypes.UPDATE }
      );
    });

    await queryInterface.removeColumn('RateioBlocos', 'numeroRateioBloco');
    await queryInterface.removeColumn('RateioBlocos', 'data');
    await queryInterface.removeColumn('RateioUnidades', 'data');
    await queryInterface.removeColumn('Rateios', 'numeroRateioBloco');
  },

  down: async (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
