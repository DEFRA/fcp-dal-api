import { html } from 'htm/react'
import { useState } from 'react'

async function fetchCustomer(crn, sbi) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      email: 'test.user01@defra.gov.uk'
    },
    body: JSON.stringify({
      query: `#graphql
        query SelectedCustomer($crn: ID!, $sbi: ID!) {
          customer(crn: $crn) {
            crn
            info {
              name {
                title
                otherTitle
                first
                middle
                last
              }
            }
            business(sbi: $sbi) {
              permissionGroups {
                id
                level
              }
              role
            }
          }
        }
        `,
      variables: {
        crn,
        sbi
      }
    })
  })

  return response.json()
}

export function LinkedContacts({ business, initialSelectedCustomer }) {
  const [selectedCustomer, setSelectedCustomer] = useState(initialSelectedCustomer)

  const displayName = `${selectedCustomer.info.name.first} ${selectedCustomer.info.name.last}`
  const fullName = `${selectedCustomer.info.name.title} ${selectedCustomer.info.name.first} ${selectedCustomer.info.name.middle} ${selectedCustomer.info.name.last}`

  return html`
    <div className="container">
      <div>
        <form className="search-input">
          <label>Search</label>
          <input name="search" placeholder="Enter search term" ...${{ autoComplete: 'off' }} />
          <button type="submit">Submit</button>
        </form>
        <div className="primary-table">
          <table>
            <thead>
              <tr>
                <th>CRN</th>
                <th>First Name</th>
                <th>Last Name</th>
              </tr>
            </thead>
            <tbody>
              ${business.customers.map((customer) => {
                return html`<tr
                  key=${customer.crn}
                  className=${customer.crn === selectedCustomer.crn ? 'selected' : ''}
                  onClick=${async () => {
                    setSelectedCustomer(
                      (await fetchCustomer(customer.crn, business.sbi)).data.customer
                    )
                  }}
                >
                  <td>${customer.crn}</td>
                  <td>${customer.firstName}</td>
                  <td>${customer.lastName}</td>
                </tr>`
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="divider"></div>
      <div>
        <h1>${displayName}</h1>

        <dl>
          <dt>CRN:</dt>
          <dd>${selectedCustomer.crn}</dd>
          <dt>Full Name:</dt>
          <dd>${fullName}</dd>
          <dt>Role:</dt>
          <dd>${selectedCustomer.business.role}</dd>
        </dl>

        <table className="even-columns">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            ${selectedCustomer.business.permissionGroups.map(
              (permissionGroup) => html`
                <tr key=${permissionGroup.id}>
                  <td>${permissionGroup.id}</td>
                  <td>${permissionGroup.level}</td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    </div>
  `
}
