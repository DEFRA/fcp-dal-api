#!/bin/bash

set -e

# Get main directories, and switch to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${PROJECT_ROOT}"

# Check for command line argument
if [ "$1" == "test" ]; then
  COMPOSE_CMD="run"
  COMPOSE_SERVICE="test"
  TEST_CONTAINER=("-f" "${SCRIPT_DIR}/compose.yml")
elif [ "$1" == "up" ]; then
  COMPOSE_CMD=("up" "--no-attach" "mongodb")
else
  echo "Usage: $0 [up|test]"
  echo "  up   - Start CDP emulation environment for local testing and dev"
  echo "  test - Run acceptance tests against emulated CDP environment"
  exit 1
fi

# Generate TLS assets
echo "Generating TLS assets..."
rm -fr "${SCRIPT_DIR}/mtls"
"${SCRIPT_DIR}/setup-mtls.sh" kits-mock

# Load env variables from generated TLS assets
export KITS_CA_CERT="$(cat "${SCRIPT_DIR}/mtls/ca.crt" | base64 -w0)"
export KITS_MOCK_TLS_SERVER_KEY="$(cat "${SCRIPT_DIR}/mtls/server.key" | base64 -w0)"
export KITS_MOCK_TLS_SERVER_CERT="$(cat "${SCRIPT_DIR}/mtls/server.crt" | base64 -w0)"
export KITS_INTERNAL_CONNECTION_KEY="$(cat "${SCRIPT_DIR}/mtls/client.key" | base64 -w0)"
export KITS_INTERNAL_CONNECTION_CERT="$(cat "${SCRIPT_DIR}/mtls/client.crt" | base64 -w0)"

# Run docker compose
echo
echo "Starting CDP emulation..."
docker compose \
  -f "${PROJECT_ROOT}/compose.yml" \
  ${TEST_CONTAINER[@]} \
  -f "${SCRIPT_DIR}/cdp-mock-check.yml" \
  -f "${SCRIPT_DIR}/cdp-kits-emulation.yml" \
  ${COMPOSE_CMD[@]} \
  --build --quiet-pull \
  ${COMPOSE_SERVICE}

# clean-up generated TLS assets
echo
echo "Cleaning up TLS assets..."
rm -fr "${SCRIPT_DIR}/mtls"
