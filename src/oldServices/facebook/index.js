const FB = require('fb');
const winston = require('winston');

const { InternalError } = require('../../errors/internal');

class FacebookService {
  async fetchFacebookUser(facebookToken) {
    try {
      FB.setAccessToken(facebookToken);

      return FB.api('me', { fields: 'id,name,email,picture' });
    } catch (err) {
      winston.error('Fetch Facebook user error:', err);
      throw new InternalError('facebook_login_error', { message: 'Falha ao entrar com Facebook' });
    }
  }

  async extendFacebookAccessToken(facebookToken) {
    try {
      const response = await FB.api('oauth/access_token', {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        grant_type: 'fb_exchange_token',
        fb_exchange_token: facebookToken
      });

      return response.access_token;
    } catch (err) {
      winston.error('Extend Facebook access token error:', err);
      throw new InternalError('facebook_login_error', { message: 'Falha ao entrar com Facebook' });
    }
  }
}

module.exports = new FacebookService();
