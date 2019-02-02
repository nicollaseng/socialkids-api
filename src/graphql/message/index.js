const _ = require('lodash');
const { attributeFields } = require('graphql-sequelize');
const { mutationWithClientMutationId } = require('graphql-relay');
const winston = require('winston');

const {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} = require('graphql');

const { InternalError } = require('../../errors/internal');
const messageService = require('../../services/message');

class MessageGraphQlService {
  constructor(fieldsCache) {
    this.fieldsCache = fieldsCache;
    this.messageType = this.getMessageType();
    this.messageUserType = this.getMessageUserType();
    this.messageContatoType = this.getMessageContatoType();
    this.model = messageService.getModel();
  }

  getMessageType() {
    return new GraphQLObjectType({
      name: 'SentMessage',
      fields: {
        assunto: {
          type: new GraphQLNonNull(GraphQLString)
        },
        mensagem: {
          type: new GraphQLNonNull(GraphQLString)
        },
        categoria: {
          type: new GraphQLNonNull(GraphQLString)
        }
      }
    });
  }

  getMessageUserType() {
    return new GraphQLObjectType({
      name: 'MessageUser',
      fields: {
        id: {
          type: new GraphQLNonNull(GraphQLString)
        },
        name: {
          type: new GraphQLNonNull(GraphQLString)
        },
        email: {
          type: GraphQLString
        },
        phone: {
          type: GraphQLString
        }
      }
    });
  }

  getMessageContatoType() {
    return new GraphQLObjectType({
      name: 'MessageContato',
      fields: {
        nome: {
          type: new GraphQLNonNull(GraphQLString)
        },
        email: {
          type: new GraphQLNonNull(GraphQLString)
        },
        mensagem: {
          type: new GraphQLNonNull(GraphQLString)
        }
      }
    });
  }

  getMessageToMoradorMutation() {
    return mutationWithClientMutationId({
      name: 'MessageToMorador',
      inputFields: {
        message: {
          type: new GraphQLInputObjectType({
            name: 'CreateMessageToMorador',
            fields: {
              assunto: {
                type: new GraphQLNonNull(GraphQLString)
              },
              mensagem: {
                type: new GraphQLNonNull(GraphQLString)
              },
              categoria: {
                type: new GraphQLNonNull(GraphQLString)
              },
              moradores: {
                type: new GraphQLList(new GraphQLNonNull(GraphQLString))
              },
              condominioId: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        message: {
          type: this.messageType,
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: (object, context, info) => {
        try {
          const { message } = object;

          return messageService.messageToMorador(context, message);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Message to Morador error:', err);
          throw new InternalError('message_to_morador_error', err);
        }
      }
    });
  }

  getMessageToSubsindicoMutation() {
    return mutationWithClientMutationId({
      name: 'MessageToSubsindico',
      inputFields: {
        message: {
          type: new GraphQLInputObjectType({
            name: 'CreateMessageToSubsindico',
            fields: {
              assunto: {
                type: new GraphQLNonNull(GraphQLString)
              },
              mensagem: {
                type: new GraphQLNonNull(GraphQLString)
              },
              categoria: {
                type: new GraphQLNonNull(GraphQLString)
              },
              condominioId: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        message: {
          type: this.messageType,
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: (object, context, info) => {
        try {
          const { message } = object;

          return messageService.messageToSubsindico(context, message);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Message to Subsíndico error:', err);
          throw new InternalError('message_to_subsindico_error', err);
        }
      }
    });
  }

  getMessageToAllSubsindicosMutation() {
    return mutationWithClientMutationId({
      name: 'MessageToAllSubsindicos',
      inputFields: {
        message: {
          type: new GraphQLInputObjectType({
            name: 'CreateMessageToAllSubsindicos',
            fields: {
              assunto: {
                type: new GraphQLNonNull(GraphQLString)
              },
              mensagem: {
                type: new GraphQLNonNull(GraphQLString)
              },
              categoria: {
                type: new GraphQLNonNull(GraphQLString)
              },
              condominioId: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        message: {
          type: this.messageType,
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: (object, context, info) => {
        try {
          const { message } = object;

          return messageService.messageToAllSubsindicos(context, message);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Message to All Subsíndicos error:', err);
          throw new InternalError('message_to_all_subsindicos_error', err);
        }
      }
    });
  }

  getMessageToSindicoMutation() {
    return mutationWithClientMutationId({
      name: 'MessageToSindico',
      inputFields: {
        message: {
          type: new GraphQLInputObjectType({
            name: 'CreateMessageToSindico',
            fields: {
              assunto: {
                type: new GraphQLNonNull(GraphQLString)
              },
              mensagem: {
                type: new GraphQLNonNull(GraphQLString)
              },
              categoria: {
                type: new GraphQLNonNull(GraphQLString)
              },
              condominioId: {
                type: new GraphQLNonNull(GraphQLString)
              }
            }
          })
        }
      },
      outputFields: {
        message: {
          type: this.messageType,
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: (object, context, info) => {
        try {
          const { message } = object;

          return messageService.messageToSindico(context, message);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Message to Síndico error:', err);
          throw new InternalError('message_to_sindico_error', err);
        }
      }
    });
  }

  getContatoMessageMutation() {
    return mutationWithClientMutationId({
      name: 'ContatoMessage',
      inputFields: {
        message: {
          type: new GraphQLInputObjectType({
            name: 'CreateContatoMessage',
            fields: {
              nome: {
                type: new GraphQLNonNull(GraphQLString)
              },
              email: {
                type: new GraphQLNonNull(GraphQLString)
              },
              mensagem: {
                type: new GraphQLNonNull(GraphQLString)
              },
            }
          })
        }
      },
      outputFields: {
        message: {
          type: this.messageContatoType,
          resolve: payload => payload
        }
      },
      mutateAndGetPayload: (object, context, info) => {
        try {
          const { message } = object;

          return messageService.contatoMessage(context, message);
        } catch (err) {
          if (err instanceof InternalError) {
            throw err;
          }

          winston.error('Message Contato error:', err);
          throw new InternalError('contato_message_error', err);
        }
      }
    });
  }

  getMessagesQuery() {
    return {
      type: new GraphQLList(new GraphQLObjectType({
        name: 'Message',
        fields: _.assign(attributeFields(this.model, {
          cache: this.fieldsCache
        }), {
          sender: {
            type: this.messageUserType,
            resolve: payload => payload.membership.user
          },
          recipients: {
            type: new GraphQLList(this.messageUserType),
            resolve: payload =>
              _.map(payload.messageRecipients, recipient => recipient.membership.user)
          }
        })
      })),

      args: {
        condominioId: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },

      resolve: (source, args, context, info) =>
        messageService.listMessages(context, args.condominioId)
    };
  }

  getSchema() {
    return {
      mutation: {
        messageToMorador: this.getMessageToMoradorMutation(),
        messageToSindico: this.getMessageToSindicoMutation(),
        messageToSubsindico: this.getMessageToSubsindicoMutation(),
        messageToAllSubsindicos: this.getMessageToAllSubsindicosMutation(),
        contatoMessage: this.getContatoMessageMutation(),
      },
      query: {
        messages: this.getMessagesQuery()
      }
    };
  }
}

module.exports = fieldsCache => new MessageGraphQlService(fieldsCache);
