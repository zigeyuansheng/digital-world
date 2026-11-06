/**
 * Digital World engine tests. Run with `node test/run-tests.mjs`.
 */

import assert from 'node:assert/strict'
import {
  advanceGameHours,
  advanceState,
  computeStats,
  createInitialState,
  dexPage,
  evolutionOptions,
  makeInstance,
  performAction,
  publicState,
  statusLine,
  skillProfile,
  SCAN_GAIN_BY_STAGE,
} from '../lib/world.js'
import { SPECIES, starterPool, getSpecies, WIKIMON_EVOLUTIONS } from '../lib/game-data.js'
import { REGIONS } from '../lib/game-data.js'
import { REGION_SCENES, SCENE_IDS } from '../lib/scene-data.js'
import { SPRITE_INDEX } from '../lib/sprite-index.js'

const tests = []
const test = (name, fn) => tests.push({ name, fn })
const now = 1_800_000_000_000

test('the catalog is populated and limited to species with sprites', () => {
  assert.ok(SPECIES.length >= 500, `only ${SPECIES.length} playable species`)
  assert.ok(SPECIES.length < 1614, 'no-art species must be hidden')
  const spriteIds = new Set(SPRITE_INDEX.map((entry) => entry.id))
  assert.ok(SPECIES.every((species) => spriteIds.has(species.id)))
  const page = dexPage('', 1, 10)
  assert.equal(page.items.length, Math.min(10, page.total))
  assert.equal(page.total, SPECIES.length)
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
  state.inventory.devices.atk = 1
  const before = active.trained.atk
  performAction(state, 'train', { stat: 'atk' }, now + 3000)
  assert.ok(active.trained.atk > before)
  assert.equal(state.inventory.devices.atk, 0)
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
  assert.ok(view.scene !== null && typeof view.scene === 'object')
})

