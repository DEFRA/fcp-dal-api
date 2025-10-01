# DAL Homepage

## Environments

The <abbr title="Data Access Layer">DAL</abbr> has the following environments:

| DAL Env   | URL                                                       | Azure Entra Tenant | KITS/Version1/RP Portal Env |
| --------- | --------------------------------------------------------- | ------------------ | --------------------------- |
| Dev       | https://fcp-dal-api.dev.cdp-int.defra.cloud/graphql       | No auth required   | Upstream mock - dev         |
| Test      | https://fcp-dal-api.test.cdp-int.defra.cloud/graphql      | O365_DEFRADEV      | Upgrade                     |
| Ext-test  | https://et.fcp-dal.api.defra.gov.uk/graphql               | Defra              | Perf                        |
| Perf-test | https://fcp-dal-api.perf-test.cdp-int.defra.cloud/graphql | Defra              | Upstream mock - perf-test   |
| Prod      | https://fcp-dal-api.defra.gov.uk/graphql                  | Defra              | Prod                        |

> NOTE: the Tenant ID for Test is `6f504113-6b64-43f2-ade9-242e05780007` (O365_DEFRADEV), all higher environments use the Prod DEFRA Tenant `770a2450-0227-4c62-90c7-4e38537f1102`

## Onboarding

The DAL requires a few things:

- Entra Security Group in the corresponding tenant for the DAL
- An "App Reg" in your Group to generate the auth token, with the groups exposed in the token
- Supply the Group ID to the DAL Team to provide access to the necessary fields (we do not currently use service accounts to call our upstreams as this is a WIP)
- A valid user email or Defra ID token for the user making the request for your service
  - **If your service users do not have access to the RP Portal you will not be able to use the DAL currently**

**Note:** you must also request the app reg be updated to expose the security groups in the token, this is done by setting the following in the manifest JSON:
`"groupMembershipClaims": "SecurityGroup",`

Example: if your service is looking to connect to the Test environment you will need an App Reg and Entra Group created in the `O365_DEFRADEV` Azure tenant.

## Authenticating

All DAL environments (except Dev) require a valid Microsoft OIDC token (with the Group setup as described in the [Onboarding](#Onboarding) section above). There are also some other requirements depending on the type of request, please see the [DAL Authentication](./auth) guide for details.
