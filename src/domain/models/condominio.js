const cnpj = require('cpf_cnpj').CNPJ;

module.exports = (sequelize, DataTypes) => {
  const Condominio = sequelize.define('Condominio', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    idCarteira: {
      type: DataTypes.INTEGER,
      defaultValue: null
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cnpj: {
      type: DataTypes.STRING,
      validate: {
        // CNPJ validator
        isCnpj(value) {
          if (!cnpj.isValid(value)) {
            throw new Error('CNPJ inválido');
          }
        }
      }
    },
    quantidadeBlocos: {
      type: DataTypes.INTEGER
    },
    quantidadeUnidades: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    vencimentoCota: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    showDevedores: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    showPrestacao: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // Address
    enderecoCep: {
      type: DataTypes.STRING,
      validate: {
        isNumeric: {
          args: true,
          msg: 'CEP inválido'
        }
      }
    },
    enderecoLogradouro: {
      type: DataTypes.STRING,
      allowNull: false
    },
    enderecoNumero: {
      type: DataTypes.STRING,
      allowNull: false
    },
    enderecoBairro: {
      type: DataTypes.STRING
    },
    enderecoLocalidade: {
      type: DataTypes.STRING,
      allowNull: false
    },
    enderecoEstado: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    },

    //Boleto
    banco: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    carteira: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    convenio: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    numeroConvenio: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    numeroBoleto: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    agencia: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    conta: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    // Code
    codigo: {
      type: DataTypes.INTEGER,
      autoIncrement: true
    },
    hasFraction: {
      type: DataTypes.BOOLEAN
    },
    cdhu: {
      type: DataTypes.STRING(100)
    }
  });

  return Condominio;
};