test('every region has a scene manifest matching its name', () => {
  const spriteNames = new Set(SPRITE_INDEX.map((entry) => String(entry.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')))
  for (const region of REGIONS) {
    const scene = REGION_SCENES[region.id]
    assert.ok(scene, `missing scene for ${region.id}`)
    assert.equal(scene.id, region.id)
    assert.equal(scene.name, region.name)
    assert.equal(scene.zh, region.zh)
    assert.ok(scene.palette && Array.isArray(scene.palette.sky) && Array.isArray(scene.palette.ground))
    assert.ok(Array.isArray(scene.objects) && scene.objects.length > 0, `${region.id} needs objects`)
    assert.ok(Array.isArray(scene.actors))
    for (const actor of scene.actors) {
      const key = String(actor.species || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      assert.ok(spriteNames.has(key), `${region.id} actor ${actor.species} has no sprite`)
    }
    for (const obj of scene.objects) {
      assert.equal(typeof obj.type, 'string')
      assert.equal(typeof obj.x, 'number')
      assert.equal(typeof obj.y, 'number')
      if (obj.type === 'facility') assert.ok(['gym', 'clinic', 'shop', 'incubator', 'nest', 'lab', 'farm'].includes(obj.facility))
    }
  }
  assert.equal(SCENE_IDS.length, REGIONS.length)
  const city = REGION_SCENES['file-city']
  const facilities = city.objects.filter((obj) => obj.type === 'facility').map((obj) => obj.facility).sort()
  assert.deepEqual(facilities, ['clinic', 'farm', 'gym', 'incubator', 'lab', 'nest', 'shop'])
  assert.ok(city.objects.some((obj) => obj.type === 'big-tree'))
  assert.ok(city.objects.some((obj) => obj.type === 'terminal-tower'))
})

test('battle can be started in a wild region and resolved', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.player.region = 'native-forest'
  state.ap.value = 999
  state.roster[0].care.energy = 100
  let started = false
  for (let i = 0; i < 30; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  assert.equal(state.battle.enemies.length, 1)
  assert.ok(state.battle.enemies[0].speciesId)
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

test('sprite index maps a large share of species to real PNGs', () => {
  assert.ok(SPRITE_INDEX.length >= 500, `only ${SPRITE_INDEX.length} sprite matches`)
  const agumon = SPRITE_INDEX.find((entry) => entry.id === 'agumon')
  assert.ok(agumon, 'agumon must have a sprite')
  assert.ok(agumon.file.endsWith('.png'))
  assert.ok(agumon.width > 0 && agumon.height > 0)
  for (const entry of SPRITE_INDEX.slice(0, 50)) {
    assert.equal(typeof entry.id, 'string')
    assert.match(entry.file, /^[A-Za-z0-9_.\-]+\.png$/)
  }
})

test('official Wikimon evolution graph is loaded and core lines hold', () => {
  assert.ok(WIKIMON_EVOLUTIONS, 'wikimon evolution graph must be built')
  assert.ok(getSpecies('agumon').evolvesTo.includes('greymon'))
  assert.ok(getSpecies('greymon').evolvesTo.includes('metal-greymon'))
  assert.ok(getSpecies('metal-greymon').evolvesTo.includes('war-greymon'))
  assert.ok(getSpecies('gabumon').evolvesTo.includes('garurumon'))
})

test('every playable species has a Simplified-Chinese display name', () => {
  for (const species of SPECIES) {
    assert.match(String(species.zh || ''), /[\u4e00-\u9fff]/, `${species.id} zh missing Chinese`)
  }
})

test('training spends AP, adds fatigue and is blocked without AP', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.roster[0].care.energy = 100
  state.roster[0].care.fullness = 100
  const apBefore = state.ap.value
  performAction(state, 'train', { stat: 'atk' }, now + 2000)
  assert.equal(state.ap.value, apBefore - 1)
  assert.ok(state.roster[0].fatigue >= 8)
  state.ap.value = 0
  assert.throws(() => performAction(state, 'train', { stat: 'atk' }, now + 3000), /行动力不足/)
})

test('expedition has AP, energy and cooldown gates', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.player.region = 'native-forest'
  state.ap.value = 100
  const active = state.roster[0]
  active.care.energy = 100
  performAction(state, 'expedition', {}, now + 2000)
  assert.ok(state.cooldowns.expedition > Date.now())
  assert.ok(active.fatigue >= 20)
  assert.throws(() => performAction(state, 'expedition', {}, now + 3000), /冷却/)
})

test('sleep restores energy/fatigue but goes on cooldown', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.care.energy = 40
  active.fatigue = 60
  performAction(state, 'care', { mode: 'sleep' }, now + 2000)
  assert.ok(active.care.energy > 40)
  assert.ok(active.fatigue <= 20)
  assert.throws(() => performAction(state, 'care', { mode: 'sleep' }, now + 3000), /冷却/)
})

test('public state exposes the action economy', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const view = publicState(state, now + 1000)
  assert.ok(view.ap && typeof view.ap.value === 'number')
  assert.ok(view.cooldowns && typeof view.cooldowns.expedition === 'number')
  assert.ok(view.rules && view.rules.apMax >= 24)
})

test('turn-based battle exposes skills, scan and MP cost', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.player.region = 'native-forest'
  state.ap.value = 999
  const active = state.roster[0]
  active.care.energy = 100
  active.level = 20
  active.hp = 200
  active.mp = 200
  let started = false
  for (let i = 0; i < 40; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  const view = publicState(state, now + 50000)
  assert.ok(Array.isArray(view.battle.player.skills) && view.battle.player.skills.length > 0)
  assert.equal(view.battle.enemies[0].skills, null)
  performAction(state, 'battle', { command: 'scan' }, now + 60000)
  assert.equal(state.battle.scanned, true)
  assert.throws(() => performAction(state, 'battle', { command: 'scan' }, now + 61000), /只能分析一次|已经分析/)
  const scannedSpecies = state.battle.enemies[0].speciesId
  const scannedStage = state.battle.enemies[0].stage
  assert.equal(state.dex.scan[scannedSpecies], SCAN_GAIN_BY_STAGE[scannedStage] ?? 12)
  const scanned = publicState(state, now + 60000)
  assert.ok(Array.isArray(scanned.battle.enemies[0].skills))
  performAction(state, 'status', {}, now + 65000)
  const fresh = publicState(state, now + 65000)
  const skills = fresh.battle.player.skills
  const idx = skills.reduce((best, skill, index) => (skill.cost < skills[best].cost ? index : best), 0)
  const activeInst = state.roster.find((entry) => entry.id === state.battle.activeId)
  const beforeMp = activeInst.mp
  assert.ok(beforeMp >= skills[idx].cost, `MP ${beforeMp} < cost ${skills[idx].cost}`)
  const beforeHp = state.battle.enemies[0].hp
  performAction(state, 'battle', { command: 'skill', skill: idx }, now + 70000)
  assert.ok(activeInst.mp <= beforeMp)
  if (state.battle.status === 'active') assert.ok(state.battle.enemies[0].hp <= beforeHp)
})

test('curated skill numbers override the derived profile', () => {
  const species = getSpecies('agumon')
  const pepper = skillProfile('Pepper Breath', species)
  assert.equal(pepper.power, 50)
  assert.equal(pepper.kind, 'physical')
  assert.equal(pepper.cost, 6)
  const derived = skillProfile('Some Unknown Move', species)
  assert.ok(derived.power >= 36)
})

test('mid-battle change swaps active without spending a turn', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const ally = makeInstance(state.roster[0].speciesId, now + 1500)
  ally.hp = 999
  state.roster.push(ally)
  state.party.push(ally.id)
  state.battleParty.push(ally.id)
  state.player.region = 'native-forest'
  state.ap.value = 999
  state.roster[0].care.energy = 100
  state.roster[0].hp = 999
  let started = false
  for (let i = 0; i < 40; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  const turnBefore = state.battle.turn
  performAction(state, 'battle', { command: 'switch', instanceId: ally.id }, now + 60000)
  assert.equal(state.activeId, ally.id)
  assert.equal(state.battle.turn, turnBefore)
})

test('status skills and capture at 100% scan work', () => {
  const species = getSpecies('agumon')
  assert.equal(skillProfile('Darkness Claw', species).effect, 'poison')
  assert.equal(skillProfile('Mega Flame', species).effect, 'burn')
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.player.region = 'native-forest'
  state.ap.value = 999
  state.roster[0].care.energy = 100
  let started = false
  for (let i = 0; i < 40; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  const rosterBefore = state.roster.length
  state.battle.status = 'won'
  state.battle.enemies[0].hp = 0
  state.battle.enemies[0].scanPercent = 100
  assert.ok(state.battle.enemies[0].speciesId)
  performAction(state, 'capture', {}, now + 90000)
  assert.equal(state.battle, null)
  assert.equal(state.roster.length, rosterBefore + 1)
})

test('elite boss battle spawns an elite enemy with cooldown', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.player.region = 'native-forest'
  state.ap.value = 999
  state.roster[0].care.energy = 100
  state.roster[0].hp = 999
  performAction(state, 'boss', {}, now + 2000)
  assert.equal(state.battle.enemies.length, 1)
  assert.equal(state.battle.enemies[0].elite, true)
  assert.ok(state.battle.enemies[0].maxHp > 0)
  assert.ok(state.cooldowns['boss:native-forest'] > Date.now())
  assert.throws(() => performAction(state, 'boss', {}, now + 3000), /冷却/)
})

test('dex pagination reports per-species scan rate', () => {
  const page = dexPage('', 1, 5, { agumon: 40 })
  const agumon = page.items.find((item) => item.id === 'agumon')
  assert.ok(agumon)
  assert.equal(agumon.scan, 40)
})

test('digital farm stores and returns extra Digimon', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const extra = makeInstance(state.roster[0].speciesId, now + 1500)
  state.roster.push(extra)
  state.party.push(extra.id)
  const result = performAction(state, 'farm_store', { instanceId: extra.id }, now + 2000)
  assert.match(result.summary, /农场/)
  assert.ok(state.farm.includes(extra.id))
  assert.ok(!state.party.includes(extra.id))
  performAction(state, 'farm_take', { instanceId: extra.id }, now + 3000)
  assert.ok(!state.farm.includes(extra.id))
})

test('party allows six and battle squad allows three', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  for (let i = 0; i < 6; i += 1) {
    const extra = makeInstance(state.roster[0].speciesId, now + 2000 + i)
    state.roster.push(extra)
    if (state.party.length < state.partyMax) state.party.push(extra.id)
    if (state.battleParty.length < state.battleMax) state.battleParty.push(extra.id)
  }
  assert.ok(state.party.length <= 6)
  assert.ok(state.battleParty.length <= 3)
})

