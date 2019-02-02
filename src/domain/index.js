const _ = require('lodash');
const { diff } = require('deep-diff');
const Sequelize = require('sequelize');
const winston = require('winston');

const config = process.env;
const isTest = process.env.NODE_ENV === 'test';

const db = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASS, {
  host: config.DB_HOST,
  dialect: 'postgres',
  logging: message => winston.verbose(message),

  pool: {
    max: 5,
    min: 1,
    idle: 10000
  }
});

// Models
const User = require('./models/user')(db, Sequelize);
const Bloco = require('./models/bloco')(db, Sequelize);
const Condominio = require('./models/condominio')(db, Sequelize);
const Membership = require('./models/membership')(db, Sequelize);
const Categoria = require('./models/categoria')(db, Sequelize);
const Conta = require('./models/conta')(db, Sequelize);
const Contato = require('./models/contato')(db, Sequelize);
const Lancamento = require('./models/lancamento')(db, Sequelize);
const Rateio = require('./models/rateio')(db, Sequelize);
const RateioBloco = require('./models/rateioBloco')(db, Sequelize);
const RateioUnidade = require('./models/rateioUnidade')(db, Sequelize);
const LeituraAgua = require('./models/leituraAgua')(db, Sequelize);
const ContaAprovada = require('./models/contaAprovada')(db, Sequelize);
const Message = require('./models/message')(db, Sequelize);
const MessageRecipient = require('./models/messageRecipient')(db, Sequelize);
const DeviceToken = require('./models/deviceToken')(db, Sequelize);
const Authentication = require('./models/authentication')(db, Sequelize);
const Videoaula = require('./models/videoaula')(db, Sequelize);
const Log = require('./models/log')(db, Sequelize);
const Revision = require('./models/revision')(db, Sequelize);

const beforeHook = function beforeHook(instance, options) {
  if (!instance.isNewRecord && _.isEmpty(instance._changed)) {
    return;
  }

  const _instance = instance;
  const exclude = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'revision'];

  let previousVersion = !_instance.isNewRecord ? _instance._previousDataValues : {};
  let currentVersion = _instance.dataValues;

  previousVersion = _.chain(previousVersion)
    .omitBy((value, key) => exclude.indexOf(key) !== -1)
    .omitBy(_.isObject)
    .value();

  currentVersion = _.chain(currentVersion)
    .omitBy((value, key) => exclude.indexOf(key) !== -1)
    .omitBy(_.isObject)
    .value();

  if (!_instance.context) {
    _instance.context = {};
  }

  _instance.context.diff = diff(previousVersion, currentVersion);

  _instance.set('revision', (instance._previousDataValues.revision || 0) + 1);
};

const afterHook = async function afterHook(instance, options) {
  const currentVersion = _.omitBy(instance.dataValues, _.isObject);

  Revision.create({
    model: this.name,
    documentId: instance.id,
    document: currentVersion,
    diff: instance.context.diff || [],
    revision: instance.get('revision'),
    userId: options.userId
  });
};

_.extend(db.Model, {
  hasRevisions: async function hasRevisions() {
    this.attributes.revision = {
      type: Sequelize.INTEGER,
      defaultValue: 0
    };

    this.refreshAttributes();

    const tableName = this.getTableName();

    try {
      const attributes = await db.getQueryInterface().describeTable(tableName);

      if (!attributes.revision) {
        db.getQueryInterface().addColumn(tableName, 'revision', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        });
      }
    } catch (err) {
      winston.error('Failed during Revision migration:', err);
    }

    this.addHook('beforeCreate', beforeHook);
    this.addHook('beforeUpdate', beforeHook);
    this.addHook('afterCreate', afterHook);
    this.addHook('afterUpdate', afterHook);

    return this.hasMany(Revision, {
      as: 'revisions',
      foreignKey: 'documentId',
      constraints: false,
      scope: {
        model: this.name
      }
    });
  }
});

// Relations - Bloco-Condominio
Bloco.Condominio = Bloco.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - User-Membership
Membership.User = Membership.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.Memberships = User.hasMany(Membership, { as: 'memberships', foreignKey: 'userId' });

// Relations - Membership-Bloco
Membership.Bloco = Membership.belongsTo(Bloco, { as: 'bloco', foreignKey: 'blocoId' });

// Relations - Membership-Condominio
Membership.Condominio = Membership.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - Lancamento-Categoria
Lancamento.Categoria = Lancamento.belongsTo(Categoria, { as: 'categoria', foreignKey: 'categoriaId' });

// Relations - Lancamento-Conta
Lancamento.Conta = Lancamento.belongsTo(Conta, { as: 'conta', foreignKey: 'contaId' });

// Relations - Lancamento-Contato
Lancamento.Contato = Lancamento.belongsTo(Contato, { as: 'contato', foreignKey: 'contatoId' });

// Relations - Lancamento-Condominio
Lancamento.Condominio = Lancamento.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - Lancamento-RateioUnidade
Lancamento.RateioUnidade = Lancamento.belongsTo(RateioUnidade, { as: 'rateioUnidade', foreignKey: 'rateioUnidadeId' });

// Relations - Categoria-Categoria
Categoria.Parent = Categoria.belongsTo(Categoria, { as: 'parent', foreignKey: 'parentId' });
Categoria.Subcategorias = Categoria.hasMany(Categoria, { as: 'subcategorias', foreignKey: 'parentId' });

