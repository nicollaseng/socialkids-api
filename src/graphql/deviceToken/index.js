const { mutationWithClientMutationId } = require('graphql-relay');
const winston = require('winston');

const {
  GraphQLNonNull,
  GraphQLString
} = require('graphql');

const { InternalError } = require('../../errors/internal');
const BaseGraphQLService = require('../base');
const deviceTokenService = require('../../services/deviceToken');

class DeviceTokenGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: deviceTokenService
    });
  }

  getDestroyMutation() {
    return mutationWithClientMutationId({
      name: `Destroy${this.name}`,
      inputFields: {
        token: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      outputFields: {
        deletedToken: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: payload => payload.token
        }
      },
      mutateAndGetPayload: async (object, context, info) => {
        try {
          const { token } = object;
          await this.service.destroyByToken(context, token);

          return {
            token
          };
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error(`Destroy ${this.name} error:`, err);
          throw new InternalError(`destroy_${this.nameLowerCase}_error`, err);
        }
      }
    });
  }

  getSchema() {
    return {
      mutation: {
        [`create${this.name}`]: this.getCreateMutation(),
        [`destroy${this.name}`]: this.getDestroyMutation()
      }
    };
  }
}

module.exports = fieldsCache => new DeviceTokenGraphQLService(fieldsCache);
