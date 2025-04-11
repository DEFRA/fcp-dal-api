# Convenience script for handling local CDP emulation

help() {
    echo "Usage: $0 [OPERATION]"
    echo "OPERATION can be one of the following:"
    echo "  up:    start the CDP emulator environment"
    echo "  down:  stop the CDP emulator environment"
    echo "  debug: start with debug container, or add and jump into the debug container"
    echo "  help, -h, --help: show this help message"
}

# tear down the emulator environment
down() {
    docker compose \
        -f ./compose-cdp.yaml \
        -f ./compose-debug.yaml \
        down --remove-orphans
}

# start the emulator environment
up() {
    docker compose \
        -f ./compose-cdp.yaml \
        up --build
}

# start the emulator environment with debug container, or add it to an existing environment
debug() {
    services=`docker compose -f ./compose-cdp.yaml -f ./compose-debug.yaml ps --services`
    # check if the debug container is already running
    if [[ "${services}" =~ fcp-dal-dev ]]; then
        # attach to the existing debug container
        docker compose \
            -f ./compose-cdp.yaml \
            -f ./compose-debug.yaml \
            exec -it --rm fcp-dal-dev
    elif [ "${services}" ]; then
        # add the debug container to the emulator environment
        docker compose \
            -f ./compose-cdp.yaml \
            -f ./compose-debug.yaml \
            run -it --rm fcp-dal-dev
    else
        # start the emulator environment with debug container
        docker compose \
            -f ./compose-cdp.yaml \
            -f ./compose-debug.yaml \
            up --build
    fi
}

# switch to script directory
cd $(dirname $0)

# set necessary env vars
export KITS_CONNECTION_KEY=`cat ./mtls/client-cdp.key | base64 -w 0`
export KITS_CONNECTION_CERT=`cat ./mtls/client-cdp.crt | base64 -w 0`

# check operation
OPERATION=${1:-up}
case "${OPERATION}" in
    up)    down
           up ;;
    down)  down ;;
    debug) debug ;;
    help|-h|--help) help ;;
    *)
        echo "ERROR: if provided, OPERATION argument must be one of the following:" >&2
        echo "  up, down, debug" >&2
        echo
        help
        exit 1 ;;
esac
