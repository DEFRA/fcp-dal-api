import { html } from 'htm/react'
import { LinkedContacts } from './LinkedContacts.js'

import { AuthProvider } from './AuthProvider.js'

export function App(initialProps) {
  return html`
    <html lang="en">
      <head>
        <meta ...${{ charSet: 'utf-8' }} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React POC</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
        />
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/segoe-ui-4" />
        <link rel="stylesheet" href="/consolidated-view/static/styles.css" />
      </head>
      <body>
        <main>
          <${AuthProvider}>
            <${LinkedContacts} ...${initialProps} />
          <//>
        </main>

        <script id="initial-props" type="application/json">
          ${JSON.stringify(initialProps)}
        </script>

        <script type="importmap">
          ${JSON.stringify({
            imports: {
              '@azure/msal-browser': 'https://esm.sh/@azure/msal-browser',
              '@azure/msal-react': 'https://esm.sh/@azure/msal-react',
              'htm/react': 'https://esm.sh/htm/react',
              'react-dom/client': 'https://esm.sh/react-dom/client',
              minisearch: 'https://esm.sh/minisearch',
              react: 'https://esm.sh/react'
            }
          })}
        </script>

        <script type="module" src="/consolidated-view-react/app/client.js"></script>
      </body>
    </html>
  `
}
