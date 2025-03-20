# Testing the KITS connection from the CDP terminal

## Prerequisites

Either a DEFRA device (on ZScaler VPN), or an active CPD (AWS) VPN session, is needed to access the CDP Portal. You will also need to sign-in to the portal to access the terminal.

## Test steps

Open the [terminal](https://portal.cdp-int.defra.cloud/services/fcp-dal-api/terminal) for the target environment.

Prepare the environment by extracting the KITS mTLS assets from the secrets:

```bash
aws secretsmanager get-secret-value \
    --secret-id "cdp/services/$SERVICE" \
    --query SecretString \
    --output text > secrets

jq -r '.KITS_CONNECTION_KEY'  secrets | base64 -d > key
jq -r '.KITS_CONNECTION_CERT' secrets | base64 -d > cert
export key_location=key
export cert_location=cert

alias curl='curl -x "$CDP_HTTPS_PROXY" ' # sets curl to use the CPD outbound squid proxy!
```

Now the test commands in the [`kits-gateway-test.sh`](./kits-gateway-test.sh) should work.
