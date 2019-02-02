const BaseGraphQLService = require('../base');
const rateioBlocoService = require('../../services/rateioBloco');

class RateioBlocoGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: rateioBlocoService
    });
  }
}

module.exports = fieldsCache => new RateioBlocoGraphQLService(fieldsCache);
