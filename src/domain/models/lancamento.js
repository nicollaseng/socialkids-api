module.exports = (sequelize, DataTypes) => {
  const Lancamento = sequelize.define('Lancamento', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    descricao: {
      type: DataTypes.STRING,
      allowNull: false
    },
    valor: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pago: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reciboEnviado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    boletoEmitido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tipo: {
      type: DataTypes.ENUM,
      values: ['debito', 'credito'],
      allowNull: false
    },
    notas: {
      type: DataTypes.STRING
    },
    categoriaId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    contaId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    contatoId: {
      type: DataTypes.UUID
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    rateioUnidadeId: {
      type: DataTypes.UUID
    },
    idBoleto: {
      type: DataTypes.UUID
    }
  });

  Lancamento.sumBy = async (where) => {
    const result = await Lancamento.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('valor')), 'total']
      ],
      where
    });

    return result.dataValues.total || 0;
  };

  return Lancamento;
};
