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
import { resolveConfig } from './config.js'
import { createPanelRoute, PANEL_ROUTE } from './panel-route.js'
import { WorldStore } from './store.js'
import { CATALOG } from './game-data.js'

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
      enum: ['status', 'care', 'train', 'travel', 'explore', 'battle', 'absorb', 'rebuild', 'hatch', 'evolve', 'rename', 'party', 'restore', 'infuse', 'expedition', 'dex'],
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
      `The catalog contains ${CATALOG.count ?? 0} Wikimon entries. Use action=status first.`,
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
  const store = new WorldStore({ root, logger })

  void store
    .ensureLoaded()
    .then(() => logger('info', `世界数据目录 ${store.filePath}（${CATALOG.count ?? '未知'} 条图鉴数据）`))
    .catch((error) => logger('warn', `初始化世界失败：${reasonOf(error)}`))

  ctx.inject(['tools'], (scope) => {
    try {
      scope.tools.register(defineDigitalWorldTool(store))
      logger('info', '已注册 digital_world 工具')
    } catch (error) {
      logger('warn', `注册 digital_world 工具失败：${reasonOf(error)}`)
    }
  })

  ctx.inject(['webServer'], (scope) => {
    try {
      const panel = createPanelRoute({ store, logger })
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
