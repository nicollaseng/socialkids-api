const winston = require('winston');

const { InternalError } = require('../../errors/internal');
const BaseService = require('../base');
const emailService = require('../email');
const {
  hasBoleto, hasRemessa, maskAccount, getLabelConvenioBoleto, getLabelConvenioRemessa
} = require('../util');

const {
  Bloco,
  Categoria,
  Condominio,
  Conta,
  User
} = require('../../domain');

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

const categorias = [
  {
    name: 'Pessoal/Prestadores',
    tipo: 'despesa',
    order: 1,
    subcategorias: [
      {
        name: 'Salário',
        order: 1
      },
      {
        name: 'Adiantamento',
        order: 2
      },
      {
        name: 'INSS',
        order: 3
      },
      {
        name: 'FGTS',
        order: 4
      },
      {
        name: 'PIS',
        order: 5
      },
      {
        name: 'ISS',
        order: 6
      },
      {
        name: 'Vale Refeição',
        order: 7
      },
      {
        name: 'Outras Despesas com Pessoal',
        order: 8
      }
    ]
  },
  {
    name: 'Consumo',
    tipo: 'despesa',
    order: 2,
    subcategorias: [
      {
        name: 'Água e Esgoto',
        order: 1
      },
      {
        name: 'Luz',
        order: 2
      },
      {
        name: 'Gás',
        order: 3
      },
      {
        name: 'Outros Consumos',
        order: 4
      }
    ]
  },
  {
    name: 'Manutenção e Conservação',
    tipo: 'despesa',
    order: 3,
    subcategorias: [
      {
        name: 'Bombas',
        order: 1
      },
      {
        name: 'Portões e Interfones',
        order: 2
      },
      {
        name: 'Jardinagem',
        order: 3
      },
      {
        name: 'Outras Manutenções',
        order: 4
      }
    ]
  },
  {
    name: 'Material de Consumo',
    tipo: 'despesa',
    order: 4,
    subcategorias: [
      {
        name: 'Material de Limpeza',
        order: 1
      },
      {
        name: 'Outros Materiais',
        order: 2
      }
    ]
  },
  {
    name: 'Despesas Diversas',
    tipo: 'despesa',
    order: 5,
    subcategorias: [
      {
        name: 'Despesas com Administração',
        order: 1
      },
      {
        name: 'Despesas Bancárias',
        order: 2
      },
      {
        name: 'Outras Despesas',
        order: 3
      }]
  },
  {
    name: 'Cotas Condominiais',
    tipo: 'receita',
    order: 1,
    subcategorias: [
      {
        name: 'Condomínio',
        order: 1
      },
      {
        name: 'Condomínio Atrasado',
        order: 2
      },
      {
        name: 'Multa por Atraso',
        order: 3
      },
      {
        name: 'Rateio Extra',
        order: 4
      },
      {
        name: 'Obras e Melhorias',
        order: 5
      },
      {
        name: 'Outras Receitas',
        order: 6
      }
    ]
  }
];

const buildSubcategoriasArray = (subcategorias, categoria) => (
  subcategorias.map(subcategoria => ({
    name: subcategoria.name,
    tipo: categoria.tipo,
    order: subcategoria.order,
    condominioId: categoria.condominioId,
    parentId: categoria.id
  }))
);

const buildBlocosArray = (blocos, condominioId) => (
  blocos.map(bloco => ({
    name: bloco.name,
    quantidadeUnidades: bloco.quantidadeUnidades,
    condominioId
  }))
);

class CondominioService extends BaseService {
  constructor() {
    super({
      model: Condominio,
      excludeFromCreateType: ['codigo']
    });
  }

