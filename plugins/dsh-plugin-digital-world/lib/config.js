/**
 * Configuration defaults for `dsh-plugin-digital-world`.
 *
 * @module dsh-plugin-digital-world/config
 */

/** @returns the value when it is a finite number at or above `min`, else `fallback`. */
function numberAt(value, min, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min ? value : fallback
}

/** @returns the value when it is a string, else `fallback`. */
function stringAt(value, fallback) {
  return typeof value === 'string' ? value : fallback
}

/**
 * Resolve the raw Loader configuration.
 * @param raw - the row's `config` object, if any.
 * @returns a complete configuration.
 */
export function resolveConfig(raw) {
  const source = raw !== null && typeof raw === 'object' ? raw : {}
  return {
    root: stringAt(source.root, '').trim(),
    tickMs: numberAt(source.tickMs, 15000, 60000),
  }
}
