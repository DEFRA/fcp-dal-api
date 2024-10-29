# Generate token
token_request=$(curl --location "https://login.microsoftonline.com/${apim_tenant_id}/oauth2/v2.0/token" \
--header 'content-type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode "scope=${apim_scope}" \
-u "${apim_client_id}:${apim_client_secret}")

token=$(jq -r  '.access_token' <<< "${token_request}")
echo "Token: ${token}"


curl --location "https://${apim_url}/person/search" \
--header "email: ${user_email}" \
--header 'Content-Type: application/json' \
--data '{
    "offset": 0,
    "limit": 20,
    "searchFieldType": "CUSTOMER_REFERENCE",
    "primarySearchPhrase": "9103020285",
    "secondarySearchPhrase": null
}' \
--header "Authorization: Bearer ${token}" \
--header "Ocp-Apim-Subscription-Key: ${apim_subscription_key}"

curl --location "https://${apim_url}/organisation/search" \
--header "email: ${user_email}" \
--header 'Content-Type: application/json' \
--data '{"offset":0,"limit": 20, "searchFieldType":"SBI","primarySearchPhrase":"806327021"}' \
--header "Authorization: Bearer ${token}" \
--header "Ocp-Apim-Subscription-Key: ${apim_subscription_key}"

curl --location "https://${apim_url}/authorisation/organisation/${org_id}" \
--header "email: ${user_email}" \
--header "Authorization: Bearer ${token}" \
--header "Ocp-Apim-Subscription-Key: ${apim_subscription_key}"

curl --location "https://${apim_url}/organisation/person/${person_id}/summary?search=" \
--header "email: ${user_email}" \
--header "Authorization: Bearer ${token}" \
--header "Ocp-Apim-Subscription-Key: ${apim_subscription_key}"
