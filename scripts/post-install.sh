#!/bin/bash
set -euo pipefail

export PATH="./node_modules/.bin:$PATH"

echo ""
echo "npm scripts are disabled in this project (ignore-scripts=true) to defend against supply chain attacks."
echo "The following mandatory post-install scripts will now be executed."
if [ "${CI:-false}" != "true" ]; then
  echo "You will be prompted to confirm each command before it runs."
fi
echo ""

confirm_and_run() {
  if [ "${CI:-false}" != "true" ]; then
    printf 'You are about to run: %s\n' "$*"
    read -r -p "Please verify you are happy with the integrity of this command before proceeding. Enter yes to confirm [yes]: " response
    response="${response:-yes}"
    if [ "$response" != "yes" ]; then
      echo "Skipped."
      return 0
    fi
  fi
  "$@"
}

# Make prettier executable
confirm_and_run chmod +x ./node_modules/.bin/prettier

# Configure git hooks path — skipped outside a git repository (e.g. Docker builds)
if [ -d '.git' ]; then
  confirm_and_run node ./node_modules/husky/bin.js
else
  echo "Skipping husky: not a git repository."
fi
