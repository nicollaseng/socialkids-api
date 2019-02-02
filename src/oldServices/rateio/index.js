const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');

const BaseTenantService = require('../baseTenant');
const { InternalError } = require('../../errors/internal');
const contaAprovadaService = require('../contaAprovada');

const {
  Bloco,
  Categoria,
  Condominio,
  Conta,
  Contato,
  Membership,
  Lancamento,
  Rateio,
  RateioBloco,
  RateioUnidade,
  LeituraAgua
} = require('../../domain');

class RateioService extends BaseTenantService {
  constructor() {
    super({
      model: Rateio
    });
  }

  // Permissão para lançamento: Síndico e Subsíndico
  async releaseRateio(context, rateioId, condominioId) {
    await this.assertSindicoOrSubsindicoPermission(context, condominioId);
    let rateioReleased = await this.model.findById(rateioId);
    let { totalAgua, competencia, isencaoPercentual, isencaoTipo, blocoId, tipo } = rateioReleased;
    await this.assertNotContaAprovada(context, competencia, condominioId, blocoId);

    let isentos = [], leiturasAguaUnidades = [];
    let sumPercent = 100, hasBloco = false;
    let rateioDescontos = { valorOrd: 0, valorExt: 0, valorFun: 0 };
    let membership = _.find(context.memberships, { condominioId });
    let whereContato = { condominioId, tipo: 'morador' };

    let blocos = await Bloco.findAll({ where: { condominioId } });
    const rateioBlocos = await RateioBloco.findAll({
      where: {
        rateioId,
        condominioId,
        status: 'pendente'
      }
    });

    if(membership.role === 'subsindico' || blocoId || (rateioBlocos.length === 1 && rateioBlocos.length < blocos.length)) {
      whereContato.blocoId =
        membership.role === 'subsindico' ? membership.blocoId : (blocoId ? blocoId : rateioBlocos[0].blocoId);
      hasBloco = true;
    }
    const contatos = await Contato.findAll({ where: whereContato });
    const condominio = await Condominio.findById(condominioId);

    if(membership.role === 'subsindico') {
      let canRelease = true;
      for(let i=0; i < rateioBlocos.length; i++) {
        if(rateioBlocos[i].blocoId !== membership.blocoId) {
          canRelease = false;
        }
      }
      if(!canRelease) {
        throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
      }
    }

    if(hasBloco && condominio.hasFraction && tipo === 'fracao') {
      sumPercent = contatos.reduce((t, contato) => {
        let { fraction } = contato;
        let realFraction = fraction ? parseFloat(fraction.replace(',', '.')) : 0;
        return t + realFraction;
      }, 0);
    }

    let totalUnidades = tipo === 'unidade' ? 1 : contatos.length;
    // Criação de RateioUnidades para Contatos que não tiveram
    // o RateioUnidade previamente cadastrado (consumo de água)
    await Promise.all(contatos.map(async (contato) => {
      let isIsento = false;
      const { blocoId, unidade, fraction } = contato;
      const member = await Membership.find({where: { condominioId, blocoId, unidade }})
      if(member && (isencaoTipo === member.role) || (isencaoTipo === 'sindicosubsindico' && member.role !== 'morador')) {
        isentos.push(contato);
        isIsento = true;
      }
      const rateioBloco = _.find(rateioBlocos, { blocoId: contato.blocoId });
      let leituraAgua = await LeituraAgua.find({
        where: {
          contatoId: contato.id,
          rateioBlocoId: rateioBloco.id,
        }
      });
      if(!leituraAgua || leituraAgua === null) {
        let ultimaLeitura = await LeituraAgua.findAll({
          order: ['referencia'],
          limit: 1,
          where: {
            contatoId: contato.id,
            referencia: {
              gte: moment(competencia).add(-1, 'month').format('YYYY-MM-01'),
              lt: moment(competencia).format('YYYY-MM-01')
            }
          }
        });
        let ultimaLeituraValor = 0;
        if(ultimaLeitura && ultimaLeitura.length > 0 && ultimaLeitura[0].leituraAtual)
          ultimaLeituraValor = ultimaLeitura[0].leituraAtual;
        leituraAgua = await LeituraAgua.create({
          condominioId: contato.condominioId,
          contatoId: contato.id,
          rateioBlocoId: rateioBloco.id,
          referencia: competencia,
          leituraAnterior: ultimaLeituraValor,
          leituraAtual: ultimaLeituraValor,
          valorConsumido: 0,
        });
      }
      if(isIsento && condominio.hasFraction && fraction && tipo === 'fracao') {
        let realFraction = parseFloat(fraction.replace(',', '.'));
        let { valorOrdinaria, valorExtraordinaria, valorFundoReserva } = rateioBloco;
        rateioDescontos.valorOrd += valorOrdinaria * parseFloat(isencaoPercentual/100) * parseFloat(realFraction/sumPercent);
        rateioDescontos.valorExt += valorExtraordinaria * parseFloat(isencaoPercentual/100) * parseFloat(realFraction/sumPercent);
        rateioDescontos.valorFun += valorFundoReserva * parseFloat(isencaoPercentual/100) * parseFloat(realFraction/sumPercent);
      }
      return RateioUnidade.findOrCreate({
        where: {
          rateioBlocoId: rateioBloco.id,
          contatoId: contato.id,
          condominioId
        },
        userId: context.user ? context.user.id : undefined
      });
    }));

    for(let i=0; i < rateioBlocos.length; i++) {
      let rateioBloco = rateioBlocos[i];
      let leiturasAguas = await LeituraAgua.findAll({ where: { rateioBlocoId: rateioBloco.id } });
      if(leiturasAguas) {
        for(let j=0; j < leiturasAguas.length; j++) {
          leiturasAguaUnidades.push(leiturasAguas[j]);
        }
      }
    }

    let somaConsumos = 0, somaValorConsumo = 0;
    for(let i=0; i < leiturasAguaUnidades.length; i++) {
      let leitura = leiturasAguaUnidades[i];
      const { leituraAnterior, leituraAtual, valorConsumido } = leitura;
      let anterior = parseFloat(leituraAnterior || 0);
      let atual = parseFloat(leituraAtual || 0);
      let valor = parseFloat(valorConsumido || 0);
      somaConsumos += (atual >= anterior) ? (atual - anterior) : atual;
      somaValorConsumo += valor;
    }

    // Recupera todos RateioUnidades (criados e já existentes)
    const rateioUnidades = await RateioUnidade.findAll({
      where: {
        condominioId,
        status: 'pendente',
        rateioBlocoId: {
          $in: _.map(rateioBlocos, 'id')
        }
      },
      include: [{
        model: RateioBloco,
        as: 'rateioBloco',
        include: [{
          model: Rateio,
          as: 'rateio'
        }]
      }, {
        model: Contato,
        as: 'contato',
        include: [{
          model: Bloco,
          as: 'bloco'
        }]
      }, {
        model: Condominio,
        as: 'condominio'
      }]
    });

    const contas = await Conta.findAll({
      where: {
        condominioId,
        blocoId: blocoId
      }
    });

    const contaOrdinaria = _.chain(contas)
      .filter(conta => conta.identifier === 'ordinaria')
      .first()
      .value();

    const contaExtraordinaria = _.chain(contas)
      .filter(conta => conta.identifier === 'extraordinaria')
      .first()
      .value();

    const contaReserva = _.chain(contas)
      .filter(conta => conta.identifier === 'reserva')
      .first()
      .value();

    const categoria = await Categoria.find({
      where: {
        name: 'Condomínio',
        condominioId
      }
    });
    if(membership.role === 'subsindico') {
      blocos = await Bloco.findAll({ where: { condominioId, id: membership.blocoId } });
    }
    const lancamentos = rateioUnidades.reduce((array, rateioUnidade) => {
      let valorOrd = Math.ceil(rateioUnidade.rateioBloco.valorOrdinaria / totalUnidades);
      let valorExt = Math.ceil(rateioUnidade.rateioBloco.valorExtraordinaria / totalUnidades);
      let valorFun = Math.ceil(rateioUnidade.rateioBloco.valorFundoReserva / totalUnidades);
      if(condominio.hasFraction && tipo === 'fracao') {
        let realFraction = parseFloat(rateioUnidade.contato.fraction.replace(',', '.'));
        valorOrd = rateioUnidade.rateioBloco.valorOrdinaria * parseFloat(realFraction/sumPercent);
        valorExt = rateioUnidade.rateioBloco.valorExtraordinaria * parseFloat(realFraction/sumPercent);
        valorFun = rateioUnidade.rateioBloco.valorFundoReserva * parseFloat(realFraction/sumPercent);
      }
      let addValueOrd = 0;
      let addValueExt = 0;
      let addValueFun = 0;
      if(isentos.length > 0) {
        let isIsento = false;
        for(let i=0; i < isentos.length; i++) {
          if(isentos[i].id === rateioUnidade.contato.id)
            isIsento = true;
        }
        if(isIsento) {
          addValueOrd = - (valorOrd * parseFloat(isencaoPercentual/100));
          addValueExt = - (valorExt * parseFloat(isencaoPercentual/100));
          addValueFun = - (valorFun * parseFloat(isencaoPercentual/100));
        } else {
          let countIsentos = isentos.length;
          let resto = (contatos.length)-countIsentos;
          if(condominio.hasFraction && tipo === 'fracao') {
            addValueOrd = rateioDescontos.valorOrd / resto;
            addValueExt = rateioDescontos.valorExt / resto;
            addValueFun = rateioDescontos.valorFun / resto;
          } else {
            addValueOrd = (valorOrd * countIsentos * parseFloat(isencaoPercentual/100)) / resto;
            addValueExt = (valorExt * countIsentos * parseFloat(isencaoPercentual/100)) / resto;
            addValueFun = (valorFun * countIsentos * parseFloat(isencaoPercentual/100)) / resto;
          }
        }
      }
      const { competencia } = rateioUnidade.rateioBloco.rateio;
      const dataMesAno = moment(competencia).format('MM/YYYY');
      const dataVencimento = moment(competencia);
      const lancamento = {
        data: dataVencimento,
        pago: false,
        tipo: 'credito',
        categoriaId: categoria.id,
        contatoId: rateioUnidade.contatoId,
        condominioId: rateioUnidade.condominioId,
        rateioUnidadeId: rateioUnidade.id
      };
      if ((valorOrd + addValueOrd) > 0) {
        array.push({
          ...lancamento,
          descricao: `Contribuição Ordinária - ${rateioUnidade.contato.bloco.name} - ${rateioUnidade.contato.unidade} - ${dataMesAno}`,
          valor: valorOrd + addValueOrd,
          contaId: contaOrdinaria.id
        });
      }

      if ((valorExt + addValueExt) > 0) {
        array.push({
          ...lancamento,
          descricao: `Contribuição Extraordinária - ${rateioUnidade.contato.bloco.name} - ${rateioUnidade.contato.unidade} - ${dataMesAno}`,
          valor: valorExt + addValueExt,
          contaId: contaExtraordinaria.id
        });
      }

      if ((valorFun + addValueFun) > 0) {
        array.push({
          ...lancamento,
          descricao: `Contribuição Fundo de Reserva - ${rateioUnidade.contato.bloco.name} - ${rateioUnidade.contato.unidade} - ${dataMesAno}`,
          valor: valorFun + addValueFun,
          contaId: contaReserva.id
        });
      }

      if (totalAgua && totalAgua > 0 && somaConsumos > 0) {
        let leitura = _.find(leiturasAguaUnidades, { contatoId: rateioUnidade.contato.id });
        if(leitura) {
          let { leituraAtual, leituraAnterior } = leitura;
          let consumo = (leituraAtual >= leituraAnterior) ? (leituraAtual - leituraAnterior) : leituraAtual;
          if(consumo > 0) {
            let valorConsumido = totalAgua * (consumo/somaConsumos);
            leitura.update({ valorConsumido });
            array.push({
              ...lancamento,
              descricao: `Gasto com Água - ${rateioUnidade.contato.bloco.name} - ${rateioUnidade.contato.unidade} - ${dataMesAno}`,
              valor: valorConsumido,
              contaId: contaOrdinaria.id
            });
          }
        }
      } else if (rateioUnidade.valorAgua > 0) {
        array.push({
          ...lancamento,
          descricao: `Gasto com Água - ${rateioUnidade.contato.bloco.name} - ${rateioUnidade.contato.unidade} - ${dataMesAno}`,
          valor: rateioUnidade.valorAgua,
          contaId: contaOrdinaria.id
        });
      }

      return array;
    }, []);

    const { sequelize } = this.model;

    try {
      return sequelize.transaction(async (transaction) => {
        const created = await Lancamento.bulkCreate(lancamentos, {
          individualHooks: true,
          userId: context.user ? context.user.id : undefined,
          transaction
        });

        await Promise.all(rateioUnidades.map(rateioUnidade =>
          rateioUnidade.update({
            status: 'lancado'
          }, {
            userId: context.user ? context.user.id : undefined,
            transaction
          })));

        await Promise.all(rateioBlocos.map(rateioBloco =>
          rateioBloco.update({
            status: 'lancado'
          }, {
            userId: context.user ? context.user.id : undefined,
            transaction
          })));

        return created;
      });
    } catch (err) {
      winston.error('Error releasing Rateio:', err);
      throw err;
    }
  }

