const { Videoaula } = require('../../domain');
const BaseTenantService = require('../baseTenant');
const { InternalError } = require('../../errors/internal');
const winston = require('winston');

class VideoaulaService extends BaseTenantService {
  constructor() {
    super({
      model: Videoaula
    });
  }

  async assertReadPermission(context) {
    return true;
  }

  async assertReadListPermission(context) {
    return true;
  }
}

module.exports = new VideoaulaService();
