import { html } from 'htm/react'

export function LinkedContacts({ listResult, selectedResult }) {
  const displayName = `${selectedResult.data.customer.info.name.first} ${selectedResult.data.customer.info.name.last}`
  const fullName = `${selectedResult.data.customer.info.name.title} ${selectedResult.data.customer.info.name.first} ${selectedResult.data.customer.info.name.middle} ${selectedResult.data.customer.info.name.last}`

  return html`
    <div className="container">
      <div>
        <form className="search-input">
          <label>Search</label>
          <input name="search" placeholder="Enter search term" ...${{ autoComplete: 'off' }} />
          <button type="submit">Submit</button>
        </form>
        <table className="small-first-column clickable">
          <thead>
            <tr>
              <th>CRN</th>
              <th>First Name</th>
              <th>Last Name</th>
            </tr>
          </thead>
          <tbody>
            ${listResult.data.business.customers.map(
              (customer) =>
                html`<tr key=${customer.crn} onClick=${() => console.log(customer.crn)}>
                  <td>${customer.crn}</td>
                  <td>${customer.firstName}</td>
                  <td>${customer.lastName}</td>
                </tr>`
            )}
          </tbody>
        </table>
      </div>
      <div className="divider"></div>
      <div>
        <h1>${displayName}</h1>

        <dl>
          <dt>CRN:</dt>
          <dd>${selectedResult.data.customer.crn}</dd>
          <dt>Full Name:</dt>
          <dd>${fullName}</dd>
          <dt>Role:</dt>
          <dd>${selectedResult.data.business.customer.role}</dd>
        </dl>

        <table className="even-columns">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            ${selectedResult.data.business.customer.permissionGroups.map(
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
