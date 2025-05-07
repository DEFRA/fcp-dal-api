import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const files = (importerFilePath) => ({
  getJSON: (path) => {
    try {
      const json = fs.readFileSync(join(dirname(fileURLToPath(importerFilePath)), path))
      return JSON.parse(json)
    } catch {
      return null
    }
  }
})

export default files
