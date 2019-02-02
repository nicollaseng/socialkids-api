# Smart Síndico - API

## Database Setup with Docker
* Both projects (Web and API) must be on ```development``` branch;

* Run ```npm install``` on each project;

* Run ```cp local.env.template local.env``` on API project and ```cp .env.template .env.development``` on Web project;

* Edit the ```.env.development``` file at the root of Web project, replacing all the content with ```REACT_APP_API_URL=http://localhost:3000/graphql```;

* Run ```docker run --name smart-postgres -e POSTGRES_DB=smartsindico -e POSTGRES_PASSWORD=smartsindico -p 5432:5432 -d postgres```;

#### Database migrations
* Local (postgres:smartsindico@localhost): ```npm run db:migrate:local ```;

* With connection string: ```npm run db:migrate -- --url postgres://postgres:smartsindico@localhost/smartsindico```;

#### Running both projects
* Run ```npm run watch``` on API project and ```npm start``` on Web project.

#### Tips
* If you see this message: ```Something is already running on port 3000...```, press ```Y```;

* You can check if Postgres is running on Docker, by running this command on your terminal: ```docker ps```.

## GraphQL - CreateUser mutation
Mutation:
```
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    user {
      id
    }
  }
}
```

Query variables:

```
{
  "input": {
    "create": {
      "email": "teste@smtsolucoes.com.br",
      "password": "Smt@1234",
      "name": "Usuário de Teste"
    }
  }
}
```

## GraphQL - UpdateUser mutation
Mutation:
```
mutation UpdateUser($data: UpdateUserInput!) {
  updateUser(input: $data) {
    user {
      id
    }
  }
}
```

Query variables:
```
{
  "data": {
    "id": "1f6322d5-88b8-4595-9a0e-505982668a43",
    "update": {
      "name": "Usuário de Teste - Novo Nome"
    }
  }
}
```

## GraphQL - DestroyUser mutation
Mutation:
```
mutation DestroyUser($input: DestroyUserInput!) {
  destroyUser(input: $input) {
    deletedId
  }
}
```

Query variables:
```
{
  "input": {
    "id": "4b085d0e-409b-4697-890a-b62baf0fcbb1"
  }
}
```

## GraphQL - AuthenticateUser mutation
Mutation:
```
mutation AuthenticateUser($input: AuthenticateUserInput!) {
  authenticateUser(input: $input) {
    token
  }
}
```

Query variables:
```
{
  "input": {
    "authenticate": {
      "email": "teste@smtsolucoes.com.br",
      "password": "password"
    }
  }
}
```
