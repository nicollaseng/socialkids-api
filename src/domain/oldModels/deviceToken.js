module.exports = (sequelize, DataTypes) => {
  const DeviceToken = sequelize.define('DeviceToken', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    token: {
      allowNull: false,
      type: DataTypes.STRING
    },
    userId: {
      allowNull: false,
      type: DataTypes.UUID
    }
  });

  return DeviceToken;
};
