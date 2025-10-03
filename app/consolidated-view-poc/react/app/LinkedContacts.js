import { html } from 'htm/react'
import MiniSearch from 'minisearch'
import { useMemo, useRef, useState } from 'react'

async function fetchCustomer({ email, crn, sbi }) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      email
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
                functions
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

async function fetchAuthenticateQuestions({ email, crn }) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      email
    },
    body: JSON.stringify({
      query: `#graphql
        query AuthenticateQuestions($crn: ID!) {
          customer(crn: $crn) {
            info {
              dateOfBirth
            }
            authenticationQuestions {
              isFound
              memorableDate
              memorableLocation
              memorableEvent
              updatedAt
            }
          }
        }
        `,
      variables: {
        crn
      }
    })
  })

  return response.json()
}

export function LinkedContacts({ email, business, indexedCustomers, initialSelectedCustomer }) {
  // Select customer
  const [selectedCustomer, setSelectedCustomer] = useState(initialSelectedCustomer)

  const displayName = `${selectedCustomer.info.name.first} ${selectedCustomer.info.name.last}`
  const fullName = `${selectedCustomer.info.name.title} ${selectedCustomer.info.name.first} ${selectedCustomer.info.name.middle} ${selectedCustomer.info.name.last}`

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const miniSearch = useMemo(
    () =>
      MiniSearch.loadJSON(indexedCustomers, {
        idField: 'crn',
        fields: ['firstName', 'lastName', 'crn'],
        storeFields: ['firstName', 'lastName', 'crn']
      }),
    [indexedCustomers]
  )

  const results = useMemo(() => {
    const found = miniSearch.search(searchQuery, { prefix: true, fuzzy: 0.2 })
    return found.length ? found : business.customers
  }, [miniSearch, searchQuery, business.customers])

  // Select permission
  const [selectedPermissionIndex, setSelectedPermissionIndex] = useState(0)
  const rightColumnRef = useRef(null)

  // Authentication question
  const [showAuthenticationQuestions, setShowAuthenticationQuestions] = useState(false)
  const [authenticationQuestions, setAuthenticationQuestions] = useState(false)

  return html`
    <div className="container">
      <div>
        <div className="search-input">
          <label>Search</label>
          <input
            name="search"
            placeholder="Enter search term"
            onChange=${(e) => setSearchQuery(e.target.value)}
            ...${{ autoComplete: 'off' }}
          />
        </div>
        <div className="primary-table clickable">
          <table>
            <thead>
              <tr>
                <th>CRN</th>
                <th>First Name</th>
                <th>Last Name</th>
              </tr>
            </thead>
            <tbody>
              ${results.map((customer) => {
                return html`<tr
                  key=${customer.crn}
                  className=${customer.crn === selectedCustomer.crn ? 'selected' : ''}
                  onClick=${async () => {
                    const newCustomer = await fetchCustomer({
                      email,
                      crn: customer.crn,
                      sbi: business.sbi
                    })
                    setSelectedCustomer(newCustomer.data.customer)
                    setSelectedPermissionIndex(0)
                    rightColumnRef.current.scrollTop = 0
                    setShowAuthenticationQuestions(false)
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
      <div ref=${rightColumnRef} className="right-column">
        <h1>${displayName}</h1>

        <div className="right-column-details-header">
          <dl>
            <dt>CRN:</dt>
            <dd>${selectedCustomer.crn}</dd>
            <dt>Full Name:</dt>
            <dd>${fullName}</dd>
            <dt>Role:</dt>
            <dd>${selectedCustomer.business.role}</dd>
          </dl>

          <button
            className="link-button"
            onClick=${async () => {
              if (showAuthenticationQuestions) {
                setShowAuthenticationQuestions(false)
              } else {
                const newAuthenticateQuestions = await fetchAuthenticateQuestions({
                  email,
                  crn: selectedCustomer.crn
                })
                setAuthenticationQuestions(newAuthenticateQuestions.data.customer)
                setShowAuthenticationQuestions(true)
              }
            }}
          >
            Show Authenticate Questions
          </button>
        </div>

        ${showAuthenticationQuestions
          ? html`<div>
              <table className="even-columns">
                <thead>
                  <tr>
                    <th>Date of Birth</th>
                    <th>Memorable Date</th>
                    <th>Memorable Event</th>
                    <th>Memorable Place</th>
                    <th>Updated Date</th>
                  </tr>
                </thead>
                <tbody>
                  <td>
                    ${new Intl.DateTimeFormat('en-GB').format(
                      new Date(authenticationQuestions.info.dateOfBirth)
                    )}
                  </td>
                  <td>${authenticationQuestions.authenticationQuestions.memorableDate}</td>
                  <td>${authenticationQuestions.authenticationQuestions.memorableEvent}</td>
                  <td>${authenticationQuestions.authenticationQuestions.memorableLocation}</td>
                  <td>
                    ${new Intl.DateTimeFormat('en-GB', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    }).format(new Date(authenticationQuestions.authenticationQuestions.updatedAt))}
                  </td>
                </tbody>
              </table>
            </div>`
          : html`<div>
              <table className="even-columns clickable">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedCustomer.business.permissionGroups.map(
                    (permissionGroup, index) => html`
                      <tr
                        key=${permissionGroup.id}
                        className=${index === selectedPermissionIndex ? 'selected' : ''}
                        onClick=${() => {
                          setSelectedPermissionIndex(index)
                        }}
                      >
                        <td>${permissionGroup.id}</td>
                        <td>${permissionGroup.level}</td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
              <table className="even-columns">
                <thead>
                  <tr>
                    <th>Permission Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedCustomer.business.permissionGroups[
                    selectedPermissionIndex
                  ].functions.map(
                    (permissionDescription) => html`
                      <tr key=${permissionDescription}>
                        <td>${permissionDescription}</td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            </div>`}
      </div>
    </div>
  `
}
