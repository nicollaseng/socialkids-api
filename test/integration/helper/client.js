const { InMemoryCache } = require('apollo-cache-inmemory/lib/bundle.umd.js');
const { ApolloClient } = require('apollo-client');
const { ApolloLink, from } = require('apollo-link');
const { HttpLink } = require('apollo-link-http');
const fetch = require('node-fetch');

let authToken;

function setAuthToken(token) {
  authToken = token;
}

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: authToken ? `Bearer ${authToken}` : null
    }
  }));

  return forward(operation);
});

const client = new ApolloClient({
  link: from([
    authMiddleware,
    new HttpLink({ uri: 'http://localhost:8000/graphql', fetch })
  ]),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only'
    }
  }
});

module.exports = {
  setAuthToken,
  client
};
