const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');
const { mutationWithClientMutationId } = require('graphql-relay');
const winston = require('winston');

const {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const BaseGraphQLService = require('../base');
const logService = require('../../services/log');
const userService = require('../../services/user');

// const { GraphQLObjectType } = require('graphql');

class LogGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: logService
    });
  }

  getType() {
    const User = userService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, { cache: this.fieldsCache }), {
        user: {
          type: new GraphQLObjectType({
            name: 'LogUser',
            fields: attributeFields(User, {
              cache: this.fieldsCache,
              exclude: userService.getExcludeFromType()
            })
          }),
          resolve: resolver(this.model.User)
        },
      })
    });
  }
}

module.exports = fieldsCache => new LogGraphQLService(fieldsCache);
