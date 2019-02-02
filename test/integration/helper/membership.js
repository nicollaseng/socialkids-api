const { expect } = require('chai');
const gql = require('graphql-tag');

const { client, setAuthToken } = require('./client');

function createMembership(input, auth) {
  setAuthToken(auth);

  return client.mutate({
    mutation: gql(`
      mutation createMembershipMutation($input: CreateMembershipInput!) {
        createMembership(input: $input) {
          membership {
            id
            role
            status
            unidade
            userId
            condominioId
            blocoId
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

function assertCreateMembershipSuccessful(response) {
  expect(response).to.have.property('data');
  expect(response.data).to.have.property('createMembership');
  expect(response.data.createMembership).to.have.property('membership');

  return response.data.createMembership.membership;
}

function approveMembership(id, auth) {
  setAuthToken(auth);

  return client.mutate({
    mutation: gql(`
      mutation approveMembership($input: ApproveMembershipInput!) {
        approveMembership(input: $input) {
          membership {
            id
            role
            status
          }
        }
      }
    `),
    variables: {
      input: {
        id
      }
    }
  }).finally(() => {
    setAuthToken(null);
  });
}

function assertApproveMembershipSuccessful(response) {
  expect(response).to.have.property('data');
  expect(response.data).to.have.property('approveMembership');
  expect(response.data.approveMembership).to.have.property('membership');
  expect(response.data.approveMembership.membership).to.have.property('status').to.equal('active');

  return response.data.approveMembership.membership;
}

module.exports = {
  // Mutations
  createMembership,
  approveMembership,
  assertCreateMembershipSuccessful,
  assertApproveMembershipSuccessful
};
