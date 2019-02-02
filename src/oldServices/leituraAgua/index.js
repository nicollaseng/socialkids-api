const { LeituraAgua, Contato } = require('../../domain');

const BaseTenantService = require('../baseTenant');

class LeituraAguaService extends BaseTenantService {
  constructor() {
    super({
      model: LeituraAgua
    });
  }

  async assertReadPermission(context, id) {
    let leitura = await this.model.findById(id);
    let contato = await Contato.findById(leitura.contatoId);
    await this.assertSindicoOrSubsindicoPermission(context, contato.condominioId);
  }

  async assertReadListPermission(context, condominioId, b, c) {
    await this.assertSindicoOrSubsindicoPermission(context, condominioId);
  }

  // Permissão para criação: Síndico ou subsíndico do bloco
  async assertCreatePermission(context, entity) {
    let contato = await Contato.findById(entity.contatoId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, contato.condominioId, contato.blocoId);
  }

  // Permissão para atualização: Síndico ou subsíndico do bloco
  async assertUpdatePermission(context, id, entity) {
    let leitura = await this.model.find({
      where: { id }, include: [{ model: Contato, as: 'contato' }]
    });
    let { condominioId, blocoId } = leitura.contato;
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, blocoId);
  }

  // Permissão para apagar: Síndico ou subsíndico do bloco
  async assertDestroyPermission(context, id) {
    let rateioUnidade = await this.model.findById(id);
    let contato = await Contato.findById(rateioUnidade.contatoId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, contato.condominioId, contato.blocoId);
  }
}

module.exports = new LeituraAguaService();
