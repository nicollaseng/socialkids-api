const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');
const { mutationWithClientMutationId } = require('graphql-relay');
const {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInt,
} = require('graphql');

const BaseGraphQLService = require('../base');
const lancamentoService = require('../../services/lancamento');

const blocoService = require('../../services/bloco');
const categoriaService = require('../../services/categoria');
const contaService = require('../../services/conta');
const contatoService = require('../../services/contato');
const condominioService = require('../../services/condominio');
const membershipService = require('../../services/membership');
const userService = require('../../services/user');

class LancamentoGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: lancamentoService
    });
  }

  // Override getType to add `categoria`, `conta`, `contato` and `condomínio`
  getType() {
    const Bloco = blocoService.getModel();
    const Categoria = categoriaService.getModel();
    const Conta = contaService.getModel();
    const Contato = contatoService.getModel();
    const Condominio = condominioService.getModel();
    const Membership = membershipService.getModel();
    const User = userService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache
      }), {
        categoria: {
          type: new GraphQLObjectType({
            name: 'LancamentoCategoria',
            fields: attributeFields(Categoria, {
              cache: this.fieldsCache
            })
          }),
          resolve: resolver(this.model.Categoria)
        },
        conta: {
          type: new GraphQLObjectType({
            name: 'LancamentoConta',
            fields: attributeFields(Conta, {
              cache: this.fieldsCache
            })
          }),
          resolve: resolver(this.model.Conta)
        },
        contato: {
          type: new GraphQLObjectType({
            name: 'LancamentoContato',
            fields: _.assign(attributeFields(Contato, {
              cache: this.fieldsCache
            }), {
              bloco: {
                type: new GraphQLObjectType({
                  name: 'LancamentoContatoBloco',
                  fields: attributeFields(Bloco, {
                    cache: this.fieldsCache
                  })
                }),
                resolve: resolver(Contato.Bloco)
              },
              membership: {
                type: new GraphQLList(new GraphQLObjectType({
                  name: 'LancamentoContatoMembership',
                  fields: _.assign(attributeFields(Membership, {
                    cache: this.fieldsCache
                  }), {
                    user: {
                      type: new GraphQLObjectType({
                        name: 'LancamentoContatoMembershipUser',
                        fields: attributeFields(User, {
                          cache: this.fieldsCache,
                          exclude: userService.getExcludeFromType()
                        })
                      })
                    }
                  })
                })),
                resolve: (source, args, context, info) =>
                  contatoService.contatoMembershipResolver(source, args, context, info)
              }
            })
          }),
          resolve: resolver(this.model.Contato)
        },
        condominio: {
          type: new GraphQLObjectType({
            name: 'LancamentoCondominio',
            fields: attributeFields(Condominio, {
              cache: this.fieldsCache
            })
          }),
          resolve: resolver(this.model.Condominio)
        }
      })
    });
  }

  quitaLancamentosSendReciboMutation() {
    return mutationWithClientMutationId({
      name: 'QuitaLancamentosSendRecibo',
      inputFields: {
        values: {
          type: new GraphQLInputObjectType({
            name: 'QuitaLancamentosSendRecibo',
            fields: {
              email: {
                type: GraphQLString,
                defaultValue: '',
              },
              isQuitacao: {
                type: GraphQLBoolean,
                defaultValue: false,
              },
              isSendAll: {
                type: GraphQLBoolean,
                defaultValue: false,
              },
              condominioId: {
                type: GraphQLString
              },
              quitar: {
                type: GraphQLBoolean,
                defaultValue: false,
              },
              todos: {
                type: GraphQLBoolean
              },
              start: {
                type: GraphQLString
              },
              end: {
                type: GraphQLString
              },
              blocoId: {
                type: GraphQLString,
              },
              unidade: {
                type: GraphQLString,
              },
              lancamentos: {
                type: new GraphQLList(GraphQLString),
              }
            }
          })
        }
      },
      outputFields: {
        users: {
          type: new GraphQLList(GraphQLString),
          resolve: payload => payload.users
        }
      },
      mutateAndGetPayload: async (object, context, info) =>
        this.service.quitaLancamentosSendRecibo(context, object.values)
    });
  }

  quitaLancamentosDevedoresMutation() {
    return mutationWithClientMutationId({
      name: 'QuitaLancamentosDevedores',
      inputFields: {
        values: {
          type: new GraphQLInputObjectType({
            name: 'QuitaLancamentosDevedores',
            fields: {
              totalValue: {
                type: GraphQLInt,
                defaultValue: 0,
              },
              paidValue: {
                type: GraphQLInt,
                defaultValue: 0,
              },
              paidIn: {
                type: GraphQLString,
              },
              description: {
                type: GraphQLString,
                defaultValue: '',
              },
              dates: {
                type: new GraphQLList(GraphQLString),
                defaultValue: [''],
              },
              contatoId: {
                type: GraphQLString,
              },
            }
          })
        }
      },
      outputFields: {
        result: {
          type: GraphQLBoolean,
          resolve: payload => payload.result
        }
      },
      mutateAndGetPayload: async (object, context, info) =>
        this.service.quitaLancamentosDevedores(context, object.values)
    });
  }

  getSchema() {
    const baseSchema = super.getSchema();
    const schema = {
      mutation: {
        quitaLancamentosSendRecibo: this.quitaLancamentosSendReciboMutation(),
        quitaLancamentosDevedores: this.quitaLancamentosDevedoresMutation(),
      }
    };

    return _.merge(baseSchema, schema);
  }
}

module.exports = fieldsCache => new LancamentoGraphQLService(fieldsCache);
