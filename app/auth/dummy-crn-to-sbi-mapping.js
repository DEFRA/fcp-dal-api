const DIGITS = /^\d+$/

// Parses one `crn:sbi|sbi...` entry into [crn, Set<sbi>]
const parseEntry = (entry, position) => {
  const parts = entry.split(':').map((part) => part.trim())
  if (parts.length !== 2 || !DIGITS.test(parts[0])) {
    throw new Error(
      `Invalid DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING entry ${position}, expected "crn:sbi|sbi"`
    )
  }

  const [crn, sbiList] = parts
  const sbis = sbiList.split('|').map((sbi) => sbi.trim())
  if (!sbis.every((sbi) => DIGITS.test(sbi))) {
    throw new Error(`Invalid SBI in DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING entry ${position}`)
  }
  return [crn, new Set(sbis)]
}

/**
 * Parses the dev/test-only DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING value. The format is a comma
 * separated list of `dummyCrn:sbi|sbi...` entries, e.g.
 * `9100000001:810000000|810000001,9100000002:810000002`.
 *
 * @param {string | null | undefined} value the raw config value
 * @returns {Map<string, Set<string>>} dummy CRN to the SBIs it may access
 * @throws {Error} if the value is malformed
 */
export const parseDummyCrnToSbiMapping = (value) => {
  const mapping = new Map()
  if (!value?.trim()) {
    return mapping
  }
  value.split(',').forEach((entry, index) => {
    const [crn, sbis] = parseEntry(entry.trim(), index + 1)
    if (mapping.has(crn)) {
      throw new Error(`Duplicate CRN in DUMMY_DEFRA_ID_CRN_TO_SBI_MAPPING entry ${index + 1}`)
    }
    mapping.set(crn, sbis)
  })
  return mapping
}