  async assertNotContaAprovada(context, data, condominioId, blocoId) {
    const firstDay = moment(data).startOf('month').format('YYYY-MM-DD');
    const contaAprovada = blocoId ?
      await contaAprovadaService.findByDataAndBlocoId(context, firstDay, condominioId, blocoId):
      await contaAprovadaService.findByDataAndCondominioId(context, firstDay, condominioId);
    
      console.log('Bloco Id: ', blocoId, contaAprovada && contaAprovada.dataValues);
    if (contaAprovada) {
      throw new InternalError('lancamento_conta_error', { message: 'Não é possível criar ou modificar lançamentos em uma conta já aprovada' });
    }
  }

  async update(context, id, values) {
    let rateio = await this.model.findById(id);
    let { condominioId } = rateio;
    let membership = _.find(context.memberships, { condominioId });

    const rateioBlocos = await RateioBloco.findAll({
      where: {
        id,
        condominioId,
        status: 'pendente'
      }
    });
    if(membership.role === 'subsindico') {
      let canRelease = true;
      for(let i=0; i < rateioBlocos.length; i++) {
        if(rateioBlocos[i].blocoId !== membership.blocoId) {
          canRelease = false;
        }
      }
      if(!canRelease) {
        throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
      }
    }

    return await rateio.update(values);
  }

