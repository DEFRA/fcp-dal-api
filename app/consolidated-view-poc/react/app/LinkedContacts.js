import { html } from 'htm/react'
import { useEffect, useRef, useState } from 'react'
import { GET_AUTHENTICATE_QUESTIONS, GET_BUSINESS_CUSTOMERS, GET_CUSTOMER } from './queries.js'
import { useLazyQuery, useQuery } from './useQuery.js'

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
    if (businessCustomers?.data?.business?.customers[0].crn) {
      getCustomer({ crn: businessCustomers?.data?.business?.customers[0].crn, sbi })
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
        authenticationQuestions?.data?.customer?.crn !== selectedCustomer?.data?.customer?.crn)
    ) {
      getAuthenticationQuestions({ crn: selectedCustomer?.data?.customer?.crn })
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
          <input name="search" placeholder="Enter search term" ...${{ autoComplete: 'off' }} />
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
              ${businessCustomers?.data?.business?.customers.map((customer) => {
                return html`<tr
                  key=${customer.crn}
                  className=${!loadingRightColumn &&
                  customer.crn === selectedCustomer?.data?.customer?.crn
                    ? 'selected'
                    : ''}
                  onClick=${() => getCustomer({ crn: customer.crn, sbi })}
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

      <div
        ref=${rightColumnRef}
        className=${loadingRightColumn ? 'column right-column loading' : 'column right-column'}
      >
        <h1>
          <div className="loading-placeholder">
            ${`${selectedCustomer?.data?.customer?.info?.name?.first} ${selectedCustomer?.data?.customer?.info?.name?.last}`}
          </div>
        </h1>

        <div className="right-column-details-header">
          <dl>
            <dt>CRN:</dt>
            <dd className="loading-placeholder">${selectedCustomer?.data?.customer?.crn}</dd>
            <dt>Full Name:</dt>
            <dd className="loading-placeholder">
              ${`${selectedCustomer?.data?.customer?.info?.name?.title} ${selectedCustomer?.data?.customer?.info?.name?.first} ${selectedCustomer?.data?.customer?.info?.name?.middle} ${selectedCustomer?.data?.customer?.info?.name?.last}`}
            </dd>
            <dt>Role:</dt>
            <dd className="loading-placeholder">
              ${selectedCustomer?.data?.customer?.business?.role}
            </dd>
          </dl>

          <button
            className="link-button"
            onClick=${() => setShowAuthenticationQuestions(!showAuthenticationQuestions)}
          >
            ${showAuthenticationQuestions ? 'Show Permissions' : 'Show Authenticate Questions'}
          </button>
        </div>

        ${!showAuthenticationQuestions &&
        html`<div>
          <table className="even-columns clickable">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              ${selectedCustomer?.data?.customer?.business?.permissionGroups.map(
                (permissionGroup, index) => html`
                  <tr
                    key=${permissionGroup.id}
                    className=${index === selectedPermissionIndex ? 'selected' : ''}
                    onClick=${() => {
                      setSelectedPermissionIndex(index)
                    }}
                  >
                    <td><div className="loading-placeholder">${permissionGroup.id}</div></td>
                    <td><div className="loading-placeholder">${permissionGroup.level}</div></td>
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
              ${selectedCustomer?.data?.customer?.business?.permissionGroups[
                selectedPermissionIndex
              ].functions.map(
                (permissionDescription) => html`
                  <tr key=${permissionDescription}>
                    <td><div className="loading-placeholder">${permissionDescription}</div></td>
                  </tr>
                `
              )}
            </tbody>
          </table>
        </div>`}
        ${showAuthenticationQuestions &&
        html`<div className=${loadingAuthenticationQuestions ? 'loading' : ''}>
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
                <div className="loading-placeholder">
                  ${selectedCustomer?.data?.customer?.info?.dateOfBirth
                    ? new Intl.DateTimeFormat('en-GB').format(
                        new Date(selectedCustomer?.data?.customer?.info?.dateOfBirth)
                      )
                    : ''}
                </div>
              </td>
              <td>
                <div className="loading-placeholder">
                  ${authenticationQuestions?.data?.customer?.authenticationQuestions?.memorableDate}
                </div>
              </td>

              <td>
                <div className="loading-placeholder">
                  ${authenticationQuestions?.data?.customer?.authenticationQuestions
                    ?.memorableEvent}
                </div>
              </td>
              <td>
                <div className="loading-placeholder">
                  ${authenticationQuestions?.data?.customer?.authenticationQuestions
                    ?.memorableLocation}
                </div>
              </td>
              <td>
                <div className="loading-placeholder">
                  ${authenticationQuestions?.data?.customer?.authenticationQuestions?.updatedAt
                    ? new Intl.DateTimeFormat('en-GB', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      }).format(
                        new Date(
                          authenticationQuestions?.data?.customer?.authenticationQuestions?.updatedAt
                        )
                      )
                    : ''}
                </div>
              </td>
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `
}
