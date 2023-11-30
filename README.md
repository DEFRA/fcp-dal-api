# FFC Customer Registry

Customer Registry GraphQL API created from template to support rapid delivery of microservices for FFC Platform. 
It contains the configuration needed to deploy a simple Hapi Node server to the Azure Kubernetes Platform.


## Local development
Create a `.env` file:

```env
NODE_ENV=development
PORT=4000
PORT_MOCK=3100

# Rural Payments Agency Land API
RURAL_PAYMENTS_AGENCY_LAND_API_URL=

# Rural Payments Portal API settings
RURAL_PAYMENTS_PORTAL_EMAIL=
RURAL_PAYMENTS_PORTAL_PASSWORD=
RURAL_PAYMENTS_PORTAL_API_URL=
```

Run:

```bash
make dev
```

Access GraphQL landing page at: [http://localhost:4000/graphql](http://localhost:4000/graphql)

#### Mock Server
The mock server is ran when the development docker environment. The mock server service is provided by [Mock Server](https://www.mocks-server.org/).

Mocks endpoints are defined within the ./mocks directory.

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
be mounted on top of the `app` folder within the Docker container, hiding the CSS files that were generated during the Docker build.  For the site to render correctly locally `npm run build` must be run on the host system.


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

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.

# Running defra machine
Ensure add the proxy url your .env: `RURAL_PAYMENTS_PORTAL_PROXY_URL=http://10.255.1.3:443`