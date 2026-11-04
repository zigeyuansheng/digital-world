/**
 * HTTP route behind the Digital World panel (`/api/digital-world`).
 *
 * The browser half cannot reach Host memory, so the panel calls this route. It
 * exposes one GET snapshot (plus a paged Dex query) and one POST action
 * envelope, using the same store as the `digital_world` tool.
 *
 * @module dsh-plugin-digital-world/panel-route
 */

import { dexPage } from './world.js'

/** Route served to the browser half. */
export const PANEL_ROUTE = '/api/digital-world'

/** Largest request body accepted from the panel, in bytes. */
export const MAX_BODY_BYTES = 64 * 1024

/** @returns a printable message for a thrown value. */
function reasonOf(error) {
  if (error !== null && typeof error === 'object' && typeof error.message === 'string' && error.message !== '') {
    return error.message
  }
  return String(error)
}

/** Read one request body as JSON. */
export async function readJsonBody(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error(`请求体超过 ${MAX_BODY_BYTES} 字节`)
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8').trim()
  if (text === '') return undefined
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`请求体不是合法 JSON：${reasonOf(error)}`)
  }
}

/**
 * Build the route definition.
 * @param options - `{ store, logger? }`.
 */
export function createPanelRoute({ store, logger }) {
  const log = (level, message) => {
    try {
      logger?.(level, message)
    } catch {
      // A logger failure must not break the response.
    }
  }

  const handler = async (req, res) => {
    const send = (status, value) => {
      res.statusCode = status
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      res.end(JSON.stringify(value))
    }
    try {
      if (req.method === 'GET' || req.method === 'HEAD') {
        const url = new URL(req.url ?? PANEL_ROUTE, 'http://127.0.0.1')
        if (url.searchParams.get('dex') === '1') {
          const query = url.searchParams.get('q') ?? ''
          const page = Number(url.searchParams.get('page') ?? '1')
          const limit = Number(url.searchParams.get('limit') ?? '24')
          send(200, { ok: true, ...dexPage(query, page, limit) })
          return
        }
        const snapshot = await store.read()
        send(200, { ok: true, ...snapshot })
        return
      }
      if (req.method === 'POST') {
        const body = await readJsonBody(req)
        const action = typeof body?.action === 'string' ? body.action.trim() : ''
        if (action === '') throw new Error('缺少 action')
        const outcome = await store.perform(action, body ?? {}, Date.now())
        send(200, { ok: true, state: outcome.state, result: outcome.result })
        return
      }
      send(405, { ok: false, error: 'method not allowed' })
    } catch (error) {
      const message = reasonOf(error)
      log('warn', `digital-world: 面板请求失败：${message}`)
      send(400, { ok: false, error: message })
    }
  }

  return {
    route: { kind: 'exact', path: PANEL_ROUTE, handler },
    handler,
  }
}
