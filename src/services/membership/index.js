const _ = require('lodash');
const winston = require('winston');

const { InternalError } = require('../../errors/internal');
const BaseTenantService = require('../baseTenant');
const notificationService = require('../pushNotification');
const emailService = require('../email');

const {
  Condominio,
  Contato,
  Membership,
  User,
  Bloco
} = require('../../domain');

class MembershipService extends BaseTenantService {
  constructor() {
    super({
      model: Membership,
      resolver: {
        list: {
          include: ['user', 'condominio', 'bloco']
        }
      }
    });
  }

  findByUserId(context, userId) {
    return Membership.findAll({
      where: {
        userId
      }
    });
  }

  findByBlocoIdAndUnidade(context, blocoId, unidade, condominioId) {
    return Membership.find({
      where: {
        blocoId,
        unidade,
        condominioId
      }
    });
  }

  findAllMoradoresByBlocoIdIncludeUser(context, moradores, condominioId, blocoId) {
    let where = {
      role: {
        $or: ['morador', 'sindico']
      },
      condominioId,
      blocoId
    };

    if (moradores) {
      where = {
        ...where,
        id: {
          $in: moradores
        }
      };
    }

    return Membership.findAll({
      where,
      include: [{
        model: User,
        as: 'user'
      }]
    });
  }

  findAllMoradoresByCondominioIdIncludeUser(context, moradores, condominioId) {
    let where = {
      role: {
        $or: ['morador', 'subsindico']
      },
      condominioId
    };

    if (moradores) {
      where = {
        ...where,
        id: {
          $in: moradores
        }
      };
    }

    return Membership.findAll({
      where,
      include: [{
        model: User,
        as: 'user'
      }]
    });
  }

