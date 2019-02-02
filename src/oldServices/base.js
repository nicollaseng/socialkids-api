const _ = require('lodash');
const winston = require('winston');
const { resolver } = require('graphql-sequelize');

const { InternalError } = require('../errors/internal');

class BaseService {
  constructor(options) {
    this.model = options.model;
    this.name = this.model.name;

    this.resolver = _.merge({
      list: {},
      one: {}
    }, options.resolver);

    this.excludeFromCreateType = options.excludeFromCreateType || [];
    this.excludeFromType = options.excludeFromType || [];
  }

  getModel() {
    return this.model;
  }

  getExcludeFromCreateType() {
    return this.excludeFromCreateType;
  }

  getExcludeFromType() {
    return this.excludeFromType;
  }

  findById(context, id) {
    return this.model.findById(id);
  }

  async create(context, values) {
    await this.assertCreatePermission(context, values);

    return this.model.create(values, {
      userId: context.user ? context.user.id : undefined
    });
  }

  async update(context, id, values) {
    await this.assertUpdatePermission(context, id, values);

    const entity = await this.findById(context, id);

    if (!entity) {
      winston.error(`Error during update: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }

    return entity.update(values, {
      userId: context.user ? context.user.id : undefined
    });
  }

  async destroy(context, id) {
    await this.assertDestroyPermission(context, id);

    const entity = await this.findById(context, id);

    if (!entity) {
      winston.error(`Error during update: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }

    return entity.destroy();
  }

  async entityResolver(source, args, context, info) {
    const self = this;

    await this.assertReadPermission(context, args.id);

    const opts = {
      before(findOptions, _args, _context) {
        return _.merge(findOptions, self.resolver.one);
      }
    };

    return resolver(this.model, opts)(source, args, context, info);
  }

  async entityListResolver(source, args, context, info) {
    const self = this;

    await this.assertReadListPermission(context);

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

    return resolver(this.model, opts)(source, args, context, info);
  }

  async assertCreatePermission(context, entity) {
    await this.assertLoggedInPermission(context);
  }

  async assertUpdatePermission(context, id, entity) {
    await this.assertLoggedInPermission(context);
  }

  async assertDestroyPermission(context, id) {
    await this.assertLoggedInPermission(context);
  }

  async assertReadPermission(context, id) {
    await this.assertLoggedInPermission(context);
  }

  async assertReadListPermission(context) {
    await this.assertLoggedInPermission(context);
  }

  async assertLoggedInPermission(context) {
    if (!context.user || !context.user.id) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  async assertSindicoPermission(context, condominioId) {
    await this.assertLoggedInPermission(context);

    if (!context.memberships) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }

    const membership = _.find(context.memberships, { condominioId });

    if (!membership || membership.role !== 'sindico') {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  async assertSindicoOrSubsindicoPermission(context, condominioId) {
    await this.assertLoggedInPermission(context);

    if (!context.memberships) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }

    const membership = _.find(context.memberships, { condominioId });

    if (!membership || (membership.role !== 'sindico' && membership.role !== 'subsindico')) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  async assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, blocoId) {
    await this.assertLoggedInPermission(context);

    if (!context.memberships) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }

    const membership = _.find(context.memberships, { condominioId });

    if (!membership || (membership.role !== 'sindico' &&
      (membership.role !== 'subsindico' || (membership.role === 'subsindico' && membership.blocoId !== blocoId)))) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  async isAdminContext(context) {
    const membership = context.memberships ? context.memberships[0] : null;
    const user = membership && membership.user ? membership.user : null;

    return user && user.isAdmin;
  }
}

module.exports = BaseService;
