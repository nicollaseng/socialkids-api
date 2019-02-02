const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');

const { Contato, Membership, User } = require('../../domain');
const { InternalError } = require('../../errors/internal');
const authenticationService = require('../authentication');
const BaseService = require('../base');
const contatoService = require('../contato');
const condominioService = require('../condominio');
const emailService = require('../email');
const facebookService = require('../facebook');
const smsService = require('../sms');

class UserService extends BaseService {
  constructor() {
    super({
      model: User,
      excludeFromCreateType: ['salt', 'status', 'resetPasswordToken', 'resetPasswordExpiresAt'],
      excludeFromType: ['password', 'salt', 'resetPasswordToken', 'resetPasswordExpiresAt']
    });
  }

  // Override to exclude salt and password
  findById(context, id) {
    return this.model.findById(id, {
      attributes: {
        exclude: ['salt', 'password']
      }
    });
  }

  // We need salt and password here for authentication
  findByEmailOrPhone(context, user) {
    return this.model.find({
      where: {
        $or: [
          {
            email: user
          },
          {
            phone: user
          }
        ]
      }
    });
  }

  // Override to send email or SMS
  async create(context, values) {
    const found = await this.model.find({
      where: {
        $or: [
          {
            email: values.email
          },
          {
            phone: values.phone
          }
        ]
      }
    });

    let user;

    if (found && found.status === 'invited') {
      user = await found.update({
        ...values,
        status: 'active'
      });
    } else {
      user = await super.create(context, values);
    }

    if (user) {
      if (user.email) {
        // Send email
        const subject = 'Bem-vindo ao SmartSíndico';
        const template = 'new-user-email';
        const templateContext = {
          name: user.name
        };

        emailService.sendEmail(user.email, subject, template, templateContext);
      } else if (user.phone) {
        // Send SMS
        const template = 'new-user-sms';
        const templateContext = {
          name: user.name
        };

        smsService.sendSms(user.phone, template, templateContext);
      } else {
        winston.error('Error sending new user notification: User is invalid (email and phone not found)');
      }
    }

    return user;
  }

  // Permissão: Sem restrição, todos podem se autenticar
  async authenticate(context, authenticate) {
    let user = {};
    let fbPicture = null;

    if (authenticate.type === 'password') {
      if (!authenticate.user || !authenticate.password) {
        throw new InternalError('invalid_authentication_credentials', { message: 'Autenticação inválida' });
      }

      user = await this.findByEmailOrPhone(context, authenticate.user);

      if (!user || user.status !== 'active') {
        throw new InternalError('user_not_found', { message: 'Usuário não encontrado' });
      }

      if (!user.password || !user.verifyPassword(authenticate.password)) {
        throw new InternalError('user_incorrect_password', { message: 'Senha incorreta' });
      }
    } else if (authenticate.type === 'facebook') {
      const extendedToken =
        await facebookService.extendFacebookAccessToken(authenticate.facebookToken);

      const facebookResponse = await facebookService.fetchFacebookUser(extendedToken);

      if (!extendedToken || !facebookResponse) {
        throw new InternalError('user_not_found', { message: 'Usuário não encontrado' });
      }
      let { picture } = facebookResponse;
      if(picture && picture.data && picture.data.url) {
        fbPicture = picture.data.url;
      }
      const facebookUser = {
        facebookId: facebookResponse.id,
        email: facebookResponse.email,
        name: facebookResponse.name,
        facebookToken: extendedToken
      };

      const [userResult, created] = await User.findOrCreate({
        where: {
          $or: [
            {
              email: facebookUser.email
            },
            {
              facebookId: facebookUser.facebookId
            }
          ]
        },
        defaults: facebookUser,
        userId: context.user ? context.user.id : undefined
      });

      if (!created) {
        await userResult.update({
          facebookId: facebookUser.facebookId,
          facebookToken: facebookUser.facebookToken
        });
      }

      if (userResult.status !== 'active') {
        throw new InternalError('user_not_found', { message: 'Usuário não encontrado' });
      }

      user = userResult;
    } else if (authenticate.type === 'refresh_token') {
      const { refreshToken } = authenticate;

      if (!refreshToken) {
        throw new InternalError('invalid_authentication_credentials', { message: 'Autenticação inválida' });
      }

      const authentication =
        await authenticationService.findByRefreshTokenIncludeUser(context, refreshToken);

      if (!authentication) {
        throw new InternalError('invalid_refresh_token', { message: 'Autenticação não encontrada' });
      }

      if (authentication.expiresAt < Date.now()) {
        authenticationService.removeRefreshToken(context, refreshToken);
        throw new InternalError('refresh_token_expired', { message: 'Autenticação expirada' });
      }

      authenticationService.removeRefreshToken(context, refreshToken);
      user = authentication.user;
    } else {
      throw new InternalError('invalid_authentication_type', { message: 'Tipo de autenticação inválido' });
    }

    return {
      fbPicture,
      accessToken: authenticationService.generateJwt(context, user),
      refreshToken: authenticationService.generateRefreshToken(context, user)
    };
  }

