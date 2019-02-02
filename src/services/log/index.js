const { Log } = require('../../domain');
const BaseTenantService = require('../baseTenant');

class LogService extends BaseTenantService {
  constructor() {
    super({
      model: Log
    });
  }

  async assertReadPermission(context) {
    this.isAdminContext(context);
  }

  async assertReadListPermission(context) {
    this.isAdminContext(context);
  }

  async assertCreatePermission(context) {
    this.assertLoggedInPermission(context);
  }
}

module.exports = new LogService();
