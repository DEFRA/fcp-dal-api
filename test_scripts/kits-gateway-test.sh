curl --location "https://${gateway_url}:8444/extapi/person/search" \
--header "email: ${user_email}" \
--header 'Content-Type: application/json' \
--data '{
    "offset": 0,
    "limit": 20,
    "searchFieldType": "CUSTOMER_REFERENCE",
    "primarySearchPhrase": "9103020285",
    "secondarySearchPhrase": null
}' \
--cert ${cert_location} --key ${key_location}

curl --location "https://${gateway_url}:8444/extapi/organisation/search" \
--header "email: ${user_email}" \
--header 'Content-Type: application/json' \
--data '{"offset":0,"limit": 20, "searchFieldType":"SBI","primarySearchPhrase":"806327021"}' \
--cert ${cert_location} --key ${key_location}

curl --location "https://${gateway_url}:8444/extapi/authorisation/organisation/${org_id}" \
--header "email: ${user_email}" \
--cert ${cert_location} --key ${key_location}

curl --location "https://${gateway_url}:8444/extapi/organisation/person/${person_id}/summary?search=" \
--header "email: ${user_email}" \
--cert ${cert_location} --key ${key_location}
