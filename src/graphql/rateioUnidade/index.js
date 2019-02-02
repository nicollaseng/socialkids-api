const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');
const { GraphQLObjectType } = require('graphql');

const BaseGraphQLService = require('../base');
const blocoService = require('../../services/bloco');
const contatoService = require('../../services/contato');
const rateioService = require('../../services/rateio');
const rateioBlocoService = require('../../services/rateioBloco');
const rateioUnidadeService = require('../../services/rateioUnidade');

class RateioUnidadeGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: rateioUnidadeService
    });
  }

  // Override getType to add `contato` and `rateioBloco`
  getType() {
    const Contato = contatoService.getModel();
    const Bloco = blocoService.getModel();
    const Rateio = rateioService.getModel();
    const RateioBloco = rateioBlocoService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache
      }), {
        contato: {
          type: new GraphQLObjectType({
            name: 'RateioUnidadeContato',
            fields: _.assign(attributeFields(Contato, {
              cache: this.fieldsCache
            }), {
              bloco: {
                type: new GraphQLObjectType({
                  name: 'RateioUnidadeContatoBloco',
                  fields: attributeFields(Bloco, {
                    cache: this.fieldsCache
                  })
                }),
                resolve: resolver(Contato.Bloco)
              }
            })
          }),
          resolve: resolver(this.model.Contato)
        },
        rateioBloco: {
          type: new GraphQLObjectType({
            name: 'RateioUnidadeRateioBloco',
            fields: _.assign(attributeFields(RateioBloco, {
              cache: this.fieldsCache
            }), {
              rateio: {
                type: new GraphQLObjectType({
                  name: 'RateioUnidadeRateioBlocoRateio',
                  fields: attributeFields(Rateio, {
                    cache: this.fieldsCache
                  })
                }),
                resolve: resolver(RateioBloco.Rateio)
              }
            })
          }),
          resolve: resolver(this.model.RateioBloco)
        }
      })
    });
  }
}

module.exports = fieldsCache => new RateioUnidadeGraphQLService(fieldsCache);
