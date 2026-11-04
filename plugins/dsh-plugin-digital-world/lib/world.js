/**
 * Core game engine for the Digital World.
 *
 * The engine is intentionally independent of HTTP and React. Every mutation the
 * panel or the `digital_world` tool performs goes through `performAction`, so
 * there is exactly one implementation of feeding, training, fighting, hatching
 * and evolving.
 *
 * @module dsh-plugin-digital-world/world
 */

import {
  CATALOG,
  LEVEL_LABELS,
  LEVEL_ORDER,
  REGION_MAP,
  REGIONS,
  SPECIES,
  SPECIES_MAP,
  attributeLabel,
  evolutionTargets,
  findBaseForm,
  getSpecies,
  levelLabel,
  stageBase,
  stageIndex,
  starterPool,
  tendencyFor,
} from './game-data.js'

/** Save format version. */
export const STATE_VERSION = 2

/** Stage labels for our own systems. */
const STAGE_LEVEL_REQ = Object.freeze({
  baby2: 3,
  child: 6,
  adult: 12,
  perfect: 24,
  ultimate: 40,
  armor: 8,
  hybrid: 8,
  'xros-wars': 6,
  unknown: 3,
})

const STAGE_POWER_REQ = Object.freeze({
  baby2: 40,
  child: 110,
  adult: 260,
  perfect: 620,
  ultimate: 1400,
  armor: 220,
  hybrid: 220,
  'xros-wars': 140,
  unknown: 50,
})

const SEASONS = ['spring', 'summer', 'autumn', 'winter']
const WEATHERS = ['sunny', 'cloudy', 'rain', 'aurora', 'storm']
const SEASON_LABELS = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }
const WEATHER_LABELS = { sunny: '晴', cloudy: '多云', rain: '雨', aurora: '极光', storm: '风暴' }

/** @returns a printable message for an error. */
export function messageOf(error) {
  if (error !== null && typeof error === 'object' && typeof error.message === 'string' && error.message !== '') {
    return error.message
  }
  return String(error)
}

/** Throw a user-facing action error. */
function fail(message) {
  throw new Error(message)
}

/** @returns a random integer in [min, max]. */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/** @returns a random element of a non-empty array. */
function pick(array) {
  return array[Math.floor(Math.random() * array.length)]
}

/** @returns a unique-ish id for an instance. */
function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** @returns a stage key for a species or instance. */
function stageOf(speciesOrInstance) {
  return speciesOrInstance.stage ?? speciesOrInstance.level ?? 'unknown'
}

/** @returns the next stage key in the normal progression. */
const NEXT_STAGE = {
  baby1: 'baby2',
  baby2: 'child',
  child: 'adult',
  adult: 'perfect',
  perfect: 'ultimate',
}

/** @returns the number of levels a stage has above baby1. */
function normalStageOrder(stage) {
  return ['baby1', 'baby2', 'child', 'adult', 'perfect', 'ultimate'].indexOf(stage)
}

/** @returns the current stage label. */
function stageLabel(stage) {
  return LEVEL_LABELS[stage] ?? '未知'
}

/** @returns experience required to reach the next level. */
export function expToNext(level) {
  return 15 + level * 8
}

/** @returns the derived stat block for a species at a level with training bonuses. */
export function computeStats(species, level, trained = {}) {
  const base = stageBase(species.level)
  const tendency = tendencyFor(species)
  const levelFactor = 1 + Math.max(0, level - 1) * 0.055
  const bump = (key) => Math.max(0, Number(trained[key]) || 0)
  return {
    maxHp: Math.max(8, Math.round((12 + base * 1.55 * tendency.hp + bump('hp') * 2) * levelFactor)),
    maxMp: Math.max(6, Math.round((8 + base * 0.9 * tendency.mp + bump('mp') * 1.5) * levelFactor)),
    atk: Math.max(2, Math.round((5 + base * 0.52 * tendency.atk + bump('atk')) * levelFactor)),
    def: Math.max(2, Math.round((4 + base * 0.42 * tendency.def + bump('def')) * levelFactor)),
    spd: Math.max(2, Math.round((5 + base * 0.38 * tendency.spd + bump('spd')) * levelFactor)),
    wis: Math.max(2, Math.round((4 + base * 0.34 * tendency.wis + bump('wis')) * levelFactor)),
  }
}

/** @returns a plain object summary of one owned Digimon. */
export function instanceSummary(instance) {
  const species = getSpecies(instance.speciesId)
  const stats = computeStats(species ?? { level: instance.stage, attribute: 'unknown', type: 'Unknown' }, instance.level, instance.trained)
  return {
    id: instance.id,
    speciesId: instance.speciesId,
    name: instance.name,
    speciesName: species?.name ?? instance.speciesId,
    speciesZh: species?.zh ?? species?.name ?? instance.speciesId,
    attribute: species?.attribute ?? 'unknown',
    attributeLabel: attributeLabel(species?.attribute ?? 'unknown'),
    type: species?.type ?? 'Unknown',
    stage: instance.stage,
    stageLabel: stageLabel(instance.stage),
    level: instance.level,
    exp: instance.exp,
    expToNext: expToNext(instance.level),
    bond: Math.round(instance.bond),
    noise: Math.round(instance.noise),
    hp: Math.round(instance.hp),
    maxHp: stats.maxHp,
    mp: Math.round(instance.mp),
    maxMp: stats.maxMp,
    stats: { atk: stats.atk, def: stats.def, spd: stats.spd, wis: stats.wis },
    care: { ...instance.care },
    moves: [...instance.moves],
    wins: instance.wins,
    battles: instance.battles,
    ageHours: Math.round(instance.ageHours),
    inParty: false,
    inNest: true,
  }
}

/** Choose a random starter species from the complete-growth pool. */
function pickStarterSpecies() {
  const pool = starterPool()
  return pool.length > 0 ? pick(pool) : SPECIES[0]
}

/** Create one egg. */
function makeEgg(speciesId, source, totalHours, hatchHours = 1, rarity = 'common') {
  return {
    id: makeId('egg'),
    speciesId,
    source,
    rarity,
    createdAt: Date.now(),
    bornAtHours: totalHours,
    hatchHours,
    readyAtHours: totalHours + hatchHours,
  }
}

