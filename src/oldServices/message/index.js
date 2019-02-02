const winston = require('winston');

const BaseTenantService = require('../baseTenant');
const emailService = require('../email');
const membershipService = require('../membership');
const pushNotificationService = require('../pushNotification');
const smsService = require('../sms');
const { InternalError } = require('../../errors/internal');

const {
  Membership,
  Message,
  MessageRecipient,
  User
} = require('../../domain');

class MessageService extends BaseTenantService {
  constructor() {
    super({
      model: Message
    });
  }

  // Permissão: Síndico
  async messageToMorador(context, values) {
    await this.assertSindicoOrSubsindicoPermission(context, values.condominioId);

    const {
      assunto,
      mensagem,
      categoria,
      moradores,
      condominioId
    } = values;

    let userMembership = context.memberships[0];
    let memberships = [];
    if(userMembership.role === 'subsindico') {
      memberships = await membershipService
        .findAllMoradoresByBlocoIdIncludeUser(context, moradores, condominioId, userMembership.blocoId);
    } else {
      memberships = await membershipService
        .findAllMoradoresByCondominioIdIncludeUser(context, moradores, condominioId);
    }

    const message = await this.saveMessage(context, values, memberships);

    const pushUsers = [];

    memberships.forEach((membership) => {
      const { user } = membership;

      pushUsers.push(user.id);

      if (user.phone) {
        // Send SMS
        const template = 'message-to-morador-sms';
        const templateContext = {
          assunto,
          mensagem
        };

        smsService.sendSms(user.phone, template, templateContext);
      }

      if (user.email) {
        // Send email
        const subject = 'Você recebeu uma mensagem do Síndico do seu condomínio';
        const template = 'message-to-morador-email';
        const templateContext = {
          name: user.name,
          categoria,
          assunto,
          mensagem
        };

        emailService.sendEmail(user.email, subject, template, templateContext);
      }

      if (!user.phone && !user.email) {
        winston.error('Error sending message to Morador: User is invalid (email and phone not found)');
      }
    });

    pushNotificationService.sendPushNotification(context, assunto, mensagem, pushUsers, 'listarMensagens');

    return message;
  }

  async messageToSubsindico(context, values) {
    await this.assertMembershipPermission(context, values.condominioId);

    const {
      categoria,
      assunto,
      mensagem,
      condominioId
    } = values;

    let userMembership = context.memberships[0];
    const memberships = await membershipService
      .findSubsindicoByBlocoIdIncludeUser(context, condominioId, userMembership.blocoId);

    const message = await this.saveMessage(context, values, memberships);

    const pushUsers = [];

    memberships.forEach((membership) => {
      const { user } = membership;

      pushUsers.push(user.id);

      // Síndico must have a phone number
      if (user.phone) {
        // Send SMS
        const template = 'message-to-sindico-sms';
        const templateContext = {
          assunto,
          mensagem
        };

        smsService.sendSms(user.phone, template, templateContext);
      }

      if (user.email) {
        // Send email
        const subject = 'Você recebeu uma mensagem de um Morador do seu condomínio';
        const template = 'message-to-sindico-email';
        const templateContext = {
          name: user.name,
          categoria,
          assunto,
          mensagem
        };

        emailService.sendEmail(user.email, subject, template, templateContext);
      }

      if (!user.phone && !user.email) {
        winston.error('Error sending message to Síndico: User is invalid (email and phone not found)');
      }
    });

    pushNotificationService.sendPushNotification(context, assunto, mensagem, pushUsers, 'listarMensagens');

    return message;
  }

  async messageToAllSubsindicos(context, values) {
    await this.assertMembershipPermission(context, values.condominioId);

    const {
      categoria,
      assunto,
      mensagem,
      condominioId
    } = values;

    const memberships = await membershipService
      .findAllSubsindicosByCondominioIdIncludeUser(context, condominioId);

    const message = await this.saveMessage(context, values, memberships);

    const pushUsers = [];

    memberships.forEach((membership) => {
      const { user } = membership;

      pushUsers.push(user.id);

      // Síndico must have a phone number
      if (user.phone) {
        // Send SMS
        const template = 'message-to-sindico-sms';
        const templateContext = {
          assunto,
          mensagem
        };

        smsService.sendSms(user.phone, template, templateContext);
      }

      if (user.email) {
        // Send email
        const subject = 'Você recebeu uma mensagem de um Morador do seu condomínio';
        const template = 'message-to-sindico-email';
        const templateContext = {
          name: user.name,
          categoria,
          assunto,
          mensagem
        };

        emailService.sendEmail(user.email, subject, template, templateContext);
      }

      if (!user.phone && !user.email) {
        winston.error('Error sending message to Síndico: User is invalid (email and phone not found)');
      }
    });

    pushNotificationService.sendPushNotification(context, assunto, mensagem, pushUsers, 'listarMensagens');

    return message;
  }

