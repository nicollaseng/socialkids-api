const _ = require('lodash');
const { resolver } = require('graphql-sequelize');
const Sequelize = require('sequelize');

const { Categoria, Lancamento } = require('../../domain');
const { extractFieldsFromFieldNodesByName, extractArgsFromField } = require('../util');
const BaseTenantService = require('../baseTenant');

class CategoriaService extends BaseTenantService {
  constructor() {
    super({
      model: Categoria,
      excludeFromType: ['parentId'],
      resolver: {
        list: (findOptions, args, context, info) => {
          const fields = extractFieldsFromFieldNodesByName(info.fieldNodes, 'categorias');

          const _findOptions = _.cloneDeep(findOptions);

          const total = _.find(fields, { name: 'total' });

          if (total) {
            const from = extractArgsFromField('from', total.args, info.variableValues);
            const to = extractArgsFromField('to', total.args, info.variableValues);
            const contas = extractArgsFromField('contas', total.args, info.variableValues);

            let query = '(SELECT SUM(valor) FROM "Lancamentos" AS lanc WHERE lanc."categoriaId" IN (SELECT id FROM "Categorias" AS sub WHERE sub."parentId" = "Categoria".id) AND lanc."pago" = true';

            const { sequelize } = Categoria;

            if (from && to) {
              query += ` AND date_trunc('day', lanc."data") >= ${sequelize.escape(from)} AND date_trunc('day', lanc."data") < ${sequelize.escape(to)}`;
            }

            if (contas) {
              const contaIn = contas.map(conta => `${sequelize.escape(conta)}`);
              query += ` AND lanc."contaId" IN (${contaIn.join()})`;
            }

            query += ')';

            if (!_findOptions.attributes) {
              _findOptions.attributes = [];
            }

            _findOptions.attributes.push([
              Sequelize.literal(query),
              'total'
            ]);
          }

          return _.merge(_findOptions, {
            where: {
              parentId: null
            }
          });
        }
      }
    });
  }

  subcategoriaListResolver(source, args, context, info) {
    const fields = extractFieldsFromFieldNodesByName(info.fieldNodes, 'subcategorias');

    const total = _.find(fields, { name: 'total' });

    if (!total) {
      return resolver(this.model.Subcategorias)(source, args, context, info);
    }

    const from = extractArgsFromField('from', total.args, info.variableValues);
    const to = extractArgsFromField('to', total.args, info.variableValues);
    const contas = extractArgsFromField('contas', total.args, info.variableValues);

    let query = '(SELECT SUM(valor) FROM "Lancamentos" AS lanc WHERE lanc."categoriaId" = "Categoria".id AND lanc."pago" = true';

    const { sequelize } = this.model;

    if (from && to) {
      query += ` AND date_trunc('day', lanc."data") >= ${sequelize.escape(from)} AND date_trunc('day', lanc."data") < ${sequelize.escape(to)}`;
    }

    if (contas) {
      const contaIn = contas.map(conta => `${sequelize.escape(conta)}`);
      query += ` AND lanc."contaId" IN (${contaIn.join()})`;
    }

    query += ')';

    const opts = {
      before(_findOptions, _args, _context) {
        const findOptions = _.cloneDeep(_findOptions);

        if (!findOptions.attributes) {
          findOptions.attributes = [];
        }

        findOptions.attributes.push([
          Sequelize.literal(query),
          'total'
        ]);

        return findOptions;
      }
    };

    return resolver(this.model.Subcategorias, opts)(source, args, context, info);
  }

  async categoriaLancamentosResolver(source, args, context, info) {
    const { id, condominioId } = source;
    const { from, to, contas } = args;
    let subcategorias = (await Categoria.findAll({ where: { parentId: id } })).map((e) => (e && e.id) || null);

    let where = {
      pago: true,
      condominioId,
      categoriaId: { $in: subcategorias }
    }

    if(from && to) {
      where.data = { $gte: from, $lt: to };
    }

    if(contas && contas.length > 0) {
      where.contaId = { $in: contas };
    }

    let lancamentos = await Lancamento.findAll({
      order: ['data'],
      where
    });

    return lancamentos;
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new CategoriaService();
