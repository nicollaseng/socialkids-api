module.exports = (sequelize, DataTypes) => {
  const Bloco = sequelize.define('Bloco', {
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
    quantidadeUnidades: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    condominioId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return Bloco;
};
