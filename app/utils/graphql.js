/**
 * Checks whether a given field is directly selected on the current GraphQL field's
 * selection set, e.g. to decide whether an expensive sub-resource should be fetched.
 *
 * Only inspects top-level `Field` selections - a `fieldName` selected via a fragment
 * will not be detected and this will return false even though the field is actually requested.
 *
 * @param {import('graphql').GraphQLResolveInfo} info - the resolver's `info` argument.
 * @param {string} fieldName - the field name to look for, e.g. 'geometry'.
 * @returns {boolean} true if `fieldName` is selected as a direct field.
 */
export function isFieldRequested(info, fieldName) {
  if (!info) {
    return false
  }

  const selections = info.fieldNodes.flatMap((node) => node.selectionSet?.selections ?? [])

  return selections.some(
    (selection) => selection.kind === 'Field' && selection.name.value === fieldName
  )
}
