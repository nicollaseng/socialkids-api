module.exports = (sequelize, DataTypes) => {
  const Revision = sequelize.define('Revision', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    document: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    diff: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    revision: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return Revision;
};
