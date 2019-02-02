const { attributeFields } = require('graphql-sequelize');
const {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');
const blocoService = require('../../services/bloco');

const lancamentoService = require('../../services/lancamento');

class DevedoresGraphQlService {
  getQuery() {
    const Bloco = blocoService.getModel();

    return {
      devedores: {
        type: new GraphQLList(new GraphQLObjectType({
          name: 'Devedor',
          fields: {
            contatoId: {
              type: GraphQLString
            },
            bloco: {
              type: new GraphQLObjectType({
                name: 'DevedorBloco',
                fields: attributeFields(Bloco, {
                  cache: this.fieldsCache
                })
              })
            },
            unidade: {
              type: GraphQLString
            },
            name: {
              type: GraphQLString
            },
            competencias: {
              type: new GraphQLList(new GraphQLObjectType({
                name: 'DevedorCompetencias',
                fields: {
                  competencia: {
                    type: GraphQLString
                  },
                  totalDevido: {
                    type: GraphQLInt
                  }
                }
              }))
            }
          }
        })),

        args: {
          condominioId: {
            type: new GraphQLNonNull(GraphQLString)
          }
        },

        resolve: (source, args, context, info) =>
          lancamentoService.devedores(context, args.condominioId)
      }
    };
  }

  getSchema() {
    return {
      query: this.getQuery()
    };
  }
}

module.exports = fieldsCache => new DevedoresGraphQlService(fieldsCache);
