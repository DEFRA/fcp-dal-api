# DAL Schema Authorization

[DAL Authentication](./auth) covers how a caller identifies itself to the DAL (an `email` header, a
Defra ID token, or a `service-account` header). This document covers a separate, later question:
once a caller is identified, which parts of the GraphQL schema is it actually allowed to use?

## The `@auth` directive

```graphql
directive @auth(requires: [AuthGroup!]!, userType: [UserAccessType!]) on OBJECT | FIELD_DEFINITION
```

`@auth` is applied to fields and types throughout the schema, e.g.:

```graphql
business(sbi: ID!): Business @auth(requires: [SINGLE_FRONT_DOOR, CONSOLIDATED_VIEW])
```

It is implemented as a schema transformer (`authDirectiveTransformer`) in
[`app/auth/authenticate.js`](../app/auth/authenticate.js).

### `requires` - which consumer entities can call this field

`requires` names one or more services (configured in `app/config.js`, under
`auth.entities.{ADMIN,CONSOLIDATED_VIEW,...}`). Each entity groups its Entra app-reg or AD group ID
(`entityId`), the name used by `@auth` (`authName`), and the consuming system name (`serviceName`).

This comes from a **different** header than the ones in [DAL Authentication](./auth): the caller's
authorised identity is read from the `appid`, `azp`, or `groups` claim of the Entra ID JWT sent in
the standard `Authorization: Bearer <token>` header, verified by `getAuthorisedEntity()` in
`authenticate.js`.
Authorization first compares the token's `appid`/`azp` claim to the configured IDs, then falls back
to checking the `groups` claim for the first match.
This identifies _which system_ is calling the DAL.
The end user is identified by one-of `email`/`x-forwarded-authorization`/`service-account` headers.
Every field-level `@auth` check is made against the authorization name (`context.auth.authName`),
while `context.auth.serviceName` identifies the service in audit and metrics data.

A caller with the configured `ADMIN` app-reg (or group) ID is ALWAYS allowed, irrespective of the
services listed by `requires`.

A field with no `@auth` directive at all has no group restriction - anyone who can reach the DAL
can call it (e.g. `Query.referenceData`).
A schema test (`test/graphql/schema.test.js` -
`'ensures all sensitive top-level fields have @auth directive'`) guards against a new top-level
field accidentally being left unprotected. 🔒

### `userType` - which end-user type can call this field

`userType` optionally restricts a field to `INTERNAL` or `EXTERNAL` end users (or both). This is a
**different** check again, orthogonal to `requires`: it isn't about which system is calling, but
about which of the [end-user identification headers](./auth) the current request carried -
`email` (internal, Rural Payments portal user) or `x-forwarded-authorization` (external, Defra ID
customer). It's read from `context.authContext.{internalAuthHeader,externalAuthHeader}`, populated
by `endUserAuthContext()` in `app/auth/end-user-auth-context.js`.

```graphql
internalUser: InternalUser @auth(requires: [SINGLE_FRONT_DOOR], userType: [INTERNAL])
```

A field with no `userType` argument has no end-user-type restriction (only the `requires` check
applies).
`userType: [ALL]` is equivalent, but lets a field state explicitly that it's intended for both
internal and external users rather than relying on that default. Unlike `requires`, the `ADMIN`
app-reg/group does **not** bypass the `userType` check - it restricts the type of end user, not the
calling system, so an `ADMIN` caller must still carry the matching header.
A service account carries neither header, so it never satisfies an `INTERNAL` or `EXTERNAL`
restriction.

### Cascading from `OBJECT` to fields

`@auth` can be applied to a whole `type`, in which case it is inherited by every field on that type
that does not carry its own `@auth`:

```graphql
type Business @auth(requires: [SINGLE_FRONT_DOOR]) {
  sbi: ID!
  info: BusinessInfo # inherits @auth(requires: [SINGLE_FRONT_DOOR])
}
```

A field-level `@auth` always overrides the type-level one for that field.

### Service account access

A [service account](./auth) call carries no end-user identity - it is typically an unattended,
batch-style caller.
Service accounts are only permitted to make read-only calls to the DAL - no mutations are allowed!

Whether the _current_ caller is a service account is derived from the same request-level
`authContext` that [DAL Authentication](./auth) describes (`context.authContext.serviceAccount`,
truthy when a `service-account` header was supplied) - see `app/graphql/context.js` and
`app/auth/end-user-auth-context.js`.

As with the `@auth` directive, an `ADMIN` caller bypasses the service account check too.
An admin service account can call any `@auth`-protected field, mutations included.

### What actually happens when access is denied

`authDirectiveTransformer` wraps the field's resolver with three checks, in order:

1. `checkAuthEntity(serviceName, allowedServices)` - throws `Unauthorized` if the `serviceName`
   does not match one listed by `requires` in the schema, and the caller is not an `ADMIN`.
2. `checkServiceAccountAccess(isServiceAccount, serviceAccountPermitted, isAdmin)` - throws
   `Unauthorized` if the caller is a service account, `serviceAccountPermitted` is `false`, and the
   caller is not `ADMIN`.
3. `checkUserAccess(authContext, userType)` - throws `Unauthorized` if the field has a `userType`
   restriction and the request's end-user headers don't match any of the listed `UserAccessType`s
   (`ADMIN` callers included).

Thrown exceptions surface as a normal GraphQL execution error against that field - the rest of the
query (sibling fields) still resolves normally.

## Local development

Setting `DISABLE_AUTH=true` skips `@auth` enforcement entirely:

- a default app-reg ID is used (as there is no token to derive the `appid`/`groups` claim from)
- `serviceName` is set to placeholder value
- and `authDirectiveTransformer` is not applied to the schema at all

This is only ever allowed when `cdp.env` is `dev` - `schema.js` throws at startup if auth is
disabled anywhere else, so auth cannot be accidentally disabled in a real environment.

[< back to Homepage](./homepage)
