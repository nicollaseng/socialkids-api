const BaseGraphQLService = require('../base');
const blocoService = require('../../services/bloco');

class BlocoGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: blocoService
    });
  }
}

module.exports = fieldsCache => new BlocoGraphQLService(fieldsCache);