  findAllSindicosByCondominioIdIncludeUser(context, condominioId) {
    return Membership.findAll({
      where: {
        role: 'sindico',
        condominioId
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });
  }

  findSubsindicoByBlocoIdIncludeUser(context, condominioId, blocoId) {
    return Membership.findAll({
      where: {
        role: 'subsindico',
        condominioId,
        blocoId
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });
  }

  findAllSubsindicosByCondominioIdIncludeUser(context, condominioId) {
    return Membership.findAll({
      where: {
        role: 'subsindico',
        condominioId
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });
  }

  findByCurrentUserAndCondominioId(context, condominioId) {
    return Membership.find({
      where: {
        userId: context.user.id,
        condominioId
      }
    });
  }

  findByCurrentUserAndCondominioIdIncludeCondominio(context, condominioId) {
    return Membership.find({
      where: {
        userId: context.user.id,
        condominioId
      },
      include: [{
        model: Condominio,
        as: 'condominio'
      }]
    });
  }

  async create(context, values) {
    let { userId, condominioId, role } = values;
    const membership = await super.create(context, values);
    if(membership && userId && condominioId && role !== 'sindico') {
      let newUser = await User.findById(userId);
      let sindicos = await this.findAllSindicosByCondominioIdIncludeUser(context, condominioId);
      let title = 'Pedido de Morador Pendente';
      let msg = `O morador ${newUser.name} deseja juntar-se ao seu condomínio.`;
      let ids = sindicos.filter(e => e.user && e.user.id).map(e => e.user.id);
      notificationService.sendPushNotification(null, title, msg, ids, 'listaMoradores');
      sindicos.map((sindico) => {
        if(sindico.user && sindico.user.email) {
          let { name, email } = sindico.user;
          const subject = 'Pedido de Morador Pendente';
          const template = 'new-morador-email';
          const templateContext = {
            name,
            morador: newUser.name
          };

          emailService.sendEmail(email, subject, template, templateContext);
        }
      });
    }
    return membership;
  }

  // Override update to update Contato
  async update(context, id, values) {
    const membership = await this.model.findById(id);
    // FIXME: Garantir que sempre em uma atualização de bloco/unidade seja enviado blocoId e unidade
    const contatoService = require('../contato');
    if (values.blocoId && values.unidade) {
      let contato = await Contato.find({
        where: {
          condominioId: membership.condominioId,
          blocoId: values.blocoId,
          unidade: values.unidade,
          tipo: 'morador'
        }
      });
      if(!contato) {
        await contatoService.create(context, {
          condominioId: membership.condominioId,
          blocoId: values.blocoId,
          unidade: values.unidade,
          tipo: 'morador'
        });
      }
    }
    const updatedMembership = await super.update(context, id, values);
    return updatedMembership;
  }

  // Permissão: Síndico
  async approveMembership(context, id) {
    const membership = await this.findById(context, id);

    if (!membership) {
      winston.error('Error approving membership: Membership not found');
      throw new InternalError('approve_membership_error', { message: 'Erro durante aprovação de morador' });
    }

    if (membership.status !== 'pending') {
      winston.error('Error approving membership: Cannot approve membership (not pending)');
      throw new InternalError('approve_membership_error', { message: 'O pedido desse morador já foi aprovado.' });
    }

    const existingMembership = await Membership.find({ where: {
      status: 'active',
      condominioId: membership.condominioId,
      blocoId: membership.blocoId,
      unidade: membership.unidade,
    } });

    const contato = await Contato.find({ where: {
      condominioId: membership.condominioId,
      blocoId: membership.blocoId,
      unidade: membership.unidade,
    } });

    const totalContatos = await Contato.count({
      where: { condominioId: membership.condominioId, blocoId: membership.blocoId, tipo: 'morador' }
    });
    const bloco = await Bloco.findById(membership.blocoId);
    if(existingMembership || (!contato && totalContatos >= bloco.quantidadeUnidades )) {
      if(existingMembership) {
        throw new InternalError('approve_membership_error', { message: 'Já existe um morador cadastrado nessa Unidade.' });
      }

      if(!contato && totalContatos >= bloco.quantidadeUnidades) {
        throw new InternalError('approve_membership_error', { message: 'O número máximo de unidades desse bloco já foi cadastrado.' });
      }
    }

    await this.assertSindicoPermission(context, membership.condominioId);

    const { sequelize } = this.model;

    try {
      return sequelize.transaction(async (transaction) => {
        await membership.update({
          status: 'active'
        }, {
          userId: context.user ? context.user.id : undefined,
          transaction
        });

        await Contato.findOrCreate({
          where: {
            tipo: 'morador',
            blocoId: membership.blocoId || undefined,
            unidade: membership.unidade,
            condominioId: membership.condominioId
          },
          userId: context.user ? context.user.id : undefined,
          transaction
        });

        let condominio = await Condominio.findById(membership.condominioId);
        let user = await User.findById(membership.userId);
        let title = 'Aprovação de Condomínio';
        let msg = `Parabéns, ${user.name}! Você foi aprovado no ${condominio.name}!`;
        notificationService.sendPushNotification(null, title, msg, [user.id], null);
        return membership;
      });
    } catch (err) {
      winston.error('Error approving Membership:', err);
      throw err;
    }
  }

  // Permissão para criação: Usuário autenticado
  async assertCreatePermission(context, entity, condominioId) {
    await this.assertLoggedInPermission(context);

    const membership = await this.findByBlocoIdAndUnidade(
      context,
      entity.blocoId,
      entity.unidade,
      entity.condominioId
    );

    // Permite o cadastro apenas de um morador por unidade
    if (membership) {
      throw new InternalError('unauthorized_error', { message: 'Já existe morador cadastrado nessa unidade' });
    }
    console.log('Creating New Membership: ', entity);
    if (entity.role === 'sindico') {
      // Only allow one Síndico to be created per Condomínio
      // Check if Condomínio has another Síndico
      const sindicoCount = await Membership.count({
        where: {
          condominioId: entity.condominioId,
          role: 'sindico'
        }
      });

      if (sindicoCount > 0) {
        throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
      }
    } else if(entity.role === 'morador') {
      const existingContato = await Contato.find({
        where: {
          unidade: entity.unidade,
          blocoId: entity.blocoId,
          condominioId: entity.condominioId
        }
      });
      const hasContato = (existingContato && existingContato.unidade && existingContato.blocoId);
      const totalContatos = await Contato.count({
        where: { condominioId: entity.condominioId, blocoId: entity.blocoId, tipo: 'morador' }
      });
      const bloco = await Bloco.findById(entity.blocoId);
      if(!hasContato && bloco && bloco.quantidadeUnidades <= totalContatos) {
        throw new InternalError('unauthorized_error', { message: 'O número máximo de unidades desse bloco já foi cadastrado.' });
      }
    }
  }

  // Permissão para atualização: Usuário autenticado atualizando o próprio membership ou Síndico
  // Sendo que somente o Síndico pode atualizar `role` e `status`
  async assertUpdatePermission(context, id, entity, condominioId) {
    await this.assertLoggedInPermission(context);

    const membership = await this.findById(context, id);

    if (context.user.id !== membership.userId) {
      // await this.assertSindicoPermission(context, membership.condominioId);
      await this.assertSindicoOrSubsindicoPermissionWithBloco(context, membership.condominioId, membership.blocoId);
    }

    // FIXME: Garantir que sempre em uma atualização de bloco/unidade seja enviado blocoId e unidade
    if (entity.blocoId && entity.unidade) {
      const haveMembership = await this.findByBlocoIdAndUnidade(
        context,
        entity.blocoId,
        entity.unidade,
        membership.condominioId
      );

      if (haveMembership && (haveMembership.id !== membership.id)) {
        throw new InternalError('multiple_membership_error', { message: 'Já existe morador cadastrado nessa unidade' });
      }
    }

    // Role changed
    if (entity.role && (membership.role !== entity.role)) {
      // Permission: Only `sindico` allowed to change role
      await this.assertSindicoPermission(context, membership.condominioId);

      if (entity.role === 'sindico') {
        // Only allow one Síndico to be created per Condomínio
        // Check if Condomínio has another Síndico
        const sindicoCount = await Membership.count({
          where: {
            condominioId: membership.condominioId,
            role: 'sindico'
          }
        });

        if (sindicoCount > 0) {
          throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
        }
      }

      if(entity.role === 'subsindico') {
        if(!entity.blocoId) {
          throw new InternalError('unauthorized_error', { message: 'Selecione um Bloco para cadastrar um Subsíndico' });
        }
        let subsindico = await Membership.find({
          where: {
            condominioId: membership.condominioId,
            blocoId: entity.blocoId,
            role: 'subsindico',
          }
        });
        if(subsindico) {
          throw new InternalError('unauthorized_error', { message: 'Já existe um Subsíndico cadastrado nesse Bloco' });
        }
      }
    }

    // Status changed
    if (entity.status && (membership.status !== entity.status)) {
      // Permission: Only `sindico` allowed to change status
      await this.assertSindicoPermission(context, membership.condominioId);
    }
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    let membership = await this.model.findById(id);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, membership.blocoId);
  }

  // Permissão para leitura: Usuário autenticado lendo o próprio membership ou Síndico
  async assertReadPermission(context, id, condominioId) {
    if(!context.memberships || !_.find(context.memberships, { condominioId })) {
      // await this.assertSindicoPermission(context, condominioId);
      await this.assertSindicoOrSubsindicoPermission(context, condominioId);
    }
  }

  // Permissão para leitura de lista: Síndico
  async assertReadListPermission(context, condominioId) {
    if(!context.memberships || !_.find(context.memberships, { condominioId })) {
      // await this.assertSindicoPermission(context, condominioId);
      await this.assertSindicoOrSubsindicoPermission(context, condominioId);
    }
  }
}

module.exports = new MembershipService();
