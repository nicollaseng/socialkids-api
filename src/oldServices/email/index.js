const hbs = require('nodemailer-express-handlebars');
const nodemailer = require('nodemailer');
const path = require('path');
const winston = require('winston');
const emailFrom = '"SmartSíndico" <app@smartsindico.com.br>';

class EmailService {
  constructor() {
    const handlebarsOptions = {
      viewEngine: 'handlebars',
      viewPath: path.resolve('./templates/email'),
      extName: '.hbs'
    };
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT,
      secure: (process.env.SMTP_SECURE === 'true'),
      requireTLS: (process.env.SMTP_REQUIRE_TLS === 'true'),
      tls: {
        rejectUnauthorized: (process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true')
      },
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    });
    this.transporter.use('compile', hbs(handlebarsOptions));
  }

  sendEmail(to, subject, template, context, bcc = null) {
    const addBcc = bcc ? (', ' + bcc) : '';
    const mailOptions = {
      from: emailFrom,
      to,
      bcc: 'app@smartsindico.com.br, bruno@adn23.com.br'+addBcc,
      subject,
      template,
      context
    };

    this.transporter.sendMail(mailOptions)
      .then((info) => {
        winston.info(`Email sent with messageId=${info.messageId}`);
      })
      .catch((err) => {
        winston.error(`Email failed: ${err.message}`);
      });
  }

  sendEmailRecibo(to, subject, template, context, reciboPath, bcc = null) {
    const addBcc = bcc ? (', ' + bcc) : '';
    const mailOptions = {
      from: emailFrom,
      to,
      bcc: 'app@smartsindico.com.br, bruno@adn23.com.br'+addBcc,
      subject,
      template,
      context,
      attachments: [{
          filename: 'Recibo.pdf',
          path: reciboPath,
          contentType: 'application/pdf'
        }
      ]
    };

    this.transporter.sendMail(mailOptions)
      .then((info) => {
        winston.info(`Email sent with messageId=${info.messageId}`);
      })
      .catch((err) => {
        winston.error(`Email failed: ${err.message}`);
      });
  }

  sendEmailPrestacao(to, subject, template, context, prestacaoPath, bcc = null) {
    const addBcc = bcc ? (', ' + bcc) : '';
    const mailOptions = {
      from: emailFrom,
      to,
      bcc: 'app@smartsindico.com.br, bruno@adn23.com.br'+addBcc,
      subject,
      template,
      context,
      attachments: [{
          filename: 'Prestacao.png',
          path: prestacaoPath,
          contentType: 'image/png'
        }
      ]
    };

    this.transporter.sendMail(mailOptions)
      .then((info) => {
        winston.info(`Email sent with messageId=${info.messageId}`);
      })
      .catch((err) => {
        winston.error(`Email failed: ${err.message}`);
      });
  }
}

module.exports = new EmailService();
