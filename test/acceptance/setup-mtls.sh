# Description: Setup mutual TLS for acceptance tests

set -e

# setup variables
TEST_ASSET_TTL=7 # one week, but probably regenerated each test
COMMON_NAME="${1:-localhost}"
echo "Using common name: ${COMMON_NAME}"
echo "This can be changed by passing a command line argument to the script:"
echo "  $0 my-common-name"
echo

# switch to acceptance test root directory
cd $(dirname $0)

# create clean mtls directory
rm -rf mtls
mkdir mtls

# wrapper function to run openssl command and handle result
run_openssl() {
    set +e
    
    local cmd="$*"    
    local operation=$2
    case "${operation}" in
        "genpkey") operation="generate private key" ;;
        "req")     operation="generate certificate signing request" ;;
        "x509")    operation="sign certificate" ;;
    esac

    ${cmd} &> /dev/null
    if [ $? -eq 0 ]; then
        local asset=$(echo "$*" | awk '{
            for (i=1; i<NF; i++) 
                if ($i == "-out") print $(i+1)
        }')
        echo -e "  \e[32m✔\e[0m ${operation}: \e[34m${asset}\e[0m"
    else
        echo -e "  \e[31m✖\e[0m could not ${operation}:\n ${cmd}" >&2
        exit 1
    fi
}

echo "Setting up mutual TLS assets..."

# setup CA assets
run_openssl openssl genpkey \
    -algorithm RSA \
    -out ./mtls/ca.key \
    -aes-256-cbc \
    -pkeyopt rsa_keygen_bits:2048 \
    -pass pass:ca-password
run_openssl openssl req -new \
    -key ./mtls/ca.key -passin pass:ca-password \
    -out ./mtls/ca.csr -subj "/CN=fcp-dal-acceptance-test-ca"
run_openssl openssl x509 -req \
    -signkey ./mtls/ca.key -passin pass:ca-password \
    -in ./mtls/ca.csr -out ./mtls/ca.crt \
    -days ${TEST_ASSET_TTL}

# setup server assets
run_openssl openssl genpkey \
    -algorithm RSA \
    -out ./mtls/server.key \
    -pkeyopt rsa_keygen_bits:2048 \
    -pass pass:server-password
run_openssl openssl req -new \
    -key ./mtls/server.key -passin pass:server-password \
    -out ./mtls/server.csr -subj "/CN=${COMMON_NAME}"
run_openssl openssl x509 -req \
    -in ./mtls/server.csr -out ./mtls/server.crt \
    -CA ./mtls/ca.crt -CAkey ./mtls/ca.key -passin pass:ca-password \
    -days ${TEST_ASSET_TTL}

# setup client assets
run_openssl openssl genpkey \
    -algorithm RSA \
    -out ./mtls/client.key \
    -pkeyopt rsa_keygen_bits:2048 \
    -pass pass:client-password
run_openssl openssl req -new \
    -key ./mtls/client.key -passin pass:client-password \
    -out ./mtls/client.csr -subj "/CN=${COMMON_NAME}"
run_openssl openssl x509 -req \
    -in ./mtls/client.csr -out ./mtls/client.crt \
    -CA ./mtls/ca.crt -CAkey ./mtls/ca.key -passin pass:ca-password \
    -days ${TEST_ASSET_TTL}

echo "MTLS setup complete"
