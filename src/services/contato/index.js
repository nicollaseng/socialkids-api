const _ = require('lodash');
const winston = require('winston');

const { extractFieldsFromFieldNodes, extractArgsFromField } = require('../util');
const { InternalError } = require('../../errors/internal');
const BaseTenantService = require('../baseTenant');
const MembershipService = require('../membership');

const {
  Contato,
  Condominio,
  Membership,
  RateioUnidade,
  LeituraAgua,
  Bloco,
  User,
  Lancamento,
} = require('../../domain');

class ContatoService extends BaseTenantService {
  constructor() {
    super({
      model: Contato,
      resolver: {
        list: {
          include: ['bloco']
        }
      }
    });
  }

  findByBlocoIdAndUnidade(context, blocoId, unidade, condominioId) {
    return Contato.find({
      where: {
        blocoId,
        unidade,
        condominioId
      }
    });
  }

  async create(context, values) {
    let condominio = await Condominio.findById(values.condominioId);

    if(condominio.hasFraction) {
      if(!values.fraction) {
        winston.error('Error create: Unidade precisa ter fração ideal.');
        throw new InternalError('bloco_create_error', { message: 'A unidade precisa ter fração ideal.' });
      }
      // let contatos = await this.model.findAll({ where: { condominioId: values.condominioId } });
      // let sumFractions = 0;
      // for(let i=0; i < contatos.length; i++) {
      //   let contato = contatos[i];
      //   if(contato.fraction) {
      //     sumFractions += parseFloat(contato.fraction.replace(',', '.'));
      //   }
      // }
      // let numFraction = parseFloat(values.fraction.replace(',', '.'));
      // if(sumFractions + numFraction > 100.0) {
      //   winston.error('Error create: Soma das frações ideais não pode ser maior que 100%.');
      //   throw new InternalError('bloco_create_error', { message: 'Soma das frações ideais das unidades não pode ser maior que 100%.' });
      // }
    }
    if (values.blocoId && values.unidade) {
      let bloco = await Bloco.findById(values.blocoId);
      let contatos = await this.model.findAll({ where: { blocoId: values.blocoId, tipo: 'morador' } });
      if(contatos.length >= bloco.quantidadeUnidades) {
        winston.error('Error create: Quantidade máxima de unidades desse bloco já cadastrada.');
        throw new InternalError('bloco_create_error', { message: `O número máximo de unidades do bloco ${bloco.name} já foi cadastrado.` });
      }
      const contato = await this.findByBlocoIdAndUnidade(
        context,
        values.blocoId,
        values.unidade,
        values.condominioId
      );

      if (contato) {
        throw new InternalError('unauthorized_error', { message: 'Esta unidade já está cadastrada' });
      } else {
        const membership = await MembershipService.findByBlocoIdAndUnidade(
          context,
          values.blocoId,
          values.unidade,
          values.condominioId
        );

        if (membership && membership.status === 'pending') {
          throw new InternalError('unauthorized_error', { message: 'Existe um pedido de um usuário pedente para associar-se a essa Unidade' });
        }
      }
    }

    return super.create(context, values);
  }

