module.exports = (sequelize, DataTypes) => {
  const LeituraAgua = sequelize.define('LeituraAgua', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    leituraAnterior: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    leituraAtual: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    valorConsumido: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    picture: {
      type: DataTypes.STRING
    },
    referencia: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    contatoId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    rateioBlocoId: {
      type: DataTypes.UUID
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    }
  });

  return LeituraAgua;
};
