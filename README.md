# fcp-dal-api

The Data Access Layer (DAL) for the Farming and Countryside Programme (FCP) - a GraphQL API.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Testing](#testing)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [API endpoints](#api-endpoints)
- [Development helpers](#development-helpers)
  - [MongoDB Locks](#mongodb-locks)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v22` and [npm](https://nodejs.org/) `>= v11`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd fcp-dal-api
nvm use
```

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

### Testing

To test the application run:

```bash
npm run test
```

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json).
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## API endpoints

| Endpoint       | Description |
| :------------- | :---------- |
| `GET: /health` | Health      |

### Security

The platform provides features for handling authentication to the DAL, connecting clients can follow the [CDP docs](https://portal.cdp-int.defra.cloud/documentation/how-to/apis.md#how-do-clients-authenticate-and-access-my-api-).

> NOTE: the endpoint protection can be changed by submitting a PR with changes to this [spec file](https://github.com/DEFRA/cdp-tf-svc-infra/blob/main/environments/dev/apis/fcp-dal-api.yml)

## Development helpers

### Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the proxy dispatcher:

To add the dispatcher to your own client:

```javascript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag fcp-dal-api:development .
```

Run:

```bash
docker run -e PORT=3001 -p 3001:3001 fcp-dal-api:development
```

### Production image

Build:

```bash
docker build --no-cache --tag fcp-dal-api .
```

Run:

```bash
docker run -e PORT=3001 -p 3001:3001 fcp-dal-api
```

### Docker Compose

A local environment with:

- This service.

```bash
docker compose up --build -d
```

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties)
# FFC Customer Registry

Customer Registry GraphQL API created from template to support rapid delivery of microservices for FFC Platform.
It contains the configuration needed to deploy a simple Hapi Node server to the Azure Kubernetes Platform.

## Local development

Create a `.env` file:

```env
NODE_ENV=development
PORT=4000

# Mock server
PORT_MOCK=3100
ENABLE_MOCK_SERVER=true
MOCK_SERVER_COLLECTION=all #options: all, rural-payments-portal, release-1

# Rural Payments Agency Land API
RURAL_PAYMENTS_AGENCY_LAND_API_URL=

# Rural Payments Portal API settings
RURAL_PAYMENTS_PORTAL_EMAIL=
RURAL_PAYMENTS_PORTAL_PASSWORD=
RURAL_PAYMENTS_PORTAL_API_URL=
RURAL_PAYMENTS_AGENCY_LAND_API_URL=

# Version One API settings
VERSION_ONE_APIM_SUBSCRIPTION_KEY=
VERSION_ONE_APIM_SCOPE=
VERSION_ONE_APIM_ACCESS_TOKEN_URL=
VERSION_ONE_API_URL=

# Turn on all fields for local development
ALL_SCHEMA_ON=true

# Generate and validate api bearer token
API_TENANT_ID=
ADMIN_AD_GROUP_ID=
CLIENT_ID=
CLIENT_SECRET=
```

Run:

```bash
make dev
```

Access GraphQL landing page at: [http://localhost:4000/graphql](http://localhost:4000/graphql)

#### Mock Server

The mock server is ran when the development docker environment. The mock server service is provided by [Mock Server](https://www.mocks-server.org/).

Mocks endpoints are defined within the ./mocks directory.

#### Mock Authenticate Database

In addition there is a mock authenticate database that can be used for local development. To run the database add the environment variables to your `.env`:

```env
AUTHENTICATE_DB_HOST=127.0.0.1
AUTHENTICATE_DB_SCHEMA=master
AUTHENTICATE_DB_USERNAME=newuser
AUTHENTICATE_DB_PASSWORD=Password123!
```

And then run the mock authenticate database: `docker compose -f mocks/services/authenticate/docker-compose.yaml up`

#### `@on` directive

To allow for the granular release of fields as data sources become available, fields must have the custom `@on` directive set to be included when the schema is built.

For example:

```graphql
type Query {
  customers: [Customer] @on
}

type Customer {
  id: ID! @on
  name: String # this field is not included in the final schema
}
```

For local development and lower environments, all fields can be turned on by setting the env variable `ALL_SCHEMA_ON`.

## Prerequisites

- Docker
- Docker Compose

Optional:

- Kubernetes
- Helm

## Running the application

The application is designed to run in containerised environments, using Docker Compose in development and Kubernetes in production.

- A Helm chart is provided for production deployments to Kubernetes.

### Build container image

Container images are built using Docker Compose, with the same images used to run the service with either Docker Compose or Kubernetes.

When using the Docker Compose files in development the local `app` folder will
be mounted on top of the `app` folder within the Docker container, hiding the CSS files that were generated during the Docker build. For the site to render correctly locally `npm run build` must be run on the host system.

By default, the start script will build (or rebuild) images so there will
rarely be a need to build images manually. However, this can be achieved
through the Docker Compose
[build](https://docs.docker.com/compose/reference/build/) command:

```
# Build container images
docker-compose build
```

### Start

Use Docker Compose to run service locally.

```
docker-compose up
```

## Test structure

The tests have been structured into subfolders of `./test` as per the
[Microservice test approach and repository structure](https://eaflood.atlassian.net/wiki/spaces/FPS/pages/1845396477/Microservice+test+approach+and+repository+structure)

### Running tests

A convenience script is provided to run automated tests in a containerised
environment. This will rebuild images before running tests via docker-compose,
using a combination of `docker-compose.yaml` and `docker-compose.test.yaml`.
The command given to `docker-compose run` may be customised by passing
arguments to the test script.

Examples:

```
# Run all tests
scripts/test

# Run tests with file watch
scripts/test -w
```

## CI pipeline

This service uses the [FFC CI pipeline](https://github.com/DEFRA/ffc-jenkins-pipeline-library)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

# Running defra machine

Ensure add the proxy url your .env: `RURAL_PAYMENTS_PORTAL_PROXY_URL=http://10.255.1.3:443`
