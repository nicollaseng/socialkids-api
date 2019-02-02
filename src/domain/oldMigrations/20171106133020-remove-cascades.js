module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ----------------------------------------------------------------------
    // Blocos
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('Blocos', 'Blocos_condominioId_fkey');

    await queryInterface.addConstraint('Blocos', ['condominioId'], {
      type: 'foreign key',
      name: 'Blocos_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // Categorias
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('Categorias', 'Categorias_condominioId_fkey');
    await queryInterface.removeConstraint('Categorias', 'Categorias_parentId_fkey');

    await queryInterface.addConstraint('Categorias', ['condominioId'], {
      type: 'foreign key',
      name: 'Categorias_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Categorias', ['parentId'], {
      type: 'foreign key',
      name: 'Categorias_parentId_fkey',
      references: {
        table: 'Categorias',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // Contas
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('Contas', 'Contas_condominioId_fkey');

    await queryInterface.addConstraint('Contas', ['condominioId'], {
      type: 'foreign key',
      name: 'Contas_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // ContasAprovadas
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('ContasAprovadas', 'ContasAprovadas_condominioId_fkey');
    await queryInterface.removeConstraint('ContasAprovadas', 'ContasAprovadas_userId_fkey');

    await queryInterface.addConstraint('ContasAprovadas', ['condominioId'], {
      type: 'foreign key',
      name: 'ContasAprovadas_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('ContasAprovadas', ['userId'], {
      type: 'foreign key',
      name: 'ContasAprovadas_userId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // Contatos
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('Contatos', 'Contatos_blocoId_fkey');
    await queryInterface.removeConstraint('Contatos', 'Contatos_condominioId_fkey');

    await queryInterface.addConstraint('Contatos', ['blocoId'], {
      type: 'foreign key',
      name: 'Contatos_blocoId_fkey',
      references: {
        table: 'Blocos',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Contatos', ['condominioId'], {
      type: 'foreign key',
      name: 'Contatos_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // Lancamentos
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('Lancamentos', 'Lancamentos_categoriaId_fkey');
    await queryInterface.removeConstraint('Lancamentos', 'Lancamentos_condominioId_fkey');
    await queryInterface.removeConstraint('Lancamentos', 'Lancamentos_contaId_fkey');
    await queryInterface.removeConstraint('Lancamentos', 'Lancamentos_contatoId_fkey');
    await queryInterface.removeConstraint('Lancamentos', 'Lancamentos_rateioId_fkey');

    await queryInterface.addConstraint('Lancamentos', ['categoriaId'], {
      type: 'foreign key',
      name: 'Lancamentos_categoriaId_fkey',
      references: {
        table: 'Categorias',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Lancamentos', ['condominioId'], {
      type: 'foreign key',
      name: 'Lancamentos_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Lancamentos', ['contaId'], {
      type: 'foreign key',
      name: 'Lancamentos_contaId_fkey',
      references: {
        table: 'Contas',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Lancamentos', ['contatoId'], {
      type: 'foreign key',
      name: 'Lancamentos_contatoId_fkey',
      references: {
        table: 'Contatos',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Lancamentos', ['rateioId'], {
      type: 'foreign key',
      name: 'Lancamentos_rateioId_fkey',
      references: {
        table: 'Rateios',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // Memberships
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('Memberships', 'Memberships_blocoId_fkey');
    await queryInterface.removeConstraint('Memberships', 'Memberships_condominioId_fkey');
    await queryInterface.removeConstraint('Memberships', 'Memberships_userId_fkey');

    await queryInterface.addConstraint('Memberships', ['blocoId'], {
      type: 'foreign key',
      name: 'Memberships_blocoId_fkey',
      references: {
        table: 'Blocos',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Memberships', ['condominioId'], {
      type: 'foreign key',
      name: 'Memberships_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Memberships', ['userId'], {
      type: 'foreign key',
      name: 'Memberships_userId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // RateioBlocos
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('RateioBlocos', 'RateioBlocos_blocoId_fkey');
    await queryInterface.removeConstraint('RateioBlocos', 'RateioBlocos_condominioId_fkey');

    await queryInterface.addConstraint('RateioBlocos', ['blocoId'], {
      type: 'foreign key',
      name: 'RateioBlocos_blocoId_fkey',
      references: {
        table: 'Blocos',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('RateioBlocos', ['condominioId'], {
      type: 'foreign key',
      name: 'RateioBlocos_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    // ----------------------------------------------------------------------
    // Rateios
    // ----------------------------------------------------------------------

    await queryInterface.removeConstraint('Rateios', 'Rateios_condominioId_fkey');
    await queryInterface.removeConstraint('Rateios', 'Rateios_contatoId_fkey');
    await queryInterface.removeConstraint('Rateios', 'Rateios_rateioBlocoId_fkey');

    await queryInterface.addConstraint('Rateios', ['condominioId'], {
      type: 'foreign key',
      name: 'Rateios_condominioId_fkey',
      references: {
        table: 'Condominios',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Rateios', ['contatoId'], {
      type: 'foreign key',
      name: 'Rateios_contatoId_fkey',
      references: {
        table: 'Contatos',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Rateios', ['rateioBlocoId'], {
      type: 'foreign key',
      name: 'Rateios_rateioBlocoId_fkey',
      references: {
        table: 'RateioBlocos',
        field: 'id'
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    // Nothing to do here
  }
};
