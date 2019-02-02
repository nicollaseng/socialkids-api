const { expect } = require('chai');
const faker = require('faker/locale/pt_BR');
const gql = require('graphql-tag');

const { client, setAuthToken } = require('./client');

function createCondominio(input, auth) {
  setAuthToken(auth);

  return client.mutate({
    mutation: gql(`
      mutation createCondominioMutation($input: CreateCondominioInput!) {
        createCondominio(input: $input) {
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
        }
      }
    `),
    variables: {
      input: {
        create: input
      }
    }
  }).finally(() => {
    setAuthToken(null);
  });
}

function assertCreateCondominioSuccessful(response) {
  expect(response).to.have.property('data');
  expect(response.data).to.have.property('createCondominio');
  expect(response.data.createCondominio).to.have.property('condominio');

  return response.data.createCondominio.condominio;
}

function findCondominioByCodigo(codigo, auth) {
  setAuthToken(auth);

  return client.query({
    query: gql(`
      query condominio($codigo: String!) {
        condominio(where: { codigo: $codigo }) {
          id
          name
          codigo
          enderecoLogradouro
          enderecoNumero
          enderecoBairro
          enderecoLocalidade
          enderecoEstado
        }
      }
    `),
    variables: {
      codigo
    }
  }).finally(() => {
    setAuthToken(null);
  });
}

function assertFindCondominioByCodigoSuccessful(response) {
  expect(response).to.have.property('data');
  expect(response.data).to.have.property('condominio');

  return response.data.condominio;
}

async function withCondominio(auth) {
  const condominioResponse = await createCondominio({
    name: faker.company.companyName(),
    cnpj: '28955279000186',
    quantidadeBlocos: 2,
    quantidadeUnidades: 100,
    vencimentoCota: 1,
    enderecoCep: '59628617',
    enderecoLogradouro: 'Rua Vivaldi',
    enderecoNumero: '379',
    enderecoBairro: 'Dom Jaime Câmara',
    enderecoLocalidade: 'Mossoró',
    enderecoEstado: 'RN',
    blocos: [
      {
        name: 'A',
        quantidadeUnidades: 50
      },
      {
        name: 'B',
        quantidadeUnidades: 50
      }
    ]
  }, auth);

  const condominio = assertCreateCondominioSuccessful(condominioResponse);

  return condominio;
}

module.exports = {
  // Mutations
  createCondominio,
  assertCreateCondominioSuccessful,

  // Queries
  findCondominioByCodigo,
  assertFindCondominioByCodigoSuccessful,

  withCondominio
};
