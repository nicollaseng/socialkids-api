const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');
const { mutationWithClientMutationId } = require('graphql-relay');
const winston = require('winston');

const {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const { InternalError } = require('../../errors/internal');
const BaseGraphQLService = require('../base');
const blocoService = require('../../services/bloco');
const condominioService = require('../../services/condominio');
const membershipService = require('../../services/membership');
const userService = require('../../services/user');

class MembershipGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: membershipService
    });
  }

  // Override getType to add `user`, `condominio` and `bloco`
  getType() {
    const User = userService.getModel();
    const Condominio = condominioService.getModel();
    const Bloco = blocoService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache
      }), {
        user: {
          type: new GraphQLObjectType({
            name: 'MembershipUser',
            fields: attributeFields(User, {
              cache: this.fieldsCache,
              exclude: userService.getExcludeFromType()
            })
          }),
          resolve: resolver(this.model.User)
        },
        condominio: {
          type: new GraphQLObjectType({
            name: 'MembershipCondominio',
            fields: attributeFields(Condominio, {
              cache: this.fieldsCache
            })
          }),
          resolve: resolver(this.model.Condominio)
        },
        bloco: {
          type: new GraphQLObjectType({
            name: 'MembershipBloco',
            fields: attributeFields(Bloco, {
              cache: this.fieldsCache
            })
          }),
          resolve: resolver(this.model.Bloco)
        }
      })
    });
  }

  approveMembershipMutation() {
    return mutationWithClientMutationId({
      name: 'ApproveMembership',
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      outputFields: {
        membership: {
          type: this.type,
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: async (object, context, info) => {
        try {
          const { id } = object;

          return this.service.approveMembership(context, id);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Approve Membership error:', err);
          throw new InternalError('approve_membership_error', err);
        }
      }
    });
  }

  getSchema() {
    const baseSchema = super.getSchema();
    const schema = {
      mutation: {
        approveMembership: this.approveMembershipMutation()
      }
    };

    return _.merge(baseSchema, schema);
  }
}

module.exports = fieldsCache => new MembershipGraphQLService(fieldsCache);
