const _ = require('lodash');
const { attributeFields } = require('graphql-sequelize');

const {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const BaseGraphQLService = require('../base');
const categoriaService = require('../../services/categoria');
const lancamentoService = require('../../services/lancamento');

class CategoriaGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: categoriaService
    });
  }

  // Override getType to add `subcategorias` and `total`
  getType() {
    const Categoria = categoriaService.getModel();
    const Lancamento = lancamentoService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache,
        exclude: categoriaService.getExcludeFromType()
      }), {
        subcategorias: {
          type: new GraphQLList(new GraphQLObjectType({
            name: 'Subcategoria',
            fields: _.assign(attributeFields(Categoria, {
              cache: this.fieldsCache,
              exclude: categoriaService.getExcludeFromType()
            }), {
              total: {
                type: GraphQLInt,
                args: {
                  from: {
                    type: GraphQLString
                  },
                  to: {
                    type: GraphQLString
                  },
                  contas: {
                    type: new GraphQLList(GraphQLString)
                  }
                },
                resolve: (source, args, context, info) => source.dataValues.total || 0
              }
            })
          })),
          resolve: (source, args, context, info) =>
            categoriaService.subcategoriaListResolver(source, args, context, info)
        },
        total: {
          type: GraphQLInt,
          args: {
            from: {
              type: GraphQLString
            },
            to: {
              type: GraphQLString
            },
            contas: {
              type: new GraphQLList(GraphQLString)
            }
          },
          resolve: (source, args, context, info) => source.dataValues.total || 0
        },
        lancamentos: {
          type: new GraphQLList(new GraphQLObjectType({
            name: 'CategoriaLancamentos',
            fields: _.assign(attributeFields(Lancamento, {
              cache: this.fieldsCache
            }))
          })),
          args: {
            from: {
              type: GraphQLString
            },
            to: {
              type: GraphQLString
            },
            contas: {
              type: new GraphQLList(GraphQLString)
            }
          },
          resolve: (source, args, context, info) =>
            categoriaService.categoriaLancamentosResolver(source, args, context, info)
        }
      })
    });
  }
}

module.exports = fieldsCache => new CategoriaGraphQLService(fieldsCache);
