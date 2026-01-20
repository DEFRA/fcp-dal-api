# Description: Setup mutual TLS for acceptance tests and CDP emulation

set -e

reuse_ca_help() {
    echo "To use an existing CA key/cert pair supply --key and --cert options:"
    echo "  $0 --key ./ca.key --cert ./ca.crt"
}

resolve_path() {
    local path="$1"
    if [ -f "${path}" ]; then
        echo "$(cd "$(dirname "${path}")" && pwd)/$(basename "${path}")"
    else
        echo "ERROR: file does not exist: ${path}" >&2
        reuse_ca_help
        exit 1
    fi
}

# setup variables
TEST_ASSET_TTL=3650 # ten years, but could be regenerated each test
GENERATE_CA=false

# parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --key)
            shift
            CA_KEY=`resolve_path $1` ;;
        --cert)
            shift
            CA_CERT=`resolve_path $1` ;;
        *) COMMON_NAME="$1" ;;
    esac
    shift
done

# check if CA key/cert pair was provided
if [ -z "${CA_KEY}" ]; then
    if [ -z "${CA_CERT}" ]; then
        CA_CERT="./mtls/ca.crt"
    else
        echo "ERROR: --key and --cert options must be used together" >&2
        reuse_ca_help
        exit 1
    fi
    GENERATE_CA=true
    CA_KEY="./mtls/ca.key"
    echo "Generating new CA key/cert pair."
    reuse_ca_help
    echo
elif [ -z "${CA_CERT}" ]; then
    echo "ERROR: --key and --cert options must be used together" >&2
    reuse_ca_help
    exit 1
fi

# use localhost if no common name was provided
if [ -z "${COMMON_NAME}" ]; then
    COMMON_NAME="localhost"
    echo "Using common name: ${COMMON_NAME}"
    echo "This can be changed by passing a command line argument to the script:"
    echo "  $0 my-common-name"
    echo
fi

# switch to script directory
cd $(dirname $0)

# ensure the mtls directory exists
mkdir -p mtls

# wrapper function to run openssl command and handle result
run_command() {
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
        if [ "$1" == "rm" ]; then
            echo -e "  \e[32m✔\e[0m remove certificate signing requests"
        else
            local asset=$(echo "$*" | awk '{
                for (i=1; i<NF; i++) 
                    if ($i == "-out") print $(i+1)
            }')
            echo -e "  \e[32m✔\e[0m ${operation}: \e[34m${asset}\e[0m"
        fi
    else
        echo -e "  \e[31m✖\e[0m could not ${operation}:\n ${cmd}" >&2
        exit 1
    fi
}

echo "Setting up mutual TLS assets..."

# setup CA assets
if ${GENERATE_CA} ; then
    run_command openssl genpkey \
        -algorithm RSA \
        -out ./mtls/ca.key \
        -aes-256-cbc \
        -pkeyopt rsa_keygen_bits:2048 \
        -pass pass:ca-password
    run_command openssl req -new \
        -key ./mtls/ca.key -passin pass:ca-password \
        -out ./mtls/ca.csr -subj '/CN=fcp-dal-acceptance-test-ca'
    run_command openssl x509 -req \
        -signkey ${CA_KEY} -passin pass:ca-password \
        -in ./mtls/ca.csr -out ${CA_CERT} \
        -days ${TEST_ASSET_TTL}
else
    echo "Skipping CA generation, using existing key/cert pair"
fi

# setup server assets
run_command openssl genpkey \
    -algorithm RSA \
    -out ./mtls/server.key \
    -pkeyopt rsa_keygen_bits:2048 \
    -pass pass:server-password
run_command openssl req -new \
    -key ./mtls/server.key -passin pass:server-password \
    -out ./mtls/server.csr -subj '/CN='"${COMMON_NAME}"
run_command openssl x509 -req \
    -in ./mtls/server.csr -out ./mtls/server.crt \
    -CA ${CA_CERT} -CAkey ${CA_KEY} -passin pass:ca-password \
    -days ${TEST_ASSET_TTL}

# setup client assets
run_command openssl genpkey \
    -algorithm RSA \
    -out ./mtls/client.key \
    -pkeyopt rsa_keygen_bits:2048 \
    -pass pass:client-password
run_command openssl req -new \
    -key ./mtls/client.key -passin pass:client-password \
    -out ./mtls/client.csr -subj '/CN='"${COMMON_NAME}"
run_command openssl x509 -req \
    -in ./mtls/client.csr -out ./mtls/client.crt \
    -CA ${CA_CERT} -CAkey ${CA_KEY} -passin pass:ca-password \
    -days ${TEST_ASSET_TTL}

# tidy up - remove CSR files
run_command rm ./mtls/*.csr

echo "MTLS setup complete"
