module.exports = (sequelize, DataTypes) => {
  const Contato = sequelize.define('Contato', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING
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
    tipo: {
      type: DataTypes.ENUM,
      values: ['externo', 'morador'],
      allowNull: false,
      defaultValue: 'externo'
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    blocoId: {
      type: DataTypes.UUID
    },
    fraction: {
      type: DataTypes.STRING(30)
    }
  });

  return Contato;
};
