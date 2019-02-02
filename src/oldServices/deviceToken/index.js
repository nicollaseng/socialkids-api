const _ = require('lodash');

const { DeviceToken } = require('../../domain');
const { InternalError } = require('../../errors/internal');
const BaseService = require('../base');

class DeviceTokenService extends BaseService {
  constructor() {
    super({
      model: DeviceToken
    });
  }

  findByToken(context, token) {
    return this.model.find({
      where: {
        token
      }
    });
  }

  findAllByToken(context, token) {
    return this.model.findAll({
      where: {
        token
      }
    });
  }

  findAllByUsers(context, users) {
    return this.model.findAll({
      where: {
        userId: {
          $in: users
        }
      }
    });
  }

  async create(context, values) {
    await this.assertCreatePermission(context, values);

    const deviceToken = await this.model.findOrCreate({
      where: {
        token: values.token,
        userId: values.userId
      },
      userId: context.user ? context.user.id : undefined
    });

    return _.first(deviceToken);
  }

  async destroyByToken(context, token) {
    await this.assertDestroyPermission(context, token);

    return this.model.destroy({
      where: { token }
    });
  }

  // Permissão para criação: Usuário autenticado criando o token para si mesmo
  async assertCreatePermission(context, entity) {
    await this.assertLoggedInPermission(context);

    if (context.user.id !== entity.userId) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  // Permissão para atualização: Ninguém
  async assertUpdatePermission(context, id, entity) {
    throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
  }

  // Permissão para apagar: Usuário autenticado apagando o próprio token
  async assertDestroyPermission(context, token) {
    await this.assertLoggedInPermission(context);

    const deviceTokens = await this.findAllByToken(context, token);
    let deviceToken = deviceTokens.filter(dev => dev.userId === context.user.id);
    if (deviceTokens && deviceTokens.length > 0 && deviceToken.length <= 0) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  // Permissão para leitura: Ninguém
  async assertReadPermission(context, id) {
    throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
  }

  // Permissão para leitura de lista: Ninguém
  async assertReadListPermission(context) {
    throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
  }
}

module.exports = new DeviceTokenService();
