module.exports = (sequelize, DataTypes) => {
  const Videoaula = sequelize.define('Videoaula', {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING(100)
    },
  });

  return Videoaula;
};
