const {
  Bloco, RateioBloco, RateioUnidade, Contato, Membership, Conta, Lancamento, LeituraAgua
} = require('../../domain');
const BaseTenantService = require('../baseTenant');
const { InternalError } = require('../../errors/internal');
const winston = require('winston');

const contas = [
  {
    name: 'Ordinária',
    identifier: 'ordinaria',
    order: 1
  },
  {
    name: 'Fundo de Reserva',
    identifier: 'reserva',
    order: 2
  },
  {
    name: 'Extraordinária',
    identifier: 'extraordinaria',
    order: 3
  }
];

class BlocoService extends BaseTenantService {
  constructor() {
    super({
      model: Bloco
    });
  }

  async create(context, values) {
    const { name, quantidadeUnidades, condominioId } = values;
    let blocos = await this.model.findAll({ where: { condominioId } });
    for(let i=0; i < blocos.length; i++) {
      let bloco = blocos[i];
      if(name.toLowerCase() === bloco.name.toLowerCase()) {
        winston.error('Error during creation: Já existe um bloco com esse nome');
        throw new InternalError('bloco_create_error',
          { message: 'Já existe um bloco com esse nome' }
        );
      }
    }
    let newBloco = await super.create(context, values);
    let contasCond = await Conta.findAll({ where: { condominioId } });
    if(contasCond && contasCond[0].blocoId !== null) {
      for(let i=0; i < contas.length; i++) {
        let conta = contas[i];
        await Conta.create({
          name: conta.name,
          identifier: conta.identifier,
          order: conta.order,
          blocoId: newBloco.id,
          condominioId,
        });
        // newContas.push({ ...conta, blocoId: newBloco.id });
      }
    }
    return newBloco;
  }

  async update(context, id, values) {
    let bloco = await this.model.findById(id);
    let contatos = await Contato.findAll({ where: { blocoId: id, tipo: 'morador' } });
    if(values.quantidadeUnidades < contatos.length) {
      winston.error('Error during update: QuantidadeUnidades do Bloco deve ser maior ou igual que unidades cadastradas');
      throw new InternalError('bloco_update_error',
        { message: 'Número de Unidades do Bloco não pode ser menor que a quantidade já cadastrada.' }
      );
    }
    return await bloco.update(values);
  }

  async destroy(context, id) {
    let members = await Membership.findAll({ where : { blocoId: id, role: 'morador', status: 'active' } });
    let contatos = await Contato.findAll({ where : { blocoId: id, tipo: 'morador' } });
    if(contatos && contatos.length > 0) {
      winston.error('Error during destroy: Can not destroy Bloco that has unidades');
      throw new InternalError('bloco_destroy_error',
        { message: 'É preciso deletar todas as unidades cadastradas desse bloco antes.' }
      );
    }

    let contas = await Conta.findAll({ where: { blocoId: id } });
    let rateioBlocos = await RateioBloco.findAll({ where: { blocoId: id } });
    for(let i=0; i < contas.length; i++) {
      let conta = contas[i];
      let lancamentos = Lancamento.findAll({ where: { contaId: conta.id } });
      for(let j=0; j < lancamentos.length; j++) {
        let lancamento = lancamentos[j];
        await lancamento.destroy();
      }
      await conta.destroy();
    }

    for(let i=0; i < rateioBlocos.length; i++) {
      var rateioBloco = rateioBlocos[i];
      var rateiosUnidade = await RateioUnidade.findAll({
        where: { rateioBlocoId: rateioBloco.id },
      });
      for(let j=0; j < rateiosUnidade.length; j++) {
        var rateioUnidade = rateiosUnidade[j];
        await Lancamento.destroy({
          where: { rateioUnidadeId: rateioUnidade.id }
        });
        await rateioUnidade.destroy();
      }

      var leituraAguas = await LeituraAgua.findAll({
        where: { rateioBlocoId: rateioBloco.id },
      });
      for(let j=0; j < leituraAguas.length; j++) {
        var leituraAgua = leituraAguas[j];
        await leituraAgua.destroy();
      }
      await rateioBloco.destroy();
    }

    //Destroy Memberships ?!
    return super.destroy(context, id);
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para leitura: Usuário autenticado
  async assertReadPermission(context, id, condominioId) {
    await this.assertLoggedInPermission(context);
  }

  // Permissão para leitura de lista: Usuário autenticado
  async assertReadListPermission(context, condominioId) {
    await this.assertLoggedInPermission(context);
  }
}

module.exports = new BlocoService();
