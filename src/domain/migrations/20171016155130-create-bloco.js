const uuidv4 = require('uuid/v4');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Blocos', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantidadeUnidades: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      condominioId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Condominios',
          key: 'id'
        },
        onDelete: 'cascade'
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

    const blocos = await queryInterface.sequelize.query(
      'SELECT DISTINCT "bloco", "quantidadeUnidades", "condominioId" FROM "Memberships" INNER JOIN "Condominios" ON "Memberships"."condominioId" = "Condominios"."id" WHERE "bloco" IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (blocos.length > 0) {
      await queryInterface.bulkInsert(
        'Blocos',
        blocos.map(bloco => ({
          id: uuidv4(),
          name: bloco.bloco,
          quantidadeUnidades: bloco.quantidadeUnidades,
          condominioId: bloco.condominioId,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );
    }

    await queryInterface.addColumn('Memberships', 'blocoId', {
      type: Sequelize.UUID,
      references: {
        model: 'Blocos',
        key: 'id'
      },
      onDelete: 'cascade'
    });

    const memberships = await queryInterface.sequelize.query(
      'SELECT m."id" AS membership_id, b."id" AS bloco_id FROM "Memberships" AS m INNER JOIN "Blocos" AS b ON (m.bloco = b.name AND m."condominioId" = b."condominioId") WHERE m.bloco IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (memberships.length > 0) {
      const updateMemberships = memberships.map(membership => queryInterface.sequelize.query(
        `UPDATE "Memberships" SET "blocoId" = '${membership.bloco_id}' WHERE "id" = '${membership.membership_id}'`,
        { type: queryInterface.sequelize.QueryTypes.UPDATE }
      ));

      await Promise.all(updateMemberships);
    }

    await queryInterface.removeColumn('Memberships', 'bloco');

    await queryInterface.removeColumn('Memberships', 'permissions');

    await queryInterface.addColumn('Contatos', 'blocoId', {
      type: Sequelize.UUID,
      references: {
        model: 'Blocos',
        key: 'id'
      },
      onDelete: 'cascade'
    });

    const contatos = await queryInterface.sequelize.query(
      'SELECT c."id" AS contato_id, b."id" AS bloco_id FROM "Contatos" AS c INNER JOIN "Blocos" b ON (c.bloco = b.name AND c."condominioId" = b."condominioId") WHERE c.bloco IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (contatos.length > 0) {
      const updateContatos = contatos.map(contato => queryInterface.sequelize.query(
        `UPDATE "Contatos" SET "blocoId" = '${contato.bloco_id}' WHERE "id" = '${contato.contato_id}'`,
        { type: queryInterface.sequelize.QueryTypes.UPDATE }
      ));

      await Promise.all(updateContatos);
    }

    await queryInterface.removeColumn('Contatos', 'bloco');

    await queryInterface.addConstraint('Contatos', ['blocoId', 'unidade', 'condominioId'], {
      type: 'unique',
      name: 'Contatos_blocoId_unidade_condominioId_key'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Contatos', 'Contatos_blocoId_unidade_condominioId_key');

    await queryInterface.addColumn('Contatos', 'bloco', {
      type: Sequelize.STRING
    });

    await queryInterface.removeColumn('Contatos', 'blocoId');

    await queryInterface.addColumn('Memberships', 'permissions', {
      type: Sequelize.ARRAY(Sequelize.STRING)
    });

    await queryInterface.addColumn('Memberships', 'bloco', {
      type: Sequelize.STRING
    });

    await queryInterface.removeColumn('Memberships', 'blocoId');

    await queryInterface.dropTable('Blocos');
  }
};
