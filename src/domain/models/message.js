module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false
    },
    assunto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mensagem: {
      type: DataTypes.STRING,
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

  return Message;
};
