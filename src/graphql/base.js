const _ = require('lodash');
const { mutationWithClientMutationId } = require('graphql-relay');
const winston = require('winston');

const {
  attributeFields,
  defaultArgs,
  defaultListArgs
} = require('graphql-sequelize');

const {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const { InternalError } = require('../errors/internal');

class BaseGraphQLService {
  constructor(options) {
    this.fieldsCache = options.fieldsCache;
    this.service = options.service;

    this.model = this.service.getModel();
    this.name = this.model.name;
    this.nameLowerCase = _.camelCase(this.name);
    this.plural = options.plural || `${this.name}s`;
    this.pluralLowerCase = _.camelCase(this.plural);

    this.type = this.getType();
    this.createType = this.getCreateType();
    this.updateType = this.getUpdateType();
  }

  getType() {
    return new GraphQLObjectType({
      name: this.name,
      fields: attributeFields(this.model, {
        cache: this.fieldsCache,
        exclude: this.service.getExcludeFromType()
      })
    });
  }

  getCreateType() {
    return new GraphQLInputObjectType({
      name: `Create${this.name}`,
      fields: attributeFields(this.model, {
        cache: this.fieldsCache,
        exclude: ['id', 'createdAt', 'updatedAt', 'revision'].concat(this.service.getExcludeFromCreateType())
      })
    });
  }

  getUpdateType() {
    return new GraphQLInputObjectType({
      name: `Update${this.name}`,
      fields: attributeFields(this.model, {
        allowNull: true,
        cache: this.fieldsCache,
        // FIXME: getExcludeFromUpdateType or getExcludeFromCreateAndUpdateType
        exclude: ['id', 'createdAt', 'updatedAt', 'revision'].concat(this.service.getExcludeFromCreateType())
      })
    });
  }

  getCreateMutation() {
    return mutationWithClientMutationId({
      name: `Create${this.name}`,
      inputFields: {
        create: {
          type: this.createType
        }
      },
      outputFields: {
        [this.nameLowerCase]: {
          type: this.type,
          resolve: payload => payload
        }
      },
      // mutateAndGetPayload = (
      //   object: any,
      //   context: any,
      //   info: GraphQLResolveInfo
      // ) => Promise<any> | any;
      mutateAndGetPayload: async (object, context, info) => {
        try {
          const { create } = object;
          const entity = await this.service.create(context, create);

          return entity;
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error(`Create ${this.name} error:`, err);
          throw new InternalError(`create_${this.nameLowerCase}_error`, err);
        }
      }
    });
  }

  getUpdateMutation() {
    return mutationWithClientMutationId({
      name: `Update${this.name}`,
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLString)
        },
        update: {
          type: this.updateType
        }
      },
      outputFields: {
        [this.nameLowerCase]: {
          type: this.type,
          resolve: payload => payload
        }
      },
      // mutateAndGetPayload = (
      //   object: any,
      //   context: any,
      //   info: GraphQLResolveInfo
      // ) => Promise<any> | any;
      mutateAndGetPayload: async (object, context, info) => {
        try {
          const { id, update } = object;
          const entity = await this.service.update(context, id, update);

          return entity;
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error(`Update ${this.name} error:`, err);
          throw new InternalError(`update_${this.nameLowerCase}_error`, err);
        }
      }
    });
  }

  getDestroyMutation() {
    return mutationWithClientMutationId({
      name: `Destroy${this.name}`,
      inputFields: {
        id: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      outputFields: {
        deletedId: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: payload => payload.id
        }
      },
      // mutateAndGetPayload = (
      //   object: any,
      //   context: any,
      //   info: GraphQLResolveInfo
      // ) => Promise<any> | any;
      mutateAndGetPayload: async (object, context, info) => {
        try {
          const { id } = object;
          await this.service.destroy(context, id);

          return {
            id
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

  getQuery() {
    return {
      [this.pluralLowerCase]: {
        // The resolver will use `findOne` or `findAll` depending on whether the field it's used in
        // is a `GraphQLList` or not
        type: new GraphQLList(this.type),

        // `defaultListArgs` will return an object containing limit and ordering args and the
        // "where" argument for passing complex query operations
        args: defaultListArgs(),

        resolve: (source, args, context, info) =>
          this.service.entityListResolver(source, args, context, info)
      },
      [this.nameLowerCase]: {
        type: this.type,

        // `defaultArgs` will return an object containing an arg with a key and type matching
        // primary key and the "where" argument for passing complex query operations
        args: defaultArgs(this.model),

        resolve: (source, args, context, info) =>
          this.service.entityResolver(source, args, context, info)
      }
    };
  }

  getSchema() {
    return {
      query: this.getQuery(),
      mutation: {
        [`create${this.name}`]: this.getCreateMutation(),
        [`update${this.name}`]: this.getUpdateMutation(),
        [`destroy${this.name}`]: this.getDestroyMutation()
      }
    };
  }
}

module.exports = BaseGraphQLService;
