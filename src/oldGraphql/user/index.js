const _ = require('lodash');
const { attributeFields, resolver } = require('graphql-sequelize');
const { mutationWithClientMutationId } = require('graphql-relay');
const winston = require('winston');

const {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const { InternalError } = require('../../errors/internal');
const BaseGraphQLService = require('../base');
const blocoService = require('../../services/bloco');
const condominioService = require('../../services/condominio');
const contatoService = require('../../services/contato');
const membershipService = require('../../services/membership');
const userService = require('../../services/user');

class UserGraphQLService extends BaseGraphQLService {
  constructor(fieldsCache) {
    super({
      fieldsCache,
      service: userService
    });
  }

  // Override getType to add `memberships`
  getType() {
    const Bloco = blocoService.getModel();
    const Condominio = condominioService.getModel();
    const Membership = membershipService.getModel();

    return new GraphQLObjectType({
      name: this.name,
      fields: _.assign(attributeFields(this.model, {
        cache: this.fieldsCache,
        exclude: userService.getExcludeFromType()
      }), {
        memberships: {
          type: new GraphQLList(new GraphQLObjectType({
            name: 'UserMembership',
            fields: _.assign(attributeFields(Membership, {
              cache: this.fieldsCache
            }), {
              condominio: {
                type: new GraphQLObjectType({
                  name: 'UserMembershipCondominio',
                  fields: attributeFields(Condominio, {
                    cache: this.fieldsCache
                  })
                }),
                resolve: resolver(Membership.Condominio)
              },
              bloco: {
                type: new GraphQLObjectType({
                  name: 'UserMembershipBloco',
                  fields: attributeFields(Bloco, {
                    cache: this.fieldsCache
                  })
                }),
                resolve: resolver(Membership.Bloco)
              }
            })
          })),
          resolve: resolver(this.model.Memberships)
        }
      })
    });
  }

  authenticateUserMutation() {
    return mutationWithClientMutationId({
      name: 'AuthenticateUser',
      inputFields: {
        authenticate: {
          type: new GraphQLInputObjectType({
            name: 'AuthenticateUser',
            fields: {
              user: {
                type: GraphQLString
              },
              password: {
                type: GraphQLString
              },
              refreshToken: {
                type: GraphQLString
              },
              facebookToken: {
                type: GraphQLString
              },
              type: {
                type: new GraphQLNonNull(new GraphQLEnumType({
                  name: 'AuthenticationType',
                  values: {
                    password: { value: 'password' },
                    facebook: { value: 'facebook' },
                    refresh_token: { value: 'refresh_token' }
                  }
                }))
              }
            }
          })
        }
      },
      outputFields: {
        authentication: {
          type: new GraphQLObjectType({
            name: 'Authentication',
            fields: {
              accessToken: {
                type: new GraphQLNonNull(GraphQLString)
              },
              refreshToken: {
                type: new GraphQLNonNull(GraphQLString)
              },
              fbPicture: {
                type: GraphQLString
              }
            }
          }),
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: async (object, context, info) => {
        const { authenticate } = object;

        try {
          return this.service.authenticate(context, authenticate);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Authentication error:', err);
          throw new InternalError('authentication_error', err);
        }
      }
    });
  }

  inviteUserMutation() {
    const User = userService.getModel();
    const Membership = membershipService.getModel();
    const Contato = contatoService.getModel();

    return mutationWithClientMutationId({
      name: 'Invite',
      inputFields: {
        invite: {
          type: new GraphQLInputObjectType({
            name: 'Invite',
            fields: {
              name: {
                type: new GraphQLNonNull(GraphQLString)
              },
              email: {
                type: GraphQLString
              },
              phone: {
                type: GraphQLString
              },
              cpf: {
                type: GraphQLString
              },
              condominioId: {
                type: new GraphQLNonNull(GraphQLString)
              },
              blocoId: {
                type: new GraphQLNonNull(GraphQLString)
              },
              unidade: {
                type: new GraphQLNonNull(GraphQLString)
              },
              role: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        user: {
          type: new GraphQLObjectType({
            name: 'InviteUser',
            fields: attributeFields(User, {
              cache: this.fieldsCache,
              exclude: userService.getExcludeFromType()
            })
          }),
          resolve: payload => payload.user
        },
        membership: {
          type: new GraphQLObjectType({
            name: 'InviteMembership',
            fields: attributeFields(Membership, {
              cache: this.fieldsCache
            })
          }),
          resolve: payload => payload.membership
        },
        contato: {
          type: new GraphQLObjectType({
            name: 'InviteContato',
            fields: attributeFields(Contato, {
              cache: this.fieldsCache
            })
          }),
          resolve: payload => payload.contato
        }
      },
      mutateAndGetPayload: (object, context, info) => {
        try {
          const { invite } = object;

          return this.service.invite(context, invite);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Invite error:', err);
          throw new InternalError('invite_error', err);
        }
      }
    });
  }

  forgotPasswordMutation() {
    return mutationWithClientMutationId({
      name: 'ForgotPassword',
      inputFields: {
        forgot: {
          type: new GraphQLInputObjectType({
            name: 'ForgotPassword',
            fields: {
              user: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        user: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: payload => payload.user
        }
      },
      mutateAndGetPayload: async (object, context, info) => {
        const { forgot } = object;
        const { user } = forgot;

        await this.service.forgotPassword(context, forgot);

        return {
          user
        };
      }
    });
  }

  resetPasswordMutation() {
    return mutationWithClientMutationId({
      name: 'ResetPassword',
      inputFields: {
        reset: {
          type: new GraphQLInputObjectType({
            name: 'ResetPassword',
            fields: {
              user: {
                type: new GraphQLNonNull(GraphQLString)
              },
              password: {
                type: new GraphQLNonNull(GraphQLString)
              },
              token: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        user: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: payload => payload.user
        }
      },
      mutateAndGetPayload: async (object, context, info) => {
        const { reset } = object;
        const { user } = reset;

        await this.service.resetPassword(context, reset);

        return {
          user
        };
      }
    });
  }

  changePasswordMutation() {
    return mutationWithClientMutationId({
      name: 'ChangePassword',
      inputFields: {
        change: {
          type: new GraphQLInputObjectType({
            name: 'ChangePassword',
            fields: {
              currentPassword: {
                type: new GraphQLNonNull(GraphQLString)
              },
              newPassword: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        userId: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: payload => payload.userId
        }
      },
      mutateAndGetPayload: async (object, context, info) =>
        this.service.changePassword(context, object.change)
    });
  }

  currentUserQuery() {
    return {
      type: this.type,
      resolve: (source, args, context, info) => {
        const { user } = context;

        if (!user || !user.id) {
          throw new InternalError('unauthorized_error', { message: 'Operação não autorizada' });
        }

        const newArgs = args;
        newArgs.id = user.id;

        return resolver(this.model)(source, newArgs, context, info);
      }
    };
  }

  getSchema() {
    const baseSchema = super.getSchema();
    const schema = {
      query: {
        currentUser: this.currentUserQuery()
      },
      mutation: {
        authenticateUser: this.authenticateUserMutation(),
        inviteUser: this.inviteUserMutation(),
        forgotPassword: this.forgotPasswordMutation(),
        resetPassword: this.resetPasswordMutation(),
        changePassword: this.changePasswordMutation()
      }
    };

    return _.merge(baseSchema, schema);
  }
}

module.exports = fieldsCache => new UserGraphQLService(fieldsCache);
