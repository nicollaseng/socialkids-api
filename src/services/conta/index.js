const _ = require('lodash');
const Sequelize = require('sequelize');

const { Conta, Lancamento, Contato, Categoria, Condominio } = require('../../domain');
const { extractFieldsFromFieldNodesByName, extractArgsFromField } = require('../util');
const { InternalError } = require('../../errors/internal');
const BaseTenantService = require('../baseTenant');
const reciboService = require('../recibo');

class ContaService extends BaseTenantService {
  constructor() {
    super({
      model: Conta,
      resolver: {
        list: async (findOptions, args, context, info) => {
          let { condominioId, blocoId } = findOptions.graphqlContext.body.variables;
          let contatosIds = null;
          if(condominioId && blocoId && blocoId.length > 0) {
            let contatos = await Contato.findAll({where: { condominioId, blocoId }});
            contatosIds = ((contatos && contatos.map((contato) => `\'${contato.id}\'`)) || []).join();
          }
          const fields = extractFieldsFromFieldNodesByName(info.fieldNodes, 'contas');

          const _findOptions = _.cloneDeep(findOptions);

          if (!_findOptions.attributes) {
            _findOptions.attributes = [];
          }

          const saldos = _.filter(fields, { name: 'saldo' });

          const totalDespesas = _.find(fields, { name: 'totalDespesas' });
          const totalReceitas = _.find(fields, { name: 'totalReceitas' });

          const { sequelize } = Conta;

          saldos.forEach((saldo) => {
            const data = extractArgsFromField('data', saldo.args, info.variableValues);

            let queryDespesas = '(SELECT SUM(valor) FROM "Lancamentos" AS lanc WHERE lanc."contaId" = "Conta".id AND lanc."tipo" = \'debito\' AND lanc."pago" = true';
            let queryReceitas = '(SELECT SUM(valor) FROM "Lancamentos" AS lanc WHERE lanc."contaId" = "Conta".id AND lanc."tipo" = \'credito\' AND lanc."pago" = true';

            if(blocoId && contatosIds) {
              // queryDespesas += ` AND lanc."blocoId" = \'${blocoId}\'`;
              // queryReceitas += ` AND lanc."blocoId" = \'${blocoId}\'`;
            }

            if (data) {
              const queryData = ` AND date_trunc('day', lanc."data") < ${sequelize.escape(data)}`;

              queryDespesas += queryData;
              queryReceitas += queryData;
            }

            queryDespesas += ')';
            queryReceitas += ')';

            _findOptions.attributes.push([
              Sequelize.literal(queryDespesas),
              `despesas${saldo.alias ? `_${saldo.alias}` : ''}`
            ]);

            _findOptions.attributes.push([
              Sequelize.literal(queryReceitas),
              `receitas${saldo.alias ? `_${saldo.alias}` : ''}`
            ]);
          });

          if (totalDespesas) {
            const from = extractArgsFromField('from', totalDespesas.args, info.variableValues);
            const to = extractArgsFromField('to', totalDespesas.args, info.variableValues);

            let query = '(SELECT SUM(valor) FROM "Lancamentos" AS lanc WHERE lanc."contaId" = "Conta".id AND lanc."tipo" = \'debito\' AND lanc."pago" = true';

            if(blocoId) {
              // query += ` AND lanc."blocoId" = \'${blocoId}\'`;
            }

            if (from && to) {
              query += ` AND date_trunc('day', lanc."data") >= ${sequelize.escape(from)} AND date_trunc('day', lanc."data") < ${sequelize.escape(to)}`;
            }

            query += ')';

            _findOptions.attributes.push([
              Sequelize.literal(query),
              'totalDespesas'
            ]);
          }

          if (totalReceitas) {
            const from = extractArgsFromField('from', totalReceitas.args, info.variableValues);
            const to = extractArgsFromField('to', totalReceitas.args, info.variableValues);

            let query = '(SELECT SUM(valor) FROM "Lancamentos" AS lanc WHERE lanc."contaId" = "Conta".id AND lanc."tipo" = \'credito\' AND lanc."pago" = true';

            if(blocoId) {
              // query += ` AND lanc."blocoId" = \'${blocoId}\'`;
            }

            if (from && to) {
              query += ` AND date_trunc('day', lanc."data") >= ${sequelize.escape(from)} AND date_trunc('day', lanc."data") < ${sequelize.escape(to)}`;
            }

            query += ')';

            _findOptions.attributes.push([
              Sequelize.literal(query),
              'totalReceitas'
            ]);
          }

          return _findOptions;
        }
      }
    });
  }

