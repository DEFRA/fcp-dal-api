ARG PARENT_VERSION=latest-22
ARG PORT=3000
ARG PORT_DEBUG=9229

FROM defradigital/node-development:${PARENT_VERSION} AS base
WORKDIR /home/node
COPY test_scripts/setup-mtls.sh test_scripts/mtls/ca.* ./
RUN npm init -y

FROM base AS proxy-base
RUN npm i basic-auth-parser proxy

FROM base AS mock-base
RUN npm i @mocks-server/core http-status-codes

# Using "latest" as there are no specific version tags for distroless images
# sonarqube-ignore-next-line
FROM gcr.io/distroless/nodejs22-debian12 AS proxy
WORKDIR /home/nonroot
COPY --from=proxy-base /home/node/node_modules /home/nonroot/node_modules
COPY test/acceptance/fake-squid-proxy.js /home/nonroot/
CMD ["/home/nonroot/fake-squid-proxy.js"]

# sonarqube-ignore-next-line
FROM gcr.io/distroless/nodejs22-debian12 AS kits-mock
WORKDIR /home/nonroot
COPY --from=mock-base /home/node/node_modules /home/nonroot/node_modules
COPY mocks /home/nonroot/
CMD ["/home/nonroot/index.js"]

# Development and general purpose
FROM defradigital/node-development:${PARENT_VERSION} AS development
ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=defradigital/node-development:${PARENT_VERSION}

USER root
RUN apk add --no-cache curl jq
USER node
ARG PORT
ARG PORT_DEBUG
ENV PORT=${PORT}
EXPOSE ${PORT} ${PORT_DEBUG}

COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node app ./app
COPY --chown=node:node test ./test
COPY --chown=node:node mocks ./mocks
COPY --chown=node:node test_scripts ./test_scripts
CMD [ "npm", "run", "start:watch" ]

# Production
FROM defradigital/node:${PARENT_VERSION} AS production
ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=defradigital/node:${PARENT_VERSION}

# Add curl to image
# CDP PLATFORM HEALTHCHECK REQUIREMENT
USER root
RUN apk add --no-cache curl
USER node

COPY package*.json ./
RUN npm ci --omit=dev \
 && rm -fr .npm

ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

COPY app/ ./app/
CMD [ "node", "app" ]
