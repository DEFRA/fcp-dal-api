# fcp-dal-api

The Data Access Layer (DAL) for the Farming and Countryside Programme (FCP) - a GraphQL API.

## Consumers' TL;DR

This README was created for project contributors; as a potential consumer of the DAL API, you probably only care about the following quick start steps:

```bash
curl https://raw.githubusercontent.com/DEFRA/fcp-dal-api/refs/heads/main/compose.yml -o dal-api-compose.yml
docker compose -f dal-api-compose.yml up
```

The graphQL explorer should now be available, head to http://localhost:3000/graphql in your browser, and have a play!

> NOTE: the IDs of the available customers and businesses can be found in the [mock code](https://github.com/DEFRA/fcp-dal-upstream-mock/blob/main/src/factories/id-lookups.js), along with their corresponding CRN or SBI (respectively), as well as the relationships between entities.

> NOTE: The above is a simplified setup that is intended to aid consumer development.
> For access to the live instances, [schema availability](#the-wip-directive) and [authorisation](#security) would need to be carefully considered.

More consumer focused documentation can be found on the project [Homepage...](https://defra.github.io/fcp-dal-api/homepage)

## Requirements

- ### Node.js

  The service is built in JavaScript code and requires [Node.js](http://nodejs.org/) `v22` or later, and [npm](https://nodejs.org/) `v11` or later (older versions will likely work, but are unsupported).

- ### Docker

  A modern version of `docker` (with the `compose` extensions) will allow a local environment to be simply run. This will mimic the live services, and facilitate development and testing.

## Local development

### Setup

#### Install application dependencies

Install application dependencies:

```bash
npm install
```

#### Implicit lifecycle scripts are disabled

Due to the prevalence of NPM supply-chain attacks, scripts that would usually be run during npm install (and also
pre/post scripts that are run alongside the target script) have been forcibly disabled with the following
setting in `.npmrc`:

```.npmrc
ignore-scripts=true
```

All required post install steps have been gathered into a `postinstall` script. This script contains calls to commands
that would have been run by 3rd party library installers, if `ignore-scripts` had not been set. These commands in this
file have been limited to those that are required for our build process. It would still be prudent to examine this script,
prior to running to ensure that you understand what will be run (you will be prompted to confirm at each step). To run
this script, execute the following:

```bash
npm run postinstall
```

#### 3rd party libraries must be at least 7 days old before they can be installed

The `.npmrc` setting below prevents libraries that have been released in the past 7 days from being installed.

```.npmrc
min-release-age=7
```

This gives the npm community time to detect a compromised release before this repo consumes it.

This does create a potential issue. If `npm audit` identifies an issue that must be fixed, and the patched library
has been released less than 7 days ago, then you will need to investigate the library in question:

- Look at the published release
- Verify that it's safe
- Run `npm install {your-dependency}@{version-number} --min-release-age=0` (including `--save-dev` if it's a dev only dependency)

#### Setup environment file

Ensure the `.env` file exists. This can be copied from `.env.example`:

```bash
cp .env.example .env
```

Also make sure to set the upstream datasource, e.g. for local testing against mock running in docker:

```env
KITS_INTERNAL_GATEWAY_URL=http://localhost:3100/v1
KITS_EXTERNAL_GATEWAY_URL=http://localhost:3100/v1
HITACHI_BASE_URL=http://localhost:3100/api
```

#### Start mongo

You will need to run mongodb locally. You can do this with the following command:

```bash
docker-compose up -d mongodb
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

#### GraphQL schema coverage

The acceptance test suite is checked against the GraphQL schema to ensure enough of the schema is actually exercised by tests. This runs as part of CI, but can also be run locally:

```bash
npm run test:acceptance:coverage
```

This prints the schema to `schema.graphql`, runs [`graphql-inspector coverage`](https://the-guild.dev/graphql/inspector/docs/products/cli#coverage) against the acceptance tests, and fails (via `scripts/check-schema-coverage.js`) if type or field coverage falls below a threshold (default `80%` for both, override with the `SCHEMA_TYPE_COVERAGE_THRESHOLD` and `SCHEMA_FIELD_COVERAGE_THRESHOLD` env vars). Any uncovered types and fields are listed in the output.

There is also a helper script to print the current schema to `schema.graphql` on its own:

```bash
npm run schema:print
```

And one to check for structurally similar types in the schema (useful for spotting duplication):

```bash
npm run schema:type:similarity
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

### The `@wip` directive

The `@wip` directive marks fields that are still a work in progress. It is only valid on field definitions:

```graphql
directive @wip on FIELD_DEFINITION
```

Fields annotated with `@wip` behave differently depending on the environment:

- In `dev` and `perf-test`, the fields are included in the schema but are marked as deprecated with the reason: `Work in progress — may change or be removed`.
- In all other environments (`test`, `ext-test`, `prod`), the fields are removed entirely from the schema.

> **Note:** `dev` and `perf-test` are the environments backed by the upstream mock service (rather than a real KITS or Hitachi instance). The `@wip` directive is only active in these mock-backed environments.

This allows WIP functionality to be safely exercised in supported environments without exposing it to consumers elsewhere.

Example usage:

```graphql
type Query {
  customers: [Customer]
  experimentalFeature: String @wip
}

type Customer {
  id: ID!
  name: String
  wipOnlyField: Int @wip
}
```

In non-WIP environments, `Query.experimentalFeature` and `Customer.wipOnlyField` will not exist in the schema. In `dev` and `perf-test` they will be present (with the deprecation reason).

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

### Publish Dev Build workflow

The [`publish-dev-build`](./.github/workflows/publish-dev-build.yml) GitHub Actions workflow allows a build from any branch to be published to the `dev` environment ahead of merging to `main`, which is useful for testing changes before they are merged.

For example, you might need to test logging works as expected within the cdp portal.

It is triggered manually (`workflow_dispatch`) from the [Actions tab](https://github.com/DEFRA/fcp-dal-api/actions/workflows/publish-dev-build.yml) by selecting the branch to build from, and running the workflow.

The workflow publishes the build via [`cdp-build-action`](https://github.com/DEFRA/cdp-build-action)'s `build-hotfix` action, tagging it `0.0.<run_number>` (the GitHub Actions run number), so each dispatch of the workflow produces a unique, incrementing version regardless of branch.

> NOTE: this bypasses the usual release process and is intended for short-lived dev testing only, not for tracking real releases.

### Publish Hot Fix workflow

The [`publish-hotfix`](./.github/workflows/publish-hotfix.yml) GitHub Actions workflow publishes a patch release directly from any non-`main` branch, bypassing the normal PR-to-main release flow. This is used to ship an urgent fix to a live environment without waiting for a full release.

It is triggered manually (`workflow_dispatch`) from the [Actions tab](https://github.com/DEFRA/fcp-dal-api/actions/workflows/publish-hotfix.yml) — select the branch to build from and run the workflow.

The workflow publishes the build via [`cdp-build-action`](https://github.com/DEFRA/cdp-build-action)'s `build-hotfix` action, which auto-increments the patch version using [`anothrNick/github-tag-action`](https://github.com/anothrNick/github-tag-action) (`DEFAULT_BUMP: patch`, `TAG_CONTEXT: branch`) based on the tags reachable from the branch's history.

#### Working around a duplicate version number

Because the next version is auto-computed from tags reachable from the branch, the computed version can collide with a tag that already exists — e.g. a release or another hotfix has been tagged since the hotfix branch diverged from `main`. When this happens, the publish fails because the version/tag already exists.

To work around this, temporarily override the auto-versioning by adding a `CUSTOM_TAG` entry to the `env:` block of [`publish-hotfix.yml`](./.github/workflows/publish-hotfix.yml):

```yaml
env:
  AWS_REGION: eu-west-2
  AWS_ACCOUNT_ID: '094954420758'
  CUSTOM_TAG: 2.18.2 # <-- pick the next unused version
```

Setting `CUSTOM_TAG` causes `github-tag-action` to skip auto-versioning entirely and use exactly the version provided.

1. Check the version currently deployed to `prod` in the [CDP portal](https://portal.cdp-int.defra.cloud/services/fcp-dal-api) and then check the existing tags (`git tag --list --sort=-v:refname | head`) to find the next free patch version for the prod `major.minor` version
2. Add the `CUSTOM_TAG` line above to `publish-hotfix.yml` on the hotfix branch and commit/push it.
3. Dispatch the `Publish Hot Fix` workflow from that branch.

> NOTE: this same technique (`CUSTOM_TAG`) is what the [Publish Dev Build workflow](#publish-dev-build-workflow) uses to guarantee a unique version on every dispatch.

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
