# DAL Schema Authorization

[DAL Authentication](./auth) covers how a caller identifies itself to the DAL (an `email` header, a
Defra ID token, or a `service-account` header). This document covers a separate, later question:
once a caller is identified, which parts of the GraphQL schema is it actually allowed to use?

## The `@auth` directive

```graphql
directive @auth(
  requires: [AuthGroup!]!
  serviceAccountPermitted: Boolean
) on OBJECT | FIELD_DEFINITION
```

`@auth` is applied to fields and types throughout the schema, e.g.:

```graphql
business(sbi: ID!): Business @auth(requires: [SINGLE_FRONT_DOOR, CONSOLIDATED_VIEW])
```

It's implemented as a schema transformer (`authDirectiveTransformer`) in
[`app/auth/authenticate.js`](../app/auth/authenticate.js).

### `requires` - which consumer groups can call this field

`requires` names one or more of the AD groups configured in `app/config.js`
(`auth.groups.{ADMIN,CONSOLIDATED_VIEW,SINGLE_FRONT_DOOR,SFI_REFORM}`), each mapping to an Azure AD
Entra group ID for a consuming system (Consolidated View, Single Front Door, Grants Platform, etc).

This comes from a **different** header than the ones in [DAL Authentication](./auth): the caller's
group membership is read from the `groups` claim of the Entra JWT sent in the standard
`Authorization: Bearer <token>` header, verified by `getAuth()` in `authenticate.js`. This identifies
_which system_ is calling the DAL. The end user is identified by one-of `email`/`x-forwarded-authorization`/
`service-account` headers. Every field-level `@auth` check runs against `context.auth.groups`.

A caller in the `ADMIN` group bypasses the `requires` check entirely (and the `serviceAccountPermitted`
check below), regardless of what groups the field lists.

A field with no `@auth` directive at all has no group restriction - anyone who can reach the DAL
can call it (e.g. `Query.referenceData`). A schema test
(`test/graphql/schema.test.js` - `'ensures all sensitive top-level fields have @auth directive'`)
guards against a new top-level field accidentally being left unprotected.

### Cascading from `OBJECT` to fields

`@auth` can be applied to a whole `type`, in which case it's inherited by every field on that type
that doesn't carry its own `@auth`:

```graphql
type Business @auth(requires: [SINGLE_FRONT_DOOR]) {
  sbi: ID!
  info: BusinessInfo # inherits @auth(requires: [SINGLE_FRONT_DOOR])
}
```

A field-level `@auth` always overrides the type-level one for that field.

### `serviceAccountPermitted` - can a service account use this field?

A [service account](./auth) call carries no end-user identity - it's typically an unattended,
batch-style caller. `serviceAccountPermitted` has **no static default** - if a field's resolved
`@auth` doesn't set it, the effective value is inferred from where the field lives:

- `false` (denied) for a field directly on `Mutation`.
- `true` (permitted) for everything else, `Query` included.

An explicit value on the directive always wins over the inferred default, in either direction -
so a specific mutation can still be opened up to service accounts, and a specific query can still
be closed off, without changing the rule for every other field:

```graphql
# Inferred true (Query) - a service account may call this without setting anything.
customer(crn: ID!): Customer @auth(requires: [SINGLE_FRONT_DOOR])

# Explicitly overridden to false, even though it's a Query field.
sensitiveLookup: SensitiveThing @auth(requires: [SINGLE_FRONT_DOOR], serviceAccountPermitted: false)

# Explicitly overridden to true, even though it's a Mutation field.
triggerAutomatedReconciliation: Boolean
  @auth(requires: [SINGLE_FRONT_DOOR], serviceAccountPermitted: true)
```

Whether the _current_ caller is a service account is derived from the same request-level
`authContext` that [DAL Authentication](./auth) describes (`context.authContext.serviceAccount`,
truthy when a `service-account` header was supplied) - see `app/graphql/context.js` and
`app/auth/end-user-auth-context.js`.

As with `requires`, an `ADMIN`-group caller bypasses the `serviceAccountPermitted` check too - an
admin service account can call any `@auth`-protected field, mutations included.

### What actually happens when access is denied

`authDirectiveTransformer` wraps the field's resolver with two checks, in order:

1. `checkAuthGroup(requesterGroups, requires)` - throws `Unauthorized` if the caller isn't in
   `ADMIN` or any group in `requires`.
2. `checkServiceAccountAccess(isServiceAccount, serviceAccountPermitted, isAdmin)` - throws
   `Unauthorized` if the caller is a service account, `serviceAccountPermitted` is `false`, and the
   caller isn't `ADMIN`.

Either throw surfaces as a normal GraphQL execution error against that field - the rest of the
query (sibling fields) still resolves normally.

## Local development

Setting `DISABLE_AUTH=true` skips `@auth` enforcement entirely (`getRequestingGroup`/
`getRequestingService` return placeholder values, and `authDirectiveTransformer` isn't applied to
the schema at all). This is only ever allowed when `cdp.env` is `dev` - `schema.js` throws at
startup if auth is disabled anywhere else, so it can't be accidentally left on in a real
environment.

[< back to Homepage](./homepage)