  async destroy(context, id) {
    let rateio = await Rateio.findById(id);
    let { condominioId } = rateio;
    let membership = _.find(context.memberships, { condominioId });

    const rateioBlocos = await RateioBloco.findAll({
      where: {
        id,
        condominioId,
        status: 'pendente'
      }
    });
    if(membership.role === 'subsindico') {
      let canRelease = true;
      for(let i=0; i < rateioBlocos.length; i++) {
        if(rateioBlocos[i].blocoId !== membership.blocoId) {
          canRelease = false;
        }
      }
      if(!canRelease) {
        throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
      }
    }

    let rateiosBloco = await RateioBloco.findAll({where: { rateioId: id }});
    for(let i=0; i < rateiosBloco.length; i++) {
      var rateioBloco = rateiosBloco[i];
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
    await rateio.destroy();
    return id;
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    await this.assertSindicoOrSubsindicoPermission(context, condominioId);
    await this.assertNotContaAprovada(context, entity.competencia, condominioId, entity.blocoId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    let rateio = this.model.findById(id);
    await this.assertSindicoOrSubsindicoPermission(context, condominioId);
    await this.assertNotContaAprovada(context, rateio.competencia, condominioId, rateio.blocoId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    // await this.assertSindicoPermission(context, condominioId);
    await this.assertSindicoOrSubsindicoPermission(context, condominioId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new RateioService();