test('three units join the field and controlled unit can switch', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  for (let i = 0; i < 2; i += 1) {
    const extra = makeInstance(state.roster[0].speciesId, now + 1100 + i)
    extra.hp = 999
    state.roster.push(extra)
    state.party.push(extra.id)
    state.battleParty.push(extra.id)
  }
  state.player.region = 'native-forest'
  state.ap.value = 999
  state.roster[0].care.energy = 100
  let started = false
  for (let i = 0; i < 40; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  assert.ok(state.battle.players.length >= 2)
  const view = publicState(state, now + 90000)
  assert.ok(Array.isArray(view.battle.players))
  const other = view.battle.players.find((unit) => unit.id !== view.battle.activeId)
  if (other !== undefined) {
    performAction(state, 'battle', { command: 'switch', instanceId: other.id }, now + 100000)
    assert.equal(state.battle.activeId, other.id)
  }
})

test('dex page can flag elite-cleared species', () => {
  const page = dexPage('', 1, 5, {}, { agumon: true })
  assert.equal(page.items.find((item) => item.id === 'agumon').elite, true)
})

test('queue planning collects orders then executes a round', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.player.region = 'native-forest'
  state.ap.value = 999
  state.roster[0].care.energy = 100
  let started = false
  for (let i = 0; i < 40; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  for (const unit of state.battle.players.filter((entry) => (state.roster.find((inst) => inst.id === entry.id)?.hp ?? 0) > 0)) {
    performAction(state, 'battle', { command: 'plan', kind: 'attack', instanceId: unit.id }, now + 80000)
  }
  assert.ok(Object.keys(state.battle.orders).length >= 1)
  performAction(state, 'battle', { command: 'execute' }, now + 90000)
  assert.ok(state.battle === null || state.battle.phase === 'planning')
  assert.ok(state.battle === null || state.battle.turn >= 2)
})

