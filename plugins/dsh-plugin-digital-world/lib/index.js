/**
 * Loader entry of `dsh-plugin-digital-world`.
 *
 * The profile links this package to its source directory and the Host caches an
 * entry module by URL, so a plain `export ... from` would keep serving whatever
 * generation the process imported first. Importing the implementation through a
 * cache-busting query means reloading the plugin picks up the current source
 * without an application restart.
 *
 * @module dsh-plugin-digital-world
 */

/** v0.4 entry: keep the cache-busting import so a plugin reload picks up source edits. */
const implementation = await import(`./plugin.js?generation=${Date.now()}`)

export const apply = implementation.apply
export const PANEL_ID = implementation.PANEL_ID
export const ROUTE = implementation.ROUTE
export const resolveConfig = implementation.resolveConfig
export const WorldStore = implementation.WorldStore
