FROM defradigital/node-development:latest-24

USER node

WORKDIR /app
COPY .npmrc ./
RUN npm install --ignore-scripts graphql-request@7.3.1 jest@29.7.0 jsonwebtoken@9.0.2 \
 && npm pkg set type=module "scripts.test"="NODE_OPTIONS=--experimental-vm-modules jest"
