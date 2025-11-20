import MiniSearch from 'minisearch'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useSearch(items = [], options) {
  const [results, setResults] = useState([])

  const miniSearchRef = useRef(new MiniSearch(options))

  useEffect(() => {
    miniSearchRef.current.removeAll()
    miniSearchRef.current.addAll(items)
  }, [items])

  return {
    search: useCallback((searchTerm) => {
      setResults(miniSearchRef.current.search(searchTerm, { prefix: true }))
    }, []),
    results: useMemo(() => (results.length ? results : items), [results, items])
  }
}
