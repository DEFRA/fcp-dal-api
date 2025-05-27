# fcp-dal-api

The Data Access Layer (DAL) for the Farming and Countryside Programme (FCP) - a GraphQL API.

## Consumers' TL;DR

This README was created for project contributors, as a consumer of the DAL API, you probably only care about the following quick start steps:

```bash
curl https://raw.githubusercontent.com/DEFRA/fcp-dal-api/refs/heads/main/compose.yml -o dal-api-compose.yml
docker compose -f dal-api-compose.yml up
```

The graphQL explorer should now be available, head to http://localhost:3000/graphql in your browser, and have a play!

> NOTE: There are currently only 2 businesses in the mock, their SBIs are: `107183280` & `107591843`.
> For composite queries (where a business and a customer reference are required), the CRNs `9477368292` & `0866159801` exist in both businesses.

> NOTE: The above is a simplified setup that is intended to aid consumer development.
> For access to the live instances, [schema availability](#the-on-directive) and [authorisation](#security) would need to be carefully considered.

## Requirements

- ### Node.js

  The service is built in JavaScript code and requires [Node.js](http://nodejs.org/) `v22` or later, and [npm](https://nodejs.org/) `v11` or later (older versions will likely work, but are unsupported).

- ### Docker

  A modern version of `docker` (with the `compose` extensions) will allow a local environment to be simply run. This will mimic the live services, and facilitate development and testing.

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

Ensure the `.env` file exists. This can be copied from `.env.example`:

```bash
cp .env.example .env
```

Also make sure to set the `RP_KITS_GATEWAY_INTERNAL_URL` variable to the desired data source, e.g. for local testing:

```env
RP_KITS_GATEWAY_INTERNAL_URL=http://localhost:3100/v1
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

This will spin up the API and automatically reload when changes are made to the API code.

### KITS API mock

There is a local mock for the KITS API (the source of all the DAL's data).
It can be started by running:

```bash
docker run -p 3100:3100 defradigital/fcp-dal-upstream-mock
```

The code for the Mock can be found [here](https://github.com/DEFRA/fcp-dal-upstream-mock).
The `fixtures` folder is probably the most interesting, as this contains all the mock's raw data.

### Testing

To test the application run:

```bash
npm test
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

### The `@on` directive

To allow for the granular release of fields as data sources become available, fields must have the custom `@on` directive set to be included when the schema is built.
Otherwise they will NOT be available in the graphQL queries, and an error will occur.

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

For local development and lower environments, all fields can be turned on by setting the env variable: `ALL_SCHEMA_ON=true`.

### Security

The platform provides features for handling authentication to APIs.
However, access to the DAL is handled differently.
Consumers must first get an access token, which must be supplied in the `Authorization` header as part of every request.

> NOTE: all endpoints (expect posts to `/graphql`) are protected by default. Modifications can be made by submitting a PR with changes to the relevant spec files:
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

### SonarCloud

The project is setup with SonarCloud to ensure certain important code quality standards are met.
More information can be found [here](https://sonarcloud.io/project/overview?id=DEFRA_fcp-dal-api).

### Dependabot - TODO!

Decide whether to enable Depend-a-bot by renaming the [.github/example.dependabot.yml](.github/example.dependabot.yml) file to `.github/dependabot.yml` 🤷

## Docker

### Production image

Build:

```bash
docker build --tag fcp-dal-api .
```

Then run:

```bash
docker run -p 3000:3000 fcp-dal-api
```

### Docker Compose

To run the DAL API backed by the KITS API mock, run:

```bash
docker compose up
```

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
