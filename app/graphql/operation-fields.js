import { Kind } from 'graphql'

// Helpers for inspecting a parsed and validated GraphQL operation, e.g. from an Apollo plugin's
// `didResolveOperation` hook.
//
// A parsed query is a tree (AST) of nodes. The curly-brace block under an operation is its
// "selection set", and each entry in it is a "selection" of one of three kinds:
// - FIELD, e.g. `business(sbi: "810000000") { ... }`
// - INLINE_FRAGMENT, e.g. `... { business(...) { ... } }`, a block of fields nested inline
// - FRAGMENT_SPREAD, e.g. `...MyFragment`, a reference to fields defined elsewhere in the document

/**
 * Indexes the document's named fragments (`fragment MyFragment on Query { ... }`) by name, so
 * `...MyFragment` spreads can be followed.
 */
export function fragmentsByName(document) {
  return Object.fromEntries(
    document.definitions
      .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
      .map((definition) => [definition.name.value, definition])
  )
}

/**
 * The operation's root field nodes, following inline fragments and fragment spreads. Directives
 * such as @skip are ignored, so every field that could run is returned. Only the root level is
 * walked, not the fields' own selection sets.
 *
 * The document must already be validated: the fragments are assumed to exist and not form a cycle.
 */
export function rootFieldNodes(selectionSet, fragments) {
  return selectionSet.selections.flatMap((selection) => {
    if (selection.kind === Kind.FIELD) {
      return [selection]
    }
    if (selection.kind === Kind.INLINE_FRAGMENT) {
      // The inline fragment's fields sit at the same (root) level, so collect them too
      return rootFieldNodes(selection.selectionSet, fragments)
    }
    // FRAGMENT_SPREAD: look the named fragment up and collect its fields
    return rootFieldNodes(fragments[selection.name.value].selectionSet, fragments)
  })
}
