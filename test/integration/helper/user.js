const { expect } = require('chai');
const faker = require('faker/locale/pt_BR');
const gql = require('graphql-tag');

const { client, setAuthToken } = require('./client');

function createUser(input) {
  return client.mutate({
    mutation: gql(`
      mutation createUserMutation($input: CreateUserInput!) {
        createUser(input: $input) {
          user {
            id
            name
            email
            phone
          }
        }
      }
    `),
    variables: {
      input: {
        create: input
      }
    }
  });
}

function assertCreateUserSuccessful(response) {
  expect(response).to.have.property('data');
  expect(response.data).to.have.property('createUser');
  expect(response.data.createUser).to.have.property('user');

  return response.data.createUser.user;
}

function authenticateUser(input) {
  return client.mutate({
    mutation: gql(`
      mutation AuthenticateUser($input: AuthenticateUserInput!) {
        authenticateUser(input: $input) {
          authentication {
            accessToken
            refreshToken
          }
        }
      }
    `),
    variables: {
      input: {
        authenticate: input
      }
    }
  });
}

function assertAuthenticateUserSuccessful(response) {
  expect(response).to.have.property('data');
  expect(response.data).to.have.property('authenticateUser');
  expect(response.data.authenticateUser).to.have.property('authentication');

  return response.data.authenticateUser.authentication;
}

function currentUser(auth) {
  setAuthToken(auth);

  return client.query({
    query: gql(`
      query currentUserQuery {
        currentUser {
          id
          name
          cpf
          email
          phone
          memberships {
            id
            role
            status
            unidade
            condominio {
              id
              name
              cnpj
              quantidadeBlocos
              quantidadeUnidades
              vencimentoCota
              enderecoCep
              enderecoLogradouro
              enderecoNumero
              enderecoBairro
              enderecoLocalidade
              enderecoEstado
              codigo
            }
            bloco {
              id
              name
              quantidadeUnidades
            }
          }
        }
      }
    `)
  }).finally(() => {
    setAuthToken(null);
  });
}

function assertCurrentUserSuccessful(response) {
  expect(response).to.have.property('data');
  expect(response.data).to.have.property('currentUser');

  return response.data.currentUser;
}

async function withUser(email = true, phone = true) {
  const password = faker.random.alphaNumeric(6);
  const emailAddress = faker.internet.email();
  const phoneNumber = faker.phone.phoneNumber('+55###########');

  const userResponse = await createUser({
    name: faker.name.findName(),
    email: email ? emailAddress : undefined,
    phone: phone ? phoneNumber : undefined,
    password
  });

  const user = assertCreateUserSuccessful(userResponse);

  const authResponse = await authenticateUser({
    user: email ? emailAddress : phoneNumber,
    password,
    type: 'password'
  });

  const auth = assertAuthenticateUserSuccessful(authResponse);

  return {
    user,
    auth
  };
}

module.exports = {
  // Mutations
  createUser,
  authenticateUser,
  assertCreateUserSuccessful,
  assertAuthenticateUserSuccessful,

  // Queries
  currentUser,
  assertCurrentUserSuccessful,

  withUser
};
