module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    action: {
      allowNull: false,
      type: DataTypes.ENUM,
      values: ['login', 'logout'],
      defaultValue: 'login'
    },
    origin: {
      allowNull: false,
      type: DataTypes.ENUM,
      values: ['mobile', 'web'],
      defaultValue: 'mobile'
    },
    timestamp: {
      allowNull: false,
      type: DataTypes.DATE
    },
    userId: {
      allowNull: false,
      type: DataTypes.UUID,
    },
  });

  return Log;
};
