const BaseGraphQLService = require('../base');
const contaAprovadaService = require('../../services/contaAprovada');

class ContaAprovadaGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: contaAprovadaService,
      plural: 'ContasAprovadas'
    });
  }
}

module.exports = fieldsCache => new ContaAprovadaGraphQLService(fieldsCache);
