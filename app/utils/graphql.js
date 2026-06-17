export function isFieldRequested(info, fieldName) {
  if (!info) {
    return false
  }

  const selections = info.fieldNodes.flatMap((node) => node.selectionSet?.selections ?? [])

  return selections.some(
    (selection) => selection.kind === 'Field' && selection.name.value === fieldName
  )
}
