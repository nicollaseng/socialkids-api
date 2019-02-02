const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');
const { GraphQLObjectType } = require('graphql');

const BaseGraphQLService = require('../base');
const rateioBlocoService = require('../../services/rateioBloco');
const blocoService = require('../../services/bloco');
const contatoService = require('../../services/contato');
const leituraAguaService = require('../../services/leituraAgua');

class LeituraAguaGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: leituraAguaService
    });
  }

  // Override getType to add `contato`
  getType() {
    const Contato = contatoService.getModel();
    const Bloco = blocoService.getModel();
    const RateioBloco = rateioBlocoService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache
      }), {
        contato: {
          type: new GraphQLObjectType({
            name: 'LeituraAguaContato',
            fields: _.assign(attributeFields(Contato, {
              cache: this.fieldsCache
            }), {
              bloco: {
                type: new GraphQLObjectType({
                  name: 'LeituraAguaContatoBloco',
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
            name: 'LeituraAguaRateioBloco',
            fields: _.assign(attributeFields(RateioBloco, {
                cache: this.fieldsCache
              })
            )
          }),
          resolve: resolver(this.model.RateioBloco)
        }
      })
    });
  }
}

module.exports = fieldsCache => new LeituraAguaGraphQLService(fieldsCache);