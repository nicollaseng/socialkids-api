module.exports = (sequelize, DataTypes) => {
  const MessageRecipient = sequelize.define('MessageRecipient', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    membershipId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    condominioId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return MessageRecipient;
};
