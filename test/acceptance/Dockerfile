FROM defradigital/node-development:3.2.4-node24.22.1

USER node

WORKDIR /app
RUN npm install --ignore-scripts --save-exact --min-release-age=7 \
     graphql-request@7.4.0 vitest@4.1.11 jsonwebtoken@9.0.2 \
 && npm pkg set type=module "scripts.test"="vitest run"
