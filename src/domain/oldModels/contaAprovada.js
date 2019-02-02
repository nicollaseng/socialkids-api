module.exports = (sequelize, DataTypes) => {
  const ContaAprovada = sequelize.define('ContaAprovada', {
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
    status: {
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    blocoId: {
      type: DataTypes.UUID
    },
    condominioId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    freezeTableName: true,
    tableName: 'ContasAprovadas'
  });

  return ContaAprovada;
};
