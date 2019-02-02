const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const methodOverride = require('method-override');
const morgan = require('morgan');
const winston = require('winston');

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

winston.info(`NODE_ENV=${process.env.NODE_ENV}`);
winston.level = isTest ? 'error' : 'verbose';

// Load config from .env file in dev mode
if (!isProduction) {
  dotenv.config({
    path: isTest ? 'config/test.env' : 'config/local.env'
  });
}

// Setup domain
const domain = require('./domain');

domain.setup();

// Setup Express
const app = express();

// CORS
const corsOptions = {
  origin: (process.env.API_CORS || 'http://localhost:8001').split(',')
};
app.use(cors(corsOptions));

// Request logging
if (isProduction) {
  // Only log error responses
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
} else if (!isTest) {
  app.use(morgan('dev'));
}

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(methodOverride());

app.use(require('./routes'));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Recurso não encontrado');
  err.code = 'resource_not_found';
  err.status = 404;
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  if (!isProduction) {
    winston.error(err);
  }

  res.status(err.status || 500).json({
    errors: [{
      code: err.code || 'unknown_error',
      message: err.message || 'Erro desconhecido'
    }]
  });
});

const server = app.listen(process.env.PORT || 8000, () => {
  winston.info(`Listening on port ${server.address().port}...`);
});

module.exports = {
  app,
  server
};