/** Create a new game. */
export function createInitialState(now = Date.now()) {
  const starter = pickStarterSpecies()
  const species = getSpecies(starter.id) ?? SPECIES[0]
  return {
    version: STATE_VERSION,
    createdAt: now,
    updatedAt: now,
    clock: {
      totalHours: 8,
      lastReal: now,
      day: 1,
      hour: 8,
      season: 'spring',
      weather: 'sunny',
      event: null,
    },
    player: { name: '训练师', region: 'file-city' },
    roster: [],
    eggs: [makeEgg(species.id, 'starter', 8, 0, 'starter')],
    party: [],
    activeId: null,
    nestCapacity: 12,
    inventory: {
      food: 6,
      medicine: 2,
      rebuildPrograms: 2,
      dataCores: 3,
      bits: 160,
      fragments: { vaccine: 0, data: 0, virus: 0, free: 0 },
      fragmentTypes: {},
    },
    dex: { seen: {}, owned: {}, absorbed: {} },
    city: {
      sync: 0,
      facilities: { gym: 1, clinic: 1, shop: 1, incubator: 1, nest: 1, lab: 0, farm: 0 },
      residents: [],
    },
    regions: { discovered: { 'file-city': true }, ecology: {} },
    battle: null,
    stats: { battlesWon: 0, battlesLost: 0, eggsHatched: 0, dataAbsorbed: 0, evolutions: 0 },
    log: [
      {
        at: now,
        kind: 'world',
        text: 'File City 的终端吐出了一颗未解析数码蛋。它的壳上有微弱的脉冲，像在等待第一次心跳。',
      },
    ],
  }
}

/** Normalize an imported v2 save. */
export function normalizeState(raw, now = Date.now()) {
  if (raw === null || typeof raw !== 'object' || raw.version !== STATE_VERSION) {
    return createInitialState(now)
  }
  const base = createInitialState(now)
  const state = { ...base, ...raw }
  state.clock = { ...base.clock, ...(raw.clock ?? {}) }
  state.player = { ...base.player, ...(raw.player ?? {}) }
  state.roster = Array.isArray(raw.roster)
    ? raw.roster
        .filter((instance) => instance && typeof instance.id === 'string' && getSpecies(instance.speciesId) !== undefined)
        .map((instance) => {
          const fallback = makeInstance(instance.speciesId, now)
          return {
            ...fallback,
            ...instance,
            care: { ...fallback.care, ...(instance.care ?? {}) },
            trained: { ...fallback.trained, ...(instance.trained ?? {}) },
            moves: Array.isArray(instance.moves) && instance.moves.length > 0 ? instance.moves.slice(0, 4) : fallback.moves,
          }
        })
    : []
  state.eggs = Array.isArray(raw.eggs) ? raw.eggs.filter((egg) => egg && typeof egg.speciesId === 'string' && getSpecies(egg.speciesId) !== undefined) : []
  state.party = Array.isArray(raw.party) ? raw.party.filter((id) => typeof id === 'string' && state.roster.some((entry) => entry.id === id)).slice(0, 3) : []
  state.activeId = state.roster.some((entry) => entry.id === raw.activeId) ? raw.activeId : null
  if (state.activeId === null && state.party.length > 0) state.activeId = state.party[0]
  state.nestCapacity = Math.max(6, Math.round(Number(raw.nestCapacity) || 12))
  state.inventory = { ...base.inventory, ...(raw.inventory ?? {}) }
  state.inventory.fragments = { ...base.inventory.fragments, ...(raw.inventory?.fragments ?? {}) }
  state.inventory.fragmentTypes = { ...(raw.inventory?.fragmentTypes ?? {}) }
  state.dex = {
    seen: { ...(raw.dex?.seen ?? {}) },
    owned: { ...(raw.dex?.owned ?? {}) },
    absorbed: { ...(raw.dex?.absorbed ?? {}) },
  }
  state.city = {
    ...base.city,
    ...(raw.city ?? {}),
    facilities: { ...base.city.facilities, ...(raw.city?.facilities ?? {}) },
  }
  state.regions = {
    ...base.regions,
    ...(raw.regions ?? {}),
    discovered: { 'file-city': true, ...(raw.regions?.discovered ?? {}) },
    ecology: { ...(raw.regions?.ecology ?? {}) },
  }
  state.stats = { ...base.stats, ...(raw.stats ?? {}) }
  state.log = Array.isArray(raw.log) ? raw.log.filter((entry) => entry && typeof entry.text === 'string').slice(-60) : base.log
  state.battle = raw.battle ?? null
  state.updatedAt = now
  state.clock.lastReal = typeof raw.clock?.lastReal === 'number' ? raw.clock.lastReal : now
  if (state.roster.length === 0 && state.eggs.length === 0) state.eggs.push(makeEgg(pickStarterSpecies().id, 'starter', state.clock.totalHours, 0, 'starter'))
  return state
}

/** Append one log entry. */
export function appendLog(state, kind, text, now = Date.now()) {
  state.log.push({ at: now, kind, text })
  if (state.log.length > 60) state.log.splice(0, state.log.length - 60)
}

/** @returns the active instance or throws. */
function requireActive(state) {
  const instance = state.roster.find((entry) => entry.id === state.activeId)
  if (instance === undefined) fail('还没有孵化的数码兽。先去孵化一颗数码蛋吧。')
  return instance
}

/** @returns the instance by id. */
function instanceById(state, id) {
  return state.roster.find((entry) => entry.id === id)
}

/** @returns the active instance without throwing. */
export function activeInstance(state) {
  return instanceById(state, state.activeId) ?? null
}

/** @returns the derived stat block for an instance. */
function statsOf(instance) {
  const species = getSpecies(instance.speciesId) ?? { level: instance.stage, attribute: 'unknown', type: 'Unknown' }
  return computeStats(species, instance.level, instance.trained)
}

/** Recompute the maxima after leveling and keep current values in range. */
function refreshInstanceStats(instance) {
  const stats = statsOf(instance)
  instance.hp = Math.min(instance.hp, stats.maxHp)
  instance.mp = Math.min(instance.mp, stats.maxMp)
  return stats
}

/** Create a new Digimon instance from a species. */
export function makeInstance(speciesId, now = Date.now(), name) {
  const species = getSpecies(speciesId)
  if (species === undefined) fail(`未知的数码兽：${speciesId}`)
  const instance = {
    id: makeId('dm'),
    speciesId: species.id,
    name: typeof name === 'string' && name.trim() !== '' ? name.trim().slice(0, 12) : species.zh || species.name,
    stage: species.level,
    level: 1,
    exp: 0,
    bond: 55,
    noise: 0,
    hp: 1,
    mp: 1,
    care: { fullness: 82, cleanliness: 88, mood: 78, energy: 80, sleep: 70 },
    trained: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, wis: 0 },
    moves: species.moves.slice(0, 3),
    wins: 0,
    battles: 0,
    ageHours: 0,
    createdAt: now,
  }
  const stats = computeStats(species, 1, instance.trained)
  instance.hp = stats.maxHp
  instance.mp = stats.maxMp
  return instance
}

/** @returns a region record by id or throws. */
function requireRegion(state, regionId) {
  const region = REGION_MAP.get(regionId)
  if (region === undefined) fail(`未知的区域：${regionId}`)
  if (region.safe === false && state.city.sync < region.unlockSync) {
    fail(`${region.zh} 还没有解锁。把 File City 的同步率提升到 ${region.unlockSync}% 再来吧。`)
  }
  return region
}

