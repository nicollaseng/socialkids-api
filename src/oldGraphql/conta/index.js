const _ = require('lodash');
const { attributeFields } = require('graphql-sequelize');
const { mutationWithClientMutationId } = require('graphql-relay');

const {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList
} = require('graphql');

const BaseGraphQLService = require('../base');
const contaService = require('../../services/conta');

class ContaGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: contaService
    });
  }

  // Override getType to add `saldo`, `totalReceitas` and `totalDespesas`
  getType() {
    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache
      }), {
        saldo: {
          type: GraphQLInt,
          args: {
            data: {
              type: GraphQLString
            }
          },
          resolve: (source, args, context, info) => {
            const { dataValues } = source;

            const field = info.fieldNodes.find(fieldNode => fieldNode.name.value === 'saldo');

            let receitasField;
            let despesasField;

            if (field.alias) {
              receitasField = `receitas_${field.alias.value}`;
              despesasField = `despesas_${field.alias.value}`;
            } else {
              receitasField = 'receitas';
              despesasField = 'despesas';
            }

            let saldo = ((dataValues[receitasField] || 0) - (dataValues[despesasField] || 0));

            if (dataValues.saldoInicial) {
              if (dataValues.saldoInicialEstado === 'positivo') {
                saldo += dataValues.saldoInicial;
              } else if (dataValues.saldoInicialEstado === 'negativo') {
                saldo -= dataValues.saldoInicial;
              }
            }

            return saldo;
          }
        },
        totalReceitas: {
          type: GraphQLInt,
          args: {
            from: {
              type: GraphQLString
            },
            to: {
              type: GraphQLString
            }
          },
          resolve: (source, args, context, info) => source.dataValues.totalReceitas || 0
        },
        totalDespesas: {
          type: GraphQLInt,
          args: {
            from: {
              type: GraphQLString
            },
            to: {
              type: GraphQLString
            }
          },
          resolve: (source, args, context, info) => source.dataValues.totalDespesas || 0
        },
        blocoId: {
          type: GraphQLString,
          args: {
            blocoId: {
              type: GraphQLString
            }
          },
          resolve: (source, args, context, info) => source.dataValues.blocoId
        }
      })
    });
  }

  sendPrestacaoContas() {
    return mutationWithClientMutationId({
      name: 'SendPrestacaoContas',
      inputFields: {
        values: {
          type: new GraphQLInputObjectType({
            name: 'SendPrestacaoContas',
            fields: {
              start: {
                type: GraphQLString
              },
              end: {
                type: GraphQLString
              },
              contas: {
                type: new GraphQLList(GraphQLString),
              },
              blocoId: {
                type: GraphQLString
              },
              condominioId: {
                type: GraphQLString
              },
            }
          })
        }
      },
      outputFields: {
        success: {
          type: GraphQLBoolean,
          resolve: payload => payload.success
        }
      },
      mutateAndGetPayload: async (object, context, info) =>
        this.service.sendPrestacaoContas(context, object.values)
    });
  }

  getSchema() {
    const baseSchema = super.getSchema();
    const schema = {
      mutation: {
        sendPrestacaoContas: this.sendPrestacaoContas(),
      }
    };

    return _.merge(baseSchema, schema);
  }
}

module.exports = fieldsCache => new ContaGraphQLService(fieldsCache);
