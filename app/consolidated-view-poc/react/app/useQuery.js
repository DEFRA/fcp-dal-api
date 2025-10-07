import { useEffect, useState } from 'react'

export function useLazyQuery(query, { headers, preloaded = null }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(preloaded)
  const [error, setError] = useState(null)
  const [preloadedReturned, setPreloadedReturned] = useState(!preloaded)

  const execute = (variables) => {
    if (preloadedReturned) {
      setLoading(true)
      fetch('/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          query,
          variables
        })
      })
        .then((response) => response.json())
        .then(({ data }) => {
          setData(data)
          setLoading(false)
        })
        .catch((err) => {
          setError(err)
          setLoading(false)
        })
    } else {
      setPreloadedReturned(true)
    }
  }

  return [execute, { loading, data, error }]
}

export function useQuery(query, { variables, headers, preloaded }) {
  const [execute, { loading, data, error }] = useLazyQuery(query, { headers, preloaded })

  useEffect(() => {
    execute(variables)
  }, [])

  return { loading, data, error }
}
