const _ = require('lodash');
const { UnauthorizedError } = require('../../errors/unauthorized');
const jsonwebtoken = require('jsonwebtoken');
const unless = require('express-unless');
const userService = require('../../services/user');
const membershipService = require('../../services/membership');
const winston = require('winston');

const secret = process.env.AUTH_JWT_SECRET;

const jwt = (options) => {
  const required = typeof options.required === 'undefined' ? true : options.required;

  const mid = async (req, res, next) => {
    let token;

    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');

      if (parts.length === 2) {
        const scheme = parts[0];
        const credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          token = credentials;
        } else {
          if (required) {
            return next(new UnauthorizedError('credentials_bad_scheme', { message: 'Format is Authorization: Bearer [token]' }));
          }

          return next();
        }
      } else {
        return next(new UnauthorizedError('credentials_bad_format', { message: 'Format is Authorization: Bearer [token]' }));
      }
    }

    if (!token) {
      if (required) {
        return next(new UnauthorizedError('credentials_required', { message: 'No authorization token was found' }));
      }

      return next();
    }

    try {
      const decoded = await jsonwebtoken.verify(token, secret);
      const user = await userService.findById(req, decoded.id);
      const memberships = await membershipService.findByUserId(req, decoded.id);

      _.set(req, 'user', user);
      _.set(req, 'memberships', memberships);

      return next();
    } catch (err) {
      winston.error('Invalid token:', err);
      return next(new UnauthorizedError('invalid_token', err));
    }
  };

  mid.unless = unless;

  return mid;
};

const auth = {
  required: jwt({
    required: true
  }),
  optional: jwt({
    required: false
  })
};

module.exports = auth;
