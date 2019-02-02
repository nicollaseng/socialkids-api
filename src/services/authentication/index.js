const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Authentication, User } = require('../../domain');

class AuthenticationService {
  constructor() {
    this.model = Authentication;
  }

  findByRefreshTokenIncludeUser(context, refreshToken) {
    return this.model.find({
      where: {
        refreshToken
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });
  }

  removeRefreshToken(context, refreshToken) {
    return this.model.destroy({
      where: {
        refreshToken
      }
    });
  }

  generateJwt(context, user) {
    return jwt.sign({
      id: user.id
    }, process.env.AUTH_JWT_SECRET, {
      expiresIn: parseInt(process.env.AUTH_JWT_EXPIRATION, 10) || 600
    });
  }

  generateRefreshToken(context, user) {
    const refreshToken = crypto.randomBytes(48)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    this.model.create({
      refreshToken,
      expiresAt: Date.now() +
        (parseInt(process.env.AUTH_REFRESH_TOKEN_EXPIRATION || 7776000, 10) * 1000),
      userId: user.id
    }, {
      userId: user.id
    });

    return refreshToken;
  }
}

module.exports = new AuthenticationService();