/** @returns a region from a current state. */
export function currentRegion(state) {
  return REGION_MAP.get(state.player.region) ?? REGION_MAP.get('file-city')
}

/** @returns weather for a world day. */
function weatherFor(day, hour) {
  return WEATHERS[(day * 3 + Math.floor(hour / 6)) % WEATHERS.length]
}

/** Advance world time and passive needs. */
export function advanceState(state, now = Date.now()) {
  const previousReal = typeof state.clock.lastReal === 'number' ? state.clock.lastReal : now
  const rawDelta = Math.max(0, now - previousReal)
  // Closing the panel should not kill a creature. Cap one catch-up at 10 real
  // minutes; normal polling advances in small slices.
  const delta = Math.min(rawDelta, 10 * 60 * 1000)
  const hours = delta / 60_000
  if (hours > 0.001) {
    state.clock.totalHours += hours
    for (const instance of state.roster) {
      const isParty = state.party.includes(instance.id)
      if (!isParty) continue
      const sleepHours = instance.sleepingUntil ?? 0
      if (state.clock.totalHours < sleepHours) {
        instance.care.energy = Math.min(100, instance.care.energy + hours * 8)
        instance.care.sleep = Math.min(100, instance.care.sleep + hours * 5)
      } else {
        instance.care.fullness = Math.max(0, instance.care.fullness - hours * 1.8)
        instance.care.cleanliness = Math.max(0, instance.care.cleanliness - hours * 1.1)
        instance.care.energy = Math.max(0, instance.care.energy - hours * 1.5)
        instance.care.sleep = Math.max(0, instance.care.sleep - hours * 0.8)
        if (instance.care.fullness < 25) instance.care.mood = Math.max(0, instance.care.mood - hours * 1.4)
        else instance.care.mood = Math.max(0, instance.care.mood - hours * 0.35)
        if (instance.care.energy > 35 && instance.care.fullness > 30) {
          const stats = statsOf(instance)
          instance.hp = Math.min(stats.maxHp, instance.hp + hours * 0.5)
          instance.mp = Math.min(stats.maxMp, instance.mp + hours * 0.6)
        }
      }
      instance.ageHours += hours
    }
  }
  state.clock.lastReal = now
  state.clock.day = Math.floor(state.clock.totalHours / 24) + 1
  state.clock.hour = Math.floor(state.clock.totalHours % 24)
  state.clock.season = SEASONS[Math.floor((state.clock.day - 1) / 7) % SEASONS.length]
  state.clock.weather = weatherFor(state.clock.day, state.clock.hour)
  state.clock.event = state.clock.day % 7 === 0 ? 'data-storm' : null
  state.updatedAt = now
  return state
}

/** Add game hours immediately (sleep, training, etc.). */
export function advanceGameHours(state, hours) {
  state.clock.totalHours += hours
  state.clock.day = Math.floor(state.clock.totalHours / 24) + 1
  state.clock.hour = Math.floor(state.clock.totalHours % 24)
  state.clock.season = SEASONS[Math.floor((state.clock.day - 1) / 7) % SEASONS.length]
  state.clock.weather = weatherFor(state.clock.day, state.clock.hour)
  state.clock.event = state.clock.day % 7 === 0 ? 'data-storm' : null
  for (const instance of state.roster) {
    if (!state.party.includes(instance.id)) continue
    instance.care.fullness = Math.max(0, instance.care.fullness - hours * 2)
    instance.care.cleanliness = Math.max(0, instance.care.cleanliness - hours * 0.8)
    instance.care.energy = Math.max(0, instance.care.energy - hours * 1)
    instance.ageHours += hours
  }
  state.clock.lastReal = Date.now()
}

/** @returns Care Mistake count proxies for UI. */
function careFlags(instance) {
  return {
    hungry: instance.care.fullness < 25,
    dirty: instance.care.cleanliness < 25,
    tired: instance.care.energy < 20,
    sad: instance.care.mood < 25,
  }
}

/** @returns the DigiLink bonuses for the current party. */
export function computeLinks(state) {
  const party = state.party.map((id) => instanceById(state, id)).filter(Boolean)
  const links = []
  const attributes = new Set(party.map((instance) => getSpecies(instance.speciesId)?.attribute ?? 'unknown'))
  if (attributes.size >= 3) links.push({ id: 'tri-data', name: '三色数据回路', effect: '全队获得经验 +10%' })
  const attributeCounts = {}
  for (const instance of party) {
    const attribute = getSpecies(instance.speciesId)?.attribute ?? 'unknown'
    attributeCounts[attribute] = (attributeCounts[attribute] ?? 0) + 1
  }
  if (Object.values(attributeCounts).some((count) => count >= 2)) links.push({ id: 'resonance', name: '同调共鸣', effect: '训练收益 +10%' })
  const typeCounts = {}
  for (const instance of party) {
    const type = getSpecies(instance.speciesId)?.type ?? 'Unknown'
    typeCounts[type] = (typeCounts[type] ?? 0) + 1
  }
  if (Object.values(typeCounts).some((count) => count >= 2)) links.push({ id: 'type-link', name: '同型链接', effect: '战斗 HP +5%' })
  return links
}

/** Grant EXP to an instance; returns level-up events. */
function grantExp(state, instance, amount) {
  const events = []
  const species = getSpecies(instance.speciesId)
  const links = computeLinks(state)
  const multiplier = links.some((link) => link.id === 'tri-data') ? 1.1 : 1
  instance.exp += Math.max(0, Math.round(amount * multiplier))
  while (instance.exp >= expToNext(instance.level) && instance.level < 99) {
    instance.exp -= expToNext(instance.level)
    instance.level += 1
    const stats = refreshInstanceStats(instance)
    instance.hp = Math.min(stats.maxHp, instance.hp + Math.round(stats.maxHp * 0.15))
    instance.mp = Math.min(stats.maxMp, instance.mp + Math.round(stats.maxMp * 0.15))
    events.push({ kind: 'level', level: instance.level, text: `${instance.name} 升到了 Lv.${instance.level}` })
  }
  if (events.length > 0 && species !== undefined) {
    appendLog(state, 'level', `${instance.name} 升到了 Lv.${instance.level}。`)
  }
  return events
}