  async create(context, values) {
    await this.assertCreatePermission(context, values);
    let newContas = [];
    const { name, banco, carteira, convenio, agencia, conta } = values;

    const { sequelize } = this.model;

    try {
      return sequelize.transaction(async (transaction) => {
        const condominio = await Condominio.create(values, {
          userId: context.user ? context.user.id : undefined,
          transaction
        });
        const { enderecoLogradouro: rua, enderecoNumero: num, enderecoBairro: bairro,
          enderecoLocalidade: cidade, enderecoEstado: estado, enderecoCep: cep, cnpj, numeroBoleto, numeroConvenio
        } = condominio;
        const hasConRemessa = hasRemessa(banco);
        const hasConBoleto = hasBoleto(banco);
        if(condominio && banco && carteira && agencia && conta && cnpj && cep &&
          (!hasConRemessa || (hasConRemessa && convenio)) && (!hasConBoleto || (hasConBoleto && numeroConvenio)) ) {
          var i = 0, j = 0;
          var maskCep = cep ? 'xxxxx-xxx'.replace(/x/g, _ => cep[i++]) : '';
          var endereco = [rua, num, bairro, cidade].filter(e => e !== null && e !== '').join(', ');
          if(estado) {
            endereco += ' - ' + estado;
            if(maskCep) endereco += ', ' + maskCep;
          } else if(maskCep) {
            endereco += ' - ' + maskCep;
          }
          var maskedCnpj = '##.###.###/####-##'.replace(/#/g, _ => cnpj[j++]);
          const subject = `O síndico do Condomínio ${condominio.codigo} - ${name} cadastrou os dados de boleto.`;
          const template = 'message-boleto-data';
          const templateContext = {
            name: 'Administrador',
            condominio: name,
            cnpj: maskedCnpj,
            enderecoCep: endereco,
            conta: conta,
            agencia: agencia,
            convenioLabel: getLabelConvenioBoleto(banco),
            remessaLabel: getLabelConvenioRemessa(banco),
            displayCon: numeroConvenio != null && numeroConvenio != '' ? '' : 'display: none',
            displayRem: convenio != null && convenio != '' ? '' : 'display: none',
            numeroBoleto: (numeroBoleto || '1'),
            banco, carteira, convenio, numeroConvenio
          };
          const to = 'contato@smartsindico.com.br';
          emailService.sendEmail(to, subject, template, templateContext);
        }

        if(values.blocos && condominio.id) {
          for(let i=0; i < contas.length; i++) {
            let conta = contas[i];
            newContas.push({ ...conta, blocoId: null });
          }
          for(let j=0; j < values.blocos.length; j++) {
            let bloco = values.blocos[j];
            let newBloco = await Bloco.create({
                name: bloco.name,
                quantidadeUnidades: bloco.quantidadeUnidades,
                condominioId: condominio.id
              }, {
                userId: context.user ? context.user.id : undefined,
                transaction
            });
            for(let i=0; i < contas.length; i++) {
              let conta = contas[i];
              newContas.push({ ...conta, blocoId: newBloco.id });
            }
          }
        }

        const contasPadrao = newContas.length > 0 ?
          newContas.map(conta => ({
            name: conta.name,
            identifier: conta.identifier,
            condominioId: condominio.id,
            order: conta.order,
            blocoId: conta.blocoId,
          })) :
          contas.map(conta => ({
            name: conta.name,
            identifier: conta.identifier,
            condominioId: condominio.id,
            order: conta.order
          }));

        await Conta.bulkCreate(contasPadrao, {
          individualHooks: true,
          userId: context.user ? context.user.id : undefined,
          transaction
        });

        const promises = categorias.map(categoria => (
          Categoria.create({
            name: categoria.name,
            tipo: categoria.tipo,
            order: categoria.order,
            condominioId: condominio.id
          }, {
            userId: context.user ? context.user.id : undefined,
            transaction
          }).then(newCategoria => (
            Categoria.bulkCreate(buildSubcategoriasArray(
              categoria.subcategorias,
              newCategoria
            ), {
              individualHooks: true,
              userId: context.user ? context.user.id : undefined,
              transaction
            })
          ))
        ));

        // if (values.blocos) {
        //   promises.push(Bloco.bulkCreate(buildBlocosArray(
        //     values.blocos,
        //     condominio.id
        //   ), {
        //     individualHooks: true,
        //     userId: context.user ? context.user.id : undefined,
        //     transaction
        //   }));
        // }

        await Promise.all(promises);

        return condominio;
      });
    } catch (err) {
      winston.error('Error creating Condomínio:', err);
      throw err;
    }
  }

  async update(context, id, values) {
    const { banco, carteira, convenio, agencia, conta, numeroBoleto, numeroConvenio, cnpj: newCnpj } = values;
    const entity = await this.findById(context, id);

    if (!entity) {
      winston.error(`Error during update: ${this.name} not found`);
      throw new InternalError('entity_not_found', { message: 'Entidade não encontrada' });
    }

    await this.assertUpdatePermission(context, id, entity);
    const { enderecoLogradouro: rua, enderecoNumero: num, enderecoBairro: bairro,
      enderecoLocalidade: cidade, enderecoEstado: estado, enderecoCep: cep, cnpj, idCarteira
    } = values;
    const hasConRemessa = hasRemessa(banco);
    const hasConBoleto = hasBoleto(banco);
    if(banco && carteira && agencia && conta && (cnpj || newCnpj) && cep &&
        (!hasConRemessa || (hasConRemessa && convenio)) && (!hasConBoleto || (hasConBoleto && numeroConvenio))) {
      var i = 0, j = 0;
      var maskCep = cep ? 'xxxxx-xxx'.replace(/x/g, _ => cep[i++]) : '';
      var endereco = [rua, num, bairro, cidade].filter(e => e !== null && e !== '').join(', ');
      if(estado) {
        endereco += ' - ' + estado;
        if(maskCep) endereco += ', ' + maskCep;
      } else if(maskCep) {
        endereco += ' - ' + maskCep;
      }
      var usedCnpj = newCnpj ? newCnpj : cnpj;
      var maskedCnpj = '##.###.###/####-##'.replace(/#/g, _ => usedCnpj[j++]);
      const subject = `O síndico do Condomínio ${entity.codigo} - ${entity.name} alterou os dados de boleto.`;
      const template = 'message-boleto-data';
      const templateContext = {
        name: 'Administrador',
        condominio: entity.name,
        cnpj: maskedCnpj,
        enderecoCep: endereco,
        conta: conta,
        agencia: agencia,
        convenioLabel: getLabelConvenioBoleto(banco),
        remessaLabel: getLabelConvenioRemessa(banco),
        displayCon: numeroConvenio != null && numeroConvenio != '' ? '' : 'display: none',
        displayRem: convenio != null && convenio != '' ? '' : 'display: none',
        numeroBoleto: (numeroBoleto || '1'),
        banco, carteira, convenio, numeroConvenio,
      };
      const to = 'contato@smartsindico.com.br';
      emailService.sendEmail(to, subject, template, templateContext);
    }

    const update = await entity.update(values);
    return update;
  }

  // Permissão para criação: Usuário autenticado

  // Permissão para atualização: Síndico
  async assertUpdatePermission(context, id, entity) {
    if(this.isAdminContext(context)) return true;
    await this.assertSindicoPermission(context, id);
  }

  // Permissão para apagar: Ninguém
  async assertDestroyPermission(context, id) {
    throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
  }

  // Permissão para leitura: Usuário autenticado (herdada de `BaseService`)

  // Permissão para leitura de lista: Ninguém
  async assertReadListPermission(context) {
    if(this.isAdminContext(context)) return true;
    throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
  }
}

module.exports = new CondominioService();
