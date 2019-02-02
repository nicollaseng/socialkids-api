const { RateioBloco, RateioUnidade, Lancamento, Conta, Bloco } = require('../../domain');
const BaseTenantService = require('../baseTenant');
const _ = require('lodash');

class RateioBlocoService extends BaseTenantService {
  constructor() {
    super({
      model: RateioBloco
    });
  }

  async update(context, id, values) {
    // console.log("UPDATING RATEIO: ", id, values);
    let rateioBloco = await RateioBloco.findById(id);
    await rateioBloco.update(values);
    let blocos = await Bloco.findAll({ where: { condominioId: rateioBloco.condominioId } });
    let totalUnidades = blocos.reduce((t, bloco) => t += bloco.quantidadeUnidades, 0);
    const contas = await Conta.findAll({ where: { condominioId: rateioBloco.condominioId }});

    const contaOrdinaria = _.chain(contas)
      .filter(conta => conta.identifier === 'ordinaria').first().value();

    const contaExtraordinaria = _.chain(contas)
      .filter(conta => conta.identifier === 'extraordinaria').first().value();

    const contaReserva = _.chain(contas)
      .filter(conta => conta.identifier === 'reserva').first().value();

    let rateiosUnidade = await RateioUnidade.findAll({where: { rateioBlocoId: id }});
    for(let i=0; i < rateiosUnidade.length; i++) {
      var lancamentos = await Lancamento.findAll({
        where: { rateioUnidadeId: rateiosUnidade[i].id }
      });
      for(let j=0; j < lancamentos.length; j++) {
        var lancamento = lancamentos[j];
        if(contaOrdinaria.id == lancamento.contaId) {
          await lancamento.update({ valor: values.valorOrdinaria/totalUnidades });
        } else if(contaExtraordinaria.id == lancamento.contaId) {
          await lancamento.update({ valor: values.valorExtraordinaria/totalUnidades });
        } else if(contaReserva.id == lancamento.contaId) {
          await lancamento.update({ valor: values.valorFundoReserva/totalUnidades });
        }
      }
    }
    return { id, ...values};
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, entity.blocoId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, entity.blocoId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    let rateioBloco = await this.model.findById(id);
    // await this.assertSindicoPermission(context, condominioId);
    await this.assertSindicoOrSubsindicoPermissionWithBloco(context, condominioId, rateioBloco.blocoId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new RateioBlocoService();
