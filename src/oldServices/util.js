const _ = require('lodash');

const applyCurrency = value => {
  value = value.toString();
  let intVal = value.slice(0, value.length-2);
  let decVal = value.slice(value.length-2);

  let len = intVal.length;
  let aux = '';
  for(var i = 0; i < len; i++ ) {
    if((len - i - 1) % 3 == 0 && i != len-1) aux += intVal[i] + '.';
    else aux += intVal[i];
  }

  aux = aux.length >= 1 ? aux : '0';

  return aux + ',' + decVal;
}


const extractFieldsFromFieldNodes = fieldNodes => (
  fieldNodes.map((fieldNode) => {
    const fieldArgs = fieldNode.arguments.map(argument => ({
      name: argument.name.value,
      value: argument.value.value || undefined,
      variable: argument.value.name ? argument.value.name.value : undefined
    }));

    return {
      name: fieldNode.name.value,
      args: fieldArgs
    };
  })
);

const extractFieldsFromFieldNodesByName = (fieldNodes, name) => (
  _.chain(fieldNodes)
    .filter(fieldNode => fieldNode.name.value === name)
    .map(fieldNode => fieldNode.selectionSet.selections.map((selection) => {
      const fieldArgs = selection.arguments.map(argument => ({
        name: argument.name.value,
        value: argument.value.value || undefined,
        variable: argument.value.name ? argument.value.name.value : undefined
      }));

      return {
        name: selection.name.value,
        alias: selection.alias ? selection.alias.value : undefined,
        args: fieldArgs
      };
    }))
    .flatten()
    .value()
);

const extractArgsFromField = (name, args, variables) => {
  const arg = _.find(args, { name });

  if (arg) {
    if (arg.value) {
      return arg.value;
    }

    if (arg.variable) {
      const value = variables[arg.variable];

      if (value) {
        return value;
      }
    }
  }

  return undefined;
};

const maskAccount = (value) => {
  try {
    if(typeof value === 'string' && value.length > 1) {
      return value.slice(0, value.length-1) + '-' + value.slice(value.length-1);
    }
  } catch(err) {
    return value;
  }
  return value;
}

const bancosList = [
  '001 - Banco do Brasil',
  '004 - Banco do Nordeste',
  '021 - Banestes',
  '033 - Santander',
  '041 - Banrisul',
  '070 - BRB',
  '104 - Caixa Econômica',
  '237 - Bradesco',
  '341 - Banco Itaú',
  '399 - HSBC',
  '422 - Banco Safra',
  '735 - Banco Neon',
  '745 - Banco Citibank',
  '748 - Sicredi',
];
const bancosHasConBoleto = [
  '001 - Banco do Brasil',
  '033 - Santander',
  '104 - Caixa Econômica',
];
const bancosHasConRemessa = [
  '001 - Banco do Brasil',
  '004 - Banco do Nordeste',
  '033 - Santander',
  '104 - Caixa Econômica',
  '237 - Bradesco',
];

const bancosMasks = {
  '001 - Banco do Brasil': {ag: '####-#', cc: '########-#'},
  '104 - Caixa Econômica': {ag: '####-#', cc: '#######-#'},
  '237 - Bradesco': {ag: '####-#', cc: '#######-#'},
  '341 - Banco Itaú': {ag: '####-#', cc: '#####-#'},
}

const bancosConvenioLabel = {
  '033 - Santander': 'Código do Beneficiário',
}

const bancosRemessaLabel = {
  '033 - Santander': 'Código de Transmissão',
  '237 - Bradesco': 'Código da Empresa',
}

const hasBoleto = (banco) => {
  return bancosHasConBoleto.indexOf(banco) > -1;
}

const hasRemessa = (banco) => {
  return bancosHasConRemessa.indexOf(banco) > -1;
}

const setMask = (value, mask) => {
  let i = 0;
  if (!value) {
    return '';
  }
  return mask.replace(/#/g, _ => (value[i++] || ''));
}

const createMaskAgency = (value, banco) => {
  let masks = bancosMasks[banco];
  if(masks && masks.ag) {
    return setMask(value, masks.ag);
  }
  return maskAccount(value);
}

const createMaskAccount = (value, banco) => {
  let masks = bancosMasks[banco];
  if(masks && masks.cc) {
    return setMask(value, masks.cc);
  }
  return maskAccount(value);
}


const getLabelConvenioBoleto = (banco) => {
  let label = 'Convênio de Boleto';
  let customLabel = bancosConvenioLabel[banco];
  return customLabel && customLabel.length > 0 ? customLabel : label;
}

const getLabelConvenioRemessa = (banco) => {
  let label = 'Convênio de Remessa';
  let customLabel = bancosRemessaLabel[banco];
  return customLabel && customLabel.length > 0 ? customLabel : label;
}

module.exports = {
  extractFieldsFromFieldNodes,
  extractFieldsFromFieldNodesByName,
  extractArgsFromField,
  applyCurrency,
  maskAccount,
  bancosList,
  bancosHasConBoleto,
  bancosHasConRemessa,
  bancosMasks,
  bancosConvenioLabel,
  bancosRemessaLabel,
  hasBoleto,
  hasRemessa,
  createMaskAgency,
  createMaskAccount,
  getLabelConvenioBoleto,
  getLabelConvenioRemessa,
};
