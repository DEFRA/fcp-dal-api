FROM defradigital/node-development:latest-24

WORKDIR /app
RUN npm install graphql-request jest jsonwebtoken \
 && npm pkg set type=module "scripts.test"="NODE_OPTIONS=--experimental-vm-modules jest"
