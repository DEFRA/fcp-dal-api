import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { config } from '../config.js'
import { context } from './context.js'
import { formatError } from './formatError.js'
import { createSchemaForGroups } from './schema.js'

/**
 * AuthGroup names the playground can simulate, one dedicated route/schema per group, so a
 * developer can preview exactly which fields a given group's @auth access would show them.
 */
export const playgroundAuthGroups = Object.keys(config.get('auth.groups'))

const apolloServerCache = new Map()

/**
 * Lazily builds (and caches) an ApolloServer whose schema only exposes fields visible to the
 * given AuthGroup name, for the playground. Real @auth enforcement is unaffected - this is
 * purely about what's visible in the Docs/introspection panel.
 */
export async function getPlaygroundApolloServer(group) {
  if (!apolloServerCache.has(group)) {
    const schema = await createSchemaForGroups([group])
    const apolloServer = new ApolloServer({
      schema,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      introspection: true,
      formatError
    })
    await apolloServer.start()
    apolloServerCache.set(group, apolloServer)
  }
  return apolloServerCache.get(group)
}

/**
 * Builds request context for a playground route, overriding the caller's auth groups to
 * simulate the given AuthGroup regardless of any real token, so query execution behaves
 * consistently with what the filtered schema shows.
 */
export async function playgroundContext({ request }, group) {
  const ctx = await context({ request })
  const groupId = config.get(`auth.groups.${group}`)

  return {
    ...ctx,
    auth: { ...ctx.auth, groups: groupId ? [groupId] : [] }
  }
}
