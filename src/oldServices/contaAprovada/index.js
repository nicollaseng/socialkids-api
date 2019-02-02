const _ = require('lodash');
const { ContaAprovada } = require('../../domain');
const BaseTenantService = require('../baseTenant');
const { InternalError } = require('../../errors/internal');

class ContaAprovadaService extends BaseTenantService {
  constructor() {
    super({
      model: ContaAprovada
    });
  }

  findById(context, id) {
    return ContaAprovada.find({
      where: {
        id
      }
    });
  }

  findByDataAndCondominioId(context, data, condominioId) {
    return this.model.find({
      where: {
        data,
        condominioId
      }
    });
  }

  findByDataAndBlocoId(context, data, condominioId, blocoId) {
    return this.model.find({
      where: {
        data,
        condominioId,
        blocoId
      }
    });
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    await this.assertSindicoOrSubsindicoPermission(context, condominioId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    let contaAprovada = await this.model.findById(id);
    if(context.memberships) {
      const membership = _.find(context.memberships, { condominioId });
      if(membership && membership.role === 'subsindico') {
        let { status, blocoId } = contaAprovada;
        if(blocoId && status && status > 0) {
          throw new InternalError('contaaprovada_destroy_error', { 
            message: 'Operação não autorizada: Contas já aprovadas pelo Síndico.' 
          });
        }
      }
    }
    await this.assertSindicoOrSubsindicoPermission(context, condominioId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new ContaAprovadaService();
