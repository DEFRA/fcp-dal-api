.PHONY: dev
dev:
	docker compose -f docker-compose.dev.yaml up

.PHONY: test
test:
	docker compose -f docker-compose.test.yaml run ffc-customer-registry-api