// Relations - Categoria-Condominio
Categoria.Condominio = Categoria.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - Conta-Condominio
Conta.Condominio = Conta.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - Contato-Bloco
Contato.Bloco = Contato.belongsTo(Bloco, { as: 'bloco', foreignKey: 'blocoId' });

// Relations - Contato-Condominio
Contato.Condominio = Contato.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - Rateio-Condominio
Rateio.Condominio = Rateio.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - RateioBloco-Bloco
RateioBloco.Bloco = RateioBloco.belongsTo(Bloco, { as: 'bloco', foreignKey: 'blocoId' });

// Relations - RateioBloco-Condominio
RateioBloco.Condominio = RateioBloco.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - RateioBloco-Rateio
RateioBloco.Rateio = RateioBloco.belongsTo(Rateio, { as: 'rateio', foreignKey: 'rateioId' });
Rateio.RateioBlocos = Rateio.hasMany(RateioBloco, { as: 'rateioBlocos', foreignKey: 'rateioId' });

// Relations - RateioUnidade-RateioBloco
RateioUnidade.RateioBloco = RateioUnidade.belongsTo(RateioBloco, { as: 'rateioBloco', foreignKey: 'rateioBlocoId' });
RateioBloco.RateioUnidades = RateioBloco.hasMany(RateioUnidade, { as: 'rateioUnidades', foreignKey: 'rateioBlocoId' });

// Relations - RateioUnidade-Contato
RateioUnidade.Contato = RateioUnidade.belongsTo(Contato, { as: 'contato', foreignKey: 'contatoId' });

// Relations - RateioUnidade-Condominio
RateioUnidade.Condominio = RateioUnidade.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - LeituraAgua-Contato
LeituraAgua.Contato = LeituraAgua.belongsTo(Contato, { as: 'contato', foreignKey: 'contatoId' });

// Relations - LeituraAgua-RateioBloco
LeituraAgua.RateioBloco = LeituraAgua.belongsTo(RateioBloco, { as: 'rateioBloco', foreignKey: 'rateioBlocoId' });
RateioBloco.LeituraAguas = RateioBloco.hasMany(LeituraAgua, { as: 'leituraAguas', foreignKey: 'rateioBlocoId' });

// Relations - Log-User
Log.User = Log.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Relations - ContaAprovada-User
ContaAprovada.User = ContaAprovada.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Relations - ContaAprovada-Condominio
ContaAprovada.Condominio = ContaAprovada.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - Message-Membership
Message.Membership = Message.belongsTo(Membership, { as: 'membership', foreignKey: 'membershipId' });

// Relations - Message-Condominio
Message.Condominio = Message.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - Message-MessageRecipient
MessageRecipient.Message = MessageRecipient.belongsTo(Message, { as: 'message', foreignKey: 'messageId' });
Message.MessageRecipients = Message.hasMany(MessageRecipient, { as: 'messageRecipients', foreignKey: 'messageId' });

// Relations - MessageRecipient-Membership
MessageRecipient.Membership = MessageRecipient.belongsTo(Membership, { as: 'membership', foreignKey: 'membershipId' });

// Relations - MessageRecipient-Condominio
MessageRecipient.Condominio = MessageRecipient.belongsTo(Condominio, { as: 'condominio', foreignKey: 'condominioId' });

// Relations - DeviceToken-User
DeviceToken.User = DeviceToken.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Relations - Authentication-User
Authentication.User = Authentication.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Relations - Revision-User
Revision.User = Revision.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Revisions
if (!isTest) {
  User.Revisions = User.hasRevisions();
  Bloco.Revisions = Bloco.hasRevisions();
  Condominio.Revisions = Condominio.hasRevisions();
  Membership.Revisions = Membership.hasRevisions();
  Categoria.Revisions = Categoria.hasRevisions();
  Conta.Revisions = Conta.hasRevisions();
  Contato.Revisions = Contato.hasRevisions();
  Lancamento.Revisions = Lancamento.hasRevisions();
  Rateio.Revisions = Rateio.hasRevisions();
  RateioUnidade.Revisions = RateioUnidade.hasRevisions();
  LeituraAgua.Revisions = LeituraAgua.hasRevisions();
  RateioBloco.Revisions = RateioBloco.hasRevisions();
  ContaAprovada.Revisions = ContaAprovada.hasRevisions();
  Message.Revisions = Message.hasRevisions();
  MessageRecipient.Revisions = MessageRecipient.hasRevisions();
  DeviceToken.Revisions = DeviceToken.hasRevisions();
  Authentication.Revisions = Authentication.hasRevisions();
  Videoaula.Revisions = Videoaula.hasRevisions();
  Log.Revisions = Log.hasRevisions()
}

const setup = async () => {
  try {
    await db.authenticate();
    winston.info('Connection to database has been established successfully');
    const reciboService = require('../services/recibo/index');
    reciboService.updateAllBoletos();
  } catch (err) {
    winston.error('Database setup failed:', err);
  }
};

const sync = async () => {
  try {
    await db.sync({ force: true });
    winston.info('Database synched');
  } catch (err) {
    winston.error('Database sync failed:', err);
  }
};

module.exports = {
  // Database setup function
  setup,
  sync,

  // Models
  User,
  Bloco,
  Condominio,
  Membership,
  Categoria,
  Conta,
  Contato,
  Lancamento,
  Rateio,
  RateioUnidade,
  RateioBloco,
  LeituraAgua,
  ContaAprovada,
  Message,
  MessageRecipient,
  DeviceToken,
  Authentication,
  Videoaula,
  Log,
  Revision
};
