const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');
const fetch = require('node-fetch');

const { InternalError } = require('../../errors/internal');
const BaseTenantService = require('../baseTenant');
const contaAprovadaService = require('../contaAprovada');
const createReciboURL = `${process.env.API_RECIBO}/createrecibo`;

const {
  Bloco,
  Categoria,
  Conta,
  Contato,
  Condominio,
  User,
  Membership,
  Lancamento
} = require('../../domain');

class LancamentoService extends BaseTenantService {
  constructor() {
    super({
      model: Lancamento
    });
  }

  findById(context, id) {
    return Lancamento.find({
      where: {
        id
      }
    });
  }

  createRecibos(bodyData) {
    console.log('Body and URL', createReciboURL, bodyData);
    try {
      const body = JSON.stringify(bodyData);
      fetch(createReciboURL, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(data => {
        console.log('Response API Recibos! ' , data);
      }).catch(err => {
        console.log('Deu error! ', err);
      });
    } catch(err) {
      console.log('Error IN fetch or Stringify ', err);
    }
    return;
  }

  async create(context, values) {
    // console.log('Lancamento creation: ', values);
    await this.assertNotContaAprovada(context, values.data, values.condominioId, values.blocoId, values.contaId);

    const conta = await Conta.findById(values.contaId);

    if (conta) {
      this.validateDataLancamento(values.data, conta.saldoInicialData);
    }

    return super.create(context, values);
  }

  async update(context, id, values) {
    const lancamento = await Lancamento.findById(id, {
      include: [{
        model: Conta,
        as: 'conta'
      }]
    });

    if (!lancamento) {
      winston.error(`Error during update: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }
    if(lancamento && lancamento.data) {
      await this.assertNotContaAprovada(context, lancamento.data, lancamento.condominioId, lancamento.blocoId, lancamento.contaId);
    }

    // Updating only `data` field
    if (!values.contaId && values.data) {
      this.validateDataLancamento(values.data, lancamento.conta.saldoInicialData);
    }

    if(!lancamento.reciboEnviado && values.reciboEnviado) {
      const { contatoId, data } = lancamento;
      const dataInfo = values.data ? values.data : data;
      const start = moment(dataInfo).startOf('month').format('YYYY-MM-DD');
      const end = moment(dataInfo).endOf('month').format('YYYY-MM-DD');

      const contato = await Contato.findById(contatoId);
      const { unidade, condominioId, blocoId } = contato;

      const membership = await Membership.find({
        where: { blocoId, condominioId, unidade },
        include: [
          { model: User, as: 'user'},
          { model: Condominio, as: 'condominio'},
          { model: Bloco, as: 'bloco'},
        ]
      });
      var user = null, bloco = null, condominio = null;
      if(membership) {
        user = membership.user;
        bloco = membership.bloco;
        condominio = membership.condominio;
      } else {
        bloco = await Bloco.find({
          where: { id: blocoId, condominioId },
          include: [{ model: Condominio, as: 'condominio'}]
        });
        condominio = bloco.condominio;
      }

      const contas = await Lancamento.findAll({
        where: { tipo: 'credito', condominioId, contatoId, data: { gte: start, lte: end } }
      });

      var contasEnviadas = await this.updateContas(context, contas, false, true);
      if(membership && contasEnviadas.length > 0) {
        let userInfo = { user, bloco, condominio, contas: contasEnviadas, unidade };
        this.createRecibos({ users: [userInfo], sindicoName: context.user.name });
      } else {
        let userInfo = { user: null, bloco, condominio, contas: contasEnviadas, unidade };
        this.createRecibos({ users: [userInfo], sindicoName: context.user.name });
      }
    }
    // Updating `contaId` field
    if (values.contaId) {
      const conta = await Conta.findById(values.contaId);

      if (conta) {
        this.validateDataLancamento(
          // Updating `data` or only `contaId`
          values.data ? values.data : lancamento.data,
          conta.saldoInicialData
        );
      }
    }

    return super.update(context, id, values);
  }

  async destroy(context, id) {
    const lancamento = await this.model.findById(id);

    if (!lancamento) {
      winston.error(`Error during destroy: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }

    await this.assertNotContaAprovada(context, lancamento.data, lancamento.condominioId, lancamento.blocoId, lancamento.contaId);

    return super.destroy(context, id);
  }

  async updateContas(context, contas, quitar = false, sendRecibo = false) {
    let contasNaoPagas = contas.filter(e => !e.pago);
    let contasImprimir = contasNaoPagas.length > 0 ? contasNaoPagas : contas;
    for(let i=0; i < contasImprimir.length; i++) {
      var conta = contasImprimir[i];
      // conta.pago = false;
      if(quitar) conta.pago = true;
      if(sendRecibo) conta.reciboEnviado = true;
      await super.update(context, conta.id, {pago: conta.pago, reciboEnviado: conta.reciboEnviado});
    }
    // console.log("Contas quitadas! ", contasImprimir);
    return sendRecibo ? contasImprimir.filter(e => e.reciboEnviado) : contasImprimir;
  }

  async quitaLancamentosSendRecibo(context, values) {
    const { isQuitacao, isSendAll, condominioId, quitar, todos, start, end, email } = values;
    await this.assertSindicoPermission(context, condominioId);
    if(todos) {
      let allUsers = [];
      var contatosUnidades = [];
      var allContatos = await Contato.findAll({
        where: { condominioId },
        include: [
          { model: Condominio, as: 'condominio'},
          { model: Bloco, as: 'bloco'},
        ]
      });

      for(let j=0; j < allContatos.length; j++) {
        var contato = allContatos[j];
        var { condominio, bloco, unidade, blocoId } = contato;
        var membership = await Membership.find({
          where: { blocoId, unidade, condominioId },
          include: [{ model: User, as: 'user'}]
        });
        var user = membership ? membership.user : null;
        if(bloco && unidade) {
          contatosUnidades.push({condominio, bloco, contatoId: contato.id, user, unidade});
        }
      }

      for(let i = 0; i < contatosUnidades.length; i++) {
        var contato = contatosUnidades[i];
        var { user, condominio, bloco, unidade, contatoId } = contato;
        var contas = await Lancamento.findAll({
          where: {
            tipo: 'credito',
            condominioId,
            contatoId,
            data: { gte: start, lt: end }
          }
        });
        var shouldSendRecibo = isSendAll || user == null ? false : true;
        var contasEnviadas = await this.updateContas(context, contas, quitar, shouldSendRecibo);
        allUsers.push({user, bloco, condominio, contas: contasEnviadas, unidade })
      }

      if(isSendAll) {
        let allUsersWithContas = allUsers.filter((user) =>  user.contas && user.contas.length > 0);
        let body = { sindico: context.user, users: allUsersWithContas, condominioId, email, method: 'all' };
        this.createRecibos(body);
      } else {
        this.createRecibos({ users: allUsers, sindicoName: context.user.name, email });
        return { users: [condominioId] };
      }
    } else {
      const { unidade, blocoId, lancamentos } = values;
      const contas = await Lancamento.findAll({
        where: { id: { $in: lancamentos } }
      });
      const membership = await Membership.find({
        where: { blocoId, unidade, condominioId },
        include: [
          { model: User, as: 'user'},
          { model: Condominio, as: 'condominio'},
          { model: Bloco, as: 'bloco'},
        ]
      });

      const { user, condominio, bloco } = membership;
      const contasEnviadas = await this.updateContas(context, contas, (quitar || isQuitacao), !isQuitacao);
      if(contasEnviadas.length > 0 && !isQuitacao) {
        let userInfo = { user, bloco, condominio, contas: contasEnviadas, unidade };
        this.createRecibos({ users: [userInfo], sindicoName: context.user.name, email });
      }
    }
    return { users: [condominioId] };
  }

  async quitaLancamentosDevedores(context, values) {
    const { totalValue, paidValue, paidIn, dates, contatoId, description } = values;

    if(!paidValue || paidValue <= 0) {
      throw new InternalError('quita_lancamentos_devedores_error', { message: 'Valor pago obrigatório' });
    }
    if(!paidIn || paidIn === '') {
      throw new InternalError('quita_lancamentos_devedores_error', { message: 'Data de pagamento obrigatória' });
    }

    const contato = await Contato.findById(contatoId);
    const { condominioId } = contato;
    const conta = await Conta.find({ where: { identifier: 'ordinaria', condominioId } });
    const categoria = await Categoria.find({ where: { name: 'Multa por Atraso', condominioId }});
    let updateResponse = false;

    if(paidValue > totalValue) {
      let addValue = paidValue - totalValue;
      await this.model.create({
        data: paidIn,
        valor: addValue,
        descricao: 'Acréscimos',
        pago: true,
        tipo: 'credito',
        notas: description,
        contaId: conta.id,
        categoriaId: categoria.id,
        contatoId: contato.id,
        condominioId,
      });
    }

    for(let i in dates) {
      let date = dates[i];
      if(date && moment(date).isValid()) {
        updateResponse = await this.model.update({
            pago: true,
            notas: description,
          }, {
            where: {
              pago: false,
              tipo: 'credito',
              condominioId,
              data: date,
              contatoId,
            }
        });
      }
    }
    console.log('Update response: ', updateResponse, (updateResponse && updateResponse !== null && updateResponse.length > 0));
    return { result: (updateResponse && updateResponse !== null && updateResponse.length > 0) };
  }

  validateDataLancamento(dataLancamento, dataSaldoInicial) {
    if (dataSaldoInicial && moment(dataLancamento).isBefore(dataSaldoInicial)) {
      winston.error(`Error during create or update lancamento: Data de lançamento anterior ao saldo inicial da conta`);
      throw new InternalError('create_or_update_lancamento_error', { message: 'Data de lançamento anterior ao saldo inicial da conta' });
    }
  }

  async statusCotaAtualByBlocoIdAndUnidade(context, condominioId, lancamento, vencimento) {
    // FIXME: Permissão: Membro do condomínio e usuário do bloco e unidade
    await this.assertMembershipPermission(context, condominioId);

    const vencido = vencimento ? moment().isAfter(vencimento, 'day') : null;

    if (lancamento) {
      if (lancamento.pago) {
        return 'pago';
      }

      if (vencido) {
        return 'atrasado';
      }

      return 'a vencer';
    }

    // Status `indefinido` se não houver lançamento
    return 'indefinido';
  }

  // Permissão: Síndico
  totalInadimplentes(context, condominioId) {
    this.assertSindicoPermission(context, condominioId);

    const today = moment().format('YYYY-MM-DD');

    return Lancamento.sumBy({
      condominioId,
      pago: false,
      tipo: 'credito',
      data: {
        $lt: today
      }
    });
  }

  // Permissão: Síndico
  pagarHoje(context, condominioId) {
    this.assertSindicoPermission(context, condominioId);

    const today = moment().format('YYYY-MM-DD');

    return Lancamento.sumBy({
      condominioId,
      data: today,
      tipo: 'debito',
      pago: false
    });
  }

  // Permissão: Síndico
  async devedores(context, condominioId) {
    const today = moment().format('YYYY-MM-DD');

    const lancamentos = await Lancamento.findAll({
      where: {
        condominioId,
        pago: false,
        tipo: 'credito',
        data: {
          $lt: today
        }
      },
      include: [{
        model: Contato,
        as: 'contato',
        include: [{
          model: Bloco,
          as: 'bloco'
        }]
      }]
    });

    let contatosUnique = {};
    let memberships = [];
    let contatos = lancamentos.map(({ contato }) => contato);
    for(let i=0; i < contatos.length; i++) {
      let contato = contatos[i];
      let contatosEqual = contatos.filter((contatoB) => contato.id === contatoB.id);
      if(contatosEqual.length > 0) {
        let contatoUnique = contatosEqual[0];
        if(!contatosUnique.hasOwnProperty(contatoUnique.id)) {
          contatosUnique[contatoUnique.id] = contatoUnique;
          let member = await Membership.find({ where: {
            unidade: contatoUnique.unidade,
            blocoId: contatoUnique.bloco.id,
            condominioId
          }, include: [{ model: User, as: 'user' }] });
          if(member) {
            memberships.push({...member, contatoId: contatoUnique.id });
          }
        }
      }
    }

    return lancamentos.reduce((devedores, lancamento) => {
      const { data, valor, contato } = lancamento;

      const devedor = _.find(devedores, { contatoId: contato.id });
      const membership = _.find(memberships, { contatoId: contato.id });
      if (!devedor) {
        let userName = membership && membership.user ? membership.user.name : null;
        devedores.push({
          contatoId: contato.id,
          bloco: contato.bloco,
          unidade: contato.unidade,
          name: userName ? userName : contato.name,
          competencias: [{
            competencia: data,
            totalDevido: valor
          }]
        });
      } else {
        const devedorCompetencia =
          _.find(devedor.competencias, { competencia: data });

        if (!devedorCompetencia) {
          devedor.competencias.push({
            competencia: data,
            totalDevido: valor
          });
        } else {
          devedorCompetencia.totalDevido += valor;
        }
      }

      return devedores;
    }, []);
  }

  async assertNotContaAprovada(context, data, condominioId, blocoId, contaId) {
    const firstDay = moment(data).startOf('month').format('YYYY-MM-DD');
    let blocoFinalId = blocoId;
    if(contaId) {
      const conta = await Conta.findById(contaId);
      blocoFinalId = conta.blocoId;
    }
    const contaAprovada = blocoFinalId ?
      await contaAprovadaService.findByDataAndBlocoId(context, firstDay, condominioId, blocoFinalId) :
      await contaAprovadaService.findByDataAndCondominioId(context, firstDay, condominioId);
    console.log('Bloco Id: ', blocoFinalId, contaAprovada && contaAprovada.dataValues);

    if (contaAprovada) {
      throw new InternalError('lancamento_conta_error', { message: 'Não é possível criar ou modificar lançamentos em uma conta já aprovada' });
    }
  }

  // Permissão para criação: Síndico
  async assertCreatePermission(context, entity, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity, condominioId) {
    if(context && context.shouldPass)
      return;
    else
      await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para apagar: Síndico
  async assertDestroyPermission(context, id, condominioId) {
    await this.assertSindicoPermission(context, condominioId);
  }

  // Permissão para leitura: Membro do condomínio (herdada de `BaseTenantService`)

  // Permissão para leitura de lista: Membro do condomínio (herdada de `BaseTenantService`)
}

module.exports = new LancamentoService();
