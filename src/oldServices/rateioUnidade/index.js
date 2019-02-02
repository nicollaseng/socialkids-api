const { RateioUnidade, Contato } = require('../../domain');

const BaseTenantService = require('../baseTenant');

class RateioUnidadeService extends BaseTenantService {
  constructor() {
    super({
      model: RateioUnidade
    });
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    let contato = await Contato.findById(entity.contatoId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, contato.blocoId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    let rateioUnidade = await this.model.findById(id);
    let contato = await Contato.findById(rateioUnidade.contatoId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, contato.blocoId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    let rateioUnidade = await this.model.findById(id);
    let contato = await Contato.findById(rateioUnidade.contatoId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, contato.blocoId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new RateioUnidadeService();
