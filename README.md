# fcp-dal-api

The Data Access Layer (DAL) for the Farming and Countryside Programme (FCP) - a GraphQL API.

## Requirements

- ### Node.js

  The service is built in JavaScript code and requires [Node.js](http://nodejs.org/) `v22` or later, and [npm](https://nodejs.org/) `v11` or later.

- ### Docker

  A modern version of `docker` (with the `compose` extensions) will allow a local environment to be simply run. This will mimic the live services, and facilitate development and testing.

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

This will spin up the API and automatically reload when changes are made to the API code.

### KITS API mock

There is a local mock for the KITS API (the source of all the DAL's data). It can be started by running:

```bash
npm run mock
```

Again, starting the mock this way will listen for (and reload with) relevant changes to its code and mock data (which can be found at `/mocks` and `/mocks/fixtures` respectively).

### Testing

To test the application run:

```bash
npm run test
```

### Production

To mimic the application running in `production` mode locally run:

```bash
docker compose up
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json).
To view them in your command line run:

```bash
npm run
```

### Update dependencies

To update dependencies just run `npm it`! And commit any changes.

### Formatting

[Prettier](https://prettier.io/docs/) is used for all formatting (and syntax checking).
[ESLint](https://eslint.org/docs/latest/) is used for linting and semantic checking (NOT formatting).

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## API endpoints

| Endpoint         | Description                                                                      |
| :--------------- | :------------------------------------------------------------------------------- |
| `GET: /health`   | Health check (should also be publicly available without auth on live envs).      |
| `GET: /graphql`  | The interactive GraphQL service frontend (like Swagger docs but for GraphQL 😉). |
| `POST: /graphql` | For making GraphQL requests to the DAL API.                                      |

### Security

The platform provides features for handling authentication to the DAL.
Connecting clients can follow the [CDP docs](https://portal.cdp-int.defra.cloud/documentation/how-to/apis.md#how-do-clients-authenticate-and-access-my-api-) to get AWS Cognito access to the live `/graphql` service.

> NOTE: all endpoints (expect `/health`) are protected by default. Modifications can be made by submitting a PR with changes to the relevant spec files:
>
> - [dev](https://github.com/DEFRA/cdp-tf-svc-infra/blob/main/environments/dev/apis/fcp-dal-api.yml)
> - [test](https://github.com/DEFRA/cdp-tf-svc-infra/blob/main/environments/test/apis/fcp-dal-api.yml)
> - [ext-test](https://github.com/DEFRA/cdp-tf-svc-infra/blob/main/environments/ext-test/apis/fcp-dal-api.yml)
> - [perf-test](https://github.com/DEFRA/cdp-tf-svc-infra/blob/main/environments/perf-test/apis/fcp-dal-api.yml)
> - [prod](https://github.com/DEFRA/cdp-tf-svc-infra/blob/main/environments/prod/apis/fcp-dal-api.yml)

## Development helpers

### Proxy

CPD uses a [forward-proxy](https://portal.cdp-int.defra.cloud/documentation/how-to/proxy.md) which is set up by default.
Modifications can be made by submitting a PR with changes to the relevant spec files:

- [dev](https://github.com/DEFRA/cdp-squid-proxy/blob/main/configs/dev/fcp-dal-api.json)
- [test](https://github.com/DEFRA/cdp-squid-proxy/blob/main/configs/test/fcp-dal-api.json)
- [ext-test](https://github.com/DEFRA/cdp-squid-proxy/blob/main/configs/ext-test/fcp-dal-api.json)
- [perf-test](https://github.com/DEFRA/cdp-squid-proxy/blob/main/configs/perf-test/fcp-dal-api.json)
- [prod](https://github.com/DEFRA/cdp-squid-proxy/blob/main/configs/prod/fcp-dal-api.json)

> NOTE: to ensure the proxy has been correctly configured, connections to the API's data source (KITS) can be tested by following [the steps in this guide](./test_scripts/kits-testing-on-cdp.md).

## Docker

### Production image

Build:

```bash
docker build --no-cache --tag fcp-dal-api .
```

Then run:

```bash
docker run -p 3000:3000 fcp-dal-api
```

### Docker Compose

To run the DAL API backed by the KITS API mock, run:

```bash
docker compose up --build
```

## TODO

Complete the following 2 sections to add the `Dependabot` and `SonarCloud` tools...

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties)

## TODO...

Check what's still needed/relevant from the old docs (which follow)...

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
