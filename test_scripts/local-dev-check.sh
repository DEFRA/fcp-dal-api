docker compose up --quiet-pull --pull always --build -d
set +e
curl -s --max-time 10 --retry 5 --retry-delay 1 --retry-all-errors http://localhost:3000/health
export NODE_OPTIONS=--experimental-vm-modules
npx jest --coverage false test/acceptance/local-dev-check.test.js
RESULT=$?
docker compose down --remove-orphans
set -e
exit $RESULT
