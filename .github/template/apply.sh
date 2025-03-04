#!/bin/bash

repository=$1
REPOSITORY_NAME=$(echo "${repository}" | awk -F'/' '{print $NF}')

find . -name .git -prune -o -name .github -prune -o -type f -exec sed -i "s/cdp-node-backend-template/${REPOSITORY_NAME}/g" {} \;
find . -name .git -prune -o -name .github -prune -o -type f -exec sed -i "s/CDP Node.js Backend Template/${REPOSITORY_NAME}/g" {} \;
contents="$(jq '.version = "0.0.0"' package.json)"
echo -E "${contents}" > package.json
contents="$(jq '.version = "0.0.0"' package-lock.json)"
echo -E "${contents}" > package-lock.json
contents="$(jq '.packages[""].version = "0.0.0"' package-lock.json)"
echo -E "${contents}" > package-lock.json
