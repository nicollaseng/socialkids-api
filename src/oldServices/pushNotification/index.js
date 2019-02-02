const fetch = require('node-fetch');
const winston = require('winston');

const deviceTokenService = require('../deviceToken');

class PushNotificationService {
  async sendPushNotification(context, title, body, users, screen) {
    const deviceTokens = await deviceTokenService.findAllByUsers(context, users);
    let url = 'https://onesignal.com/api/v1/notifications';
    let urlToken = 'https://onesignal.com/api/v1/players/';
    let headers = { 'Content-Type': 'application/json' };
    let bodyReq = {
      app_id: "7cfe7a86-8312-47df-b548-610c24531f18",
      headings: {en: title},
      contents: {en: body},
      data: {screen}
    };
    deviceTokens.forEach((device) => {
      var { token } = device;
      if(token) {
        bodyReq.include_player_ids = [token];
        fetch(urlToken + `${token}?app_id=7cfe7a86-8312-47df-b548-610c24531f18`, {
          method: 'get', headers
        }).then(data => data.json()).then(json => {
          let { id, identifier, errors } = json;
          if(id && identifier && !errors) {
            winston.info(`Sent notification to user: ${id}`);
            fetch(url, {
              method: 'post',
              body: JSON.stringify(bodyReq),
              headers
            });
          } else {
            winston.error('Invalid Push Token.');
          }
        }).catch(err => {
          winston.error('Error sending push notification:', err);
        });
      }
    });
  }
}

module.exports = new PushNotificationService();
