---
redirect_from: /homepage
---

# FCP Data Access Layer (DAL)

The Data Access Layer (<abbr title="Data Access Layer">DAL</abbr>) is a GraphQL API for the Farming and Countryside Programme (FCP). It's hosted on the Core Development Platform (CDP) and gives consuming services, such as Consolidated View and Single Front Door, one authenticated, consistent way to query Rural Payments Agency (RPA) data about businesses (organisations), customers (people) and related information. Behind the scenes it fetches that data through KITS/Version1, from data sources including SITI Agri, the Rural Payments Portal and the Land Management System (LMS).

## Getting started

This section is for teams building a service that uses the DAL. It shows how to make your first request and what changes when you move to an authenticated environment.

### 1. Explore the schema

The DAL is a single GraphQL endpoint: every request is a `POST` to `/graphql`. To view the schema, open the <a href="https://fcp-dal-api.api.dev.cdp-int.defra.cloud/graphql" target="_blank" rel="noopener">dev Apollo playground</a> in your browser, then go to **Schema** > **Schema Definition**. In dev you can query any part of the schema. In higher environments, what you can query depends on the access your Entra group has been given (see [DAL Schema Authorization](./schema-auth)).

### 2. Point your service at a mock-backed DAL

While you build your service you don't need real data or credentials. Use the CDP dev environment: <a href="https://fcp-dal-api.dev.cdp-int.defra.cloud/graphql" target="_blank" rel="noopener">`https://fcp-dal-api.dev.cdp-int.defra.cloud/graphql`</a>. Auth is disabled, but your service must be on the CDP network.

