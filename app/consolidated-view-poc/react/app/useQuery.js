import { useEffect, useState } from 'react'
import { useToken } from './AuthProvider.js'

export function useLazyQuery(query, { headers, preloaded = null }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(preloaded)
  const [error, setError] = useState(null)
  const [preloadedReturned, setPreloadedReturned] = useState(!preloaded)
  const { getToken } = useToken()

  return [
    async (variables) => {
      if (preloadedReturned) {
        setLoading(true)
        const token = await getToken()

        try {
          const response = await fetch('/consolidated-view/graphql', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              Authorization: `Bearer ${token}`,
              ...headers
            },
            body: JSON.stringify({
              query,
              variables
            })
          })
          const { data } = await response.json()
          setData(data)
        } catch (err) {
          setError(err)
        } finally {
          setLoading(false)
        }
      } else {
        setPreloadedReturned(true)
      }
    },
    { loading, data, error }
  ]
}

export function useQuery(query, { variables, headers, preloaded }) {
  const [execute, { loading, data, error }] = useLazyQuery(query, { headers, preloaded })
  const { isAuthenticated } = useToken()

  useEffect(() => {
    if (isAuthenticated) {
      execute(variables)
    }
  }, [isAuthenticated])

  return { loading, data, error }
}
