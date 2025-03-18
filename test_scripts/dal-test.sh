# Generate token
token_request=$(curl --location "https://login.microsoftonline.com/${dal_tenant_id}/oauth2/v2.0/token" \
--header 'content-type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode "scope=${dal_scope}" \
-u "${dal_client_id}:${dal_client_secret}")

token=$(jq -r  '.access_token' <<< "${token_request}")
echo "Token: ${token}"


# Authenticate questions
curl --location "${dal_url}" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${token}" \
--data '{"query":"query Customer ($crn: ID!) {\n    customer(crn: $crn) {\n        crn\n        authenticationQuestions {\n            isFound\n            updatedAt\n            memorableDate\n            memorableEvent\n            memorableLocation\n        }\n    }\n}","variables":{"crn":"9103020285"}}'

# Customer businesses
curl --location "${dal_url}" \
--header "Email: ${user_email}" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${token}" \
--data '{"query":"query Customer ($crn: ID!) {\n    customer(crn: $crn) {\n        personId\n        crn\n        businesses {\n            sbi\n            name\n        }\n    }\n}","variables":{"crn":"9103020285"}}'

# Customer permissions
curl --location "${dal_url}" \
--header "Email: ${user_email}" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${token}" \
--data '{"query":"query Customer ($crn: ID!, $sbi: ID!) {\n    customer(crn: $crn) {\n        crn\n        business(sbi: $sbi) {\n            role\n            permissionGroups {\n                level\n                id\n            }\n        }\n    }\n}","variables":{"crn":"9103020285","sbi":"806833558"}}'

# Business customers
curl --location 'https://fcp-data-access-layer-api.tst1.adp.defra.gov.uk/graphql' \
--header "Email: ${user_email}" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${token}" \
--data '{"query":"query BusinessCustomers ($sbi: ID!) {\n    business(sbi: $sbi) {\n        customers {\n            firstName\n            lastName\n            crn\n        }\n    }\n}","variables":{"sbi":"890000004"}}'

# Business customer permissions
curl --location "${dal_url}" \
--header "Email: ${user_email}" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${token}" \
--data '{"query":"query BusinessCustomer ($sbi: ID!, $crn: ID!) {\n    business(sbi: $sbi) {\n        customer(crn: $crn) {\n            role\n            permissionGroups {\n                level\n                id\n            }\n        }\n    }\n}","variables":{"sbi":"890000004","crn":"9100071369"}}'