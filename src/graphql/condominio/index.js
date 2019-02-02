
const _ = require('lodash');
const { attributeFields } = require('graphql-sequelize');

const {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString
} = require('graphql');

const BaseGraphQLService = require('../base');
const condominioService = require('../../services/condominio');

class CondominioGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: condominioService
    });
  }

  getCreateType() {
    return new GraphQLInputObjectType({
      name: 'CreateCondominio',
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache,
        exclude: ['id', 'createdAt', 'updatedAt'].concat(this.service.getExcludeFromCreateType())
      }), {
        blocos: {
          type: new GraphQLList(new GraphQLInputObjectType({
            name: 'CreateCondominioBloco',
            fields: {
              name: {
                type: new GraphQLNonNull(GraphQLString)
              },
              quantidadeUnidades: {
                type: new GraphQLNonNull(GraphQLInt)
              }
            }
          }))
        }
      })
    });
  }
}

module.exports = fieldsCache => new CondominioGraphQLService(fieldsCache);
