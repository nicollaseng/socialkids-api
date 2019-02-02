module.exports = (sequelize, DataTypes) => {
  const Rateio = sequelize.define('Rateio', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    competencia: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    totalAgua: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tipo: {
      type: DataTypes.ENUM,
      values: ['total', 'unidade', 'fracao'],
      defaultValue: 'total'
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    blocoId: {
      type: DataTypes.UUID,
    },
    isencaoPercentual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isencaoTipo: {
      type: DataTypes.ENUM,
      values: ['nenhuma', 'sindico', 'subsindico', 'sindicosubsindico'],
      defaultValue: 'nenhuma',
    },
  });

  return Rateio;
};
