const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');

const {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const BaseGraphQLService = require('../base');
const blocoService = require('../../services/bloco');
const contatoService = require('../../services/contato');
const membershipService = require('../../services/membership');
const rateioUnidadeService = require('../../services/rateioUnidade');
const userService = require('../../services/user');

class ContatoGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: contatoService
    });
  }

  // Override getType to add `bloco` and `rateio`
  getType() {
    const Bloco = blocoService.getModel();
    const RateioUnidade = rateioUnidadeService.getModel();
    const Membership = membershipService.getModel();
    const User = userService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache
      }), {
        bloco: {
          type: new GraphQLObjectType({
            name: 'ContatoBloco',
            fields: attributeFields(Bloco, {
              cache: this.fieldsCache
            })
          }),
          resolve: resolver(this.model.Bloco)
        },
        rateioUnidade: {
          type: new GraphQLObjectType({
            name: 'ContatoRateioUnidade',
            fields: attributeFields(RateioUnidade, {
              cache: this.fieldsCache
            })
          }),
          args: {
            rateioBlocoId: {
              type: new GraphQLNonNull(GraphQLString)
            }
          },
          resolve: (source, args, context, info) =>
            contatoService.contatoRateioUnidadeResolver(source, args, context, info)
        },
        membership: {
          type: new GraphQLList(new GraphQLObjectType({
            name: 'ContatoMembership',
            fields: _.assign(attributeFields(Membership, {
              cache: this.fieldsCache
            }), {
              user: {
                type: new GraphQLObjectType({
                  name: 'ContatoUser',
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
    });
  }
}

module.exports = fieldsCache => new ContatoGraphQLService(fieldsCache);
