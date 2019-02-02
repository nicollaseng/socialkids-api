const _ = require('lodash');
const { GraphQLObjectType, GraphQLSchema } = require('graphql');
const auth = require('./middlewares/auth');
const expressGraphQl = require('express-graphql');
const router = require('express').Router();

const fieldsCache = {};

const userGraphQlService = require('../graphql/user')(fieldsCache);
const condominioGraphQlService = require('../graphql/condominio')(fieldsCache);
const membershipGraphQlService = require('../graphql/membership')(fieldsCache);
const categoriaGraphQlService = require('../graphql/categoria')(fieldsCache);
const contaGraphQlService = require('../graphql/conta')(fieldsCache);
const contatoGraphQlService = require('../graphql/contato')(fieldsCache);
const lancamentoGraphQlService = require('../graphql/lancamento')(fieldsCache);
const dashboardGraphQlService = require('../graphql/dashboard')(fieldsCache);
const cotaGraphQlService = require('../graphql/cota')(fieldsCache);
const blocoGraphQlService = require('../graphql/bloco')(fieldsCache);
const rateioGraphQlService = require('../graphql/rateio')(fieldsCache);
const rateioBlocoGraphQlService = require('../graphql/rateioBloco')(fieldsCache);
const rateioUnidadeGraphQlService = require('../graphql/rateioUnidade')(fieldsCache);
const leituraAguaGraphQLService = require('../graphql/leituraAgua')(fieldsCache);
const contaAprovadaGraphQLService = require('../graphql/contaAprovada')(fieldsCache);
const devedoresGraphQlService = require('../graphql/devedores')(fieldsCache);
const messageGraphQLService = require('../graphql/message')(fieldsCache);
const deviceTokenGraphQLService = require('../graphql/deviceToken')(fieldsCache);
const videoaulaGraphQLService = require('../graphql/videoaula')(fieldsCache);
const logGraphQLService = require('../graphql/log')(fieldsCache);

const userSchema = userGraphQlService.getSchema();
const condominioSchema = condominioGraphQlService.getSchema();
const membershipSchema = membershipGraphQlService.getSchema();
const categoriaSchema = categoriaGraphQlService.getSchema();
const contaSchema = contaGraphQlService.getSchema();
const contatoSchema = contatoGraphQlService.getSchema();
const lancamentoSchema = lancamentoGraphQlService.getSchema();
const dashboardSchema = dashboardGraphQlService.getSchema();
const cotaSchema = cotaGraphQlService.getSchema();
const blocoSchema = blocoGraphQlService.getSchema();
const rateioSchema = rateioGraphQlService.getSchema();
const rateioBlocoSchema = rateioBlocoGraphQlService.getSchema();
const rateioUnidadeSchema = rateioUnidadeGraphQlService.getSchema();
const leituraAguaSchema = leituraAguaGraphQLService.getSchema();
const contaAprovadaSchema = contaAprovadaGraphQLService.getSchema();
const devedoresSchema = devedoresGraphQlService.getSchema();
const messageSchema = messageGraphQLService.getSchema();
const deviceTokenSchema = deviceTokenGraphQLService.getSchema();
const videoaulaSchema = videoaulaGraphQLService.getSchema();
const logSchema = logGraphQLService.getSchema();

const isProduction = process.env.NODE_ENV === 'production';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: _.assign(
      {},
      userSchema.query,
      condominioSchema.query,
      membershipSchema.query,
      categoriaSchema.query,
      contaSchema.query,
      contatoSchema.query,
      lancamentoSchema.query,
      dashboardSchema.query,
      cotaSchema.query,
      blocoSchema.query,
      rateioSchema.query,
      rateioBlocoSchema.query,
      rateioUnidadeSchema.query,
      leituraAguaSchema.query,
      contaAprovadaSchema.query,
      devedoresSchema.query,
      videoaulaSchema.query,
      logSchema.query,
      messageSchema.query,
    )
  }),

  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: _.assign(
      {},
      userSchema.mutation,
      condominioSchema.mutation,
      membershipSchema.mutation,
      categoriaSchema.mutation,
      contaSchema.mutation,
      contatoSchema.mutation,
      lancamentoSchema.mutation,
      blocoSchema.mutation,
      rateioSchema.mutation,
      rateioBlocoSchema.mutation,
      rateioUnidadeSchema.mutation,
      leituraAguaSchema.mutation,
      contaAprovadaSchema.mutation,
      messageSchema.mutation,
      logSchema.mutation,
      deviceTokenSchema.mutation
    )
  })
});

const formatError = (error) => {
  if (!isProduction) {
    return {
      code: error.originalError && error.originalError.code,
      message: error.message,
      inner: error.originalError && error.originalError.inner,
      path: error.path,
      stack: error.stack
    };
  }

  return {
    code: error.originalError && error.originalError.code,
    message: error.message,
    inner: error.originalError && error.originalError.inner,
    path: error.path
  };
};

router.use('/', auth.optional, expressGraphQl({
  schema,
  graphiql: !isProduction,
  formatError
}));

module.exports = router;
