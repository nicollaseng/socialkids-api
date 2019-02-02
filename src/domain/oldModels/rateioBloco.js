module.exports = (sequelize, DataTypes) => {
  const RateioBloco = sequelize.define('RateioBloco', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    valorOrdinaria: {
      type: DataTypes.INTEGER
    },
    valorExtraordinaria: {
      type: DataTypes.INTEGER
    },
    valorFundoReserva: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM,
      values: ['pendente', 'lancado', 'cancelado'],
      defaultValue: 'pendente'
    },
    blocoId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    rateioId: {
      allowNull: false,
      type: DataTypes.UUID
    }
  });

  return RateioBloco;
};
