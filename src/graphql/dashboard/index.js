const {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt
} = require('graphql');

const lancamentoService = require('../../services/lancamento');

class DashboardGraphQlService {
  getQuery() {
    return {
      dashboard: {
        type: new GraphQLObjectType({
          name: 'Dashboard',

          fields: {
            condominioId: {
              type: GraphQLString
            },

            inadimplentes: {
              type: GraphQLInt,
              resolve: (source, args, context, info) => (
                lancamentoService.totalInadimplentes(context, source.condominioId)
              )
            },

            pagarHoje: {
              type: GraphQLInt,
              resolve: (source, args, context, info) => (
                lancamentoService.pagarHoje(context, source.condominioId)
              )
            }
          }
        }),

        args: {
          condominioId: {
            type: new GraphQLNonNull(GraphQLString)
          }
        },

        resolve: (source, args, context, info) => args
      }
    };
  }

  getSchema() {
    return {
      query: this.getQuery()
    };
  }
}

module.exports = fieldsCache => new DashboardGraphQlService(fieldsCache);
