docker compose up --quiet-pull --build -d
set +e
npm i graphql-request
curl -s --max-time 10 --retry 5 --retry-delay 1 --retry-all-errors http://localhost:3000/health
npx jest --coverage false test/acceptance/local-dev-check.test.js
RESULT=$?
docker compose down --remove-orphans
set -e
exit $RESULT
