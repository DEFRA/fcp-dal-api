const listResult = {
  data: {
    business: {
      sbi: '107591843',
      customers: [
        {
          personId: '11111111',
          firstName: 'Gerhard',
          lastName: 'Purdy',
          crn: '1111111100',
          role: 'Business Partner'
        },
        {
          personId: '11111112',
          firstName: 'Odie',
          lastName: 'Lueilwitz',
          crn: '1111111200',
          role: 'Business Partner'
        },
        {
          personId: '11111113',
          firstName: 'Don',
          lastName: 'Stracke',
          crn: '1111111300',
          role: 'Business Partner'
        },
        {
          personId: '11111114',
          firstName: 'Tatum',
          lastName: 'McLaughlin',
          crn: '1111111400',
          role: 'Business Partner'
        },
        {
          personId: '11111115',
          firstName: 'Antwon',
          lastName: 'Mann',
          crn: '1111111500',
          role: 'Business Partner'
        },
        {
          personId: '11111116',
          firstName: 'Norris',
          lastName: 'Waters',
          crn: '1111111600',
          role: 'Business Partner'
        },
        {
          personId: '11111117',
          firstName: 'Marjorie',
          lastName: 'Simonis',
          crn: '1111111700',
          role: 'Business Partner'
        },
        {
          personId: '11111118',
          firstName: 'Cielo',
          lastName: 'Kohler',
          crn: '1111111800',
          role: 'Business Partner'
        },
        {
          personId: '11111119',
          firstName: 'Orlo',
          lastName: 'Kozey',
          crn: '1111111900',
          role: 'Business Partner'
        },
        {
          personId: '11111122',
          firstName: 'Richmond',
          lastName: 'Adams',
          crn: '1111112200',
          role: 'Business Partner'
        },
        {
          personId: '11111222',
          firstName: 'Oswaldo',
          lastName: 'Ortiz',
          crn: '1111122200',
          role: 'Business Partner'
        },
        {
          personId: '11112222',
          firstName: 'Anastasia',
          lastName: 'McCullough',
          crn: '1111222200',
          role: 'Business Partner'
        },
        {
          personId: '11122222',
          firstName: 'Forest',
          lastName: 'Murray',
          crn: '1112222200',
          role: 'Business Partner'
        },
        {
          personId: '11222222',
          firstName: 'Travis',
          lastName: 'Dooley',
          crn: '1122222200',
          role: 'Business Partner'
        },
        {
          personId: '12222222',
          firstName: 'Shad',
          lastName: 'Rau',
          crn: '1222222200',
          role: 'Business Partner'
        }
      ]
    }
  }
}

