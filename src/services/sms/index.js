const aws = require('aws-sdk');
const hbs = require('express-handlebars').create();
const path = require('path');
const winston = require('winston');

aws.config.region = process.env.AWS_REGION;

class SmsService {
  constructor() {
    this.sns = new aws.SNS();
  }

  async sendSms(to, template, context) {
    const templateFolder = path.resolve('./templates/sms');
    const templateExtension = '.hbs';
    const templatePath = path.join(templateFolder, template + templateExtension);

    try {
      const message = await hbs.render(templatePath, context);

      const params = {
        PhoneNumber: to,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      };

      this.sns.publish(params).promise()
        .then((data) => {
          winston.info(`SMS sent with MessageId=${data.MessageId}`);
        })
        .catch((err) => {
          winston.error(`SMS failed: ${err.message}`);
        });
    } catch (err) {
      winston.error('SMS template render failed:', err.message);
    }
  }
}

module.exports = new SmsService();
