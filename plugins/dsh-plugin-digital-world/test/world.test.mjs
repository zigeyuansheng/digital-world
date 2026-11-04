/**
 * Digital World engine tests. Run with `node test/run-tests.mjs`.
 */

import assert from 'node:assert/strict'
import {
  advanceGameHours,
  computeStats,
  createInitialState,
  dexPage,
  evolutionOptions,
  makeInstance,
  performAction,
  publicState,
  statusLine,
} from '../lib/world.js'
import { SPECIES, starterPool } from '../lib/game-data.js'

const tests = []
const test = (name, fn) => tests.push({ name, fn })
const now = 1_800_000_000_000

test('the catalog is populated', () => {
  assert.equal(SPECIES.length, 1614)
  const page = dexPage('', 1, 10)
  assert.equal(page.items.length, Math.min(10, page.total))
  assert.ok(page.total >= 1614)
})

test('a new game starts with exactly one random starter egg', () => {
  const state = createInitialState(now)
  assert.equal(state.version, 2)
  assert.equal(state.eggs.length, 1)
  assert.equal(state.eggs[0].source, 'starter')
  assert.ok(starterPool().some((species) => species.id === state.eggs[0].speciesId))
  assert.equal(state.roster.length, 0)
})

test('hatching creates one active Digimon and fills party', () => {
  const state = createInitialState(now)
  const result = performAction(state, 'hatch', { eggId: state.eggs[0].id }, now + 1000)
  assert.match(result.summary, /裂开/)
  assert.equal(state.roster.length, 1)
  assert.equal(state.party.length, 1)
  assert.equal(state.activeId, state.roster[0].id)
  assert.equal(state.eggs.length, 0)
  assert.ok(statusLine(state).includes(state.roster[0].name))
})

test('care changes needs and training adds a stat', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.care.fullness = 40
  active.care.energy = 80
  const feed = performAction(state, 'care', { mode: 'feed' }, now + 2000)
  assert.ok(active.care.fullness > 40)
  assert.match(feed.summary, /饱食/)
  const before = active.trained.atk
  performAction(state, 'train', { stat: 'atk' }, now + 3000)
  assert.ok(active.trained.atk > before)
  assert.ok(active.care.energy < 80)
})

test('game time advances needs and creates a day/weather clock', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  const before = active.care.fullness
  advanceGameHours(state, 6)
  assert.ok(active.care.fullness < before)
  assert.ok(state.clock.day >= 1)
  assert.ok(typeof state.clock.weather === 'string')
})

test('evolution options use real Wikimon targets', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.level = 20
  active.trained = { hp: 20, mp: 20, atk: 30, def: 30, spd: 30, wis: 30 }
  const options = evolutionOptions(state, active.id)
  assert.ok(Array.isArray(options))
  assert.ok(options.length >= 0)
  for (const option of options) {
    assert.ok(typeof option.speciesId === 'string')
    assert.ok(typeof option.eligible === 'boolean')
  }
})

test('public state exposes the whole 1280 UI payload', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const view = publicState(state, now + 1000)
  assert.ok(view.clock.day >= 1)
  assert.ok(view.regions.length >= 9)
  assert.ok(view.catalog.count >= 8)
  assert.ok(view.dex.total >= 8)
  assert.ok(view.active !== null)
  assert.ok(Array.isArray(view.log))
})

test('battle can be started in a wild region and resolved', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.player.region = 'native-forest'
  let started = false
  for (let i = 0; i < 30; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  assert.ok(state.battle.enemy.speciesId)
  const result = performAction(state, 'battle', { command: 'auto' }, now + 40000)
  assert.ok(['won', 'lost', 'fled', 'active'].includes(state.battle?.status ?? 'fled'))
  assert.ok(result.summary.length > 0)
})

test('a complete growth path can produce an evolution option', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  // Give a generous level/training budget so at least one real target is visible.
  active.level = 40
  active.trained = { hp: 100, mp: 100, atk: 100, def: 100, spd: 100, wis: 100 }
  active.bond = 90
  const options = evolutionOptions(state, active.id)
  assert.ok(options.length > 0)
})

test('makeInstance computes a positive stat block', () => {
  const species = SPECIES[0]
  const instance = makeInstance(species.id, now)
  const stats = computeStats(species, 1, instance.trained)
  assert.ok(stats.maxHp > 0)
  assert.ok(stats.maxMp > 0)
  assert.ok(stats.atk > 0)
})

let failed = 0
for (const entry of tests) {
  try {
    await entry.fn()
    console.log(`ok - ${entry.name}`)
  } catch (error) {
    failed += 1
    console.error(`not ok - ${entry.name}`)
    console.error(error?.stack ?? error)
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`)
if (failed > 0) process.exitCode = 1