Dev is backed by the [upstream mock](https://github.com/DEFRA/fcp-dal-upstream-services-mock), so the data is fake. The test businesses and customers, with their SBIs and CRNs, are listed in [`id-lookups.js`](https://github.com/DEFRA/fcp-dal-upstream-services-mock/blob/main/src/factories/id-lookups.js).

### 3. Make a request

For example, to get a business and its customers from your service:

```js
const response = await fetch(DAL_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-cdp-request-id': requestId,
    email: 'test.user@defra.gov.uk'
  },
  body: JSON.stringify({
    query: `
      query Business($sbi: ID!) {
        business(sbi: $sbi) {
          sbi
          info {
            name
          }
          customers {
            crn
            firstName
            lastName
          }
        }
      }
    `,
    variables: { sbi: '811111111' }
  })
})
const { data, errors } = await response.json()
```

Even in dev, a request that fetches data needs a header saying who it's for, or it fails with `UNPROCESSABLE ENTITY`. In dev any email address works (see step 4 for the other options).

GraphQL returns errors in the `errors` array, often with a `200` status, so check it as well as the HTTP status.

A response can also be partial: it can contain both `data` and `errors`. If one field fails, for example because an upstream system is unavailable or you don't have access to that field, the DAL still returns the fields that succeeded. The failed field comes back as `null`, and its entry in `errors` has a `path` showing which field it was:

```json
{
  "data": {
    "business": {
      "sbi": "811111111",
      "info": { "name": "Example Farm Ltd" },
      "customers": null
    }
  },
  "errors": [
    {
      "message": "...",
      "path": ["business", "customers"]
    }
  ]
}
```

So don't treat `data` being present as success. Check `errors` too, and decide whether your service can carry on with the fields it did get.

Send an `x-cdp-request-id` header with every request so it can be traced across services. If your service is on CDP, pass on the `x-cdp-request-id` from the request your service received, so the same ID follows the whole journey. The DAL uses it as the trace ID in its logs and as the correlation ID on its audit events. If you don't send one, the DAL generates its own, and you won't be able to match its logs to yours.

### 4. Move to an authenticated environment

Before you can use Test and the environments above it, you need to:

1. Complete [Onboarding](#onboarding) so your Entra group is mapped to the parts of the schema you need.
2. Add an `Authorization: Bearer <token>` header with an Entra token for your app registration.
3. Add a header that identifies who the request is for: `email` for internal users, `x-forwarded-authorization` for Defra ID users, or `service-account` for requests with no user.

The request body stays the same as in step 3. Only the headers change.

| Access method   | Description                                                      | Header                      | Access rights                                                                                                                                     |
| --------------- | ---------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Internal user   | A user signed in with a Defra account, such as call centre staff | `email`                     | Whatever their RP portal account is permitted to see and do. Can use queries and mutations                                                        |
| External user   | A customer signed in with Defra ID                               | `x-forwarded-authorization` | Only their own customer record (the CRN in their token) and the businesses they're linked to (SBIs in their token). Can use queries and mutations |
| Service account | A request with no user behind it, such as a batch job            | `service-account`           | Queries only. Mutations are blocked unless your Entra group has admin access. Fields restricted to internal or external users are not available   |

Whichever method you use, your Entra group also limits which parts of the schema you can reach (see [Onboarding](#onboarding)).

#### Internal user

For a user signed in with a Defra account, such as call centre staff. The email must match an account on the RP portal with the right permissions.

```js
headers: {
  'Content-Type': 'application/json',
  'x-cdp-request-id': requestId,
  Authorization: `Bearer ${entraToken}`,
  email: user.email
}
```

#### External user

For a customer signed in with Defra ID. Pass on their Defra ID token as it is, without a `Bearer` prefix. It must contain the CRN, and the SBI if you're requesting business data.

```js
headers: {
  'Content-Type': 'application/json',
  'x-cdp-request-id': requestId,
  Authorization: `Bearer ${entraToken}`,
  'x-forwarded-authorization': defraIdToken
}
```

#### Service account

For requests with no user behind them, such as a batch job. Send the service account's email address in the `service-account` header, not the `email` header.

```js
headers: {
  'Content-Type': 'application/json',
  'x-cdp-request-id': requestId,
  Authorization: `Bearer ${entraToken}`,
  'service-account': serviceAccountEmail
}
```

Send only one of `email`, `x-forwarded-authorization` or `service-account` on each request. [DAL Authentication](./auth) has more detail on each, including how to get an Entra token.

## Environments

For each environment, the <a href="https://portal.cdp-int.defra.cloud/services/fcp-dal-api" target="_blank" rel="noopener">CDP portal</a> shows the version currently deployed, the gateway and internal URLs, and links to the logs.

The <abbr title="Data Access Layer">DAL</abbr> has the following environments:

| DAL CDP Env | URL                                                       | Azure Entra Tenant | KITS/Version1/RP Portal Env |
| ----------- | --------------------------------------------------------- | ------------------ | --------------------------- |
| Dev         | https://fcp-dal-api.dev.cdp-int.defra.cloud/graphql       | No auth required   | Upstream mock - dev         |
| Test        | https://fcp-dal-api.test.cdp-int.defra.cloud/graphql      | O365_DEFRADEV      | Upgrade                     |
| Ext-test    | https://et.fcp-dal.api.defra.gov.uk/graphql               | Defra              | Perf                        |
| Perf-test   | https://fcp-dal-api.perf-test.cdp-int.defra.cloud/graphql | Defra              | Upstream mock - perf-test   |
| Prod        | https://fcp-dal-api.defra.gov.uk/graphql                  | Defra              | Prod                        |

> NOTE: the Tenant ID for Test is `6f504113-6b64-43f2-ade9-242e05780007` (O365_DEFRADEV), all higher environments use the Prod DEFRA Tenant `770a2450-0227-4c62-90c7-4e38537f1102`

> **Note on WIP environments:** The `dev` and `perf-test` environments are backed by the upstream mock service rather than a real KITS or Hitachi instance. This is relevant for the `@wip` directive, which only includes work-in-progress fields in mock-backed environments.

## Onboarding

The DAL requires a few things:

- Entra Security Group in the corresponding tenant for the DAL
- An "App Reg" in your Group to generate the auth token, with the groups exposed in the token
- Supply the Group ID to the DAL Team to provide access to the necessary fields
- A valid internal user email, Defra ID token, or service account email for the user making the request for your service
  - See [Service account](https://eaflood.atlassian.net/wiki/spaces/FDM/pages/6535938295/Service+account) for instructions on requesting a service account <!-- sfd-id-check: allow -->
  - **If your service users do not have access to the RP Portal you will not be able to use the DAL currently**

**Note:** you must also request the app reg be updated to expose the security groups in the token, this is done by setting the following in the manifest JSON:
`"groupMembershipClaims": "SecurityGroup",`

Example: if your service is looking to connect to the Test environment you will need an App Reg and Entra Group created in the `O365_DEFRADEV` Azure tenant (see) [Environments](#Environments).

## Authenticating

All DAL environments (except Dev) require a valid Microsoft OIDC token (with the Group setup as described in the [Onboarding](#Onboarding) section above). There are also some other requirements depending on the type of request, please see the [DAL Authentication](./auth) guide for details.

## More Info

- [DAL Architecture](./architecture) - how the DAL fits into CDP, its upstream and downstream services, and the testing strategy
- [DAL Authentication](./auth) - what each request needs to provide to authenticate with the DAL
- [DAL Schema Authorization](./schema-auth) - how the `@auth` directive controls which parts of the schema a caller can use
