const _ = require('lodash');
const { resolver } = require('graphql-sequelize');
const winston = require('winston');

const { InternalError } = require('../errors/internal');
const BaseService = require('./base');

class BaseTenantService extends BaseService {
  async create(context, values) {
    await this.assertCreatePermission(context, values, values.condominioId);

    return this.model.create(values, {
      userId: context.user ? context.user.id : undefined
    });
  }

  async update(context, id, values) {
    const entity = await this.findById(context, id);

    if (!entity) {
      winston.error(`Error during update: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }

    await this.assertUpdatePermission(context, id, values, entity.condominioId);

    return entity.update(values, {
      userId: context.user ? context.user.id : undefined
    });
  }

  async destroy(context, id) {
    const entity = await this.findById(context, id);

    if (!entity) {
      winston.error(`Error during update: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }

    await this.assertDestroyPermission(context, id, entity.condominioId);

    return entity.destroy();
  }

  async entityResolver(source, args, context, info) {
    const self = this;

    const opts = {
      before(findOptions, _args, _context) {
        return _.merge(findOptions, self.resolver.one);
      }
    };

    const entity = await resolver(this.model, opts)(source, args, context, info);

    if (entity) {
      await this.assertReadPermission(context, entity.id, entity.condominioId);
    }

    return entity;
  }

  async entityListResolver(source, args, context, info) {
    const self = this;

    const opts = {
      before(_findOptions, _args, _context) {
        const findOptions = _findOptions;

        // Allow to order by nested properties
        // We have to split the order by string
        //   ["user.name", "ASC"] -> ["user", "name", "ASC"]
        findOptions.order = _.map(findOptions.order, item => item[0].split('.').concat(item[1]));

        if (_.isFunction(self.resolver.list)) {
          return self.resolver.list(findOptions, _args, _context, info);
        }

        return _.merge(findOptions, self.resolver.list);
      }
    };

    const entities = await resolver(this.model, opts)(source, args, context, info);

    await Promise.all(_.chain(entities)
      .uniqBy('condominioId')
      .map(entity => this.assertReadListPermission(context, entity.condominioId))
      .value());

    return entities;
  }

  async assertCreatePermission(context, entity, condominioId) {
    await this.assertMembershipPermission(context, condominioId);
  }

  async assertUpdatePermission(context, id, entity, condominioId) {
    await this.assertMembershipPermission(context, condominioId);
  }

  async assertDestroyPermission(context, id, condominioId) {
    await this.assertMembershipPermission(context, condominioId);
  }

  async assertReadPermission(context, id, condominioId) {
    await this.assertLoggedInPermission(context);

    if (!_.find(context.memberships, { condominioId })) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  async assertReadListPermission(context, condominioId) {
    await this.assertLoggedInPermission(context);

    if (!_.find(context.memberships, { condominioId })) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  async assertMembershipPermission(context, condominioId) {
    await this.assertLoggedInPermission(context);

    if (!context.memberships) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }

    const membership = _.find(context.memberships, { condominioId });

    if (!membership) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }
}

module.exports = BaseTenantService;