/** @returns all normal evolution options for one instance. */
export function evolutionOptions(state, instanceId = state.activeId) {
  const instance = instanceById(state, instanceId)
  if (instance === undefined) return []
  const species = getSpecies(instance.speciesId)
  if (species === undefined) return []
  const currentStage = stageIndex(instance.stage)
  const targets = evolutionTargets(species.id).filter((target) => stageIndex(target.level) === currentStage + 1)
  return targets.map((target) => {
    const targetStage = stageIndex(target.level)
    const levelReq = STAGE_LEVEL_REQ[target.level] ?? 6
    const stats = statsOf(instance)
    const power = stats.atk + stats.def + stats.spd + stats.wis
    const powerReq = STAGE_POWER_REQ[target.level] ?? 100
    const reasons = []
    if (instance.level < levelReq) reasons.push(`等级不足（需 Lv.${levelReq}）`)
    if (instance.bond < 40) reasons.push('羁绊不足（需 40）')
    if (power < powerReq) reasons.push(`基础能力不足（需 ${powerReq}）`)
    if (instance.noise > 50) reasons.push('数据噪声过高（需 ≤50）')
    return {
      speciesId: target.id,
      name: target.name,
      zh: target.zh,
      stage: target.level,
      stageLabel: levelLabel(target.level),
      levelReq,
      powerReq,
      eligible: reasons.length === 0,
      reasons,
      nextStage: targetStage === currentStage + 1,
    }
  })
}

/** Evolve the active instance. */
export function evolve(state, targetId, now = Date.now()) {
  const instance = requireActive(state)
  const region = currentRegion(state)
  if (region.id !== 'file-city' && region.id !== 'green-gym') fail('进化需要在 File City 或苍苔训练场的进化祭坛进行。')
  const option = evolutionOptions(state).find((entry) => entry.speciesId === targetId)
  if (option === undefined) fail('这不是当前可用的进化路线。')
  if (!option.eligible) fail(`还不能进化：${option.reasons.join('；')}`)
  const target = getSpecies(targetId)
  if (target === undefined) fail('进化目标不存在。')
  instance.speciesId = target.id
  instance.stage = target.level
  const stats = computeStats(target, instance.level, instance.trained)
  instance.hp = stats.maxHp
  instance.mp = stats.maxMp
  instance.moves = [...new Set([...instance.moves, ...target.moves].slice(0, 4))]
  state.dex.seen[target.id] = true
  state.dex.owned[target.id] = true
  state.stats.evolutions += 1
  appendLog(state, 'evolve', `${instance.name} 在进化祭坛的光柱中进化成了 ${target.zh || target.name}！`, now)
  return { ok: true, action: 'evolve', summary: `${instance.name} 进化成了 ${target.zh || target.name}（${levelLabel(target.level)}）。` }
}

/** Feed/clean/pet/sleep/heal. */
function careAction(state, mode) {
  const instance = requireActive(state)
  if (mode === 'feed') {
    if (state.inventory.food <= 0) {
      if (state.inventory.bits >= 10) {
        state.inventory.bits -= 10
      } else {
        fail('没有食物，也没有足够的比特。')
      }
    } else {
      state.inventory.food -= 1
    }
    instance.care.fullness = Math.min(100, instance.care.fullness + 24)
    instance.care.mood = Math.min(100, instance.care.mood + 5)
    instance.bond = Math.min(100, instance.bond + 1)
    appendLog(state, 'feed', `你喂了 ${instance.name} 一份数据食物。`)
    return `你喂了 ${instance.name} 一份数据食物。饱食 +24，心情 +5。`
  }
  if (mode === 'clean') {
    instance.care.cleanliness = Math.min(100, instance.care.cleanliness + 30)
    instance.care.mood = Math.min(100, instance.care.mood + 3)
    appendLog(state, 'clean', `你清理了 ${instance.name} 周围的数据灰尘。`)
    return `你清理了 ${instance.name} 的数据灰尘。清洁 +30。`
  }
  if (mode === 'pet') {
    instance.care.mood = Math.min(100, instance.care.mood + 8)
    instance.bond = Math.min(100, instance.bond + 2)
    appendLog(state, 'pat', `你摸了摸 ${instance.name} 的头，它蹭了蹭你的手心。`)
    return `你摸了摸 ${instance.name}。心情 +8，羁绊 +2。`
  }
  if (mode === 'sleep') {
    const hours = 4
    instance.sleepingUntil = state.clock.totalHours + hours
    advanceGameHours(state, hours)
    instance.care.energy = Math.min(100, instance.care.energy + 38)
    instance.care.sleep = Math.min(100, instance.care.sleep + 45)
    instance.care.mood = Math.min(100, instance.care.mood + 4)
    appendLog(state, 'rest', `${instance.name} 睡了 ${hours} 个游戏小时，精神恢复了不少。`)
    return `${instance.name} 睡了 ${hours} 个游戏小时。体力 +38，睡眠 +45。`
  }
  if (mode === 'heal') {
    if (state.inventory.medicine <= 0) {
      if (state.inventory.bits < 25) fail('没有药品，也不够比特购买。')
      state.inventory.bits -= 25
    } else {
      state.inventory.medicine -= 1
    }
    const stats = statsOf(instance)
    instance.hp = stats.maxHp
    instance.care.mood = Math.min(100, instance.care.mood + 2)
    appendLog(state, 'heal', `${instance.name} 使用了药品，HP 完全恢复。`)
    return `${instance.name} 使用了药品，HP 完全恢复。`
  }
  fail(`未知的照顾动作：${mode}`)
}

/** Train one stat. */
function trainAction(state, stat) {
  const instance = requireActive(state)
  const allowed = new Set(['hp', 'mp', 'atk', 'def', 'spd', 'wis'])
  if (!allowed.has(stat)) fail(`未知的训练项目：${stat}`)
  if (instance.care.energy < 15) fail('体力不足，先让它休息一下。')
  if (instance.care.fullness < 20) fail('太饿了，先喂点东西。')
  advanceGameHours(state, 1)
  const links = computeLinks(state)
  const linkBonus = links.some((link) => link.id === 'resonance') ? 1.1 : 1
  const gymBonus = 1 + Math.max(0, (state.city.facilities.gym ?? 1) - 1) * 0.06
  const species = getSpecies(instance.speciesId)
  const tendency = tendencyFor(species ?? { attribute: 'unknown', type: 'Unknown' })
  const typeBonus = tendency[stat] ?? 1
  const moodBonus = instance.care.mood >= 60 ? 1.1 : instance.care.mood < 25 ? 0.7 : 1
  const gain = Math.max(1, Math.round((2 + stageIndex(instance.stage) * 1.2) * typeBonus * moodBonus * linkBonus * gymBonus))
  instance.trained[stat] = (instance.trained[stat] ?? 0) + gain
  instance.care.energy = Math.max(0, instance.care.energy - 12)
  instance.care.fullness = Math.max(0, instance.care.fullness - 4)
  instance.care.mood = Math.min(100, instance.care.mood + 1)
  instance.bond = Math.min(100, instance.bond + 0.5)
  refreshInstanceStats(instance)
  const expEvents = grantExp(state, instance, 5 + stageIndex(instance.stage) * 2)
  appendLog(state, 'train', `${instance.name} 在 ${stat.toUpperCase()} 训练中提升了 ${gain} 点。`)
  const suffix = expEvents.length > 0 ? ` 升到了 Lv.${instance.level}！` : ''
  return `${instance.name} 完成了 ${stat.toUpperCase()} 训练。成长 +${gain}，消耗 1 游戏小时。${suffix}`
}

