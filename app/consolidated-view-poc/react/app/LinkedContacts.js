import { html } from 'htm/react'
import { useEffect, useRef, useState } from 'react'
import { GET_AUTHENTICATE_QUESTIONS, GET_BUSINESS_CUSTOMERS, GET_CUSTOMER } from './queries.js'
import { useLazyQuery, useQuery } from './useQuery.js'
import { useSearch } from './useSearch.js'

export function LinkedContacts({ sbi, email, preloaded }) {
  // Load list of business customers
  const { data: businessCustomers, loading: loadingBusinessCustomers } = useQuery(
    GET_BUSINESS_CUSTOMERS,
    {
      variables: { sbi },
      headers: { email },
      preloaded: preloaded.businessCustomers
    }
  )

  const { search: searchBusinessCustomers, results: businessCustomersSearchResults } = useSearch(
    businessCustomers?.business?.customers,
    {
      idField: 'crn',
      fields: ['firstName', 'lastName', 'crn'],
      storeFields: ['firstName', 'lastName', 'crn']
    }
  )

  // Create `getCustomer` query
  const [getCustomer, { data: selectedCustomer, loading: loadingSelectedCustomers }] = useLazyQuery(
    GET_CUSTOMER,
    {
      headers: { email },
      preloaded: preloaded.selectedCustomer
    }
  )

  // Execute `getCustomer` to get first customer in list
  useEffect(() => {
    if (businessCustomers?.business?.customers[0].crn) {
      getCustomer({ crn: businessCustomers?.business?.customers[0].crn, sbi })
    }
  }, [businessCustomers])

  // Authenticate questions
  const [
    getAuthenticationQuestions,
    { data: authenticationQuestions, loading: loadingAuthenticationQuestions }
  ] = useLazyQuery(GET_AUTHENTICATE_QUESTIONS, {
    headers: { email }
  })

  const [showAuthenticationQuestions, setShowAuthenticationQuestions] = useState(false)

  useEffect(() => {
    if (
      (showAuthenticationQuestions && !authenticationQuestions) ||
      (showAuthenticationQuestions &&
        authenticationQuestions?.customer?.crn !== selectedCustomer?.customer?.crn)
    ) {
      getAuthenticationQuestions({ crn: selectedCustomer?.customer?.crn })
    }
  }, [showAuthenticationQuestions])

  const [selectedPermissionIndex, setSelectedPermissionIndex] = useState(0)
  const loadingLeftColumn = loadingBusinessCustomers
  const loadingRightColumn = loadingLeftColumn || !selectedCustomer || loadingSelectedCustomers

  // Reset right column scroll position when loading customer
  const rightColumnRef = useRef(null)
  useEffect(() => {
    rightColumnRef.current.scrollTop = 0
    setShowAuthenticationQuestions(false)
  }, [loadingSelectedCustomers])

  return html`
    <div className="container">
      <div className="column">
        <div className="search-input">
          <label>Search</label>
          <input
            name="search"
            placeholder="Enter search term"
            ...${{ autoComplete: 'off' }}
            onChange=${(e) => {
              searchBusinessCustomers(e.target.value)
            }}
          />
        </div>
        <div className="primary-table">
          <table>
            <thead>
              <tr>
                <th>CRN</th>
                <th>First Name</th>
                <th>Last Name</th>
              </tr>
            </thead>
            ${businessCustomersSearchResults.length
              ? html`<tbody className="clickable">
                  ${businessCustomersSearchResults.map((customer) => {
                    return html`<tr
                      key=${customer.crn}
                      className=${!loadingRightColumn &&
                      customer.crn === selectedCustomer?.customer?.crn
                        ? 'selected'
                        : ''}
                      onClick=${() => getCustomer({ crn: customer.crn, sbi })}
                    >
                      <td>${customer.crn}</td>
                      <td>${customer.firstName}</td>
                      <td>${customer.lastName}</td>
                    </tr>`
                  })}
                </tbody>`
              : html`<tbody>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXXXXX</div></td>
                  </tr>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXXXXXXX</div></td>
                  </tr>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXXXX</div></td>
                  </tr>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXXX</div></td>
                  </tr>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXXXXXXXX</div></td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                </tbody>`}
          </table>
        </div>
      </div>

      <div className="divider"></div>

      <div ref=${rightColumnRef} className="column right-column">
        ${!loadingRightColumn
          ? html`<h1>
              <div>
                ${`${selectedCustomer?.customer?.info?.name?.first} ${selectedCustomer?.customer?.info?.name?.last}`}
              </div>
            </h1>`
          : html`<h1>
              <div className="loading-placeholder">XXXXX XXXXXXXXX</div>
            </h1>`}

        <div className="right-column-details-header">
          ${!loadingRightColumn
            ? html`<dl>
                <dt>CRN:</dt>
                <dd>${selectedCustomer?.customer?.crn}</dd>
                <dt>Full Name:</dt>
                <dd>
                  ${`${selectedCustomer?.customer?.info?.name?.title} ${selectedCustomer?.customer?.info?.name?.first} ${selectedCustomer?.customer?.info?.name?.middle} ${selectedCustomer?.customer?.info?.name?.last}`}
                </dd>
                <dt>Role:</dt>
                <dd>${selectedCustomer?.customer?.business?.role}</dd>
              </dl>`
            : html`<dl>
                <dt>CRN:</dt>
                <dd className="loading-placeholder">XXXXXXXXX</dd>
                <dt>Full Name:</dt>
                <dd className="loading-placeholder">XXXXXXXXXXXXXXXXX</dd>
                <dt>Role:</dt>
                <dd className="loading-placeholder">XXXXXXXX</dd>
              </dl>`}

          <button
            className="link-button"
            onClick=${() => setShowAuthenticationQuestions(!showAuthenticationQuestions)}
          >
            ${showAuthenticationQuestions ? 'Show Permissions' : 'Show Authenticate Questions'}
          </button>
        </div>

        ${!showAuthenticationQuestions &&
        html`<div>
          <table className="even-columns">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Level</th>
              </tr>
            </thead>
            ${!loadingRightColumn
              ? html`<tbody className="clickable">
                  ${selectedCustomer?.customer?.business?.permissionGroups.map(
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
                </tbody>`
              : html`<tbody>
                  <tr>
                    <td>
                      <div className="loading-placeholder">BASIC_PAYMENT_SCHEME</div>
                    </td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="loading-placeholder">BUSINESS_DETAILS</div>
                    </td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="loading-placeholder">COUNTRYSIDE_STEWARDSHIP_AGREEMENTS</div>
                    </td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="loading-placeholder">
                        COUNTRYSIDE_STEWARDSHIP_APPLICATIONS
                      </div>
                    </td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="loading-placeholder">ENTITLEMENTS</div>
                    </td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                  <tr>
                    <td>
                      <div className="loading-placeholder">
                        ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS
                      </div>
                    </td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                  <tr>
                    <td><div className="loading-placeholder">LAND_DETAILS</div></td>
                    <td><div className="loading-placeholder">XXXXXX</div></td>
                  </tr>
                </tbody>`}
          </table>
          <table className="even-columns">
            <thead>
              <tr>
                <th>Permission Description</th>
              </tr>
            </thead>
            ${!loadingRightColumn
              ? html`<tbody>
                  ${selectedCustomer?.customer?.business?.permissionGroups[
                    selectedPermissionIndex
                  ].functions.map(
                    (permissionDescription) => html`
                      <tr key=${permissionDescription}>
                        <td><div>${permissionDescription}</div></td>
                      </tr>
                    `
                  )}
                </tbody>`
              : html`<tbody>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXXXXXXX</div></td>
                  </tr>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXXXX</div></td>
                  </tr>
                  <tr>
                    <td><div className="loading-placeholder">XXXXXXXXXXXXXXXXXXXXXXX</div></td>
                  </tr>
                </tbody>`}
          </table>
        </div>`}
        ${showAuthenticationQuestions &&
        html`<div>
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
            ${!loadingAuthenticationQuestions
              ? html`<tbody>
                  <td>
                    <div>
                      ${selectedCustomer?.customer?.info?.dateOfBirth
                        ? new Intl.DateTimeFormat('en-GB').format(
                            new Date(selectedCustomer?.customer?.info?.dateOfBirth)
                          )
                        : ''}
                    </div>
                  </td>
                  <td>
                    <div>
                      ${authenticationQuestions?.customer?.authenticationQuestions?.memorableDate}
                    </div>
                  </td>

                  <td>
                    <div>
                      ${authenticationQuestions?.customer?.authenticationQuestions?.memorableEvent}
                    </div>
                  </td>
                  <td>
                    <div>
                      ${authenticationQuestions?.customer?.authenticationQuestions
                        ?.memorableLocation}
                    </div>
                  </td>
                  <td>
                    <div>
                      ${authenticationQuestions?.customer?.authenticationQuestions?.updatedAt
                        ? new Intl.DateTimeFormat('en-GB', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          }).format(
                            new Date(
                              authenticationQuestions?.customer?.authenticationQuestions?.updatedAt
                            )
                          )
                        : ''}
                    </div>
                  </td>
                </tbody>`
              : html`<tbody>
                  <td>
                    <div className="loading-placeholder">XXXXXXXXXX</div>
                  </td>
                  <td>
                    <div className="loading-placeholder">XXXXXXXXXX</div>
                  </td>
                  <td>
                    <div className="loading-placeholder">XXXXXXXXXX</div>
                  </td>
                  <td>
                    <div className="loading-placeholder">XXXXXXXXXXXX</div>
                  </td>
                  <td>
                    <div className="loading-placeholder">XXXXXXXXXX</div>
                  </td>
                </tbody> `}
          </table>
        </div>`}
      </div>
    </div>
  `
}
