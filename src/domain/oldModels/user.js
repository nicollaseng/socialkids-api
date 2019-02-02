const cpf = require('cpf_cnpj').CPF;
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: DataTypes.STRING(512),
    profile: {
      type: DataTypes.STRING
    },
    cpf: {
      type: DataTypes.STRING,
      // unique: {
      //   args: true,
      //   msg: 'CPF já registrado'
      // },
      validate: {
        // CPF validator
        isCpf(value) {
          if (!cpf.isValid(value)) {
            throw new Error('CPF inválido');
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: {
        args: true,
        msg: 'Endereço de e-mail já registrado'
      },
      validate: {
        isEmail: {
          args: true,
          msg: 'E-mail inválido'
        }
      }
    },
    phone: {
      type: DataTypes.STRING,
      unique: {
        args: true,
        msg: 'Telefone já registrado'
      },
      validate: {
        is: {
          args: /^(\+)[0-9]{0,13}$/,
          msg: 'Telefone inválido'
        }
      }
    },
    salt: DataTypes.STRING,
    password: {
      type: DataTypes.STRING(1024),
      validate: {
        notEmpty: {
          args: true,
          msg: 'Senha inválida'
        }
      }
    },
    status: {
      type: DataTypes.ENUM,
      values: ['invited', 'active', 'pending', 'inactive', 'deleted'],
      defaultValue: 'active'
    },
    resetPasswordToken: {
      type: DataTypes.STRING
    },
    resetPasswordExpiresAt: {
      type: DataTypes.DATE
    },
    facebookId: {
      type: DataTypes.STRING,
      unique: {
        args: true,
        msg: 'FacebookId já registrado'
      }
    },
    facebookToken: {
      type: DataTypes.STRING,
      unique: {
        args: true,
        msg: 'FacebookToken já registrado'
      }
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  });

  User.beforeCreate((user, options) => {
    if (user.password) {
      user.updatePassword();
    }
  });

  User.beforeUpdate((user, options) => {
    if (user.changed('password')) {
      user.updatePassword();
    }
  });

  User.prototype.updatePassword = function updatePassword() {
    this.salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(this.password, this.salt, 10000, 512, 'sha512').toString('hex');
    this.password = hashedPassword;
  };

  User.prototype.verifyPassword = function verifyPassword(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.password === hash;
  };

  return User;
};