  async update(context, id, values) {
    const entity = await this.findById(context, id);

    if (!entity) {
      winston.error(`Error during update: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }

    await this.assertUpdatePermission(context, id, values, entity.condominioId);

    let condominio = await Condominio.findById(entity.condominioId);
    if(condominio.hasFraction) {
      if(!values.fraction) {
        winston.error('Error create: Unidade precisa ter fração ideal.');
        throw new InternalError('bloco_create_error', { message: 'A unidade precisa ter fração ideal.' });
      }
      // let contatos = await this.model.findAll({ where: { condominioId: entity.condominioId } });
      // contatos = contatos.filter(con => con.id !== entity.id);
      // let sumFractions = 0;
      // for(let i=0; i < contatos.length; i++) {
      //   let contato = contatos[i];
      //   if(contato.fraction) {
      //     sumFractions += parseFloat(contato.fraction.replace(',', '.'));
      //   }
      // }
      // let numFraction = parseFloat(values.fraction.replace(',', '.'));
      // if(sumFractions + numFraction > 100.0) {
      //   winston.error('Error create: Soma das frações ideais não pode ser maior que 100%.');
      //   throw new InternalError('bloco_create_error', { message: 'Soma das frações ideais das unidades não pode ser maior que 100%.' });
      // }
    }

    let bloco = await Bloco.findById(values.blocoId);
    let contatos = await this.model.findAll({ where: { blocoId: values.blocoId, tipo: 'morador' } });
    if((entity.blocoId !== values.blocoId) && (contatos.length >= bloco.quantidadeUnidades)) {
      winston.error('Error create: Quantidade máxima de unidades desse bloco já cadastrada.');
      throw new InternalError('bloco_update_error', { message: `O número máximo de unidades do bloco ${bloco.name} já foi cadastrado.` });
    }

    const currentContato = await this.findByBlocoIdAndUnidade(
      context,
      values.blocoId,
      values.unidade,
      values.condominioId
    );

    if (currentContato && currentContato.id !== id) {
      throw new InternalError('unauthorized_error', { message: 'Esta unidade já está cadastrada' });
    } else {
      const membership = await MembershipService.findByBlocoIdAndUnidade(
        context,
        values.blocoId,
        values.unidade,
        values.condominioId
      );

      if (membership && membership.status === 'pending') {
        throw new InternalError('unauthorized_error', { message: 'Existe um pedido de um usuário pedente para associar-se a essa Unidade' });
      }
    }

    const memberships = await Membership.findAll({
      where: {
        blocoId: entity.blocoId,
        unidade: entity.unidade,
        condominioId: entity.condominioId
      }
    });

    const update = await entity.update(values, {
      userId: context.user ? context.user.id : undefined
    });

    await Promise.all(memberships.map(membership => Membership.update(values, {
      where: {
        id: membership.id
      }
    })));

    return update;
  }

  async destroy(context, id) {
    let contato = await this.model.findById(id);
    let { unidade, condominioId, blocoId } = contato;
    let membership = await Membership.find({ where: { unidade, condominioId, blocoId } });
    if(membership != undefined && membership.id) {
      throw new InternalError('bloco_destroy_error', { message: 'É necessário desassociar o morador desta unidade primeiro.' });
    }

    let lancamentos = await Lancamento.findAll({ where: { contatoId: id } });
    let rateioUnidades = await RateioUnidade.findAll({ where: { contatoId: id } });
    let leituraAguas = await LeituraAgua.findAll({ where: { contatoId: id } });
    for(let i = 0; i < lancamentos.length; i++) {
      await lancamentos[i].destroy();
    }
    for(let i = 0; i < rateioUnidades.length; i++) {
      await rateioUnidades[i].destroy();
    }
    for(let i = 0; i < leituraAguas.length; i++) {
      await leituraAguas[i].destroy();
    }

    return super.destroy(context, id);
  }

  async contatoRateioUnidadeResolver(source, args, context, info) {
    const fields = extractFieldsFromFieldNodes(info.fieldNodes);
    const rateioUnidade = _.find(fields, { name: 'rateioUnidade' });
    const rateioBlocoId = extractArgsFromField('rateioBlocoId', rateioUnidade.args, info.variableValues);

    return RateioUnidade.find({
      where: {
        rateioBlocoId,
        contatoId: source.id,
        condominioId: source.condominioId
      }
    });
  }

  async contatoMembershipResolver(source, args, context, info) {
    return Membership.findAll({
      where: {
        condominioId: source.condominioId,
        unidade: source.unidade,
        blocoId: source.bloco ? source.bloco.id : (source.blocoId ? source.blocoId : undefined)
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, entity.blocoId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, entity.blocoId);
    // await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    let contato = await this.model.findById(id);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, contato.blocoId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new ContatoService();