/** Choose a wild species for a region. */
function regionSpecies(region, stages = region.wildStages) {
  let pool = SPECIES.filter((species) => stages.includes(species.level))
  const biased = pool.filter((species) => {
    const type = String(species.type).toLowerCase()
    return region.typeBias.some((bias) => type.includes(bias.toLowerCase()))
      || region.attributeBias.includes(species.attribute)
  })
  if (biased.length >= 3) pool = biased
  if (pool.length === 0) pool = starterPool()
  return pool.length > 0 ? pick(pool) : SPECIES[0]
}

/** Create a wild enemy for a region, scaled to the active Digimon. */
function createEnemy(state, region) {
  const active = activeInstance(state)
  const activeStage = active === null ? 0 : stageIndex(active.stage)
  let stages = region.wildStages.filter((stage) => {
    const index = stageIndex(stage)
    return index <= activeStage && index >= Math.max(0, activeStage - 1)
  })
  if (stages.length === 0) {
    stages = region.wildStages.filter((stage) => stageIndex(stage) <= activeStage + 1)
  }
  if (stages.length === 0) stages = region.wildStages.slice(0, 1)
  const ecology = state.regions.ecology?.[region.id] ?? {}
  const dominant = Object.entries(ecology).sort((a, b) => b[1] - a[1])[0]?.[0]
  const biasedRegion = dominant === undefined
    ? region
    : { ...region, attributeBias: [...region.attributeBias, dominant] }
  const species = regionSpecies({ ...biasedRegion, wildStages: stages }, stages)
  const playerLevel = active?.level ?? 1
  const level = Math.max(1, playerLevel + randInt(-1, 1))
  const stats = computeStats(species, level)
  return {
    id: makeId('enemy'),
    speciesId: species.id,
    name: species.zh || species.name,
    level,
    stage: species.level,
    attribute: species.attribute,
    type: species.type,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    mp: stats.maxMp,
    maxMp: stats.maxMp,
    stats,
    moves: species.moves,
  }
}

/** Start a battle in the current region. */
function startBattle(state) {
  const region = currentRegion(state)
  if (region.safe) fail('File City 里没有野生数码兽。去外地探索吧。')
  if (activeInstance(state) === null) fail('还没有出战的数码兽。')
  const enemy = createEnemy(state, region)
  state.battle = {
    enemy,
    turn: 1,
    status: 'active',
    scanned: false,
    log: [`野生的 ${enemy.name}（Lv.${enemy.level}）出现了！`],
    rewardPreview: `EXP +${8 + stageIndex(enemy.stage) * 12}，数据碎片`,
  }
  state.dex.seen[enemy.speciesId] = true
  return `野生的 ${enemy.name} 挡住了去路。`
}

/** @returns the attribute damage multiplier for an attacker. */
function attributeMultiplier(attacker, defender) {
  const strong = { vaccine: 'virus', virus: 'data', data: 'vaccine' }
  if (strong[attacker] === defender) return 1.25
  if (strong[defender] === attacker) return 0.8
  return 1
}

/** Resolve one battle round. */
function battleRound(state, command = 'attack') {
  const battle = state.battle
  if (battle === null || battle.status !== 'active') fail('当前没有进行中的战斗。')
  const instance = requireActive(state)
  const enemy = battle.enemy
  const playerStats = statsOf(instance)
  const enemyStats = enemy.stats
  const playerName = instance.name

  if (command === 'flee') {
    battle.status = 'fled'
    battle.log.push(`${playerName} 撤退了。`)
    return
  }
  if (command === 'scan') {
    battle.scanned = true
    battle.log.push(`扫描完成：${enemy.name} 是 ${attributeLabel(enemy.attribute)} / ${enemy.type} 型，吸收与重构效率上升。`)
    battle.turn += 1
    return
  }
  const playerAttack = Math.max(1, Math.round(playerStats.atk * (command === 'skill' ? 1.6 : 1) * (1 + instance.bond / 500) * (1 - instance.noise / 500) - enemyStats.def * 0.45))
  const playerDamage = Math.max(1, Math.round(playerAttack * attributeMultiplier(getSpecies(instance.speciesId)?.attribute ?? 'unknown', enemy.attribute) * (0.85 + Math.random() * 0.3)))
  enemy.hp = Math.max(0, enemy.hp - playerDamage)
  battle.log.push(command === 'skill' ? `${playerName} 使用了必杀技，对 ${enemy.name} 造成 ${playerDamage} 伤害。` : `${playerName} 攻击 ${enemy.name}，造成 ${playerDamage} 伤害。`)
  if (enemy.hp <= 0) {
    battle.status = 'won'
    battle.log.push(`${enemy.name} 的数据开始崩解。`)
    state.stats.battlesWon += 1
    instance.battles += 1
    instance.wins += 1
    instance.care.mood = Math.min(100, instance.care.mood + 3)
    return
  }
  const enemyDamage = Math.max(1, Math.round(enemyStats.atk * 0.9 * attributeMultiplier(enemy.attribute, getSpecies(instance.speciesId)?.attribute ?? 'unknown') - playerStats.def * 0.35))
  instance.hp = Math.max(0, instance.hp - enemyDamage)
  battle.log.push(`${enemy.name} 反击，${playerName} 受到 ${enemyDamage} 伤害。`)
  battle.turn += 1
  if (instance.hp <= 0) {
    battle.status = 'lost'
    instance.hp = 1
    instance.care.mood = Math.max(0, instance.care.mood - 10)
    state.stats.battlesLost += 1
    battle.log.push(`${playerName} 失去了战斗能力，被传送回了 File City。`)
  }
}

/** Absorb the defeated enemy's data. */
function absorbBattle(state) {
  const battle = state.battle
  if (battle === null || battle.status !== 'won') fail('没有可以吸收的敌方数据。')
  const instance = requireActive(state)
  const enemy = battle.enemy
  const species = getSpecies(enemy.speciesId)
  const attribute = species?.attribute ?? 'unknown'
  const expGain = 8 + stageIndex(enemy.stage) * 12
  const levelEvents = grantExp(state, instance, expGain)
  const ownAttribute = getSpecies(instance.speciesId)?.attribute ?? 'unknown'
  if (attribute !== 'unknown') state.inventory.fragments[attribute] = (state.inventory.fragments[attribute] ?? 0) + 1
  if (attribute !== 'unknown' && attribute !== ownAttribute) instance.noise = Math.min(100, instance.noise + 3)
  state.inventory.fragmentTypes[enemy.type] = (state.inventory.fragmentTypes[enemy.type] ?? 0) + 1
  state.dex.absorbed[enemy.speciesId] = (state.dex.absorbed[enemy.speciesId] ?? 0) + 1
  state.stats.dataAbsorbed += 1
  if (attribute !== 'unknown') {
    const ecology = state.regions.ecology[state.player.region] ?? { vaccine: 0, data: 0, virus: 0, free: 0 }
    ecology[attribute] = (ecology[attribute] ?? 0) + 1
    state.regions.ecology[state.player.region] = ecology
  }
  if (state.stats.battlesWon % 3 === 0) state.inventory.dataCores += 1
  let learned = null
  if (Math.random() < (battle.scanned ? 0.33 : 0.18)) {
    const move = species?.moves?.[0]
    if (move && !instance.moves.includes(move)) {
      instance.moves = [...instance.moves, move].slice(0, 4)
      learned = move
    }
  }
  appendLog(state, 'battle', `${instance.name} 吸收了 ${enemy.name} 的数据。经验 +${expGain}，获得 ${attributeLabel(attribute)} 数据碎片。`)
  state.battle = null
  const levels = levelEvents.length > 0 ? ` 升到了 Lv.${instance.level}！` : ''
  return `吸收了 ${enemy.name} 的数据。经验 +${expGain}${learned === null ? '' : `，学会了 ${learned}`}。${levels}`
}

