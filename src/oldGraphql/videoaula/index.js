const BaseGraphQLService = require('../base');
const videoaulaService = require('../../services/videoaula');

class BlocoGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: videoaulaService
    });
  }
}

module.exports = fieldsCache => new BlocoGraphQLService(fieldsCache);
