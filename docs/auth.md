# DAL Homepage

The DAL requires multiple things to be provided to succesfully return a response.
**Please note in Dev the DAL has auth disabled so will return a response to all requests**

## Required for all requests

- If making a request in a non-external environment (not ext-test or prod) you will need to either be within the CDP network or request your IP to be whitelisted.
- You will need a valid Entra token that contains a group that has been provided and mapped to the corresponding access in the DAL.

## Internal User requests

- An email address of a user within the RP portal that has the correct permissions sent in the email header.

## External User requests

- Set **gateway-type** header to "external"
- A Defra ID token that contains the relevant CRN and SBI (if requesting business data) for your query sent through in the **x-forwarded-authorization** header
