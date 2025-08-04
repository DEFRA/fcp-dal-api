# DAL Homepage

## Environments

The DAL has the following environments:
| DAL Env | URL | Azure Entra Tenant - Tenant ID | KITS/Version1/RP Portal Env |
| ----------| ------------- | ----- | ------- |
| Dev | https://fcp-dal-api.dev.cdp-int.defra.cloud/graphql | No Auth required | Upstream mock - dev |
| Test | https://fcp-dal-api.test.cdp-int.defra.cloud/graphql | O365_DEFRADEV - 6f504113-6b64-43f2-ade9-242e05780007 | Upgrade |
| Ext-test | https://et.fcp-dal.api.defra.gov.uk/graphql | Defra - 770a2450-0227-4c62-90c7-4e38537f1102 | Perf |
| Perf-test | https://fcp-dal-api.perf-test.cdp-int.defra.cloud/graphql | Defra - 770a2450-0227-4c62-90c7-4e38537f1102 | Upstream mock - perf-test |
| Prod | https://fcp-dal-api.defra.gov.uk/graphql | Defra - 770a2450-0227-4c62-90c7-4e38537f1102 | Prod |

## Onboarding

The DAL requires a few things:

- Entra Security Group in the corresponding tenant for the DAL
- An App reg in your group to generate the token, with the groups exposed in the token
- Have the Group added to the DAL to provide access to the necessary fields (we do not currently use service accounts to call our upstreams as this is a WIP)
- A valid user email or Defra ID token for the user making the request for your service
  - **If Your service users do not have access to the RP Portal you will not be able to use the DAL currently**

**Note:** you must also request the app reg be updated to expose the security groups in the token, this is done by setting the following in the manifest json:
`"groupMembershipClaims": "SecurityGroup",`

So if your service is looking to connect to the Test environment you will need an app reg and Entra group created in the O365_DEFRADEV Azure tenant.

### Authenticating

All DAL environments other than Dev require a valid Microsoft OIDC token containing Groups that have been mapped withing the DAL to the corresponding access.

Your service will then need to generate a valid OIDC token containing the group claims,
you can do this by making the following POST request:

```shell
curl --location 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token' \
  --form 'client_id="{client_id}"' \
  --form 'scope="{client_id}/.default"' \
  --form 'client_secret="{client_secret}"' \
  --form 'grant_type="client_credentials"'
```