/** Rebuild defeated enemy data into an egg. */
function rebuildBattle(state) {
  const battle = state.battle
  if (battle === null || battle.status !== 'won') fail('没有可以重构的敌方数据。')
  if (state.inventory.rebuildPrograms <= 0) fail('没有重构程序。去 File City 商店补充吧。')
  state.inventory.rebuildPrograms -= 1
  const enemySpecies = getSpecies(battle.enemy.speciesId)
  if (enemySpecies === undefined) fail('敌方数据不完整。')
  const base = findBaseForm(enemySpecies.id) ?? (enemySpecies.level === 'baby1' || enemySpecies.level === 'baby2' ? enemySpecies : null)
  if (base === null) {
    state.battle = null
    fail('这份数据无法重构为稳定的数码蛋。')
  }
  const active = requireActive(state)
  const chance = Math.min(0.95, 0.65 + (battle.scanned ? 0.15 : 0) + Math.max(0, stageIndex(active.stage) - stageIndex(battle.enemy.stage)) * 0.08)
  if (Math.random() > chance) {
    appendLog(state, 'battle', `重构 ${battle.enemy.name} 失败，数据逸散了。`)
    state.battle = null
    return `重构失败，${battle.enemy.name} 的数据在稳定前逸散了。`
  }
  if (state.roster.length + state.eggs.length >= state.nestCapacity) fail('数码巢和孵化器都满了，先扩建或腾出空间。')
  const egg = makeEgg(base.id, 'rebuild', state.clock.totalHours, 1 + Math.random() * 2, 'rare')
  state.eggs.push(egg)
  appendLog(state, 'battle', `你用重构程序把 ${battle.enemy.name} 的数据重建成了数码蛋。`)
  state.battle = null
  return `重构成功！获得了 ${base.zh || base.name} 谱系的数码蛋。${''}`
}

/** Explore the current region. */
function exploreAction(state) {
  const region = currentRegion(state)
  if (region.safe) {
    const roll = Math.random()
    if (roll < 0.5) {
      const found = randInt(10, 28)
      state.inventory.bits += found
      appendLog(state, 'explore', `你在 File City 的集市帮了点忙，获得了 ${found} 比特。`)
      return `你在 File City 的集市帮了点忙，获得了 ${found} 比特。`
    }
    state.inventory.food += 1
    appendLog(state, 'explore', '你在 File City 的补给点找到了 1 份食物。')
    return '你在 File City 的补给点找到了 1 份食物。'
  }
  const roll = Math.random()
  if (roll < 0.58) return startBattle(state)
  if (roll < 0.76) {
    const item = pick(['food', 'medicine', 'rebuild'])
    if (item === 'food') state.inventory.food += 1
    if (item === 'medicine') state.inventory.medicine += 1
    if (item === 'rebuild') state.inventory.rebuildPrograms += 1
    const label = item === 'food' ? '数据食物' : item === 'medicine' ? '药品' : '重构程序'
    appendLog(state, 'explore', `你在 ${region.zh} 找到了 1 份${label}。`)
    return `探索 ${region.zh}，找到 1 份${label}。`
  }
  if (roll < 0.88) {
    const pool = SPECIES.filter((species) => species.level === 'baby1')
    const biased = pool.filter((species) => region.attributeBias.includes(species.attribute) || region.typeBias.some((bias) => String(species.type).toLowerCase().includes(bias.toLowerCase())))
    const species = (biased.length > 0 ? biased : pool)[Math.floor(Math.random() * Math.max(1, (biased.length > 0 ? biased : pool).length))]
    const egg = makeEgg(species.id, 'wild', state.clock.totalHours, 1 + Math.random() * 2, 'wild')
    state.eggs.push(egg)
    appendLog(state, 'egg', `你在 ${region.zh} 发现了一颗野生数码蛋！`)
    return `你发现了一颗野生数码蛋！它被送进了 File City 孵化器。`
  }
  const attribute = pick(['vaccine', 'data', 'virus', 'free'])
  state.inventory.fragments[attribute] = (state.inventory.fragments[attribute] ?? 0) + 1
  appendLog(state, 'explore', `你在 ${region.zh} 发现了一小段游离数据。`)
  return `你在 ${region.zh} 发现了一小段游离数据。`
}

/** Generate the AI expedition report. */
function expeditionAction(state) {
  const region = currentRegion(state)
  if (region.safe) fail('File City 里没有远征目标。')
  const instance = requireActive(state)
  const lines = []
  let battles = 0
  let eggs = 0
  let fragments = 0
  for (let i = 0; i < 3; i += 1) {
    const enemy = createEnemy(state, region)
    const playerStats = statsOf(instance)
    const playerPower = playerStats.atk + playerStats.spd + playerStats.wis
    const enemyPower = enemy.stats.atk + enemy.stats.spd + enemy.stats.wis
    if (playerPower >= enemyPower * 0.7) {
      battles += 1
      const expGain = 8 + stageIndex(enemy.stage) * 12
      grantExp(state, instance, expGain)
      state.dex.seen[enemy.speciesId] = true
      state.dex.absorbed[enemy.speciesId] = (state.dex.absorbed[enemy.speciesId] ?? 0) + 1
      fragments += 1
      lines.push(`击败 ${enemy.name} Lv.${enemy.level}，吸收 ${expGain} 经验`)
    } else {
      instance.hp = Math.max(1, instance.hp - Math.round(enemy.stats.atk * 0.4))
      lines.push(`遇到 ${enemy.name} Lv.${enemy.level}，选择绕行`)
    }
  }
  const attribute = pick(['vaccine', 'data', 'virus', 'free'])
  state.inventory.fragments[attribute] = (state.inventory.fragments[attribute] ?? 0) + fragments
  if (Math.random() < 0.2) {
    const species = regionSpecies(region, ['baby1'])
    state.eggs.push(makeEgg(species.id, 'expedition', state.clock.totalHours, 1, 'wild'))
    eggs += 1
  }
  appendLog(state, 'expedition', `远征 ${region.zh}：${lines.join('；')}。`)
  return `远征 ${region.zh} 完成：${lines.join('；')}。数据碎片 +${fragments}${eggs > 0 ? '，发现一颗野生蛋' : ''}。`
}

