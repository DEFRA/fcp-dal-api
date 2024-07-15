.PHONY: dev
dev:
	docker compose -f docker-compose.dev.yaml up
token:
	@curl -s -d "grant_type=client_credentials" \
	-d "client_id=${CLIENT_ID}" \
	-d "scope=api://${CLIENT_ID}/.default" \
	-d "client_secret=${CLIENT_SECRET}" \
	-X POST h"ttps://login.microsoftonline.com/${API_TENANT_ID}/oauth2/v2.0/token" | jq -r '.access_token'