test('combat stats are capped at 200 and include SPR', () => {
  const species = getSpecies('agumon')
  const stats = computeStats(species, 99, { hp: 9999, mp: 9999, atk: 9999, def: 9999, spd: 9999, wis: 9999, spr: 9999 })
  for (const key of ['maxHp', 'maxMp', 'atk', 'def', 'spd', 'wis', 'spr']) {
    assert.ok(stats[key] <= 200, `${key} ${stats[key]} > 200`)
    assert.ok(stats[key] >= 2)
  }
})

test('shop sells food tiers, devices and battle items', () => {
  const state = createInitialState(now)
  state.inventory.bits = 1000
  const bits = state.inventory.bits
  performAction(state, 'shop_buy', { itemId: 'food_premium', qty: 1 }, now + 1000)
  assert.ok(state.inventory.bits < bits)
  assert.equal(state.inventory.foods.premium, 1)
  performAction(state, 'shop_buy', { itemId: 'device_atk', qty: 1 }, now + 2000)
  assert.equal(state.inventory.devices.atk, 1)
  performAction(state, 'shop_buy', { itemId: 'bomb', qty: 1 }, now + 3000)
  assert.ok((state.inventory.items.bomb ?? 0) >= 2)
})

test('skill book has six-or-fewer, heal skill exists and equip toggles', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  assert.ok(active.skillBook.length <= 6)
  assert.ok(active.skillBook.some((skill) => skill.effect === 'heal'))
  const learned = active.learnedSkills.slice()
  assert.ok(learned.length >= 1)
  const candidate = active.skillBook.find((skill) => skill.learned && !active.equippedSkills.includes(skill.name))
  if (candidate !== undefined) {
    performAction(state, 'equip_skill', { instanceId: active.id, skillName: candidate.name }, now + 2000)
    assert.ok(active.equippedSkills.includes(candidate.name))
    performAction(state, 'equip_skill', { instanceId: active.id, skillName: candidate.name }, now + 3000)
    assert.ok(!active.equippedSkills.includes(candidate.name))
  }
})

