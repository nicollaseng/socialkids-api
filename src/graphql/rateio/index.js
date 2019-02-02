const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');
const { mutationWithClientMutationId } = require('graphql-relay');
const winston = require('winston');

const {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const { InternalError } = require('../../errors/internal');
const BaseGraphQLService = require('../base');
const lancamentoService = require('../../services/lancamento');
const rateioBlocoService = require('../../services/rateioBloco');
const rateioService = require('../../services/rateio');
const rateioUnidadeService = require('../../services/rateioUnidade');

class RateioGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: rateioService
    });
  }

  // Override getType to add `rateioBlocos`
  getType() {
    const RateioBloco = rateioBlocoService.getModel();
    const RateioUnidade = rateioUnidadeService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache,
        exclude: this.service.getExcludeFromType()
      }), {
        rateioBlocos: {
          type: new GraphQLList(new GraphQLObjectType({
            name: 'RateioRateioBloco',
            fields: _.assign(attributeFields(RateioBloco, {
              cache: this.fieldsCache
            }), {
              rateioUnidades: {
                type: new GraphQLList(new GraphQLObjectType({
                  name: 'RateioRateioBlocoUnidade',
                  fields: attributeFields(RateioUnidade, {
                    cache: this.fieldsCache
                  })
                })),
                resolve: resolver(RateioBloco.RateioUnidades)
              }
            })
          })),
          resolve: resolver(this.model.RateioBlocos)
        }
      })
    });
  }

  releaseRateioMutation() {
    const Lancamento = lancamentoService.getModel();

    return mutationWithClientMutationId({
      name: 'ReleaseRateio',
      inputFields: {
        rateioId: {
          type: new GraphQLNonNull(GraphQLString)
        },
        condominioId: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      outputFields: {
        lancamentos: {
          type: new GraphQLList(new GraphQLObjectType({
            name: 'ReleaseRateioLancamento',
            fields: attributeFields(Lancamento, {
              cache: this.fieldsCache,
              exclude: lancamentoService.getExcludeFromType()
            })
          })),
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: async (object, context, info) => {
        try {
          const { rateioId, condominioId } = object;

          return this.service.releaseRateio(context, rateioId, condominioId);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Release Rateio error:', err);
          throw new InternalError('release_rateio_error', err);
        }
      }
    });
  }

  getSchema() {
    const baseSchema = super.getSchema();
    const schema = {
      mutation: {
        releaseRateio: this.releaseRateioMutation()
      }
    };

    return _.merge(baseSchema, schema);
  }
}

module.exports = fieldsCache => new RateioGraphQLService(fieldsCache);
