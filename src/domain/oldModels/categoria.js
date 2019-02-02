module.exports = (sequelize, DataTypes) => {
  const Categoria = sequelize.define('Categoria', {
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
    tipo: {
      type: DataTypes.ENUM,
      values: ['receita', 'despesa'],
      allowNull: false
    },
    parentId: {
      type: DataTypes.UUID
    },
    condominioId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    order: {
      allowNull: true,
      type: DataTypes.INTEGER
    }
  }, {
    freezeTableName: true,
    tableName: 'Categorias'
  });

  return Categoria;
};