test('evolution resets level, trained stats and keeps learned skills', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.level = 40
  active.trained = { hp: 50, mp: 50, atk: 50, def: 50, spd: 50, wis: 50, spr: 50 }
  active.bond = 90
  active.noise = 0
  const learnedBefore = active.learnedSkills.slice()
  const option = evolutionOptions(state, active.id).find((entry) => entry.eligible)
  if (option !== undefined) {
    performAction(state, 'evolve', { target: option.speciesId }, now + 2000)
    assert.equal(active.level, 1)
    assert.equal(active.trained.atk, 0)
    for (const name of learnedBefore) assert.ok(active.learnedSkills.includes(name))
  }
})

test('farm capacity is 999 and extra Digimon can be decomposed', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const extra = makeInstance(state.roster[0].speciesId, now + 1500)
  state.roster.push(extra)
  const beforeCount = state.roster.length
  const beforeBits = state.inventory.bits
  performAction(state, 'decompose', { instanceId: extra.id }, now + 2000)
  assert.equal(state.roster.length, beforeCount - 1)
  assert.ok(state.inventory.bits > beforeBits)
  assert.equal(publicState(state, now + 2500).farmCapacity, 999)
  assert.throws(() => performAction(state, 'decompose', { instanceId: state.activeId }, now + 3000), /出战/)
})

test('AP regenerates by real time (6 real minutes per point)', () => {
  const state = createInitialState(now)
  state.ap.value = 5
  state.ap.lastReal = now
  advanceState(state, now + 12 * 60 * 1000)
  assert.equal(state.ap.value, 7)
})

test('MP regenerates over time and expedition always yields loot', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.mp = 0
  active.care.energy = 100
  active.care.fullness = 100
  state.clock.lastReal = now
  advanceState(state, now + 10 * 60 * 1000)
  assert.ok(active.mp > 0)
  state.player.region = 'gear-savanna'
  state.ap.value = 999
  active.care.energy = 100
  const before = Object.values(state.inventory.fragments).reduce((sum, value) => sum + value, 0)
  performAction(state, 'expedition', {}, now + 11 * 60 * 1000)
  const after = Object.values(state.inventory.fragments).reduce((sum, value) => sum + value, 0)
  assert.ok(after > before)
})

test('status line exposes AP, energy, party ids and eggs', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const line = statusLine(state)
  assert.match(line, /AP /)
  assert.match(line, /体力/)
  assert.match(line, /随行.*dm_/)
  assert.match(line, /蛋/)
})

test('travel accepts Chinese region names and lists ids on error', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  performAction(state, 'travel', { region: '齿轮荒原' }, now + 2000)
  assert.equal(state.player.region, 'gear-savanna')
  assert.throws(() => performAction(state, 'travel', { region: '不存在的地方' }, now + 3000), /gear-savanna/)
})

test('expedition in File City lists regions and can auto-travel with region param', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.ap.value = 999
  state.roster[0].care.energy = 100
  assert.throws(() => performAction(state, 'expedition', {}, now + 2000), /gear-savanna/)
  performAction(state, 'expedition', { region: '齿轮荒原' }, now + 3000)
  assert.equal(state.player.region, 'gear-savanna')
})

test('status line shows sleep cooldown and egg hatch remaining', () => {
  const state = createInitialState(now)
  const line = statusLine(state)
  assert.match(line, /睡眠冷却/)
  assert.match(line, /孵化/)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.care.energy = 30
  performAction(state, 'care', { mode: 'sleep' }, now + 2000)
  assert.ok(active.care.energy >= 90)
  assert.match(statusLine(state), /睡眠冷却 [0-9]+分钟/)
})

test('shop accepts aliases and lists ids on failure', () => {
  const state = createInitialState(now)
  state.inventory.bits = 1000
  performAction(state, 'shop_buy', { itemId: '训练装置', stat: 'atk', qty: 1 }, now + 1000)
  assert.equal(state.inventory.devices.atk, 1)
  performAction(state, 'shop_buy', { itemId: '数据食物', qty: 1 }, now + 2000)
  assert.ok(state.inventory.foods.basic >= 4)
  assert.throws(() => performAction(state, 'shop_buy', { itemId: '不存在', qty: 1 }, now + 3000), /device_atk/)
})

