import { Kind } from 'graphql'

const isSelected = (selections, fieldName, fragments) =>
  selections.some((selection) => {
    if (selection.kind === Kind.FIELD) {
      return selection.name.value === fieldName
    }
    // Otherwise an inline fragment, or a fragment spread whose definition is in info.fragments
    const selectionSet =
      selection.kind === Kind.INLINE_FRAGMENT
        ? selection.selectionSet
        : fragments?.[selection.name.value]?.selectionSet
    return selectionSet ? isSelected(selectionSet.selections, fieldName, fragments) : false
  })

/**
 * Checks whether a field is selected directly on the current GraphQL field's selection set
 * (including via inline fragments and fragment spreads), e.g. to decide whether an expensive
 * upstream resource should be requested.
 *
 * @param {import('graphql').GraphQLResolveInfo} [info] - the resolver's `info` argument.
 * @param {string} fieldName - the field name to look for, e.g. 'geometry'.
 * @returns {boolean} true if `fieldName` is selected.
 */
export function isFieldRequested(info, fieldName) {
  if (!info?.fieldNodes) {
    return false
  }

  const selections = info.fieldNodes.flatMap((node) => node.selectionSet?.selections ?? [])

  return isSelected(selections, fieldName, info.fragments)
}
