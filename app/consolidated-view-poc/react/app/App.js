import { html } from 'htm/react'
import { LinkedContacts } from './LinkedContacts.js'

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
          <${LinkedContacts} ...${initialProps} />
        </main>

        <script id="initial-props" type="application/json">
          ${JSON.stringify(initialProps)}
        </script>

        <script type="importmap">
          ${JSON.stringify({
            imports: {
              react: 'https://esm.sh/react',
              'react-dom/client': 'https://esm.sh/react-dom/client',
              'htm/react': 'https://esm.sh/htm/react'
            }
          })}
        </script>

        <script type="module" src="/consolidated-view-react/app/client.js"></script>
      </body>
    </html>
  `
}