/** Restore one File City facility. */
function restoreAction(state, facility) {
  const names = { gym: '训练场', clinic: '诊所', shop: '商店', incubator: '孵化器', nest: '数码巢', lab: '研究所', farm: '农场' }
  if (!names[facility]) fail('未知的设施。')
  const current = state.city.facilities[facility] ?? 0
  if (current >= 5) fail(`${names[facility]} 已经满级了。`)
  const cost = Math.max(1, current)
  if (state.inventory.dataCores < cost) fail(`数据核心不足（需要 ${cost} 个）。`)
  state.inventory.dataCores -= cost
  state.city.facilities[facility] = current + 1
  state.city.sync = Math.min(100, state.city.sync + 4)
  if (facility === 'nest') state.nestCapacity += 4
  appendLog(state, 'city', `${names[facility]} 升级到了 Lv.${current + 1}，岛同步率 +4%。`)
  return `${names[facility]} 升级到 Lv.${current + 1}。岛同步率 ${state.city.sync}%。`
}

/** Hatch an egg. */
function hatchAction(state, eggId) {
  const egg = state.eggs.find((entry) => entry.id === eggId) ?? state.eggs[0]
  if (egg === undefined) fail('孵化器里没有数码蛋。')
  if (state.clock.totalHours < egg.readyAtHours) {
    const remaining = Math.max(0, egg.readyAtHours - state.clock.totalHours)
    fail(`这颗蛋还需要 ${remaining.toFixed(1)} 个游戏小时才能孵化。`)
  }
  if (state.roster.length >= state.nestCapacity) fail('数码巢已满，先扩建巢穴。')
  const species = getSpecies(egg.speciesId)
  if (species === undefined) fail('蛋里的数据已经损坏。')
  const instance = makeInstance(species.id)
  state.roster.push(instance)
  if (state.party.length < 3) state.party.push(instance.id)
  if (state.activeId === null) state.activeId = instance.id
  state.dex.seen[species.id] = true
  state.dex.owned[species.id] = true
  state.eggs = state.eggs.filter((entry) => entry.id !== egg.id)
  state.stats.eggsHatched += 1
  appendLog(state, 'evolve', `数码蛋裂开了，${instance.name}（${species.zh || species.name}）诞生了！`)
  return `数码蛋裂开了！一只 ${species.zh || species.name} 钻了出来。`
}

/** Rename the active Digimon. */
function renameAction(state, name) {
  const instance = requireActive(state)
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed === '') fail('名字不能为空。')
  if ([...trimmed].length > 12) fail('名字最多 12 个字符。')
  const old = instance.name
  instance.name = trimmed
  appendLog(state, 'rename', `${old} 接受了新名字「${trimmed}」。`)
  return `${old} 现在叫「${trimmed}」。`
}

/** Switch/add a party member. */
function partyAction(state, instanceId) {
  const instance = instanceById(state, instanceId)
  if (instance === undefined) fail('找不到这只数码兽。')
  if (!state.party.includes(instance.id)) {
    if (state.party.length >= 3) fail('出战队伍已满，先替换一只。')
    state.party.push(instance.id)
  }
  state.activeId = instance.id
  appendLog(state, 'party', `${instance.name} 成为了当前出战数码兽。`)
  return `${instance.name} 成为了出战数码兽。`
}

/** Build a public snapshot for the browser. */
export function publicState(state, now = Date.now()) {
  const active = activeInstance(state)
  const party = state.party.map((id) => instanceById(state, id)).filter(Boolean)
  const roster = state.roster.map((instance) => {
    const summary = instanceSummary(instance)
    return { ...summary, inParty: state.party.includes(instance.id), active: instance.id === state.activeId }
  })
  const activeSummary = active === null ? null : roster.find((entry) => entry.id === active.id) ?? null
  const eggs = state.eggs.map((egg) => {
    const species = getSpecies(egg.speciesId)
    const progress = egg.hatchHours <= 0 ? 1 : Math.min(1, Math.max(0, (state.clock.totalHours - egg.bornAtHours) / egg.hatchHours))
    return {
      id: egg.id,
      source: egg.source,
      rarity: egg.rarity,
      progress,
      canHatch: state.clock.totalHours >= egg.readyAtHours,
      remainingHours: Math.max(0, egg.readyAtHours - state.clock.totalHours),
      signature: { attribute: species?.attribute ?? 'unknown', type: species?.type ?? 'Unknown' },
      hint: egg.source === 'starter' ? '初始蛋' : egg.source === 'rebuild' ? '重构数据' : '野生蛋',
    }
  })
  const regions = REGIONS.map((region) => ({
    id: region.id,
    name: region.name,
    zh: region.zh,
    x: region.x,
    y: region.y,
    color: region.color,
    safe: region.safe,
    unlockSync: region.unlockSync,
    unlocked: region.safe || state.city.sync >= region.unlockSync,
    current: state.player.region === region.id,
    description: region.description,
    ecology: { ...(state.regions.ecology?.[region.id] ?? {}) },
  }))
  const fragments = { ...state.inventory.fragments }
  return {
    version: state.version,
    clock: {
      day: state.clock.day,
      hour: state.clock.hour,
      season: state.clock.season,
      seasonLabel: SEASON_LABELS[state.clock.season] ?? state.clock.season,
      weather: state.clock.weather,
      weatherLabel: WEATHER_LABELS[state.clock.weather] ?? state.clock.weather,
      event: state.clock.event,
    },
    player: { ...state.player },
    active: activeSummary,
    evolutionOptions: active === null ? [] : evolutionOptions(state, active.id),
    party: party.map((instance) => instanceSummary(instance)),
    roster,
    eggs,
    nestCapacity: state.nestCapacity,
    inventory: {
      food: state.inventory.food,
      medicine: state.inventory.medicine,
      rebuildPrograms: state.inventory.rebuildPrograms,
      dataCores: state.inventory.dataCores,
      bits: state.inventory.bits,
      fragments,
      fragmentTypes: state.inventory.fragmentTypes,
    },
    city: {
      sync: state.city.sync,
      facilities: { ...state.city.facilities },
      residents: [...state.city.residents],
      nextUnlock: REGIONS.filter((region) => !region.safe && state.city.sync < region.unlockSync).sort((a, b) => a.unlockSync - b.unlockSync)[0] ?? null,
    },
    regions,
    battle: state.battle === null ? null : {
      status: state.battle.status,
      turn: state.battle.turn,
      enemy: {
        name: state.battle.enemy.name,
        speciesId: state.battle.enemy.speciesId,
        level: state.battle.enemy.level,
        stage: state.battle.enemy.stage,
        attribute: state.battle.enemy.attribute,
        type: state.battle.enemy.type,
        hp: Math.round(state.battle.enemy.hp),
        maxHp: state.battle.enemy.maxHp,
        mp: Math.round(state.battle.enemy.mp),
        maxMp: state.battle.enemy.maxMp,
      },
      log: [...state.battle.log],
      rewardPreview: state.battle.rewardPreview,
    },
    dex: {
      total: SPECIES.length,
      seen: Object.keys(state.dex.seen).length,
      owned: Object.keys(state.dex.owned).length,
      absorbed: Object.values(state.dex.absorbed).reduce((sum, value) => sum + value, 0),
    },
    links: computeLinks(state),
    stats: { ...state.stats },
    log: state.log.slice(-20).map((entry) => ({ at: entry.at, kind: entry.kind, text: entry.text })),
    catalog: { count: CATALOG.count ?? SPECIES.length, snapshotDate: CATALOG.snapshotDate ?? '' },
  }
}

