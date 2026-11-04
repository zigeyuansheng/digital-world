/**
 * Durable, serialized access to one Digital World save file.
 *
 * @module dsh-plugin-digital-world/store
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  advanceState,
  createInitialState,
  normalizeState,
  performAction,
  publicState,
} from './world.js'

/** @returns a printable message for a thrown value. */
function reasonOf(error) {
  if (error !== null && typeof error === 'object' && typeof error.message === 'string' && error.message !== '') {
    return error.message
  }
  return String(error)
}

/** One persistent world. */
export class WorldStore {
  /**
   * @param options - `{ root, logger? }`.
   */
  constructor({ root, logger }) {
    this.root = root
    this.file = path.join(root, 'state.json')
    this.logger = logger
    this.state = null
    this.queue = Promise.resolve()
    this.lastSaved = 0
  }

  /** @returns the absolute state file path. */
  get filePath() {
    return this.file
  }

  /** Load on first use; missing/corrupt saves start a fresh world. */
  async ensureLoaded(now = Date.now()) {
    if (this.state !== null) return this.state
    try {
      const text = await readFile(this.file, 'utf8')
      const parsed = JSON.parse(text)
      if (parsed !== null && typeof parsed === 'object' && parsed.version !== 2) {
        try {
          await rename(this.file, path.join(this.root, 'state.v1.backup.json'))
          this.log('info', '旧版单宠存档已备份为 state.v1.backup.json，将创建新的 v0.4 世界。')
        } catch {
          // A failed backup must not block the new world.
        }
        this.state = createInitialState(now)
        await this.save()
      } else {
        this.state = normalizeState(parsed, now)
      }
    } catch (error) {
      if (error !== null && typeof error === 'object' && error.code !== 'ENOENT') {
        this.log('warn', `读取世界存档失败，将创建新世界：${reasonOf(error)}`)
      }
      this.state = createInitialState(now)
      await this.save()
    }
    return this.state
  }

  /** Write the current state, creating the directory on first save. */
  async save() {
    await mkdir(this.root, { recursive: true })
    await writeFile(this.file, `${JSON.stringify(this.state, null, 2)}\n`, 'utf8')
    this.lastSaved = Date.now()
  }

  /** Run one operation after every earlier operation has settled. */
  async serial(operation) {
    const run = this.queue.then(operation, operation)
    this.queue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  /** Read a public snapshot, advancing the world clock. */
  async read(now = Date.now()) {
    return this.serial(async () => {
      await this.ensureLoaded(now)
      advanceState(this.state, now)
      if (now - this.lastSaved > 30_000) await this.save()
      return { state: publicState(this.state, now), notices: [] }
    })
  }

  /** Apply one action through the same path the agent tool uses. */
  async perform(action, params, now = Date.now()) {
    return this.serial(async () => {
      await this.ensureLoaded(now)
      const result = performAction(this.state, action, params, now)
      await this.save()
      return { state: publicState(this.state, now), result }
    })
  }

  /** Advance the clock and persist if enough time passed. */
  async tick(now = Date.now()) {
    return this.serial(async () => {
      await this.ensureLoaded(now)
      advanceState(this.state, now)
      if (now - this.lastSaved > 60_000) await this.save()
      return { ok: true }
    })
  }

  /** Best-effort logging. */
  log(level, message) {
    try {
      this.logger?.(level, message)
    } catch {
      // Logging is advisory only.
    }
  }
}