  async sendPrestacaoContas(context, values) {
    const { user } = context;
    if(user && user.email) {
      const { start, end, contas: contasIds, condominioId, blocoId } = values;
      const condominio = await Condominio.findById(condominioId);
      const contas = await this.model.findAll({
        order: ['order'],
        where: {
          id: { $in: contasIds },
          condominioId,
          blocoId,
        }
      });
      const categorias = await Categoria.findAll({ where: {
        condominioId,
        parentId: null
      } });
      let pdfInfo = {
        user,
        condominio,
        contas: [],
        data: { start, end },
      };

      const dateBetween = { $gte: start, $lt: end };
      const dateBeforeStart = { $lt: start };
      const dateBeforeEnd = { $lt: end };

      const queryLancamentos = (operation, condominioId, tipo, contaId, dataQuery, add = {}) => {
        let options = {
          condominioId,
          pago: true,
          contaId,
          data: dataQuery,
          ...add
        }
        if(tipo) options.tipo = tipo;
        let where = operation === 'sumBy' ? options : { where: options };
        return Lancamento[operation](where);
      }

      for(let i in contas) {
        let conta = contas[i];
        let { id, name, identifier, saldoInicial, saldoInicialEstado } = conta;
        let isPositive = (saldoInicial && saldoInicialEstado === 'positivo');
        let isNegative = (saldoInicial && saldoInicialEstado === 'negativo');

        let despesasMes = await queryLancamentos('sumBy', condominioId, 'debito', id, dateBetween);
        let receitasMes = await queryLancamentos('sumBy', condominioId, 'credito', id, dateBetween);

        let despesasInicio = await queryLancamentos('sumBy', condominioId, 'debito', id, dateBeforeStart);
        let receitasInicio = await queryLancamentos('sumBy', condominioId, 'credito', id, dateBeforeStart);
        let saldoInicio = ((receitasInicio || 0) - (despesasInicio || 0));
        if(isPositive) saldoInicio += saldoInicial;
        else if(isNegative) saldoInicio -= saldoInicial;

        let despesasFim = await queryLancamentos('sumBy', condominioId, 'debito', id, dateBeforeEnd);
        let receitasFim = await queryLancamentos('sumBy', condominioId, 'credito', id, dateBeforeEnd);
        let saldoFim = ((receitasFim || 0) - (despesasFim || 0));
        if(isPositive) saldoFim += saldoInicial;
        else if(isNegative) saldoFim -= saldoInicial;

        let categoriasInfo = [];
        for(let j in categorias) {
          let categoria = categorias[j];
          let subcategorias = await Categoria.findAll({ where: { condominioId, parentId: categoria.id }});
          let subcategoriasIds = subcategorias.map((sub) => (sub && sub.id) || null);
          let lancamentosSubcategorias = await queryLancamentos(
            'findAll', condominioId, null, id, dateBetween,
            { categoriaId: { $in: subcategoriasIds } }
          );
          let subcategoriasInfo = [];
          for(let y in subcategorias) {
            let subcategoria = subcategorias[y];
            let lans = [];
            if(lancamentosSubcategorias.length > 0) {
              lans = lancamentosSubcategorias.filter((e) => e.categoriaId === subcategoria.id);
            }
            let subInfo = {
              id: subcategoria.id,
              name: subcategoria.name,
              lancamentos: lans,
            };
            subcategoriasInfo.push(subInfo);
          }
          categoriasInfo.push({
            id: categoria.id,
            name: categoria.name,
            tipo: categoria.tipo,
            subcategorias: subcategoriasInfo,
          });
        }

        pdfInfo['contas'].push({
          id,
          name,
          identifier,
          despesasMes,
          receitasMes,
          saldoInicio,
          saldoFim,
          categorias: categoriasInfo,
        });
      }
      reciboService.sendPdfPrestacao(pdfInfo);
      return { success: true };
    }

    return { success: false };
  }

  async update(context, id, values) {
    if (values.saldoInicial && (!values.saldoInicialData || !values.saldoInicialEstado)) {
      throw new InternalError('update_conta_error', { message: 'Necessário informar data e estado do saldo inicial' });
    }

    if (values.saldoInicial) {
      const lancamentos = await Lancamento.findAll({
        where: {
          contaId: id,
          data: {
            $lt: values.saldoInicialData
          }
        }
      });

      if (lancamentos.length !== 0) {
        throw new InternalError('update_conta_error', { message: 'Existem lançamentos anteriores à data do saldo inicial' });
      }
    }

    return super.update(context, id, values);
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    let conta = await this.model.findById(id);
    // await this.assertSindicoPermission(context, condominioId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, conta.blocoId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new ContaService();