/** Short status line for the agent tool. */
export function statusLine(state) {
  const active = activeInstance(state)
  if (active === null) {
    const egg = state.eggs[0]
    return `【数码世界】还没有出战的数码兽。${egg ? `孵化器里有 ${state.eggs.length} 颗蛋。` : '先去 File City 的终端领取一颗蛋吧。'}`
  }
  const species = getSpecies(active.speciesId)
  const stats = statsOf(active)
  return `【${active.name}】${species?.zh || species?.name || active.speciesId} · ${stageLabel(active.stage)} Lv.${active.level}｜HP ${Math.round(active.hp)}/${stats.maxHp}｜MP ${Math.round(active.mp)}/${stats.maxMp}｜羁绊 ${Math.round(active.bond)}｜饱食 ${Math.round(active.care.fullness)}｜心情 ${Math.round(active.care.mood)}｜区域 ${currentRegion(state).zh}｜队伍 ${state.party.length}/3｜巢穴 ${state.roster.length}/${state.nestCapacity}`
}

/** Public API used by both the tool and the HTTP route. */
export function performAction(state, action, payload = {}, now = Date.now()) {
  advanceState(state, now)
  const input = payload !== null && typeof payload === 'object' ? payload : {}
  let summary = ''
  if (action === 'status') {
    summary = statusLine(state)
  } else if (action === 'care') {
    summary = careAction(state, input.mode)
  } else if (action === 'train') {
    summary = trainAction(state, input.stat)
  } else if (action === 'travel') {
    const region = requireRegion(state, input.region)
    state.player.region = region.id
    state.regions.discovered[region.id] = true
    appendLog(state, 'travel', `你来到了 ${region.zh}。`)
    summary = `你来到了 ${region.zh}。${region.description}`
  } else if (action === 'explore') {
    requireActive(state)
    summary = exploreAction(state)
  } else if (action === 'battle') {
    if (input.command === 'dismiss') {
      state.battle = null
      summary = '你离开了战斗界面。'
    } else if (input.command === 'auto') {
      let rounds = 0
      while (state.battle?.status === 'active' && rounds < 20) {
        battleRound(state, 'attack')
        rounds += 1
      }
      summary = state.battle === null ? '战斗结束。' : state.battle.log.slice(-3).join(' ')
    } else {
      battleRound(state, input.command ?? 'attack')
      summary = state.battle === null ? '战斗结束。' : state.battle.log.slice(-3).join(' ')
    }
  } else if (action === 'absorb') {
    summary = absorbBattle(state)
  } else if (action === 'rebuild') {
    summary = rebuildBattle(state)
  } else if (action === 'hatch') {
    summary = hatchAction(state, input.eggId)
  } else if (action === 'evolve') {
    const result = evolve(state, input.target, now)
    summary = result.summary
  } else if (action === 'rename') {
    summary = renameAction(state, input.name)
  } else if (action === 'party') {
    summary = partyAction(state, input.instanceId)
  } else if (action === 'restore') {
    summary = restoreAction(state, input.facility)
  } else if (action === 'infuse') {
    const instance = requireActive(state)
    const species = getSpecies(instance.speciesId)
    const attribute = typeof input.attribute === 'string' ? input.attribute : species?.attribute ?? 'unknown'
    if (!['vaccine', 'data', 'virus', 'free'].includes(attribute)) fail('未知的数据碎片属性。')
    if ((state.inventory.fragments[attribute] ?? 0) <= 0) fail(`没有${attributeLabel(attribute)}数据碎片。`)
    state.inventory.fragments[attribute] -= 1
    const map = { vaccine: 'hp', data: 'wis', virus: 'atk', free: 'spd' }
    const stat = map[attribute]
    instance.trained[stat] = (instance.trained[stat] ?? 0) + 2
    instance.noise = Math.max(0, instance.noise - (attribute === species?.attribute ? 2 : 0))
    grantExp(state, instance, 8)
    appendLog(state, 'data', `${instance.name} 融合了一份${attributeLabel(attribute)}数据碎片。`)
    summary = `${instance.name} 融合了${attributeLabel(attribute)}数据碎片，${stat.toUpperCase()} +2。`
  } else if (action === 'expedition') {
    summary = expeditionAction(state)
  } else if (action === 'dex') {
    summary = `图鉴共 ${SPECIES.length} 条；已见 ${Object.keys(state.dex.seen).length}，已拥有 ${Object.keys(state.dex.owned).length}，已吸收数据 ${Object.values(state.dex.absorbed).reduce((sum, value) => sum + value, 0)} 次。`
  } else {
    fail(`未知的 action「${action}」。`)
  }
  state.updatedAt = now
  return { ok: true, action, summary }
}

/** Dex page for the browser. */
export function dexPage(query, page = 1, limit = 24) {
  const q = typeof query === 'string' ? query.trim().toLowerCase() : ''
  const filtered = SPECIES.filter((species) => {
    if (q === '') return true
    return [species.name, species.zh, species.type, species.attribute, species.level].some((value) => String(value ?? '').toLowerCase().includes(q))
  })
  const safeLimit = Math.max(1, Math.min(60, Math.round(limit)))
  const totalPages = Math.max(1, Math.ceil(filtered.length / safeLimit))
  const safePage = Math.max(1, Math.min(totalPages, Math.round(page)))
  const start = (safePage - 1) * safeLimit
  return {
    total: filtered.length,
    page: safePage,
    pages: totalPages,
    items: filtered.slice(start, start + safeLimit).map((species) => ({
      id: species.id,
      name: species.name,
      zh: species.zh,
      level: species.level,
      levelLabel: levelLabel(species.level),
      attribute: species.attribute,
      attributeLabel: attributeLabel(species.attribute),
      type: species.type,
      moves: species.moves,
      evolvesTo: species.evolvesTo,
    })),
  }
}

export { REGIONS, REGION_MAP, LEVEL_LABELS }
