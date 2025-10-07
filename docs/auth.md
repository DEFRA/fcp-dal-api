# DAL Authentication

The <abbr title="Data Access Layer">DAL</abbr> requires multiple things to be provided to successfully return a response.
**Please note the DAL on the <abbr title="Core Delivery Platform">CDP</abbr> `dev` environment has auth _disabled_ so will return a response to all requests**

## Required for all requests

- If making a request from a DEFRA environment, you will need to either be within the CDP network or request your IP to be whitelisted.  
  NOTE: the CDP `ext-test` and `prod` environments are externally accessible.
- You will need a valid Entra token containing a group that has already been provided and mapped to the corresponding access in the DAL. This **POST** request shows how to get a token:
  ```shell
  curl --location 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token' \
      --form 'client_id="{client_id}"' \
      --form 'scope="{client_id}/.default"' \
      --form 'client_secret="{client_secret}"' \
      --form 'grant_type="client_credentials"'
  ```

## Internal User requests

- The email address of the user making the request, sent in the `email` header.  
  NOTE: This email must match an account on the RP portal (with the correct permissions)

## External User requests

- Set `gateway-type` header to "**external**"
- Set `x-forwarded-authorization` header to a Defra ID token that contains the relevant <abbr title="Customer Reference Number">CRN</abbr> and <abbr title="Single Business Identifier">SBI</abbr> (if requesting business data)

[< back to Homepage](./homepage)
