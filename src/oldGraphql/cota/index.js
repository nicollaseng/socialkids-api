const _ = require('lodash');
const moment = require('moment');

const {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const { Contato } = require('../../domain');
const { InternalError } = require('../../errors/internal');
const lancamentoService = require('../../services/lancamento');
const membershipService = require('../../services/membership');

class CotaGraphQlService {
  getQuery() {
    return {
      cota: {
        type: new GraphQLObjectType({
          name: 'Cota',

          fields: {
            condominioId: {
              type: GraphQLString,
              resolve: (source, args, context, info) => {
                const { condominio } = source;
                return condominio.id;
              }
            },

            status: {
              type: GraphQLString,
              resolve: (source, args, context, info) => {
                const { condominio, vencimento, lancamento } = source;

                return lancamentoService.statusCotaAtualByBlocoIdAndUnidade(
                  context,
                  condominio.id,
                  lancamento,
                  vencimento
                );
              }
            },

            vencimento: {
              type: GraphQLString
            }
          }
        }),

        args: {
          condominioId: {
            type: new GraphQLNonNull(GraphQLString)
          }
        },

        resolve: async (source, args, context, info) => {
          // FIXME: Need some refactor here
          const membership = await membershipService
            .findByCurrentUserAndCondominioIdIncludeCondominio(
              context,
              args.condominioId
            );

          if (!membership) {
            throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
          }

          const condominio = membership.condominio.dataValues;
          const firstDay = moment().startOf('month').format('YYYY-MM-DD');
          const lastDay = moment().endOf('month').format('YYYY-MM-DD');

          const lancamento = membership.unidade ? await lancamentoService.model.find({
            order: ['data'],
            where: {
              condominioId: condominio.id,
              '$contato.blocoId$': membership.blocoId,
              '$contato.unidade$': membership.unidade,
              tipo: 'credito',
              data: {
                $gte: firstDay,
                $lte: lastDay
              }
            },
            include: [{
              model: Contato,
              as: 'contato'
            }]
          }) : null;
          return {
            membership: _.omit(membership.dataValues, 'condominio'),
            condominio,
            vencimento: lancamento && lancamento.data ? moment(lancamento.data).format('YYYY-MM-DD') : null,
            lancamento,
          };
        }
      }
    };
  }

  getSchema() {
    return {
      query: this.getQuery()
    };
  }
}

module.exports = fieldsCache => new CotaGraphQlService(fieldsCache);