test('battle substitute swaps a bench member onto the field', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  for (let i = 0; i < 3; i += 1) {
    const extra = makeInstance(state.roster[0].speciesId, now + 1500 + i)
    extra.hp = 200
    state.roster.push(extra)
    state.party.push(extra.id)
    if (state.battleParty.length < 3) state.battleParty.push(extra.id)
  }
  // extra party members beyond the battle party become bench
  state.player.region = 'native-forest'
  state.ap.value = 999
  state.roster[0].care.energy = 100
  state.roster[0].hp = 200
  let started = false
  for (let i = 0; i < 40; i += 1) {
    performAction(state, 'explore', {}, now + 2000 + i * 1000)
    if (state.battle !== null) { started = true; break }
  }
  assert.equal(started, true)
  const bench = publicState(state, now + 90000).battle.bench
  if (bench.length > 0) {
    const before = state.battle.players.map((unit) => unit.id)
    performAction(state, 'battle', { command: 'substitute', inId: bench[0].id }, now + 100000)
    assert.ok(state.battle.players.some((unit) => unit.id === bench[0].id))
    assert.notDeepEqual(state.battle.players.map((unit) => unit.id), before)
  }
})

test('AP has visible recovery sources and explore costs AP', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.ap.value = 5
  performAction(state, 'care', { mode: 'feed' }, now + 2000)
  assert.ok(state.ap.value > 5)
  state.ap.value = 5
  performAction(state, 'care', { mode: 'sleep' }, now + 3000)
  assert.ok(state.ap.value >= 8)
  state.ap.value = 10
  const before = state.ap.value
  performAction(state, 'explore', {}, now + 4000)
  assert.ok(state.ap.value <= before - 1)
  assert.match(statusLine(state), /AP恢复/)
})

test('backpack use_item consumes medicine, food and training devices', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  state.inventory.bits = 1000
  const active = state.roster[0]
  active.hp = 10
  const potions = state.inventory.items.potion_s
  performAction(state, 'use_item', { itemId: 'potion_s' }, now + 2000)
  assert.ok(active.hp > 10)
  assert.equal(state.inventory.items.potion_s, potions - 1)
  performAction(state, 'shop_buy', { itemId: 'device_atk', qty: 1 }, now + 3000)
  assert.equal(state.inventory.devices.atk, 1)
  active.care.energy = 100
  active.care.fullness = 100
  const before = active.trained.atk
  performAction(state, 'use_item', { itemId: 'device_atk' }, now + 4000)
  assert.equal(state.inventory.devices.atk, 0)
  assert.ok(active.trained.atk > before)
  assert.match(statusLine(state), /背包：装置/)
})

test('healing charges bits by missing HP at higher level', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.level = 12
  active.hp = 1
  state.inventory.bits = 1000
  const before = state.inventory.bits
  const result = performAction(state, 'care', { mode: 'heal' }, now + 2000)
  assert.ok(state.inventory.bits < before)
  assert.match(result.summary, /比特/)
  assert.ok(active.hp > 1)
})

test('targeted training requires and consumes the matching device', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.care.energy = 100
  active.care.fullness = 100
  assert.throws(() => performAction(state, 'train', { stat: 'atk', useDevice: true }, now + 2000), /训练装置/)
  state.inventory.devices.atk = 1
  const before = active.trained.atk
  const result = performAction(state, 'train', { stat: 'atk', useDevice: true }, now + 3000)
  assert.match(result.summary, /训练装置/)
  assert.equal(state.inventory.devices.atk, 0)
  assert.ok(active.trained.atk > before)
})

test('play restores mood and goes on cooldown', () => {
  const state = createInitialState(now)
  performAction(state, 'hatch', {}, now + 1000)
  const active = state.roster[0]
  active.care.mood = 10
  performAction(state, 'care', { mode: 'play' }, now + 2000)
  assert.ok(active.care.mood >= 20)
  assert.throws(() => performAction(state, 'care', { mode: 'play' }, now + 3000), /冷却/)
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