const selectedResult = {
  data: {
    business: {
      customer: {
        role: 'Business Partner',
        permissionGroups: [
          {
            id: 'BASIC_PAYMENT_SCHEME',
            level: 'SUBMIT',
            functions: [
              'View business summary',
              'View claims',
              'View land, features and covers',
              'Create and edit a claim',
              'Amend a previously submitted claim',
              'Amend land, features and covers',
              'Submit a claim',
              'Withdraw a claim',
              'Receive warnings and notifications'
            ]
          },
          {
            id: 'BUSINESS_DETAILS',
            level: 'FULL_PERMISSION',
            functions: [
              'View business details',
              'View people associated with the business',
              'Amend business and correspondence contact details',
              'Amend controlled information, such as business name',
              'Confirm business details',
              'Amend bank account details',
              'Make young/new farmer declaration',
              'Add someone to the business',
              'Give permissions on business'
            ]
          },
          {
            id: 'COUNTRYSIDE_STEWARDSHIP_AGREEMENTS',
            level: 'SUBMIT',
            functions: [
              'View CS Agreements',
              'View Land, Features and Cover',
              'View CS Agreement amendments',
              'View CS agreement Transfers',
              'View CS Claims',
              'Amend land, Features and Covers',
              'Create and edit a CS claim',
              'Amend a previously submitted claim',
              'Create and edit a CS agreement Amendment',
              'Revise a previously submitted agreement amendment',
              'Create and Edit a CS agreement transfer',
              'Revise a previously submitted agreement transfer',
              'Submit Acceptance of CS Agreement offer',
              'Submit rejection of CS agreement offer',
              'Submit (and resubmit) a CS claim',
              'Withdraw a CS claim',
              'Submit (and resubmit) a CS agreement amendment',
              'Withdraw a CS agreement amendment',
              'Submit (and resubmit) a CS agreement transfer',
              'Withdraw a CS agreement transfer',
              'Receive warnings and notifications'
            ]
          },
          {
            id: 'COUNTRYSIDE_STEWARDSHIP_APPLICATIONS',
            level: 'SUBMIT',
            functions: [
              'View CS Scheme eligibility',
              'View Applications',
              'View land, features and covers',
              'View CS agreement offer',
              'View draft CS Agreements',
              'Create and edit a CS application',
              'Amend a previously submitted CS application',
              'Amend Land, Features and Covers',
              'Submit CS Application',
              'Withdraw CS application',
              'Receive warnings and notifications'
            ]
          },
          {
            id: 'ENTITLEMENTS',
            level: 'AMEND',
            functions: ['View entitlements', 'Transfer entitlements', 'Apply for new entitlements']
          },
          {
            id: 'ENVIRONMENTAL_LAND_MANAGEMENT_APPLICATIONS',
            level: 'SUBMIT',
            functions: [
              'View Environmental Land Management scheme eligibility',
              'View Environmental Land Management applications',
              'View land, features and covers',
              'View Environmental Land Management agreement offer',
              'View Environmental Land Management agreements',
              'Create and edit a Environmental Land Management application',
              'Amend (but not resubmit) a previously submitted Environmental Land Management application',
              'Amend land, features and covers',
              'Submit Environmental Land Management application',
              'Withdraw Environmental Land Management application',
              'Submit acceptance of Environmental Land Management agreement offer',
              'Submit rejection of Environmental Land Management agreement offer',
              'Receive all application correspondence including all warnings and notifications'
            ]
          },
          {
            id: 'LAND_DETAILS',
            level: 'AMEND',
            functions: [
              'View land, features and covers',
              'Amend land, features and covers',
              'Transfer land'
            ]
          }
        ]
      }
    },
    customer: {
      crn: '1111111100',
      info: {
        name: {
          title: 'Mr.',
          first: 'Gerhard',
          middle: 'Shayna',
          last: 'Purdy'
        },
        dateOfBirth: '1955-04-23'
      }
    }
  }
}

const App = () => {
  return (
    <div className="container">
      <div>
        <form className="search-input">
          <label>Search</label>
          <input name="search" autoComplete="off" placeholder="Enter search term" />
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
            {listResult.data.business.customers.map((customer) => (
              <tr
                key={customer.crn}
                className="{% if customer.crn === selectedCrn %}selected{% endif %}"
              >
                <td>
                  <a href="#">{customer.crn}</a>
                </td>
                <td>
                  <a href="#">{customer.firstName}</a>
                </td>
                <td>
                  <a href="#">{customer.lastName}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divider"></div>
      <div>
        <h1>
          {selectedResult.data.customer.info.name.first}{' '}
          {selectedResult.data.customer.info.name.last}
        </h1>

        <dl>
          <dt>CRN:</dt>
          <dd>{selectedResult.data.customer.crn}</dd>
          <dt>Full Name:</dt>
          <dd>
            {selectedResult.data.customer.info.name.title}{' '}
            {selectedResult.data.customer.info.name.first}{' '}
            {selectedResult.data.customer.info.name.middle}{' '}
            {selectedResult.data.customer.info.name.last}
          </dd>
          <dt>Role:</dt>
          <dd>{selectedResult.data.business.customer.role}</dd>
        </dl>

        <table className="even-columns">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {selectedResult.data.business.customer.permissionGroups.map((permissionGroup) => (
              <tr key={permissionGroup.id}>
                <td>{permissionGroup.id}</td>
                <td>{permissionGroup.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
