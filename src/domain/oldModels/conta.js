module.exports = (sequelize, DataTypes) => {
  const Conta = sequelize.define('Conta', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    saldoInicial: {
      type: DataTypes.INTEGER
    },
    saldoInicialData: {
      type: DataTypes.DATEONLY
    },
    saldoInicialEstado: {
      type: DataTypes.ENUM,
      values: ['positivo', 'negativo']
    },
    identifier: {
      type: DataTypes.ENUM,
      values: ['ordinaria', 'extraordinaria', 'reserva']
    },
    condominioId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    blocoId: {
      type: DataTypes.UUID,
    },
    order: {
      allowNull: true,
      type: DataTypes.INTEGER
    }
  }, {
    freezeTableName: true,
    tableName: 'Contas'
  });

  return Conta;
};
