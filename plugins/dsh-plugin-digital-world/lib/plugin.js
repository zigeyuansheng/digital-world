/**
 * Host half of `dsh-plugin-digital-world`.
 *
 * Owns the persistent v0.4 game state, the `digital_world` tool, and the panel
 * HTTP route. The client is a 1280×720 pixel UI; the agent plays through the
 * same action API as the UI.
 *
 * @module dsh-plugin-digital-world/plugin
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { resolveConfig } from './config.js'
import { createPanelRoute, PANEL_ROUTE } from './panel-route.js'
import { WorldStore } from './store.js'
import { CATALOG, AVAILABLE_COUNT } from './game-data.js'
import { REGION_SCENES } from './scene-data.js'

/** Sidebar entry and main-panel id; the client half must use the same value. */
export const PANEL_ID = 'digital-world'

/** HTTP route shared by the panel. */
export const ROUTE = PANEL_ROUTE

/** @returns a printable message for a thrown value. */
function reasonOf(error) {
  if (error !== null && typeof error === 'object' && typeof error.message === 'string' && error.message !== '') {
    return error.message
  }
  return String(error)
}

/** JSON schema for the tool parameters. */
const PARAMETERS_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['status', 'care', 'train', 'travel', 'explore', 'battle', 'absorb', 'rebuild', 'hatch', 'evolve', 'rename', 'party', 'restore', 'infuse', 'expedition', 'dex', 'regions', 'shop', 'shop_buy', 'use_item', 'equip_skill', 'decompose', 'farm_store', 'farm_take', 'capture', 'boss'],
      description: 'The world action. status = inspect; care = feed/clean/pet/sleep/heal; train = one stat; travel = go to a region; explore = search current region; battle = fight with a command; absorb/rebuild = resolve a won battle; hatch = hatch an egg; evolve = evolve active Digimon; party = switch active; restore = upgrade a File City facility; expedition = auto 3-encounter run; dex = collection stats.',
    },
    mode: {
      type: 'string',
      enum: ['feed', 'clean', 'pet', 'sleep', 'heal'],
      description: 'Care mode when action=care.',
    },
    stat: {
      type: 'string',
      enum: ['hp', 'mp', 'atk', 'def', 'spd', 'wis'],
      description: 'Training stat when action=train.',
    },
    region: {
      type: 'string',
      description: 'Region id when action=travel.',
    },
    command: {
      type: 'string',
      enum: ['auto', 'attack', 'skill', 'scan', 'defend', 'flee', 'dismiss'],
      description: 'Battle command when action=battle.',
    },
    eggId: {
      type: 'string',
      description: 'Egg id when action=hatch (optional; first egg if omitted).',
    },
    instanceId: {
      type: 'string',
      description: 'Owned Digimon id for party/active selection.',
    },
    target: {
      type: 'string',
      description: 'Target species id when action=evolve.',
    },
    facility: {
      type: 'string',
      enum: ['gym', 'clinic', 'shop', 'incubator', 'nest', 'lab', 'farm'],
      description: 'Facility id when action=restore.',
    },
    attribute: {
      type: 'string',
      enum: ['vaccine', 'data', 'virus', 'free'],
      description: 'Fragment attribute when action=infuse.',
    },
    name: {
      type: 'string',
      description: 'New name when action=rename (1-12 chars).',
    },
  },
  required: ['action'],
  additionalProperties: false,
}

/** JSON schema for the tool result. */
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    action: { type: 'string' },
    summary: { type: 'string' },
    state: { type: 'object', additionalProperties: true },
  },
  required: ['ok', 'action', 'summary'],
  additionalProperties: true,
}

/**
 * Build the `digital_world` tool.
 * @param store - the shared WorldStore.
 */
function defineDigitalWorldTool(store) {
  return {
    name: 'digital_world',
    description: [
      'Play the persistent pixel Digital World in the sidebar: one island, random Digitama starts, multiple owned Digimon, data absorption, real Wikimon evolution links, and File City rebuilding.',
      `The catalog contains ${AVAILABLE_COUNT} playable Wikimon entries (of ${CATALOG.count ?? AVAILABLE_COUNT} in the snapshot); species without sprites are hidden until their art is added. Use action=status first.`,
      'Battle defaults to automatic data absorption; after a win you can choose absorb or rebuild into a same-lineage egg.',
    ].join(' '),
    parameters: PARAMETERS_SCHEMA,
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [
        {
          type: 'text',
          text:
            value !== null && typeof value === 'object' && typeof value.summary === 'string'
              ? value.summary
              : JSON.stringify(value),
        },
      ],
    },
    isConcurrencySafe: () => false,
    async execute(args, _exec) {
      const input = args !== null && typeof args === 'object' ? args : {}
      const action = typeof input.action === 'string' && input.action !== '' ? input.action : 'status'
      try {
        const outcome = await store.perform(action, input, Date.now())
        return {
          ok: true,
          action,
          summary: outcome.result.summary,
          state: outcome.state,
        }
      } catch (error) {
        throw new Error(reasonOf(error))
      }
    },
  }
}