  // Permissão: Síndico
  async invite(context, invite) {
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, invite.condominioId, invite.blocoId);

    // if (!invite.email && !invite.phone) {
    //   const {
    //     name,
    //     condominioId,
    //     blocoId,
    //     unidade
    //   } = invite;

    //   const contato = await contatoService.create(context, {
    //     name,
    //     condominioId,
    //     blocoId,
    //     unidade,
    //     tipo: 'morador'
    //   });

    //   return {
    //     contato
    //   };
    // }
    if(invite.role === 'subsindico') {
      let memberSubsindinco = await Membership.find({
        where: {
          condominioId: invite.condominioId,
          blocoId: invite.blocoId,
          role: 'subsindico',
        }
      });
      if(memberSubsindinco) {
        throw new InternalError('unauthorized_error', { message: 'Já existe um Subsíndico cadastrado nesse Bloco' });
      }
    }

    let member = await Membership.find({
      where: {
        condominioId: invite.condominioId,
        blocoId: invite.blocoId,
        unidade: invite.unidade,
      }
    });
    if(member) {
      throw new InternalError('unauthorized_error', { message: 'Já existe um morador cadastrado nessa unidade' });
    }
    const { sequelize } = this.model;
    try {
      const result = await sequelize.transaction(async (transaction) => {
        const user = await User.create({
          name: invite.name,
          email: invite.email || undefined,
          phone: invite.phone || undefined,
          cpf: invite.cpf || undefined,
          status: 'invited'
        }, {
          userId: context.user ? context.user.id : undefined,
          transaction
        });

        const membership = await Membership.create({
          userId: user.id,
          condominioId: invite.condominioId,
          blocoId: invite.blocoId,
          unidade: invite.unidade,
          role: invite.role,
          status: 'active'
        }, {
          userId: context.user ? context.user.id : undefined,
          transaction
        });
        let contato = [null];
        if(membership.blocoId && membership.unidade && membership.condominioId) {
          contato = await Contato.findOrCreate({
            where: {
              tipo: 'morador',
              blocoId: membership.blocoId || undefined,
              unidade: membership.unidade,
              condominioId: membership.condominioId
            },
            userId: context.user ? context.user.id : undefined,
            transaction
          });
        }

        return {
          user,
          membership,
          contato: _.first(contato)
        };
      });

      const condominio = await condominioService.findById(context, invite.condominioId);

      if (invite.email) {
        // Send email
        const subject = 'Você foi convidado para o SmartSíndico';
        const template = 'invite-user-email';
        const templateContext = {
          name: invite.name,
          codigoCondominio: condominio.codigo
        };

        emailService.sendEmail(invite.email, subject, template, templateContext);
      } else if (invite.phone) {
        // Send SMS
        const template = 'invite-user-sms';
        const templateContext = {
          codigoCondominio: condominio.codigo
        };

        smsService.sendSms(invite.phone, template, templateContext);
      } else {
        winston.error('Error sending invite: Invite is invalid (email and phone not found)');
      }

      return result;
    } catch (err) {
      winston.error('Error inviting User:', err);
      throw err;
    }
  }

  // Permissão: Sem restrição, todos recuperar a senha
  async forgotPassword(context, forgot) {
    const user = await this.findByEmailOrPhone(context, forgot.user);

    if (!user) {
      throw new InternalError('user_not_found', { message: 'Usuário não encontrado' });
    }

    let {
      resetPasswordToken,
      resetPasswordExpiresAt
    } = user;

    // Expired token, generate a new one
    resetPasswordToken = Math.floor(100000 + (Math.random() * 900000));
    resetPasswordExpiresAt = Date.now() + 86400000;

    await user.update({
      resetPasswordToken,
      resetPasswordExpiresAt
    });

    let timezone = 'America/Sao_Paulo';
    const dateExpiresAt = moment(resetPasswordExpiresAt).tz(timezone).format('DD/MM/YYYY');
    const hourExpiresAt = moment(resetPasswordExpiresAt).tz(timezone).format('HH:mm:ss');

    if (user.email === forgot.user) {
      // Send recover email
      const subject = 'Recuperação de senha';
      const template = 'forgot-password-email';
      const templateContext = {
        name: user.name,
        resetPasswordToken,
        dateExpiresAt,
        hourExpiresAt
      };

      emailService.sendEmail(user.email, subject, template, templateContext);
    } else {
      // Send recover SMS
      const template = 'forgot-password-sms';
      const templateContext = {
        name: user.name,
        resetPasswordToken,
        dateExpiresAt,
        hourExpiresAt
      };

      smsService.sendSms(user.phone, template, templateContext);
    }

    return {
      userId: user.id
    };
  }

  // Permissão: Sem restrição, todos recuperar a senha
  async resetPassword(context, reset) {
    const user = await this.findByEmailOrPhone(context, reset.user);

    if (!user) {
      throw new InternalError('user_not_found', { message: 'Usuário não encontrado' });
    }

    if (user.resetPasswordToken !== reset.token) {
      throw new InternalError('invalid_recover_token', { message: 'Código de recuperação inválido' });
    }

    if (user.resetPasswordExpiresAt < Date.now()) {
      throw new InternalError('recover_token_expired', { message: 'Código de recuperação expirado' });
    }

    await user.update({
      password: reset.password,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null
    });

    if (user.email === reset.user) {
      // Send email
      const subject = 'Sua senha foi alterada';
      const template = 'reset-password-email';
      const templateContext = {
        name: user.name
      };

      emailService.sendEmail(user.email, subject, template, templateContext);
    } else {
      // Send SMS
      const template = 'reset-password-sms';
      const templateContext = {
        name: user.name
      };

      smsService.sendSms(user.phone, template, templateContext);
    }

    return {
      userId: user.id
    };
  }

  // Permissão: Usuário autenticado
  async changePassword(context, change) {
    await this.assertLoggedInPermission(context);

    const user = await this.model.findById(context.user.id);

    if (!user) {
      throw new InternalError('user_not_found', { message: 'Usuário não encontrado' });
    }

    if (!user.verifyPassword(change.currentPassword)) {
      throw new InternalError('user_incorrect_password', { message: 'Senha incorreta' });
    }

    await user.update({
      password: change.newPassword
    }, {
      userId: context.user ? context.user.id : undefined
    });

    return {
      userId: user.id
    };
  }

  // Permissão para criação: Sem restrição, todos criar um usuário
  async assertCreatePermission(context, entity) {
    // Empty method
  }

  // Permissão para atualização: Somente usuário autenticado atualizando o próprio perfil
  async assertUpdatePermission(context, id, entity) {
    await this.assertLoggedInPermission(context);
    let isSindicoOrSub = false;
    let { memberships } = context;
    if (memberships) {
      for(let i=0; i < memberships.length; i++) {
        let { condominioId, role } = memberships[i];
        let morador = await Membership.find({ where: { userId: id, condominioId } });
        if(morador && morador.status === 'active' && (role === 'sindico' || role === 'subsindico'))
          isSindicoOrSub = true;
      }
    }
    if (context.user.id !== id && !isSindicoOrSub) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  // Permissão para apagar: Ninguém
  async assertDestroyPermission(context, id) {
    throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
  }

  // Permissão para leitura: Usuário autenticado recuperando o próprio perfil
  // FIXME: Verificar possibilidade de um Síndico recuperar o perfil de um usuário do condomínio
  async assertReadPermission(context, id) {
    await this.assertLoggedInPermission(context);
    let isSindicoOrSub = false;
    let { memberships } = context;
    if (memberships) {
      for(let i=0; i < memberships.length; i++) {
        let { condominioId, role } = memberships[i];
        let morador = await Membership.find({ where: { userId: id, condominioId } });
        if(morador && morador.status === 'active') {
          if(role === 'sindico' || role === 'subsindico') {
            isSindicoOrSub = true;
          }
        }
      }
    }
    if (context.user.id !== id && !isSindicoOrSub) {
      throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
    }
  }

  // Permissão para leitura de lista: Ninguém
  async assertReadListPermission(context) {
    throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
  }
}

module.exports = new UserService();