  // Permissão: Membro do condomínio
  async messageToSindico(context, values) {
    await this.assertMembershipPermission(context, values.condominioId);

    const {
      categoria,
      assunto,
      mensagem,
      condominioId
    } = values;

    const memberships = await membershipService
      .findAllSindicosByCondominioIdIncludeUser(context, condominioId);

    const message = await this.saveMessage(context, values, memberships);

    const pushUsers = [];

    memberships.forEach((membership) => {
      const { user } = membership;

      pushUsers.push(user.id);

      // Síndico must have a phone number
      if (user.phone) {
        // Send SMS
        const template = 'message-to-sindico-sms';
        const templateContext = {
          assunto,
          mensagem
        };

        smsService.sendSms(user.phone, template, templateContext);
      }

      if (user.email) {
        // Send email
        const subject = 'Você recebeu uma mensagem de um Morador do seu condomínio';
        const template = 'message-to-sindico-email';
        const templateContext = {
          name: user.name,
          categoria,
          assunto,
          mensagem
        };

        emailService.sendEmail(user.email, subject, template, templateContext);
      }

      if (!user.phone && !user.email) {
        winston.error('Error sending message to Síndico: User is invalid (email and phone not found)');
      }
    });

    pushNotificationService.sendPushNotification(context, assunto, mensagem, pushUsers, 'listarMensagens');

    return message;
  }

  async contatoMessage(context, values) {
    await this.assertLoggedInPermission(context);
    const { nome, email, mensagem } = values;

    if (!nome || !email || !mensagem) {
      winston.error('Error sending Contato message: Form incomplete');
      throw new InternalError('contato_message_error', 'Formulário incompleto');
    }

    // Send email
    const subject = 'Mensagem de Dúvida/Sugestão recebida';
    const template = 'message-to-contato';
    const templateContext = { nome, email, mensagem };
    const contatoEmail = 'contato@smartsindico.com.br';
    emailService.sendEmail(contatoEmail, subject, template, templateContext, email);

    return { nome, email, mensagem };
  }

  async saveMessage(context, values, memberships) {
    const { sequelize } = this.model;

    const {
      assunto,
      mensagem,
      categoria,
      condominioId
    } = values;

    const senderMembership =
      await membershipService.findByCurrentUserAndCondominioId(context, condominioId);

    return sequelize.transaction(async (transaction) => {
      const message = await Message.create({
        categoria,
        assunto,
        mensagem,
        membershipId: senderMembership.id, // FIXME: use Membership hydrated in context
        condominioId
      }, {
        userId: context.user ? context.user.id : undefined,
        transaction
      });

      await MessageRecipient.bulkCreate(memberships.map(membership => ({
        messageId: message.id,
        membershipId: membership.id,
        condominioId
      })), {
        individualHooks: true,
        userId: context.user ? context.user.id : undefined,
        transaction
      });

      return message;
    });
  }

  // Permissão: Membro do condomínio
  // As mensagens recuperadas serão do usuário autenticado no contexto
  async listMessages(context, condominioId) {
    await this.assertMembershipPermission(context, condominioId);

    const membership =
      await membershipService.findByCurrentUserAndCondominioId(context, condominioId);

    return Message.findAll({
      where: {
        $or: [
          {
            membershipId: membership.id
          },
          {
            '$messageRecipients.membershipId$': membership.id
          }
        ]
      },
      include: [{
        model: MessageRecipient,
        as: 'messageRecipients',
        include: [{
          model: Membership,
          as: 'membership',
          include: [{
            model: User,
            as: 'user'
          }]
        }]
      }, {
        model: Membership,
        as: 'membership',
        include: [{
          model: User,
          as: 'user'
        }]
      }],
      order: [
        ['createdAt', 'DESC']
      ]
    });
  }
}

module.exports = new MessageService();
