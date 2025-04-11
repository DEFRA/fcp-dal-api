# Testing against the KITS service

## Prerequisites

Either a DEFRA device (on ZScaler VPN), or an active CPD (AWS) VPN session, is needed to access the CDP Portal. You will also need to sign-in to the portal to access the terminal.

## Testing from the CDP terminal

### Test steps

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

## Local testing via the CDP outbound proxy

From the `aws secrets` command output in the previous section, copy the `CDP_HTTPS_PROXY` value.
Now use that from `curl` (or other testing tools), as with the following example:

```bash
export CDP_HTTPS_PROXY=<copied-value>

curl -q \
    -L 'https://chs-upgrade-api.ruraldev.org.uk:8444/extapi/organisation/5613879' \
    -x "$CDP_HTTPS_PROXY" \
    --key key \
    --cert cert \
    -H 'Content-Type: application/json' \
    -H 'email: Test.User01@rpa.gov.uk' \
| jq
```

There is also a handy local forwarder that can be used to add helpful logging, which can be very useful when trying to resolve connectivity issues:

```bash
docker compose -f cdp-backdoor.yaml up

curl -q \
    -L 'https://chs-upgrade-api.ruraldev.org.uk:8444/extapi/organisation/5613879' \
    -x "http://localhost:3128" \
    --key key \
    --cert cert \
    -H 'Content-Type: application/json' \
    -H 'email: Test.User01@rpa.gov.uk' \
| jq
```
