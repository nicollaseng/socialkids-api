module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define('Membership', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    role: {
      type: DataTypes.ENUM,
      values: ['sindico', 'subsindico', 'morador'],
      defaultValue: 'morador'
    },
    status: {
      type: DataTypes.ENUM,
      values: ['active', 'pending', 'inactive', 'deleted'],
      defaultValue: 'pending'
    },
    unidade: {
      type: DataTypes.STRING(5),
      validate: {
        len: {
          args: [0, 5],
          msg: 'Unidade só pode conter até 5 caracteres',
        }
      }
    },
    userId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    blocoId: {
      type: DataTypes.UUID
    }
  });

  return Membership;
};