/**
 * Activate the Host half.
 * @param ctx - Host plugin context.
 * @param raw - the row's `config` object.
 */
export function apply(ctx, raw) {
  const config = resolveConfig(raw)
  const logger = (level, message) => {
    try {
      const sink = ctx.logger?.[level]
      if (typeof sink === 'function') sink.call(ctx.logger, `digital-world: ${message}`)
    } catch {
      // Logging must never break activation.
    }
  }

  const fallbackDirectory =
    typeof process.env.DSH_PROFILE_DIR === 'string' && process.env.DSH_PROFILE_DIR !== ''
      ? process.env.DSH_PROFILE_DIR
      : process.cwd()
  const root = config.root === '' ? path.join(fallbackDirectory, 'digital-world') : path.resolve(config.root)
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const spriteDir = typeof process.env.DSH_DIGITAL_WORLD_SPRITES === 'string' && process.env.DSH_DIGITAL_WORLD_SPRITES !== ''
    ? process.env.DSH_DIGITAL_WORLD_SPRITES
    : path.resolve(moduleDir, '../../../digitalpartner_sprites')
  const store = new WorldStore({ root, logger })

  // Attach the region scene manifest to every snapshot the panel or the tool
  // reads. Kept here (not in world.js) so the scene layer can ship without a
  // Host restart: plugin.js is the cache-busted entry module.
  const withScene = (snapshot) => {
    try {
      const regionId = snapshot?.state?.player?.region
      if (snapshot?.state && snapshot.state.scene === undefined) {
        snapshot.state.scene = REGION_SCENES[regionId] ?? REGION_SCENES['file-city'] ?? null
      }
    } catch {
      // A missing scene must never break a snapshot.
    }
    return snapshot
  }
  const storeView = {
    get filePath() { return store.filePath },
    ensureLoaded: (...args) => store.ensureLoaded(...args),
    read: (...args) => store.read(...args).then(withScene),
    perform: (...args) => store.perform(...args).then(withScene),
    tick: (...args) => store.tick(...args),
  }

  void store
    .ensureLoaded()
    .then(() => logger('info', `世界数据目录 ${store.filePath}（可用图鉴 ${AVAILABLE_COUNT} / 快照 ${CATALOG.count ?? '未知'}）`))
    .catch((error) => logger('warn', `初始化世界失败：${reasonOf(error)}`))

  ctx.inject(['tools'], (scope) => {
    try {
      scope.tools.register(defineDigitalWorldTool(storeView))
      logger('info', '已注册 digital_world 工具')
    } catch (error) {
      logger('warn', `注册 digital_world 工具失败：${reasonOf(error)}`)
    }
  })

  ctx.inject(['webServer'], (scope) => {
    try {
      const panel = createPanelRoute({ store: storeView, logger, spriteDir })
      scope.effect(() => {
        const dispose = scope.webServer.register(panel.route)
        logger('info', `面板路由已注册：${ROUTE}`)
        return () => {
          try {
            dispose?.()
          } catch {
            // A raced unload is harmless.
          }
        }
      }, 'digital-world: panel route')
      const spriteHandler = async (req, res) => {
        const url = new URL(req.url ?? '/api/digital-world/sprite', 'http://127.0.0.1')
        const file = url.searchParams.get('file') ?? ''
        const safe = /^[A-Za-z0-9_.\-]+\.png$/.test(file)
        if (!safe) {
          res.statusCode = 404
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: 'sprite not found' }))
          return
        }
        try {
          const buffer = await readFile(path.join(spriteDir, file))
          res.statusCode = 200
          res.setHeader('content-type', 'image/png')
          res.setHeader('cache-control', 'public, max-age=86400')
          res.end(buffer)
        } catch {
          res.statusCode = 404
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: 'sprite not found' }))
        }
      }
      scope.effect(() => {
        const dispose = scope.webServer.register({ kind: 'exact', path: '/api/digital-world/sprite', handler: spriteHandler })
        logger('info', `精灵图路由已注册：/api/digital-world/sprite（${spriteDir}）`)
        return () => {
          try {
            dispose?.()
          } catch {
            // A raced unload is harmless.
          }
        }
      }, 'digital-world: sprite route')
    } catch (error) {
      logger('warn', `注册面板路由失败：${reasonOf(error)}`)
    }
  })

  try {
    ctx.effect(() => {
      const dispose = ctx.interval(() => {
        void store.tick().catch((error) => logger('warn', `世界时钟失败：${reasonOf(error)}`))
      }, config.tickMs)
      return () => {
        try {
          dispose?.()
        } catch {
          // A raced unload is harmless.
        }
      }
    }, 'digital-world: passive clock')
  } catch (error) {
    logger('warn', `世界时钟未启动：${reasonOf(error)}`)
  }
}

export { resolveConfig, createPanelRoute, WorldStore }
