module.exports = (sequelize, DataTypes) => {
  const RateioUnidade = sequelize.define('RateioUnidade', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    valorAgua: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM,
      values: ['pendente', 'lancado', 'cancelado'],
      defaultValue: 'pendente'
    },
    rateioBlocoId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    contatoId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    }
  });

  return RateioUnidade;
};
