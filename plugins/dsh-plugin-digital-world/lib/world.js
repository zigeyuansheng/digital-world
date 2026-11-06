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
  SKILL_OVERRIDES,
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
import { REGION_SCENES } from './scene-data.js'

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
const STAT_CAP = 200

export function computeStats(species, level, trained = {}) {
  const base = stageBase(species.level)
  const tendency = tendencyFor(species)
  const levelFactor = 1 + Math.max(0, level - 1) * 0.055
  const bump = (key) => Math.max(0, Number(trained[key]) || 0)
  const cap = (value, floor) => Math.max(floor, Math.min(STAT_CAP, Math.round(value)))
  return {
    maxHp: cap((12 + base * 1.55 * tendency.hp + bump('hp') * 2) * levelFactor, 8),
    maxMp: cap((8 + base * 0.9 * tendency.mp + bump('mp') * 1.5) * levelFactor, 6),
    atk: cap((5 + base * 0.52 * tendency.atk + bump('atk')) * levelFactor, 2),
    def: cap((4 + base * 0.42 * tendency.def + bump('def')) * levelFactor, 2),
    spd: cap((5 + base * 0.38 * tendency.spd + bump('spd')) * levelFactor, 2),
    wis: cap((4 + base * 0.34 * tendency.wis + bump('wis')) * levelFactor, 2),
    spr: cap((4 + base * 0.32 * tendency.wis + bump('spr')) * levelFactor, 2),
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
    fatigue: Math.round(instance.fatigue ?? 0),
    hp: Math.round(instance.hp),
    maxHp: stats.maxHp,
    mp: Math.round(instance.mp),
    maxMp: stats.maxMp,
    stats: { atk: stats.atk, def: stats.def, spd: stats.spd, wis: stats.wis, spr: stats.spr },
    care: { ...instance.care },
    moves: [...instance.moves],
    skills: skillsFor(instance),
    learnedSkills: [...(instance.learnedSkills ?? [])],
    equippedSkills: [...(instance.equippedSkills ?? [])],
    skillBook: (instance.skillBook ?? []).map((entry) => ({
      ...entry,
      learned: (instance.learnedSkills ?? []).includes(entry.name),
      equipped: (instance.equippedSkills ?? []).includes(entry.name),
    })),
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
      items: { potion_s: 2, antidote: 1, bomb: 1 },
      foods: { basic: 3, good: 1, premium: 0 },
      devices: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, wis: 0, spr: 0 },
    },
    dex: { seen: {}, owned: {}, absorbed: {}, scan: {}, elite: {} },
    city: {
      sync: 0,
      facilities: { gym: 1, clinic: 1, shop: 1, incubator: 1, nest: 1, lab: 0, farm: 0 },
      residents: [],
    },
    regions: { discovered: { 'file-city': true }, ecology: {} },
    ap: { value: RULES.apMax, max: RULES.apMax, lastReal: now },
    cooldowns: {},
    farm: [],
    battleParty: [],
    bossCleared: {},
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
  state.party = Array.isArray(raw.party) ? raw.party.filter((id) => typeof id === 'string' && state.roster.some((entry) => entry.id === id)).slice(0, RULES.partyMax) : []
  state.farm = Array.isArray(raw.farm)
    ? raw.farm.filter((id) => typeof id === 'string' && state.roster.some((entry) => entry.id === id) && !state.party.includes(id)).slice(0, RULES.farmCapacity)
    : []
  state.battleParty = Array.isArray(raw.battleParty)
    ? raw.battleParty.filter((id) => state.party.includes(id)).slice(0, RULES.battleMax)
    : []
  if (state.battleParty.length === 0) state.battleParty = state.party.slice(0, RULES.battleMax)
  state.bossCleared = { ...(raw.bossCleared ?? {}) }
  state.activeId = state.roster.some((entry) => entry.id === raw.activeId) ? raw.activeId : null
  if (state.activeId === null && state.party.length > 0) state.activeId = state.battleParty[0] ?? state.party[0]
  for (const unit of state.roster) ensureSkillFields(unit)
  state.nestCapacity = Math.max(6, Math.round(Number(raw.nestCapacity) || 12))
  state.inventory = { ...base.inventory, ...(raw.inventory ?? {}) }
  state.inventory.fragments = { ...base.inventory.fragments, ...(raw.inventory?.fragments ?? {}) }
  state.inventory.fragmentTypes = { ...(raw.inventory?.fragmentTypes ?? {}) }
  state.inventory.items = { ...base.inventory.items, ...(raw.inventory?.items ?? {}) }
  state.inventory.foods = { ...base.inventory.foods, ...(raw.inventory?.foods ?? {}) }
  state.inventory.devices = { ...base.inventory.devices, ...(raw.inventory?.devices ?? {}) }
  state.dex = {
    seen: { ...(raw.dex?.seen ?? {}) },
    owned: { ...(raw.dex?.owned ?? {}) },
    absorbed: { ...(raw.dex?.absorbed ?? {}) },
    scan: { ...(raw.dex?.scan ?? {}) },
    elite: { ...(raw.dex?.elite ?? {}) },
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
  if (state.battle !== null && typeof state.battle === 'object') {
    if (!Array.isArray(state.battle.enemies)) {
      state.battle.enemies = state.battle.enemy !== undefined ? [state.battle.enemy] : []
      if (state.battle.enemy !== undefined) {
        const legacy = state.battle.enemies[0]
        legacy.ailments = legacy.ailments ?? { ...(state.battle.ailments?.enemy ?? { poison: 0, burn: 0, paralyze: 0 }) }
        legacy.buffs = legacy.buffs ?? { ...(state.battle.buffs?.enemy ?? { atk: 0, def: 0 }) }
        legacy.scanPercent = legacy.scanPercent ?? state.battle.scanPercent ?? 0
        legacy.scanned = legacy.scanned === true || state.battle.scanned === true
        delete state.battle.enemy
      }
    }
    for (const enemy of state.battle.enemies) {
      if (enemy.ailments === undefined) enemy.ailments = { poison: 0, burn: 0, paralyze: 0 }
      if (enemy.buffs === undefined) enemy.buffs = { atk: 0, def: 0 }
      if (typeof enemy.scanPercent !== 'number') enemy.scanPercent = 0
      if (typeof enemy.scanned !== 'boolean') enemy.scanned = false
    }
    if (typeof state.battle.scanned !== 'boolean') state.battle.scanned = false
    if (!Array.isArray(state.battle.players) || state.battle.players.length === 0) {
      const fallbackId = state.activeId ?? state.battleParty[0] ?? state.party[0]
      state.battle.players = fallbackId === undefined ? [] : [{ id: fallbackId, ailments: { ...(state.battle.ailments?.player ?? { poison: 0, burn: 0, paralyze: 0 }) }, buffs: { ...(state.battle.buffs?.player ?? { atk: 0, def: 0 }) } }]
    }
    state.battle.players = state.battle.players.filter((unit) => unit && typeof unit.id === 'string' && instanceById(state, unit.id) !== undefined)
    for (const unit of state.battle.players) {
      if (unit.ailments === undefined) unit.ailments = { poison: 0, burn: 0, paralyze: 0 }
      if (unit.buffs === undefined) unit.buffs = { atk: 0, def: 0 }
    }
    if (typeof state.battle.activeId !== 'string' || !state.battle.players.some((unit) => unit.id === state.battle.activeId)) {
      state.battle.activeId = state.battle.players[0]?.id
    }
    delete state.battle.buffs
    delete state.battle.ailments
    if (typeof state.battle.targetIndex !== 'number') state.battle.targetIndex = 0
    if (state.battle.phase !== 'planning' && state.battle.phase !== 'resolving') state.battle.phase = 'planning'
    if (state.battle.orders === undefined || state.battle.orders === null) state.battle.orders = {}
    if (typeof state.battle.focusId !== 'string') state.battle.focusId = state.battle.activeId
    if (state.battle.guarding !== true) state.battle.guarding = false
  }
  ensureEconomy(state)
  state.ap.lastReal = typeof raw.ap?.lastReal === 'number' ? raw.ap.lastReal : now
  for (const key of Object.keys(state.cooldowns)) {
    const value = state.cooldowns[key]
    if (typeof value !== 'number') { delete state.cooldowns[key]; continue }
    if (value < 1e11) {
      // Migrate old game-hour cooldowns to real-time cooldown timestamps.
      const remainingHours = value - state.clock.totalHours
      state.cooldowns[key] = remainingHours > 0 ? now + remainingHours * RULES.cooldownMinutesPerHour * 60000 : 0
    }
  }
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
    fatigue: 0,
    hp: 1,
    mp: 1,
    care: { fullness: 82, cleanliness: 88, mood: 78, energy: 80, sleep: 70 },
    trained: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, wis: 0, spr: 0 },
    moves: species.moves.slice(0, 3),
    skillBook: buildSkillBook(species),
    learnedSkills: [],
    equippedSkills: [],
    wins: 0,
    battles: 0,
    ageHours: 0,
    createdAt: now,
  }
  ensureSkillFields(instance)
  const stats = computeStats(species, 1, instance.trained)
  instance.hp = stats.maxHp
  instance.mp = stats.maxMp
  return instance
}

/** @returns a printable list of regions with ids and unlock state. */
export function regionListText(state, expeditionOnly = false) {
  return REGIONS
    .filter((region) => (expeditionOnly ? !region.safe : true))
    .map((region) => {
      const unlocked = region.safe || state.city.sync >= region.unlockSync
      const stateText = region.safe ? '城市' : unlocked ? '可远征' : `需同步${region.unlockSync}%`
      return `${region.id}（${region.zh}）${stateText}${state.player.region === region.id ? '←当前' : ''}`
    })
    .join('、')
}

function findRegion(input) {
  const key = String(input ?? '').trim()
  if (key === '') return undefined
  const lower = key.toLowerCase()
  return REGION_MAP.get(key)
    ?? REGIONS.find((region) => region.zh === key || region.name.toLowerCase() === lower || region.id.toLowerCase() === lower)
}

/** @returns a region record by id/中文名/英文名 or throws with the region list. */
function requireRegion(state, regionInput) {
  const region = findRegion(regionInput)
  if (region === undefined) {
    fail(`未知的区域：${regionInput}。可用区域：${regionListText(state)}`)
  }
  if (region.safe === false && state.city.sync < region.unlockSync) {
    fail(`${region.zh}（${region.id}）还没有解锁。把 File City 的同步率提升到 ${region.unlockSync}% 再来吧。`)
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

/** Action economy tuning (A+B+cooldowns). */
export const RULES = Object.freeze({
  apMax: 24,
  apTrain: 1,
  apExplore: 2,
  apExpedition: 6,
  apEvolve: 4,
  apHeal: 1,
  apRestore: 2,
  apInfuse: 1,
  apBoss: 8,
  apMinutesPerPoint: 6,
  cooldownMinutesPerHour: 6,
  healPaidLevel: 10,
  healCostPerHp: 0.8,
  partyMax: 6,
  battleMax: 3,
  farmCapacity: 999,
  expeditionCooldownHours: 6,
  sleepCooldownHours: 6,
  petCooldownHours: 0.5,
  fatigueTrain: 8,
  fatigueExpedition: 20,
  fatigueTrainSoftCap: 60,
  fatigueTrainHardCap: 85,
})

/** Shop catalog: medicine (self), item (against enemy), food (tiers), training devices. */
export const SHOP_ITEMS = Object.freeze([
  { id: 'potion_s', category: 'medicine', name: '小型回复药', price: 40, effect: 'heal', power: 60, desc: '回复 60 HP' },
  { id: 'potion_l', category: 'medicine', name: '大型回复药', price: 120, effect: 'heal', power: 150, desc: '回复 150 HP' },
  { id: 'antidote', category: 'medicine', name: '万能解药', price: 60, effect: 'cure', desc: '解除中毒/灼烧/麻痹' },
  { id: 'power_chip', category: 'medicine', name: '力量芯片', price: 100, effect: 'atk_up', desc: '战斗中攻击提升' },
  { id: 'guard_chip', category: 'medicine', name: '守护芯片', price: 100, effect: 'def_up', desc: '战斗中防御提升' },
  { id: 'bomb', category: 'item', name: '数据炸弹', price: 80, effect: 'damage', power: 70, desc: '对敌方造成伤害' },
  { id: 'acid_vial', category: 'item', name: '腐蚀瓶', price: 70, effect: 'def_down', desc: '削弱敌方防御' },
  { id: 'curse_tag', category: 'item', name: '诅咒符', price: 70, effect: 'atk_down', desc: '削弱敌方攻击' },
  { id: 'food_basic', category: 'food', name: '基础数据食物', price: 15, tier: 'basic', fullness: 20, bond: 1, desc: '饱食+20，羁绊+1' },
  { id: 'food_good', category: 'food', name: '优质数据食物', price: 45, tier: 'good', fullness: 35, bond: 3, desc: '饱食+35，羁绊+3' },
  { id: 'food_premium', category: 'food', name: '特级数据食物', price: 120, tier: 'premium', fullness: 55, bond: 6, desc: '饱食+55，羁绊+6' },
  { id: 'device_hp', category: 'training', name: 'HP 训练装置', price: 100, stat: 'hp', desc: '指定训练 HP' },
  { id: 'device_mp', category: 'training', name: 'MP 训练装置', price: 100, stat: 'mp', desc: '指定训练 MP' },
  { id: 'device_atk', category: 'training', name: 'ATK 训练装置', price: 100, stat: 'atk', desc: '指定训练 ATK' },
  { id: 'device_def', category: 'training', name: 'DEF 训练装置', price: 100, stat: 'def', desc: '指定训练 DEF' },
  { id: 'device_spd', category: 'training', name: 'SPD 训练装置', price: 100, stat: 'spd', desc: '指定训练 SPD' },
  { id: 'device_wis', category: 'training', name: '智力训练装置', price: 100, stat: 'wis', desc: '指定训练 智力' },
  { id: 'device_spr', category: 'training', name: '精神训练装置', price: 100, stat: 'spr', desc: '指定训练 精神' },
])
export const TRAIN_STATS = Object.freeze(['hp', 'mp', 'atk', 'def', 'spd', 'wis', 'spr'])
export const SCAN_GAIN_BY_STAGE = Object.freeze({
  baby1: 20,
  baby2: 18,
  child: 15,
  adult: 12,
  perfect: 9,
  ultimate: 6,
  armor: 10,
  hybrid: 10,
  'xros-wars': 14,
  unknown: 12,
})

function ensureEconomy(state) {
  if (state.ap === null || typeof state.ap !== 'object' || typeof state.ap.value !== 'number') {
    state.ap = { value: RULES.apMax, max: RULES.apMax, lastReal: Date.now() }
  }
  if (state.ap.max !== RULES.apMax) state.ap.max = RULES.apMax
  if (typeof state.ap.lastReal !== 'number') state.ap.lastReal = Date.now()
  if (state.cooldowns === null || typeof state.cooldowns !== 'object') state.cooldowns = {}
}

/** Regenerate action points from real time: one point per 6 real minutes. */
function apRegen(state, now = Date.now()) {
  ensureEconomy(state)
  const stepMs = RULES.apMinutesPerPoint * 60 * 1000
  const elapsed = Math.max(0, now - state.ap.lastReal)
  if (elapsed < stepMs) return
  const gain = Math.floor(elapsed / stepMs)
  state.ap.lastReal += gain * stepMs
  state.ap.value = Math.min(state.ap.max, state.ap.value + gain)
}

function spendAp(state, cost) {
  ensureEconomy(state)
  if (cost <= 0) return
  if (state.ap.value + 1e-9 < cost) {
    fail(`行动力不足（需要 ${cost} AP，当前 ${Math.floor(state.ap.value)}）。每 6 现实分钟恢复 1 AP，休息或等待后再来。`)
  }
  state.ap.value = Math.max(0, state.ap.value - cost)
}

/** @returns remaining cooldown in REAL minutes. */
function cooldownRemaining(state, key) {
  ensureEconomy(state)
  return Math.max(0, ((state.cooldowns[key] ?? 0) - Date.now()) / 60000)
}

function requireCooldownReady(state, key, label) {
  const left = cooldownRemaining(state, key)
  if (left > 0.05) fail(`${label}还在冷却中，还需 ${Math.ceil(left)} 现实分钟。`)
}

/** Set a cooldown expressed in the old "game hours" unit, converted to real
 * minutes at 6 real minutes per game hour (1 AP-equivalent). */
function setCooldown(state, key, hours) {
  ensureEconomy(state)
  state.cooldowns[key] = Date.now() + hours * RULES.cooldownMinutesPerHour * 60 * 1000
}

function addFatigue(instance, amount) {
  instance.fatigue = Math.max(0, Math.min(100, (instance.fatigue ?? 0) + amount))
}

/** Advance world time and passive needs. */
export function advanceState(state, now = Date.now()) {
  const previousReal = typeof state.clock.lastReal === 'number' ? state.clock.lastReal : now
  const rawDelta = Math.max(0, now - previousReal)
  // Closing the panel should not kill a creature. Cap one catch-up at 10 real
  // minutes; normal polling advances in small slices.
  const delta = Math.min(rawDelta, 10 * 60 * 1000)
  const hours = delta / 60_000
  apRegen(state, now)
  if (hours > 0.001) {
    state.clock.totalHours += hours
    for (const instance of state.roster) {
      const isParty = state.party.includes(instance.id)
      if (!isParty) continue
      const sleepHours = instance.sleepingUntil ?? 0
      if (state.clock.totalHours < sleepHours) {
        instance.care.energy = Math.min(100, instance.care.energy + hours * 8)
        instance.care.sleep = Math.min(100, instance.care.sleep + hours * 5)
        instance.fatigue = Math.max(0, (instance.fatigue ?? 0) - hours * 6)
        const sleepStats = statsOf(instance)
        instance.mp = Math.min(sleepStats.maxMp, instance.mp + hours * 10)
      } else {
        instance.care.fullness = Math.max(0, instance.care.fullness - hours * 1.8)
        instance.care.cleanliness = Math.max(0, instance.care.cleanliness - hours * 1.1)
        instance.care.energy = Math.max(0, instance.care.energy - hours * 1.0)
        instance.care.sleep = Math.max(0, instance.care.sleep - hours * 0.8)
        instance.fatigue = Math.max(0, (instance.fatigue ?? 0) - hours * 0.4)
        const awakeStats = statsOf(instance)
        instance.mp = Math.min(awakeStats.maxMp, instance.mp + hours * 2)
        if (instance.care.fullness < 25) instance.care.mood = Math.max(0, instance.care.mood - hours * 1.0)
        else instance.care.mood = Math.max(0, instance.care.mood - hours * 0.2)
        if (instance.care.energy > 35 && instance.care.fullness > 30) {
          instance.hp = Math.min(awakeStats.maxHp, instance.hp + hours * 0.5)
        }
      }
      instance.ageHours += hours
    }
  }
  state.clock.lastReal = now
  ensureEconomy(state)
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
    unlockSkillsForLevel(instance)
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
  spendAp(state, RULES.apEvolve)
  advanceGameHours(state, 1)
  const option = evolutionOptions(state).find((entry) => entry.speciesId === targetId)
  if (option === undefined) fail('这不是当前可用的进化路线。')
  if (!option.eligible) fail(`还不能进化：${option.reasons.join('；')}`)
  const target = getSpecies(targetId)
  if (target === undefined) fail('进化目标不存在。')
  instance.speciesId = target.id
  instance.stage = target.level
  const existingBook = Array.isArray(instance.skillBook) ? instance.skillBook : []
  const existingNames = new Set(existingBook.map((entry) => entry.name))
  const merged = [...existingBook]
  for (const entry of buildSkillBook(target)) {
    if (!existingNames.has(entry.name)) { merged.push(entry); existingNames.add(entry.name) }
  }
  instance.skillBook = merged
  instance.level = 1
  instance.exp = 0
  instance.trained = { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, wis: 0, spr: 0 }
  ensureSkillFields(instance)
  unlockSkillsForLevel(instance)
  const stats = computeStats(target, 1, instance.trained)
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
function careAction(state, mode, payload = {}) {
  const instance = requireActive(state)
  if (mode === 'feed') {
    const tiers = ['premium', 'good', 'basic']
    const chosen = tiers.find((tier) => (state.inventory.foods?.[tier] ?? 0) > 0)
    if (chosen !== undefined) {
      const item = SHOP_ITEMS.find((entry) => entry.tier === chosen)
      state.inventory.foods[chosen] -= 1
      instance.care.fullness = Math.min(100, instance.care.fullness + (item?.fullness ?? 20))
      instance.care.mood = Math.min(100, instance.care.mood + 5)
      instance.bond = Math.min(100, instance.bond + (item?.bond ?? 1))
      const apGain = chosen === 'premium' ? 3 : chosen === 'good' ? 2 : 1
      state.ap.value = Math.min(state.ap.max, state.ap.value + apGain)
      advanceGameHours(state, 0.25)
      appendLog(state, 'feed', `你喂了 ${instance.name} 一份${item?.name ?? '数据食物'}。`)
      return `你喂了 ${instance.name} 一份${item?.name ?? '数据食物'}。饱食 +${item?.fullness ?? 20}，羁绊 +${item?.bond ?? 1}，AP +${apGain}。`
    }
    if (state.inventory.food <= 0) {
      if (state.inventory.bits >= 10) {
        state.inventory.bits -= 10
      } else {
        fail('没有食物，也没有足够的比特。')
      }
    } else {
      state.inventory.food -= 1
    }
    instance.care.fullness = Math.min(100, instance.care.fullness + 18)
    instance.care.mood = Math.min(100, instance.care.mood + 4)
    instance.bond = Math.min(100, instance.bond + 1)
    state.ap.value = Math.min(state.ap.max, state.ap.value + 1)
    advanceGameHours(state, 0.25)
    appendLog(state, 'feed', `你喂了 ${instance.name} 一份数据食物。`)
    return `你喂了 ${instance.name} 一份数据食物。饱食 +18，羁绊 +1，AP +1。`
  }
  if (mode === 'clean') {
    instance.care.cleanliness = Math.min(100, instance.care.cleanliness + 30)
    instance.care.mood = Math.min(100, instance.care.mood + 5)
    advanceGameHours(state, 0.25)
    appendLog(state, 'clean', `你清理了 ${instance.name} 周围的数据灰尘。`)
    return `你清理了 ${instance.name} 的数据灰尘。清洁 +30，心情 +5。`
  }
  if (mode === 'play') {
    requireCooldownReady(state, 'play', '玩耍')
    instance.care.mood = Math.min(100, instance.care.mood + 12)
    instance.bond = Math.min(100, instance.bond + 2)
    instance.care.energy = Math.max(0, instance.care.energy - 4)
    setCooldown(state, 'play', 1)
    advanceGameHours(state, 0.5)
    appendLog(state, 'play', `你陪 ${instance.name} 玩了一会儿，它开心多了。`)
    return `${instance.name} 玩耍了一会儿。心情 +12，羁绊 +2，体力 -4。`
  }
  if (mode === 'pet') {
    requireCooldownReady(state, 'pet', '抚摸')
    instance.care.mood = Math.min(100, instance.care.mood + 8)
    instance.bond = Math.min(100, instance.bond + 2)
    setCooldown(state, 'pet', RULES.petCooldownHours)
    appendLog(state, 'pat', `你摸了摸 ${instance.name} 的头，它蹭了蹭你的手心。`)
    return `你摸了摸 ${instance.name}。心情 +8，羁绊 +2。`
  }
  if (mode === 'sleep') {
    requireCooldownReady(state, 'sleep', '睡眠')
    const hours = 6
    instance.sleepingUntil = state.clock.totalHours + hours
    advanceGameHours(state, hours)
    instance.care.energy = Math.min(100, instance.care.energy + 70)
    instance.care.sleep = Math.min(100, instance.care.sleep + 60)
    instance.care.mood = Math.min(100, instance.care.mood + 4)
    instance.fatigue = Math.max(0, (instance.fatigue ?? 0) - 40)
    setCooldown(state, 'sleep', RULES.sleepCooldownHours)
    state.ap.value = Math.min(state.ap.max, state.ap.value + 3)
    appendLog(state, 'rest', `${instance.name} 睡了 ${hours} 个游戏小时，精神恢复了不少。`)
    return `${instance.name} 睡了 ${hours} 个游戏小时。体力 +70，睡眠 +60，疲劳 -40，AP +3。`
  }
  if (mode === 'heal') {
    spendAp(state, RULES.apHeal)
    const stats = statsOf(instance)
    const missing = Math.max(0, stats.maxHp - instance.hp)
    if (instance.level >= RULES.healPaidLevel) {
      const cost = Math.max(10, Math.ceil(missing * RULES.healCostPerHp))
      if (state.inventory.bits < cost) fail(`治疗费用 ${cost} 比特（恢复 ${missing} HP），比特不足。`)
      state.inventory.bits -= cost
      instance.hp = stats.maxHp
      instance.care.mood = Math.min(100, instance.care.mood + 2)
      advanceGameHours(state, 0.5)
      appendLog(state, 'heal', `${instance.name} 在诊所支付 ${cost} 比特，恢复了 ${missing} HP。`)
      return `${instance.name} 支付 ${cost} 比特，恢复 ${missing} HP（Lv.${instance.level} 起治疗收费）。`
    }
    if (state.inventory.medicine <= 0) {
      if (state.inventory.bits < 25) fail('没有药品，也不够比特购买。')
      state.inventory.bits -= 25
    } else {
      state.inventory.medicine -= 1
    }
    instance.hp = stats.maxHp
    instance.care.mood = Math.min(100, instance.care.mood + 2)
    advanceGameHours(state, 0.5)
    appendLog(state, 'heal', `${instance.name} 使用了药品，HP 完全恢复。`)
    return `${instance.name} 使用了药品，HP 完全恢复。`
  }
  fail(`未知的照顾动作：${mode}`)
}

/** Train one stat. */
function trainAction(state, payload) {
  const instance = requireActive(state)
  const allowed = new Set(TRAIN_STATS)
  const requested = payload !== null && typeof payload === 'object' ? payload.stat : undefined
  const wantsDevice = payload !== null && typeof payload === 'object' && payload.useDevice === true
  const validRequest = allowed.has(requested)
  let stat = validRequest ? requested : null
  let usedDevice = false
  if (wantsDevice) {
    if (!validRequest) fail('定向训练必须指定属性（hp/mp/atk/def/spd/wis/spr）。')
    if ((state.inventory.devices?.[stat] ?? 0) <= 0) fail(`没有 ${stat.toUpperCase()} 训练装置，无法定向训练（普通训练请不带 useDevice，将随机提升）。`)
    state.inventory.devices[stat] -= 1
    usedDevice = true
  } else if (stat !== null && (state.inventory.devices?.[stat] ?? 0) > 0) {
    state.inventory.devices[stat] -= 1
    usedDevice = true
  } else {
    stat = TRAIN_STATS[Math.floor(Math.random() * TRAIN_STATS.length)]
  }
  if (instance.care.energy < 15) fail('体力不足，先让它休息一下。')
  if (instance.care.fullness < 20) fail('太饿了，先喂点东西。')
  if ((instance.fatigue ?? 0) >= RULES.fatigueTrainHardCap) fail('疲劳过高，不能再训练了，先睡一觉。')
  spendAp(state, RULES.apTrain)
  advanceGameHours(state, 1)
  const links = computeLinks(state)
  const linkBonus = links.some((link) => link.id === 'resonance') ? 1.1 : 1
  const gymBonus = 1 + Math.max(0, (state.city.facilities.gym ?? 1) - 1) * 0.06
  const species = getSpecies(instance.speciesId)
  const tendency = tendencyFor(species ?? { attribute: 'unknown', type: 'Unknown' })
  const typeBonus = tendency[stat] ?? 1
  const moodBonus = instance.care.mood >= 60 ? 1.1 : instance.care.mood < 25 ? 0.7 : 1
  const fatigueMalus = (instance.fatigue ?? 0) > RULES.fatigueTrainSoftCap ? 0.5 : 1
  const deviceBonus = usedDevice ? 1 : 0.6
  const gain = Math.max(1, Math.round((2 + stageIndex(instance.stage) * 1.2) * typeBonus * moodBonus * linkBonus * gymBonus * fatigueMalus * deviceBonus))
  instance.trained[stat] = (instance.trained[stat] ?? 0) + gain
  instance.care.energy = Math.max(0, instance.care.energy - 8)
  instance.care.fullness = Math.max(0, instance.care.fullness - 4)
  instance.care.mood = Math.min(100, instance.care.mood + 1)
  instance.bond = Math.min(100, instance.bond + 0.5)
  addFatigue(instance, RULES.fatigueTrain)
  refreshInstanceStats(instance)
  const expEvents = grantExp(state, instance, 5 + stageIndex(instance.stage) * 2)
  appendLog(state, 'train', `${instance.name} 在 ${stat.toUpperCase()} 训练中提升了 ${gain} 点。`)
  const suffix = expEvents.length > 0 ? ` 升到了 Lv.${instance.level}！` : ''
  return `${instance.name} 完成了 ${stat.toUpperCase()} 训练${usedDevice ? '（训练装置）' : '（随机属性）'}。成长 +${gain}，消耗 ${RULES.apTrain} AP、1 游戏小时。疲劳 ${Math.round(instance.fatigue)}。${suffix}`
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
function createEnemy(state, region, options = {}) {
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
  const species = options.species ?? regionSpecies({ ...biasedRegion, wildStages: stages }, stages)
  const playerLevel = active?.level ?? 1
  const level = Math.max(1, options.level ?? (playerLevel <= 3 ? 1 : playerLevel + randInt(-1, 1)))
  const stats = computeStats(species, level)
  if (options.elite === true) {
    stats.maxHp = Math.round(stats.maxHp * 1.5)
    stats.maxMp = Math.round(stats.maxMp * 1.3)
    stats.atk = Math.round(stats.atk * 1.3)
    stats.def = Math.round(stats.def * 1.25)
    stats.wis = Math.round(stats.wis * 1.2)
  } else if (playerLevel <= 3) {
    // Early-game gentleness: low-level wild Digimon hit much softer.
    stats.maxHp = Math.max(8, Math.round(stats.maxHp * 0.8))
    stats.atk = Math.max(2, Math.round(stats.atk * 0.75))
    stats.def = Math.max(2, Math.round(stats.def * 0.85))
  }
  const enemy = {
    id: makeId('enemy'),
    speciesId: species.id,
    name: `${options.elite === true ? '精英·' : ''}${species.zh || species.name}`,
    elite: options.elite === true,
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
    buffs: { atk: 0, def: 0 },
    ailments: { poison: 0, burn: 0, paralyze: 0 },
    scanned: false,
    scanPercent: state.dex.scan?.[species.id] ?? 0,
  }
  ensureSkillFields(enemy)
  enemy.equippedSkills = enemy.skillBook.filter((entry) => entry.unlockLevel <= level).slice(0, 4).map((entry) => entry.name)
  return enemy
}

/** Deterministic elite boss for a region (perfect/ultimate matching bias). */
function regionBoss(region) {
  const pool = SPECIES.filter((species) => {
    if (species.level !== 'perfect' && species.level !== 'ultimate') return false
    return region.attributeBias.includes(species.attribute)
      || region.typeBias.some((bias) => String(species.type).toLowerCase().includes(String(bias).toLowerCase()))
  })
  const list = pool.length > 0 ? pool : SPECIES.filter((species) => species.level === 'perfect' || species.level === 'ultimate')
  return list[hashText(`boss|${region.id}`) % list.length]
}

function beginBattle(state, region, enemies, elite) {
  const ids = (state.battleParty.length > 0 ? state.battleParty : [state.activeId]).filter((id) => {
    const instance = instanceById(state, id)
    return instance !== undefined && instance.hp > 0
  }).slice(0, RULES.battleMax)
  if (ids.length === 0) fail('没有可以上场的数码兽。')
  const players = ids.map((id) => ({ id, ailments: { poison: 0, burn: 0, paralyze: 0 }, buffs: { atk: 0, def: 0 } }))
  const activeId = players.some((unit) => unit.id === state.activeId) ? state.activeId : players[0].id
  state.activeId = activeId
  state.battle = {
    enemies,
    players,
    activeId,
    focusId: activeId,
    phase: 'planning',
    orders: {},
    targetIndex: 0,
    turn: 1,
    status: 'active',
    scanned: false,
    elite: elite === true,
    guarding: false,
    events: [],
    log: [enemies.length === 1
      ? `${elite === true ? '精英' : '野生'}的 ${enemies[0].name}（Lv.${enemies[0].level}）出现了！`
      : `${enemies.map((enemy) => enemy.name).join('、')} 一起出现了！（${enemies.length} 只）`],
    rewardPreview: `EXP +${enemies.reduce((sum, enemy) => sum + 8 + stageIndex(enemy.stage) * 12, 0)}，数据碎片`,
  }
  for (const enemy of enemies) state.dex.seen[enemy.speciesId] = true
  return `遭遇 ${enemies.map((enemy) => enemy.name).join('、')}。`
}

/** Start a battle in the current region. */
function startBattle(state) {
  const region = currentRegion(state)
  if (region.safe) fail('File City 里没有野生数码兽。去外地探索吧。')
  if (activeInstance(state) === null) fail('还没有出战的数码兽。')
  const activeLevel = activeInstance(state)?.level ?? 1
  const count = activeLevel <= 3 ? 1 : 1 + (Math.random() < 0.3 ? 1 : 0) + (Math.random() < 0.1 ? 1 : 0)
  const enemies = Array.from({ length: count }, () => createEnemy(state, region))
  return beginBattle(state, region, enemies, false)
}

/** Challenge the region's elite boss. */
function bossBattle(state) {
  const region = currentRegion(state)
  if (region.safe) fail('File City 里没有可挑战的精英。')
  const active = requireActive(state)
  requireCooldownReady(state, `boss:${region.id}`, '精英战')
  spendAp(state, 8)
  setCooldown(state, `boss:${region.id}`, 24)
  const species = regionBoss(region)
  const enemy = createEnemy(state, region, { species, level: active.level + 3, elite: true })
  return beginBattle(state, region, [enemy], true)
}

/** @returns the attribute damage multiplier for an attacker. */
function attributeMultiplier(attacker, defender) {
  const strong = { vaccine: 'virus', virus: 'data', data: 'vaccine' }
  if (strong[attacker] === defender) return 1.3
  if (strong[defender] === attacker) return 0.7
  return 1
}

const MAGIC_TYPES = new Set(['Holy', 'Dark', 'Machine', 'Cyborg', 'Unknown', 'Species Unknown', 'Demon', 'Angel'])
const MAGIC_WORDS = ['flame', 'fire', 'ice', 'thunder', 'light', 'dark', 'holy', 'mega', 'beam', 'cannon', 'blast', 'wave', 'storm', 'wind', 'water', 'spirit', 'soul']

function hashText(value) {
  let hash = 2166136261 >>> 0
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Deterministic skill profile from a move name + species (power/MP/kind/effect). */
export function skillProfile(moveName, species) {
  const override = SKILL_OVERRIDES[moveName]
  if (override !== undefined) {
    return {
      name: moveName,
      kind: override.kind === 'magic' ? 'magic' : 'physical',
      power: Number(override.power) || 40,
      cost: Number(override.cost) || 5,
      accuracy: Number(override.accuracy) || 95,
      effect: override.effect ?? 'none',
      element: species?.attribute ?? 'unknown',
    }
  }
  const hash = hashText(`${moveName}|${species?.id ?? ''}`)
  const lower = String(moveName).toLowerCase()
  const magic = MAGIC_TYPES.has(species?.type) || MAGIC_WORDS.some((word) => lower.includes(word))
  const effects = ['none', 'none', 'none', 'atk_up', 'def_up', 'atk_down', 'def_down', 'burn', 'poison', 'paralyze']
  return {
    name: moveName,
    kind: magic ? 'magic' : 'physical',
    power: 36 + (hash % 37),
    cost: 4 + (hash % 9),
    accuracy: 85 + (hash % 16),
    effect: effects[(hash >>> 4) % effects.length],
    element: species?.attribute ?? 'unknown',
  }
}

const SIGNATURE_UNLOCK = [1, 6, 12, 20]
const GENERIC_UNLOCK = [1, 4, 9, 15, 22, 30]

/** Generic (non-exclusive) skills used to fill a species' skill book. */
const GENERIC_SKILL_LIBRARY = {
  vaccine: [
    { name: '圣光弹', kind: 'magic', power: 45, cost: 6, accuracy: 95, effect: 'none' },
    { name: '勇气之盾', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'def_up' },
    { name: '治愈之光', kind: 'magic', power: 40, cost: 8, accuracy: 100, effect: 'heal' },
    { name: '净化', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'cure' },
    { name: '圣剑斩', kind: 'physical', power: 55, cost: 8, accuracy: 92, effect: 'none' },
    { name: '审判之雷', kind: 'magic', power: 65, cost: 10, accuracy: 90, effect: 'paralyze' },
  ],
  virus: [
    { name: '暗黑爪', kind: 'physical', power: 50, cost: 6, accuracy: 94, effect: 'poison' },
    { name: '诅咒', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'atk_down' },
    { name: '腐蚀', kind: 'magic', power: 40, cost: 6, accuracy: 95, effect: 'poison' },
    { name: '恐惧之瞳', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'def_down' },
    { name: '暗影吞噬', kind: 'magic', power: 50, cost: 9, accuracy: 92, effect: 'drain' },
    { name: '生命吸取', kind: 'magic', power: 45, cost: 8, accuracy: 93, effect: 'drain' },
  ],
  data: [
    { name: '数据刃', kind: 'physical', power: 50, cost: 6, accuracy: 94, effect: 'none' },
    { name: '回复程序', kind: 'magic', power: 40, cost: 8, accuracy: 100, effect: 'heal' },
    { name: '屏障', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'def_up' },
    { name: '数据风暴', kind: 'magic', power: 60, cost: 9, accuracy: 92, effect: 'none' },
    { name: '解析', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'cure' },
    { name: '过载', kind: 'magic', power: 0, cost: 6, accuracy: 100, effect: 'atk_up' },
  ],
  free: [
    { name: '能量弹', kind: 'magic', power: 45, cost: 6, accuracy: 95, effect: 'none' },
    { name: '护盾', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'def_up' },
    { name: '回复', kind: 'magic', power: 40, cost: 8, accuracy: 100, effect: 'heal' },
    { name: '干扰', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'atk_down' },
    { name: '突袭', kind: 'physical', power: 55, cost: 8, accuracy: 93, effect: 'none' },
    { name: '净化波', kind: 'magic', power: 0, cost: 5, accuracy: 100, effect: 'cure' },
  ],
}
GENERIC_SKILL_LIBRARY.unknown = GENERIC_SKILL_LIBRARY.free
GENERIC_SKILL_LIBRARY.variable = GENERIC_SKILL_LIBRARY.free

/** Build the full skill book (up to 6) for a species: signature + generic fill. */
export function buildSkillBook(species) {
  const attribute = species?.attribute ?? 'free'
  const signature = (species?.moves ?? []).slice(0, 4).map((move, index) => ({
    ...skillProfile(move, species),
    unlockLevel: SIGNATURE_UNLOCK[index] ?? 20,
    exclusive: true,
  }))
  const generic = (GENERIC_SKILL_LIBRARY[attribute] ?? GENERIC_SKILL_LIBRARY.free).map((skill, index) => ({
    ...skill,
    element: attribute,
    unlockLevel: GENERIC_UNLOCK[index] ?? 30,
    exclusive: false,
  }))
  const book = []
  const seen = new Set()
  for (const entry of [...signature, ...generic]) {
    if (seen.has(entry.name)) continue
    seen.add(entry.name)
    book.push(entry)
    if (book.length >= 6) break
  }
  return book
}

/** Ensure an instance has skill book / learned / equipped fields. */
export function ensureSkillFields(instance) {
  const species = getSpecies(instance.speciesId)
  if (species === undefined) return instance
  if (!Array.isArray(instance.skillBook) || instance.skillBook.length === 0) {
    instance.skillBook = buildSkillBook(species)
  }
  if (!Array.isArray(instance.learnedSkills)) instance.learnedSkills = []
  if (!Array.isArray(instance.equippedSkills)) instance.equippedSkills = []
  for (const entry of instance.skillBook) {
    if (entry.unlockLevel <= instance.level && !instance.learnedSkills.includes(entry.name)) {
      instance.learnedSkills.push(entry.name)
    }
  }
  if (instance.equippedSkills.length === 0) instance.equippedSkills = instance.learnedSkills.slice(0, 6)
  return instance
}

/** Learn and auto-equip any skills unlocked by the current level. */
function unlockSkillsForLevel(instance) {
  ensureSkillFields(instance)
  for (const entry of instance.skillBook) {
    if (entry.unlockLevel <= instance.level && !instance.learnedSkills.includes(entry.name)) {
      instance.learnedSkills.push(entry.name)
      if (instance.equippedSkills.length < 6) instance.equippedSkills.push(entry.name)
    }
  }
}

/** @returns the equipped, level-unlocked skills for a creature. */
export function skillsFor(creature, levelOverride) {
  const level = typeof levelOverride === 'number' ? levelOverride : creature.level ?? 1
  if (Array.isArray(creature.skillBook) && creature.skillBook.length > 0) {
    const equipped = Array.isArray(creature.equippedSkills) && creature.equippedSkills.length > 0
      ? creature.equippedSkills
      : creature.skillBook.map((entry) => entry.name)
    return creature.skillBook.filter((entry) => equipped.includes(entry.name) && entry.unlockLevel <= level)
  }
  const species = getSpecies(creature.speciesId)
  const moves = Array.isArray(creature.moves) && creature.moves.length > 0 ? creature.moves : species?.moves ?? ['Data Bite']
  return moves.slice(0, 4).map((move) => skillProfile(move, species))
}

const BASIC_ATTACK = (element) => ({ name: '攻击', kind: 'physical', power: 30, cost: 0, accuracy: 100, effect: 'none', element })

function buffValue(buffs, key) {
  return 1 + (buffs?.[key] ?? 0)
}

function computeDamage(attackerStats, defenderStats, skill, attackerAttribute, defenderAttribute, attackerBuffs, guarding) {
  const attack = skill.kind === 'magic' ? attackerStats.wis : attackerStats.atk
  const defense = skill.kind === 'magic' ? (defenderStats.spr ?? defenderStats.wis) : defenderStats.def
  let raw = attack * 1.15 * (skill.power / 50) - defense * 0.35 + 6
  raw *= attributeMultiplier(attackerAttribute, defenderAttribute)
  raw *= buffValue(attackerBuffs, 'atk')
  const critical = Math.random() < 0.1
  const variance = 0.9 + Math.random() * 0.2
  let damage = Math.max(1, Math.round(raw * (critical ? 1.5 : 1) * variance))
  if (guarding) damage = Math.max(1, Math.round(damage * 0.5))
  return { damage, critical }
}

function buffsOf(battle, creature) {
  if (creature === 'player') return battle.buffs.player
  if (creature === null || typeof creature !== 'object') return { atk: 0, def: 0 }
  if (creature.buffs === undefined) creature.buffs = { atk: 0, def: 0 }
  return creature.buffs
}

function ailmentsOf(battle, creature) {
  if (creature === 'player') return battle.ailments.player
  if (creature.ailments === undefined) creature.ailments = { poison: 0, burn: 0, paralyze: 0 }
  return creature.ailments
}

function applySkillEffect(battle, caster, target, effect, casterName) {
  if (effect === 'none') return null
  const selfBuffs = buffsOf(battle, caster)
  const targetBuffs = buffsOf(battle, target)
  if (effect === 'atk_up') { selfBuffs.atk = Math.min(0.5, selfBuffs.atk + 0.25); return `${casterName} 攻击提升！` }
  if (effect === 'def_up') { selfBuffs.def = Math.min(0.5, selfBuffs.def + 0.25); return `${casterName} 防御提升！` }
  if (effect === 'atk_down') { targetBuffs.atk = Math.max(-0.4, targetBuffs.atk - 0.25); return `${casterName} 削弱了对手的攻击！` }
  if (effect === 'def_down') { targetBuffs.def = Math.max(-0.4, targetBuffs.def - 0.25); return `${casterName} 削弱了对手的防御！` }
  if (effect === 'poison' || effect === 'burn' || effect === 'paralyze') {
    if (Math.random() < 0.6) {
      const ailment = ailmentsOf(battle, target)
      ailment[effect] = Math.max(ailment[effect], 3)
      const label = { poison: '中毒', burn: '灼烧', paralyze: '麻痹' }[effect]
      return `对手陷入了${label}！`
    }
    return null
  }
  return null
}

/** Damage over time from poison/burn at the end of a round. */
function ailmentTick(battle, playerUnits, enemies, state) {
  const lines = []
  const entries = []
  for (let index = 0; index < playerUnits.length; index += 1) {
    const unit = playerUnits[index]
    const instance = instanceById(state, unit.id)
    if (instance === undefined) continue
    entries.push({ side: 'player', index, creature: instance, stats: statsOf(instance), ailment: unit.ailments, name: instance.name })
  }
  for (let index = 0; index < enemies.length; index += 1) {
    const enemy = enemies[index]
    entries.push({ side: 'enemy', index, creature: enemy, stats: enemy.stats, ailment: enemy.ailments, name: enemy.name })
  }
  for (const entry of entries) {
    if (entry.creature.hp <= 0) continue
    let damage = 0
    if (entry.ailment.poison > 0) damage += Math.round(entry.stats.maxHp * 0.05)
    if (entry.ailment.burn > 0) damage += Math.round(entry.stats.maxHp * 0.07)
    if (damage > 0) {
      entry.creature.hp = Math.max(0, entry.creature.hp - damage)
      battle.events.push(entry.side === 'player' ? { side: 'player', index: entry.index, damage } : { side: 'enemy', index: entry.index, damage })
      lines.push(`${entry.name} 因状态异常损失 ${damage} HP。`)
    }
    for (const key of ['poison', 'burn', 'paralyze']) {
      if (entry.ailment[key] > 0) entry.ailment[key] = Math.max(0, entry.ailment[key] - 1)
    }
  }
  return lines
}

function decayBuffs(battle) {
  for (const key of ['atk', 'def']) {
    const value = battle.buffs.player[key]
    if (value > 0) battle.buffs.player[key] = Math.max(0, Math.round((value - 0.1) * 100) / 100)
    else if (value < 0) battle.buffs.player[key] = Math.min(0, Math.round((value + 0.1) * 100) / 100)
  }
}

/** Enemy AI: use an affordable skill most of the time, otherwise basic attack. */
function enemyChoice(enemy) {
  const available = skillsFor(enemy).filter((skill) => enemy.mp >= skill.cost)
  if (available.length === 0) return { skill: BASIC_ATTACK(enemy.attribute), kind: 'attack' }
  const profiles = ['aggressive', 'caster', 'trickster', 'guardian']
  const profile = profiles[hashText(enemy.speciesId ?? 'unknown') % profiles.length]
  const strongest = available.slice().sort((a, b) => b.power - a.power)[0]
  let pick = strongest
  if (profile === 'caster') {
    pick = available.filter((skill) => skill.kind === 'magic').sort((a, b) => b.power - a.power)[0] ?? strongest
  } else if (profile === 'trickster') {
    pick = available.find((skill) => ['poison', 'burn', 'paralyze', 'atk_down', 'def_down'].includes(skill.effect)) ?? available[Math.floor(Math.random() * available.length)]
  } else if (profile === 'guardian' && enemy.hp < enemy.maxHp * 0.5) {
    pick = available.find((skill) => ['heal', 'cure'].includes(skill.effect))
      ?? available.find((skill) => ['def_up', 'atk_up'].includes(skill.effect))
      ?? strongest
  }
  if (Math.random() < 0.8) {
    enemy.mp = Math.max(0, enemy.mp - pick.cost)
    return { skill: pick, kind: 'skill' }
  }
  return { skill: BASIC_ATTACK(enemy.attribute), kind: 'attack' }
}

/** Player auto: strongest affordable skill, else basic attack. */
function autoChoice(instance) {
  const skills = skillsFor(instance).filter((skill) => instance.mp >= skill.cost)
  if (skills.length === 0) return { skill: BASIC_ATTACK(getSpecies(instance.speciesId)?.attribute ?? 'unknown'), kind: 'attack' }
  const best = skills.slice().sort((a, b) => b.power - a.power)[0]
  instance.mp = Math.max(0, instance.mp - best.cost)
  return { skill: best, kind: 'skill' }
}

/** Resolve one turn-based battle round (up to 3 player units vs 1-3 enemies). */
function battleRound(state, command = 'attack', skillIndex = 0, orders = null) {
  const battle = state.battle
  if (battle === null || battle.status !== 'active') fail('当前没有进行中的战斗。')
  battle.events = []
  const controlled = instanceById(state, battle.activeId) ?? requireActive(state)
  const controlledSpecies = getSpecies(controlled.speciesId)
  const controlledStats = statsOf(controlled)

  const aliveUnits = () => battle.players.filter((unit) => {
    const instance = instanceById(state, unit.id)
    return instance !== undefined && instance.hp > 0
  })
  const aliveEnemies = () => battle.enemies.filter((enemy) => enemy.hp > 0)
  const primaryTarget = () => {
    const alive = aliveEnemies()
    if (alive.length === 0) return null
    const preferred = battle.enemies[battle.targetIndex]
    return preferred !== undefined && preferred.hp > 0 ? preferred : alive[0]
  }

  if (command === 'flee') {
    const target = primaryTarget()
    const enemySpd = target === null ? 0 : target.stats.spd * (target.ailments.paralyze > 0 ? 0.7 : 1)
    const playerSpd = controlledStats.spd * buffValue(battle.players[0].buffs, 'spd')
    const chance = Math.max(0.25, Math.min(0.9, 0.5 + (playerSpd - enemySpd) / 300))
    if (Math.random() < chance) {
      battle.status = 'fled'
      battle.log.push('你们撤退了。')
      return
    }
    battle.log.push('逃跑失败！')
  } else if (command === 'scan') {
    if (battle.scanned === true) fail('本场战斗已经分析过了（每场只能分析一次）。')
    const targets = aliveEnemies()
    if (targets.length === 0) fail('没有可分析的目标。')
    battle.scanned = true
    const lines = []
    for (const enemy of targets) {
      enemy.scanned = true
      const gain = SCAN_GAIN_BY_STAGE[enemy.stage] ?? 12
      const previous = state.dex.scan?.[enemy.speciesId] ?? 0
      const next = Math.min(100, previous + gain)
      state.dex.scan = state.dex.scan ?? {}
      state.dex.scan[enemy.speciesId] = next
      enemy.scanPercent = next
      lines.push(`${enemy.name}（${levelLabel(enemy.stage)}）+${gain}%`)
    }
    battle.log.push(`分析完成（本场仅一次）：${lines.join('；')}。`)
    return
  }

  let plannedOrders = orders
  if (plannedOrders === null) {
    plannedOrders = {}
    let controlledOrder
    if (command === 'guard') controlledOrder = { kind: 'guard' }
    else if (command === 'auto') controlledOrder = { kind: 'auto' }
    else if (command === 'skill') controlledOrder = { kind: 'skill', skillIndex }
    else controlledOrder = { kind: 'attack' }
    for (const unit of aliveUnits()) {
      plannedOrders[unit.id] = command === 'auto' ? { kind: 'auto' } : (unit.id === battle.activeId ? controlledOrder : { kind: 'auto' })
    }
  }

  const damageEnemy = (target, action, instance, unit) => {
    const skill = action.skill
    if (Math.random() * 100 > skill.accuracy) {
      battle.log.push(`${instance.name} 的「${skill.name}」没有命中。`)
      return 0
    }
    const stats = statsOf(instance)
    const result = computeDamage(stats, target.stats, skill, getSpecies(instance.speciesId)?.attribute ?? 'unknown', target.attribute, unit.buffs, false)
    target.hp = Math.max(0, target.hp - result.damage)
    battle.events.push({ side: 'enemy', index: battle.enemies.indexOf(target), damage: result.damage, critical: result.critical, skill: skill.name })
    battle.log.push(`${instance.name} 使用「${skill.name}」对 ${target.name} 造成 ${result.damage} 伤害${result.critical ? '（暴击）' : ''}。`)
    if (target.hp <= 0) battle.log.push(`${target.name} 的数据开始崩解。`)
    const effectText = applySkillEffect(battle, unit, target, skill.effect, instance.name)
    if (effectText !== null) battle.log.push(effectText)
    return result.damage
  }

  const doPlayerUnit = (unit, action) => {
    const instance = instanceById(state, unit.id)
    if (instance === undefined || instance.hp <= 0) return
    if (unit.ailments.paralyze > 0 && Math.random() < 0.25) {
      battle.log.push(`${instance.name} 因麻痹无法行动！`)
      return
    }
    if (action.kind === 'guard') {
      battle.guarding = true
      const stats = statsOf(instance)
      instance.mp = Math.min(stats.maxMp, instance.mp + Math.round(stats.maxMp * 0.08))
      battle.log.push(`${instance.name} 摆出防御姿态，本回合受到的伤害减半，MP 小幅回复。`)
      return
    }
    if (action.kind === 'item') {
      const def = SHOP_ITEMS.find((entry) => entry.id === action.itemId)
      if (def === undefined || (state.inventory.items?.[def.id] ?? 0) <= 0) {
        battle.log.push('道具不足，改为普通攻击。')
        action = { kind: 'attack' }
      } else {
        state.inventory.items[def.id] -= 1
        if (def.category === 'item') {
          const target = primaryTarget()
          if (target !== null) {
            if (def.effect === 'damage') {
              const fakeSkill = { name: def.name, kind: 'physical', power: def.power ?? 60, cost: 0, accuracy: 100, effect: 'none', element: getSpecies(instance.speciesId)?.attribute ?? 'unknown' }
              const dealt = damageEnemy(target, { kind: 'skill', skill: fakeSkill }, instance, unit)
              battle.log.push(`${instance.name} 投出了${def.name}。`)
            } else if (def.effect === 'def_down' || def.effect === 'atk_down') {
              const effectText = applySkillEffect(battle, instance, target, def.effect, instance.name)
              if (effectText !== null) battle.log.push(effectText)
            }
          }
        } else {
          const stats = statsOf(instance)
          if (def.effect === 'heal') {
            const amount = def.power ?? 60
            instance.hp = Math.min(stats.maxHp, instance.hp + amount)
            battle.events.push({ side: 'player', index: battle.players.indexOf(unit), heal: amount })
            battle.log.push(`${instance.name} 使用了${def.name}，回复 ${amount} HP。`)
          } else if (def.effect === 'cure') {
            unit.ailments = { poison: 0, burn: 0, paralyze: 0 }
            battle.log.push(`${instance.name} 使用了${def.name}，解除了异常状态。`)
          } else if (def.effect === 'atk_up' || def.effect === 'def_up') {
            const effectText = applySkillEffect(battle, instance, instance, def.effect, instance.name)
            if (effectText !== null) battle.log.push(effectText)
          }
        }
        return
      }
    }
    let resolved = action
    if (action.kind === 'auto') {
      resolved = autoChoice(instance)
    } else if (action.kind === 'skill') {
      const skill = skillsFor(instance)[action.skillIndex]
      const stats = statsOf(instance)
      if (skill === undefined || instance.mp < skill.cost) {
        resolved = { kind: 'attack', skill: BASIC_ATTACK(getSpecies(instance.speciesId)?.attribute ?? 'unknown') }
      } else {
        instance.mp = Math.max(0, instance.mp - skill.cost)
        resolved = { kind: 'skill', skill }
      }
    } else {
      resolved = { kind: 'attack', skill: BASIC_ATTACK(getSpecies(instance.speciesId)?.attribute ?? 'unknown') }
    }
    const target = primaryTarget()
    if (target === null) return
    const stats = statsOf(instance)
    if (resolved.kind === 'skill' && (resolved.skill.effect === 'heal' || resolved.skill.effect === 'cure')) {
      const allies = aliveUnits().map((entry) => instanceById(state, entry.id)).filter(Boolean)
      if (allies.length === 0) return
      const allyUnit = aliveUnits().find((entry) => entry.id === instance.id) ?? aliveUnits()[0]
      const ally = instanceById(state, allyUnit.id)
      if (resolved.skill.effect === 'heal') {
        const allyStats = statsOf(ally)
        const amount = Math.max(1, Math.round((resolved.skill.power || 40) * 1.5 + stats.wis * 0.6))
        ally.hp = Math.min(allyStats.maxHp, ally.hp + amount)
        battle.events.push({ side: 'player', index: battle.players.indexOf(allyUnit), heal: amount })
        battle.log.push(`${instance.name} 使用「${resolved.skill.name}」为 ${ally.name} 回复 ${amount} HP。`)
      } else {
        allyUnit.ailments = { poison: 0, burn: 0, paralyze: 0 }
        battle.log.push(`${instance.name} 使用「${resolved.skill.name}」解除了 ${ally.name} 的异常状态。`)
      }
      return
    }
    const guardBefore = battle.guarding
    battle.guarding = unit.id === battle.activeId ? battle.guarding : false
    const dealt = damageEnemy(target, resolved, instance, unit)
    battle.guarding = guardBefore
    if (resolved.kind === 'skill' && resolved.skill.effect === 'drain' && dealt > 0) {
      const maxHp = statsOf(instance).maxHp
      const heal = Math.round(dealt * 0.5)
      instance.hp = Math.min(maxHp, instance.hp + heal)
      battle.log.push(`${instance.name} 吸取了 ${heal} HP。`)
    }
  }

  const doEnemy = (enemy) => {
    if (enemy.hp <= 0) return
    const units = aliveUnits()
    if (units.length === 0) return
    const unit = units[Math.floor(Math.random() * units.length)]
    const instance = instanceById(state, unit.id)
    if (unit.ailments.paralyze > 0 && Math.random() < 0.25) {
      battle.log.push(`${enemy.name} 因麻痹无法行动！`)
      return
    }
    const choice = enemyChoice(enemy)
    if (choice.skill.effect === 'heal' || choice.skill.effect === 'cure') {
      if (choice.skill.effect === 'heal') {
        const amount = Math.max(1, Math.round((choice.skill.power || 40) * 1.5 + enemy.stats.wis * 0.6))
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + amount)
        battle.log.push(`${enemy.name} 使用「${choice.skill.name}」回复 ${amount} HP。`)
      } else {
        enemy.ailments = { poison: 0, burn: 0, paralyze: 0 }
        battle.log.push(`${enemy.name} 使用「${choice.skill.name}」解除了异常状态。`)
      }
      return
    }
    if (Math.random() * 100 > choice.skill.accuracy) {
      battle.log.push(`${enemy.name} 的「${choice.skill.name}」没有命中。`)
      return
    }
    const stats = statsOf(instance)
    const guarding = unit.id === battle.activeId && battle.guarding
    const result = computeDamage(enemy.stats, stats, choice.skill, enemy.attribute, getSpecies(instance.speciesId)?.attribute ?? 'unknown', enemy.buffs, guarding)
    instance.hp = Math.max(0, instance.hp - result.damage)
    battle.events.push({ side: 'player', index: battle.players.indexOf(unit), damage: result.damage, critical: result.critical, skill: choice.skill.name })
    battle.log.push(`${enemy.name} 使用「${choice.skill.name}」，${instance.name} 受到 ${result.damage} 伤害${result.critical ? '（暴击）' : ''}。`)
    if (choice.skill.effect === 'drain') {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.round(result.damage * 0.5))
    }
    const effectText = applySkillEffect(battle, enemy, unit, choice.skill.effect, enemy.name)
    if (effectText !== null) battle.log.push(effectText)
  }

  const finishIfOver = () => {
    if (battle.enemies.every((enemy) => enemy.hp <= 0)) {
      battle.status = 'won'
      state.stats.battlesWon += 1
      const apReward = battle.elite === true ? 3 : 1
      state.ap.value = Math.min(state.ap.max, state.ap.value + apReward)
      battle.log.push(`战斗胜利，AP +${apReward}。`)
      for (const unit of battle.players) {
        const instance = instanceById(state, unit.id)
        if (instance !== undefined && instance.hp > 0) {
          instance.battles += 1
          instance.wins += 1
        }
      }
      for (const enemy of battle.enemies) {
        const previous = state.dex.scan?.[enemy.speciesId] ?? 0
        const next = Math.min(100, previous + 25)
        state.dex.scan = state.dex.scan ?? {}
        state.dex.scan[enemy.speciesId] = next
        enemy.scanPercent = next
      }
      if (battle.elite === true && state.bossCleared[state.player.region] !== true) {
        state.bossCleared[state.player.region] = true
        state.dex.elite = state.dex.elite ?? {}
        const bossId = battle.enemies[0]?.speciesId
        if (bossId) state.dex.elite[bossId] = true
        state.inventory.dataCores += 3
        state.inventory.rebuildPrograms += 1
        state.stats.bossFirstClears = (state.stats.bossFirstClears ?? 0) + 1
        battle.log.push(`首次讨伐区域精英：图鉴精英徽记 +1，数据核心 +3，重构程序 +1！`)
      }
      battle.log.push('所有敌方数据开始崩解。')
      appendLog(state, 'battle', `击败了 ${battle.enemies.map((enemy) => enemy.name).join('、')}。`)
      return true
    }
    if (aliveUnits().length === 0) {
      battle.status = 'lost'
      state.player.region = 'file-city'
      state.regions.discovered['file-city'] = true
      for (const unit of battle.players) {
        const instance = instanceById(state, unit.id)
        if (instance === undefined) continue
        const stats = statsOf(instance)
        instance.hp = stats.maxHp
        instance.mp = Math.max(instance.mp, Math.round(stats.maxMp * 0.5))
        instance.care.energy = Math.min(100, instance.care.energy + 20)
      }
      state.stats.battlesLost += 1
      battle.log.push('队伍被传送回 File City，并在诊所恢复了体力与 HP。')
      appendLog(state, 'battle', '队伍在战斗中败北，被传送回 File City 并恢复了状态。')
      return true
    }
    return false
  }

  const actors = []
  for (const unit of aliveUnits()) {
    const instance = instanceById(state, unit.id)
    const stats = statsOf(instance)
    actors.push({ kind: 'player', unit, spd: stats.spd * buffValue(unit.buffs, 'spd') * (unit.ailments.paralyze > 0 ? 0.7 : 1) })
  }
  for (const enemy of aliveEnemies()) {
    actors.push({ kind: 'enemy', enemy, spd: enemy.stats.spd * (enemy.ailments.paralyze > 0 ? 0.7 : 1) })
  }
  actors.sort((a, b) => (b.spd - a.spd) || (Math.random() - 0.5))
  for (const actor of actors) {
    if (battle.status !== 'active') break
    if (actor.kind === 'player') {
      const instance = instanceById(state, actor.unit.id)
      let action = plannedOrders[actor.unit.id]
      if (action === undefined || action.kind === 'auto') action = autoChoice(instance)
      doPlayerUnit(actor.unit, action)
    } else {
      doEnemy(actor.enemy)
    }
    if (finishIfOver()) break
  }
  if (battle.status === 'active') {
    for (const line of ailmentTick(battle, battle.players, battle.enemies, state)) battle.log.push(line)
    finishIfOver()
  }
  if (battle.status === 'active') battle.guarding = false
  battle.orders = {}
  battle.phase = 'planning'
  battle.turn += 1
}

/** Add one unit's order during the planning phase. */
function battlePlan(state, payload) {
  const battle = state.battle
  if (battle === null || battle.status !== 'active') fail('当前没有进行中的战斗。')
  if (battle.phase !== 'planning') fail('当前不是指令阶段。')
  const unit = battle.players.find((entry) => entry.id === payload.instanceId)
  if (unit === undefined) fail('这只数码兽不在场上。')
  const instance = instanceById(state, unit.id)
  if (instance === undefined || instance.hp <= 0) fail('它已经失去战斗能力。')
  const kind = ['attack', 'skill', 'guard', 'auto', 'item'].includes(payload.kind) ? payload.kind : 'attack'
  let skillIndex = 0
  if (kind === 'skill') {
    skillIndex = Number(payload.skillIndex) || 0
    const skill = skillsFor(instance)[skillIndex]
    if (skill === undefined) fail('没有这个技能（可能等级不足）。')
    if (instance.mp < skill.cost) fail(`MP 不足（需要 ${skill.cost}）。`)
  }
  if (kind === 'item') {
    const item = SHOP_ITEMS.find((entry) => entry.id === payload.itemId)
    if (item === undefined) fail('没有这个道具。')
    if ((state.inventory.items?.[item.id] ?? 0) <= 0) fail('这个道具的数量不足。')
    battle.orders = battle.orders ?? {}
    battle.orders[unit.id] = { kind: 'item', itemId: item.id, side: item.category === 'item' ? 'enemy' : 'self' }
    return advancePlanningFocus(state, battle, instance)
  }
  battle.orders = battle.orders ?? {}
  battle.orders[unit.id] = kind === 'skill' ? { kind, skillIndex } : { kind }
  return advancePlanningFocus(state, battle, instance)
}

/** Move the planning focus to the next unit without an order. */
function advancePlanningFocus(state, battle, instance) {
  const nextUnit = battle.players.find((entry) => {
    const inst = instanceById(state, entry.id)
    return inst !== undefined && inst.hp > 0 && battle.orders[entry.id] === undefined
  })
  if (nextUnit !== undefined) {
    battle.focusId = nextUnit.id
    battle.activeId = nextUnit.id
    state.activeId = nextUnit.id
    const nextInstance = instanceById(state, nextUnit.id)
    return `${instance.name} 的指令已记录，接着为 ${nextInstance?.name ?? '下一只'} 下令。`
  }
  return `${instance.name} 的指令已记录。全部下单后点「执行回合」。`
}

/** Execute the planned round in speed order. */
function battleExecute(state) {
  const battle = state.battle
  if (battle === null || battle.status !== 'active') fail('当前没有进行中的战斗。')
  const orders = { ...(battle.orders ?? {}) }
  battleRound(state, 'execute', 0, orders)
  return battle.status === 'active' ? '本回合结束，请下达下一回合指令。' : battle.log.slice(-3).join(' ')
}

/** Swap a bench party member onto the field (costs no turn). */
function substituteBattle(state, inId) {
  const battle = state.battle
  if (battle === null || battle.status !== 'active') fail('当前没有进行中的战斗。')
  const incoming = instanceById(state, inId)
  if (incoming === undefined) fail('找不到这只数码兽。')
  if (!state.party.includes(incoming.id)) fail('它不在随行队伍中。')
  if (battle.players.some((unit) => unit.id === incoming.id)) fail('它已经在场上了。')
  if (incoming.hp <= 0) fail('它已经失去战斗能力，无法上场。')
  const hpRatio = (unit) => {
    const inst = instanceById(state, unit.id)
    if (inst === undefined) return 1
    const stats = statsOf(inst)
    return inst.hp <= 0 ? -1 : inst.hp / stats.maxHp
  }
  let outUnit = battle.players.find((unit) => unit.id === battle.focusId && hpRatio(unit) >= 0)
  if (outUnit === undefined) outUnit = battle.players.find((unit) => hpRatio(unit) < 0)
  if (outUnit === undefined) outUnit = battle.players.slice().sort((a, b) => hpRatio(a) - hpRatio(b))[0]
  if (outUnit === undefined) fail('场上没有可替换的单位。')
  const outInstance = instanceById(state, outUnit.id)
  const index = battle.players.indexOf(outUnit)
  battle.players[index] = { id: incoming.id, ailments: { poison: 0, burn: 0, paralyze: 0 }, buffs: { atk: 0, def: 0 } }
  battle.focusId = incoming.id
  battle.activeId = incoming.id
  state.activeId = incoming.id
  battle.log.push(`${outInstance?.name ?? '队友'} 被换下，${incoming.name} 上场！`)
  return `${outInstance?.name ?? '队友'} 被换下，${incoming.name} 上场。`
}

/** Change the active party member mid-battle (costs no turn). */
function switchBattle(state, instanceId) {
  const battle = state.battle
  if (battle === null || battle.status !== 'active') fail('当前没有进行中的战斗。')
  const target = state.roster.find((entry) => entry.id === instanceId)
  if (target === undefined) fail('没有这只数码兽。')
  if (!Array.isArray(battle.players) || !battle.players.some((unit) => unit.id === target.id && instanceById(state, unit.id)?.hp > 0)) fail('它不在上场队伍中或已倒下。')
  if (target.id === state.activeId) fail('它已经在场上了。')
  if (target.hp <= 0) fail('它已经失去战斗能力，无法上场。')
  const previous = activeInstance(state)
  state.activeId = target.id
  battle.activeId = target.id
  battle.events = [{ side: 'player', text: `${target.name} 上场！` }]
  battle.log.push(`${previous?.name ?? '前一只'} 被换下，${target.name} 上场！`)
  return `换上了 ${target.name}。`
}

/** Capture a defeated enemy once its scan rate reaches 100%. */
function captureBattle(state) {
  const battle = state.battle
  if (battle === null || battle.status !== 'won') fail('没有可捕获的目标。')
  const candidates = battle.enemies.filter((enemy) => enemy.hp <= 0 && (enemy.scanPercent ?? 0) >= 100)
  const enemy = candidates[battle.captureIndex ?? 0] ?? candidates[0]
  if (enemy === undefined) fail('没有扫描率达到 100% 的可捕获目标，先多用「分析」扫描。')
  const species = getSpecies(enemy.speciesId)
  if (species === undefined) fail('目标数据缺失。')
  if (state.roster.length >= state.nestCapacity) fail('数码巢已满，先去「城市」扩建数码巢。')
  const instance = makeInstance(species.id, Date.now())
  instance.level = Math.max(1, enemy.level)
  const stats = refreshInstanceStats(instance)
  instance.hp = stats.maxHp
  instance.mp = stats.maxMp
  state.roster.push(instance)
  if (state.party.length < RULES.partyMax) state.party.push(instance.id)
  if (state.battleParty.length < RULES.battleMax) state.battleParty.push(instance.id)
  if (state.activeId === null) state.activeId = instance.id
  state.dex.owned[species.id] = true
  state.stats.captures = (state.stats.captures ?? 0) + 1
  state.battle = null
  appendLog(state, 'capture', `捕获了 ${species.zh || species.name}。`)
  return `捕获成功：${species.zh || species.name}（Lv.${instance.level}）加入了数码巢。`
}

/** Absorb the defeated enemies' data. */
function absorbBattle(state) {
  const battle = state.battle
  if (battle === null || battle.status !== 'won') fail('没有可以吸收的敌方数据。')
  const instance = requireActive(state)
  const ownAttribute = getSpecies(instance.speciesId)?.attribute ?? 'unknown'
  let totalExp = 0
  const gained = []
  const learned = []
  for (const enemy of battle.enemies) {
    const species = getSpecies(enemy.speciesId)
    const attribute = species?.attribute ?? 'unknown'
    totalExp += 8 + stageIndex(enemy.stage) * 12
    if (attribute !== 'unknown') {
      state.inventory.fragments[attribute] = (state.inventory.fragments[attribute] ?? 0) + 1
      gained.push(attributeLabel(attribute))
      if (attribute !== ownAttribute) instance.noise = Math.min(100, instance.noise + 3)
    }
    state.inventory.fragmentTypes[enemy.type] = (state.inventory.fragmentTypes[enemy.type] ?? 0) + 1
    state.dex.absorbed[enemy.speciesId] = (state.dex.absorbed[enemy.speciesId] ?? 0) + 1
    state.stats.dataAbsorbed += 1
    if (attribute !== 'unknown') {
      const ecology = state.regions.ecology[state.player.region] ?? { vaccine: 0, data: 0, virus: 0, free: 0 }
      ecology[attribute] = (ecology[attribute] ?? 0) + 1
      state.regions.ecology[state.player.region] = ecology
    }
    if (Math.random() < (battle.scanned ? 0.33 : 0.18)) {
      const move = species?.moves?.[0]
      if (move && !instance.moves.includes(move)) {
        instance.moves = [...instance.moves, move].slice(0, 4)
        learned.push(move)
      }
    }
  }
  const levelEvents = grantExp(state, instance, totalExp)
  if (state.stats.battlesWon % 3 === 0) state.inventory.dataCores += 1
  appendLog(state, 'battle', `${instance.name} 吸收了 ${battle.enemies.length} 只敌方数据。经验 +${totalExp}，获得 ${gained.join('/') || '若干'} 数据碎片。`)
  state.battle = null
  const levels = levelEvents.length > 0 ? ` 升到了 Lv.${instance.level}！` : ''
  const learnedText = learned.length > 0 ? `，学会了 ${learned.join('、')}` : ''
  return `吸收了 ${battle.enemies.length} 只敌方数据。经验 +${totalExp}${learnedText}。${levels}`
}

/** Rebuild defeated enemy data into an egg. */
function rebuildBattle(state) {
  const battle = state.battle
  if (battle === null || battle.status !== 'won') fail('没有可以重构的敌方数据。')
  if (state.inventory.rebuildPrograms <= 0) fail('没有重构程序。去 File City 商店补充吧。')
  state.inventory.rebuildPrograms -= 1
  const enemySpecies = getSpecies(battle.enemies[0].speciesId)
  if (enemySpecies === undefined) fail('敌方数据不完整。')
  const enemy = battle.enemies[0]
  const base = findBaseForm(enemySpecies.id) ?? (enemySpecies.level === 'baby1' || enemySpecies.level === 'baby2' ? enemySpecies : null)
  if (base === null) {
    state.battle = null
    fail('这份数据无法重构为稳定的数码蛋。')
  }
  const active = requireActive(state)
  const chance = Math.min(0.95, 0.65 + (battle.scanned ? 0.15 : 0) + Math.max(0, stageIndex(active.stage) - stageIndex(enemy.stage)) * 0.08)
  if (Math.random() > chance) {
    appendLog(state, 'battle', `重构 ${enemy.name} 失败，数据逸散了。`)
    state.battle = null
    return `重构失败，${enemy.name} 的数据在稳定前逸散了。`
  }
  if (state.roster.length + state.eggs.length >= state.nestCapacity) fail('数码巢和孵化器都满了，先扩建或腾出空间。')
  const egg = makeEgg(base.id, 'rebuild', state.clock.totalHours, 1 + Math.random() * 2, 'rare')
  state.eggs.push(egg)
  appendLog(state, 'battle', `你用重构程序把 ${enemy.name} 的数据重建成了数码蛋。`)
  state.battle = null
  return `重构成功！获得了 ${base.zh || base.name} 谱系的数码蛋。${''}`
}

/** Explore the current region. */
function exploreAction(state) {
  const instance = requireActive(state)
  spendAp(state, RULES.apExplore)
  advanceGameHours(state, 1)
  instance.care.energy = Math.max(0, instance.care.energy - 8)
  addFatigue(instance, 4)
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
    const found = randInt(12, 30)
    state.inventory.bits += found
    appendLog(state, 'explore', `你在 ${region.zh} 拾到了一些散落的比特。`)
    return `探索 ${region.zh}，获得 ${found} 比特。`
  }
  const attribute = pick(['vaccine', 'data', 'virus', 'free'])
  state.inventory.fragments[attribute] = (state.inventory.fragments[attribute] ?? 0) + 1
  appendLog(state, 'explore', `你在 ${region.zh} 发现了一小段游离数据。`)
  return `你在 ${region.zh} 发现了一小段游离数据。`
}

/** Generate the AI expedition report. */
function expeditionAction(state, regionInput) {
  if (regionInput !== undefined && regionInput !== null && regionInput !== '') {
    const destination = requireRegion(state, regionInput)
    if (state.player.region !== destination.id) {
      state.player.region = destination.id
      state.regions.discovered[destination.id] = true
      appendLog(state, 'travel', `远征队伍前往 ${destination.zh}。`)
    }
  }
  const region = currentRegion(state)
  if (region.safe) fail(`File City 里没有远征目标。请先前往可远征区域：${regionListText(state, true)}。也可以用 expedition 时带 region 参数自动前往（如 region=gear-savanna）。`)
  const instance = requireActive(state)
  requireCooldownReady(state, 'expedition', '远征')
  if (instance.care.energy < 40) fail('体力不足 40，无法远征。先休息一下。')
  spendAp(state, RULES.apExpedition)
  advanceGameHours(state, 3)
  instance.care.energy = Math.max(0, instance.care.energy - 25)
  addFatigue(instance, RULES.fatigueExpedition)
  setCooldown(state, 'expedition', RULES.expeditionCooldownHours)
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
  if (battles === 0) {
    fragments = 1
    grantExp(state, instance, 3 + stageIndex(instance.stage) * 2)
    lines.push('虽未交战，也搜集到了一份残留数据')
  }
  state.inventory.fragments[attribute] = (state.inventory.fragments[attribute] ?? 0) + fragments
  if (Math.random() < 0.35) {
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
  spendAp(state, RULES.apRestore)
  advanceGameHours(state, 2)
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
  if (state.party.length < RULES.partyMax) state.party.push(instance.id)
  if (state.battleParty.length < RULES.battleMax) state.battleParty.push(instance.id)
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
  if (state.farm.includes(instance.id)) fail('它还在数码农场里，先取回。')
  if (!state.party.includes(instance.id)) {
    if (state.party.length >= RULES.partyMax) fail('随行队伍已满（6 只），先替换一只。')
    state.party.push(instance.id)
  }
  if (!state.battleParty.includes(instance.id)) {
    if (state.battleParty.length < RULES.battleMax) state.battleParty.push(instance.id)
    else state.battleParty[RULES.battleMax - 1] = instance.id
  }
  state.activeId = instance.id
  appendLog(state, 'party', `${instance.name} 成为了当前出战数码兽。`)
  return `${instance.name} 成为了出战数码兽。`
}

/** Store a Digimon in the Digital Farm. */
function farmStore(state, instanceId) {
  const instance = instanceById(state, instanceId)
  if (instance === undefined) fail('找不到这只数码兽。')
  if (state.battle !== null) fail('战斗中不能整理农场。')
  if (state.activeId === instance.id) fail('当前出战的数码兽不能存入农场，先换一只。')
  if (state.farm.includes(instance.id)) fail('它已经在农场里了。')
  if (state.farm.length >= RULES.farmCapacity) fail('农场已满。')
  state.party = state.party.filter((id) => id !== instance.id)
  state.battleParty = state.battleParty.filter((id) => id !== instance.id)
  state.farm.push(instance.id)
  appendLog(state, 'farm', `${instance.name} 被送到了数码农场。`)
  return `${instance.name} 已存入数码农场。`
}

/** Take a Digimon back from the Digital Farm. */
function farmTake(state, instanceId) {
  const instance = instanceById(state, instanceId)
  if (instance === undefined) fail('找不到这只数码兽。')
  if (!state.farm.includes(instance.id)) fail('它不在农场里。')
  state.farm = state.farm.filter((id) => id !== instance.id)
  appendLog(state, 'farm', `${instance.name} 从数码农场回来了。`)
  return `${instance.name} 已从数码农场取回。`
}

/** Decompose a Digimon to free space, yielding fragments and bits. */
function decomposeAction(state, instanceId) {
  const instance = instanceById(state, instanceId)
  if (instance === undefined) fail('找不到这只数码兽。')
  if (state.battle !== null) fail('战斗中不能分解数码兽。')
  if (state.activeId === instance.id) fail('当前出战的数码兽不能分解，先换一只。')
  if (state.roster.length <= 1) fail('至少要保留一只数码兽。')
  const species = getSpecies(instance.speciesId)
  const attribute = species?.attribute ?? 'unknown'
  const bits = 20 + stageIndex(instance.stage) * 30 + instance.level * 2
  state.inventory.bits += bits
  if (attribute !== 'unknown') state.inventory.fragments[attribute] = (state.inventory.fragments[attribute] ?? 0) + 1
  if (stageIndex(instance.stage) >= 4) state.inventory.dataCores += 1
  state.roster = state.roster.filter((entry) => entry.id !== instance.id)
  state.party = state.party.filter((id) => id !== instance.id)
  state.battleParty = state.battleParty.filter((id) => id !== instance.id)
  state.farm = state.farm.filter((id) => id !== instance.id)
  state.dex.owned[instance.speciesId] = state.dex.owned[instance.speciesId] ?? false
  state.stats.decomposed = (state.stats.decomposed ?? 0) + 1
  appendLog(state, 'decompose', `把 ${instance.name} 分解成了数据碎片。`)
  return `已分解 ${instance.name}：比特 +${bits}，${attributeLabel(attribute)}碎片 +1。`
}

/** Use one inventory item outside battle (medicine / food / training device). */
function useItem(state, itemId, input = {}) {
  const item = resolveShopItem(state, { ...input, itemId })
  const instant = instanceById(state, state.activeId)
  if (item.category === 'medicine') {
    if (item.effect === 'heal') {
      if (instant === undefined) fail('还没有出战的数码兽。')
      if ((state.inventory.items?.[item.id] ?? 0) <= 0) fail('这个药品数量不足。')
      state.inventory.items[item.id] -= 1
      const stats = statsOf(instant)
      instant.hp = Math.min(stats.maxHp, instant.hp + (item.power ?? 60))
      appendLog(state, 'item', `${instant.name} 使用了${item.name}。`)
      return `${instant.name} 使用了${item.name}，HP 回复 ${item.power ?? 60}（当前 ${Math.round(instant.hp)}/${stats.maxHp}）。`
    }
    if (item.effect === 'cure') {
      fail('当前没有需要解除的异常状态（异常状态只发生在战斗中，请在战斗中作为道具使用）。')
    }
    fail(`${item.name} 只能在战斗中使用（指令阶段选道具）。`)
  }
  if (item.category === 'food') {
    if ((state.inventory.foods?.[item.tier] ?? 0) <= 0) fail('这种食物数量不足。')
    if (instant === undefined) fail('还没有出战的数码兽。')
    state.inventory.foods[item.tier] -= 1
    instant.care.fullness = Math.min(100, instant.care.fullness + (item.fullness ?? 20))
    instant.care.mood = Math.min(100, instant.care.mood + 5)
    instant.bond = Math.min(100, instant.bond + (item.bond ?? 1))
    const apGain = item.tier === 'premium' ? 3 : item.tier === 'good' ? 2 : 1
    state.ap.value = Math.min(state.ap.max, state.ap.value + apGain)
    advanceGameHours(state, 0.25)
    appendLog(state, 'feed', `你喂了 ${instant.name} 一份${item.name}。`)
    return `喂食${item.name}：饱食 +${item.fullness}，羁绊 +${item.bond}，AP +${apGain}。`
  }
  if (item.category === 'training') {
    if ((state.inventory.devices?.[item.stat] ?? 0) <= 0) fail('这个训练装置数量不足。')
    return trainAction(state, { stat: item.stat })
  }
  fail(`${item.name} 只能在战斗中对敌方使用。`)
}

/** Printable shop catalog. */
export function shopListText() {
  const label = { medicine: '药品', item: '道具', food: '食物', training: '训练装置' }
  return Object.entries(label).map(([category, text]) =>
    `${text}：${SHOP_ITEMS.filter((item) => item.category === category).map((item) => `${item.id}(${item.name}·${item.price})`).join('、')}`,
  ).join('；')
}

/** Resolve a shop item by id, Chinese name, or category alias. */
function resolveShopItem(state, input) {
  const key = String(input.itemId ?? input.item ?? input.name ?? '').trim()
  const stat = String(input.stat ?? '').trim()
  let item = SHOP_ITEMS.find((entry) => entry.id === key || entry.name === key)
  if (item === undefined && ['训练装置', '训练机', 'training_device', 'device', '训练'].includes(key)) {
    if (TRAIN_STATS.includes(stat)) item = SHOP_ITEMS.find((entry) => entry.category === 'training' && entry.stat === stat)
    if (item === undefined) fail(`训练装置请指定 stat=hp/mp/atk/def/spd/wis/spr（例如 shop_buy itemId=device_atk）。可用商品：${shopListText()}`)
  }
  if (item === undefined && ['数据食物', '食物', 'food', 'food_basic'].includes(key)) {
    const tier = String(input.tier ?? '').trim()
    item = SHOP_ITEMS.find((entry) => entry.category === 'food' && (tier === '' ? entry.tier === 'basic' : entry.tier === tier))
  }
  if (item === undefined) fail(`商店没有这个商品：${key || '（空）'}。可用商品 id：${shopListText()}`)
  return item
}

/** Buy an item from the File City shop. */
function shopBuy(state, itemId, qty = 1, input = {}) {
  const item = resolveShopItem(state, { ...input, itemId })
  const count = Math.max(1, Math.min(99, Math.round(Number(qty) || 1)))
  const cost = item.price * count
  if (state.inventory.bits < cost) fail(`比特不足（需要 ${cost}）。`)
  state.inventory.bits -= cost
  if (item.category === 'food') {
    state.inventory.foods[item.tier] = (state.inventory.foods[item.tier] ?? 0) + count
  } else if (item.category === 'training') {
    state.inventory.devices[item.stat] = (state.inventory.devices[item.stat] ?? 0) + count
  } else {
    state.inventory.items[item.id] = (state.inventory.items[item.id] ?? 0) + count
  }
  appendLog(state, 'shop', `购买了 ${count} 个${item.name}。`)
  return `购买了 ${count} 个${item.name}，花费 ${cost} 比特。`
}

/** Equip or unequip one learned skill (max 6 equipped). */
function equipSkill(state, instanceId, skillName) {
  const instance = instanceById(state, instanceId)
  if (instance === undefined) fail('找不到这只数码兽。')
  ensureSkillFields(instance)
  if (!instance.learnedSkills.includes(skillName)) fail('它还没有学会这个技能。')
  if (instance.equippedSkills.includes(skillName)) {
    instance.equippedSkills = instance.equippedSkills.filter((name) => name !== skillName)
    return `已卸下技能「${skillName}」。`
  }
  if (instance.equippedSkills.length >= 6) fail('最多只能携带 6 个技能，先卸下一个。')
  instance.equippedSkills.push(skillName)
  return `已装备技能「${skillName}」。`
}
export function publicState(state, now = Date.now()) {
  const active = activeInstance(state)
  const party = state.party.map((id) => instanceById(state, id)).filter(Boolean)
  const roster = state.roster.map((instance) => {
    const summary = instanceSummary(instance)
    return { ...summary, inParty: state.party.includes(instance.id), inBattleParty: state.battleParty.includes(instance.id), inFarm: state.farm.includes(instance.id), active: instance.id === state.activeId }
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
    activeId: state.activeId,
    ap: { value: Math.floor(ensureEconomy(state) ?? state.ap.value), max: state.ap.max },
    cooldowns: {
      expedition: Math.round(cooldownRemaining(state, 'expedition') * 10) / 10,
      sleep: Math.round(cooldownRemaining(state, 'sleep') * 10) / 10,
      pet: Math.round(cooldownRemaining(state, 'pet') * 10) / 10,
      play: Math.round(cooldownRemaining(state, 'play') * 10) / 10,
      boss: Math.round(cooldownRemaining(state, `boss:${state.player.region}`) * 10) / 10,
    },
    rules: { ...RULES },
    scene: REGION_SCENES[state.player.region] ?? REGION_SCENES['file-city'] ?? null,
    active: activeSummary,
    evolutionOptions: active === null ? [] : evolutionOptions(state, active.id),
    party: party.map((instance) => instanceSummary(instance)),
    battleParty: state.battleParty.map((id) => instanceById(state, id)).filter(Boolean).map((instance) => instanceSummary(instance)),
    farm: state.farm.map((id) => instanceById(state, id)).filter(Boolean).map((instance) => instanceSummary(instance)),
    farmCapacity: RULES.farmCapacity,
    partyMax: RULES.partyMax,
    battleMax: RULES.battleMax,
    bossCleared: { ...state.bossCleared },
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
      items: { ...(state.inventory.items ?? {}) },
      foods: { ...(state.inventory.foods ?? {}) },
      devices: { ...(state.inventory.devices ?? {}) },
    },
    shopItems: SHOP_ITEMS.map((item) => ({ ...item })),
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
      scanned: state.battle.scanned === true,
      elite: state.battle.elite === true,
      activeId: state.battle.activeId,
      phase: state.battle.phase ?? 'planning',
      focusId: state.battle.focusId ?? state.battle.activeId,
      orders: { ...(state.battle.orders ?? {}) },
      events: Array.isArray(state.battle.events) ? [...state.battle.events] : [],
      player: (() => {
        const active = activeInstance(state)
        if (active === null) return null
        const stats = statsOf(active)
        return {
          name: active.name,
          level: active.level,
          hp: Math.round(active.hp),
          maxHp: stats.maxHp,
          mp: Math.round(active.mp),
          maxMp: stats.maxMp,
          attribute: getSpecies(active.speciesId)?.attribute ?? 'unknown',
          skills: skillsFor(active),
        }
      })(),
      players: (state.battle.players ?? []).map((unit, index) => {        const instance = instanceById(state, unit.id)
        if (instance === undefined) return null
        const stats = statsOf(instance)
        return {
          index,
          id: unit.id,
          name: instance.name,
          speciesId: instance.speciesId,
          level: instance.level,
          hp: Math.round(instance.hp),
          maxHp: stats.maxHp,
          mp: Math.round(instance.mp),
          maxMp: stats.maxMp,
          attribute: getSpecies(instance.speciesId)?.attribute ?? 'unknown',
          ailments: { ...(unit.ailments ?? { poison: 0, burn: 0, paralyze: 0 }) },
          buffs: { ...(unit.buffs ?? { atk: 0, def: 0 }) },
          active: unit.id === state.battle.activeId,
          focus: unit.id === (state.battle.focusId ?? state.battle.activeId),
          order: state.battle.orders?.[unit.id]?.kind ?? null,
          skills: skillsFor(instance),
        }
      }).filter(Boolean),
      enemies: (state.battle.enemies ?? []).map((enemy, index) => ({
        index,
        name: enemy.name,
        speciesId: enemy.speciesId,
        level: enemy.level,
        stage: enemy.stage,
        attribute: enemy.attribute,
        type: enemy.type,
        elite: enemy.elite === true,
        hp: Math.round(enemy.hp),
        maxHp: enemy.maxHp,
        mp: Math.round(enemy.mp),
        maxMp: enemy.maxMp,
        scanPercent: enemy.scanPercent ?? 0,
        scanned: enemy.scanned === true,
        ailments: { ...(enemy.ailments ?? { poison: 0, burn: 0, paralyze: 0 }) },
        skills: enemy.scanned === true ? skillsFor(enemy) : null,
        target: index === (state.battle.targetIndex ?? 0) && enemy.hp > 0,
      })),
      bench: state.party
        .filter((id) => !(state.battle.players ?? []).some((unit) => unit.id === id))
        .map((id) => instanceById(state, id))
        .filter(Boolean)
        .map((instance) => instanceSummary(instance)),
      captureReady: (state.battle.enemies ?? []).some((enemy) => enemy.hp <= 0 && (enemy.scanPercent ?? 0) >= 100),
      log: [...state.battle.log],
      rewardPreview: state.battle.rewardPreview,
    },
    dex: {
      total: SPECIES.length,
      seen: Object.keys(state.dex.seen).length,
      owned: Object.keys(state.dex.owned).length,
      absorbed: Object.values(state.dex.absorbed).reduce((sum, value) => sum + value, 0),
      captures: state.stats.captures ?? 0,
      scan: { ...(state.dex.scan ?? {}) },
      elite: { ...(state.dex.elite ?? {}) },
    },
    links: computeLinks(state),
    stats: { ...state.stats },
    log: state.log.slice(-20).map((entry) => ({ at: entry.at, kind: entry.kind, text: entry.text })),
    catalog: { count: SPECIES.length, snapshotTotal: CATALOG.count ?? SPECIES.length, snapshotDate: CATALOG.snapshotDate ?? '' },
  }
}

/** Short status line for the agent tool. */
export function statusLine(state) {
  const active = activeInstance(state)
  const apText = `${Math.floor(state.ap?.value ?? 0)}/${state.ap?.max ?? RULES.apMax}`
  const partyText = state.party.map((id) => {
    const inst = instanceById(state, id)
    return inst === undefined ? `?(${id})` : `${inst.name}(${id})`
  }).join('、') || '无'
  const nextEgg = state.eggs.length > 0 ? Math.max(0, Math.min(...state.eggs.map((egg) => egg.readyAtHours - state.clock.totalHours))) : null
  const eggInfo = state.eggs.length === 0 ? '无蛋' : `${state.eggs.length}颗，最快剩余 ${nextEgg.toFixed(1)} 游戏小时(≈${Math.round(nextEgg)}分钟)`
  const sleepCd = cooldownRemaining(state, 'sleep')
  const expCd = cooldownRemaining(state, 'expedition')
  const cdText = `睡眠冷却 ${sleepCd > 0 ? `${Math.ceil(sleepCd)}分钟` : '就绪'}｜远征冷却 ${expCd > 0 ? `${Math.ceil(expCd)}分钟` : '就绪'}｜孵化：${eggInfo}`
  const shopIds = SHOP_ITEMS.map((item) => item.id).join('/')
  const apHint = 'AP恢复：每6现实分钟+1；睡眠+3；喂食+1~3；胜利+1（精英+3）'
  const deviceText = Object.entries(state.inventory.devices ?? {}).filter(([, count]) => count > 0).map(([stat, count]) => `${stat}×${count}`).join('/') || '无'
  const foodText = `基础${state.inventory.foods?.basic ?? 0}/优质${state.inventory.foods?.good ?? 0}/特级${state.inventory.foods?.premium ?? 0}`
  const itemText = Object.entries(state.inventory.items ?? {}).filter(([, count]) => count > 0).map(([id, count]) => `${id}×${count}`).join('/') || '无'
  const invText = `背包：装置 ${deviceText}｜食物 ${foodText}｜道具 ${itemText}`
  if (active === null) {
    return `【数码世界】还没有出战的数码兽。AP ${apText}｜随行 ${state.party.length}/${RULES.partyMax}：${partyText}｜巢穴 ${state.roster.length}/${state.nestCapacity}｜${cdText}｜${apHint}｜${invText}｜商店id：${shopIds}`
  }
  const species = getSpecies(active.speciesId)
  const stats = statsOf(active)
  return `【${active.name}】${species?.zh || species?.name || active.speciesId} · ${stageLabel(active.stage)} Lv.${active.level}｜HP ${Math.round(active.hp)}/${stats.maxHp}｜MP ${Math.round(active.mp)}/${stats.maxMp}｜体力 ${Math.round(active.care.energy)}｜AP ${apText}｜羁绊 ${Math.round(active.bond)}｜饱食 ${Math.round(active.care.fullness)}｜心情 ${Math.round(active.care.mood)}｜区域 ${currentRegion(state).zh}(${currentRegion(state).id})｜随行 ${state.party.length}/${RULES.partyMax}：${partyText}｜上场 ${state.battleParty.length}/${RULES.battleMax}｜农场 ${state.farm.length}｜巢穴 ${state.roster.length}/${state.nestCapacity}｜${cdText}｜${apHint}｜${invText}｜商店id：${shopIds}`
}

/** Public API used by both the tool and the HTTP route. */
export function performAction(state, action, payload = {}, now = Date.now()) {
  advanceState(state, now)
  const input = payload !== null && typeof payload === 'object' ? payload : {}
  let summary = ''
  if (action === 'status') {
    summary = statusLine(state)
  } else if (action === 'care') {
    summary = careAction(state, input.mode, input)
  } else if (action === 'train') {
    summary = trainAction(state, input)
  } else if (action === 'shop_buy') {
    summary = shopBuy(state, input.itemId, input.qty, input)
  } else if (action === 'use_item') {
    summary = useItem(state, input.itemId, input)
  } else if (action === 'shop') {
    summary = `File City 商店（比特 ${state.inventory.bits}）：${shopListText()}。用 shop_buy itemId=… 购买。`
  } else if (action === 'equip_skill') {
    summary = equipSkill(state, input.instanceId, input.skillName)
  } else if (action === 'decompose') {
    summary = decomposeAction(state, input.instanceId)
  } else if (action === 'travel') {
    const region = requireRegion(state, input.region)
    state.player.region = region.id
    state.regions.discovered[region.id] = true
    advanceGameHours(state, 0.5)
    appendLog(state, 'travel', `你来到了 ${region.zh}。`)
    summary = `你来到了 ${region.zh}。${region.description}`
  } else if (action === 'explore') {
    requireActive(state)
    summary = exploreAction(state)
  } else if (action === 'boss') {
    summary = bossBattle(state)
  } else if (action === 'farm_store') {
    summary = farmStore(state, input.instanceId)
  } else if (action === 'farm_take') {
    summary = farmTake(state, input.instanceId)
  } else if (action === 'battle') {
    if (input.command === 'dismiss') {
      state.battle = null
      summary = '你离开了战斗界面。'
    } else if (input.command === 'plan') {
      summary = battlePlan(state, input)
    } else if (input.command === 'execute') {
      summary = battleExecute(state)
    } else if (input.command === 'focus') {
      const unit = (state.battle.players ?? []).find((entry) => entry.id === input.instanceId)
      const instance = unit === undefined ? undefined : instanceById(state, unit.id)
      if (instance === undefined || instance.hp <= 0) fail('目标无效或已倒下。')
      state.battle.focusId = unit.id
      state.battle.activeId = unit.id
      state.activeId = unit.id
      summary = `当前为 ${instance.name} 下达指令。`
    } else if (input.command === 'target') {
      const index = Number(input.index)
      const enemy = state.battle.enemies[index]
      if (enemy === undefined || enemy.hp <= 0) fail('目标无效或已倒下。')
      state.battle.targetIndex = index
      summary = `目标锁定：${enemy.name}。`
    } else if (input.command === 'switch') {
      summary = switchBattle(state, input.instanceId)
    } else if (input.command === 'substitute') {
      summary = substituteBattle(state, input.inId ?? input.instanceId)
    } else if (input.command === 'auto') {
      let rounds = 0
      while (state.battle?.status === 'active' && rounds < 60) {
        battleRound(state, 'auto')
        rounds += 1
      }
      summary = state.battle === null ? '战斗结束。' : state.battle.log.slice(-4).join(' ')
    } else {
      battleRound(state, input.command ?? 'attack', Number(input.skill) || 0)
      summary = state.battle === null ? '战斗结束。' : state.battle.log.slice(-4).join(' ')
    }
  } else if (action === 'absorb') {
    summary = absorbBattle(state)
  } else if (action === 'capture') {
    summary = captureBattle(state)
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
    spendAp(state, RULES.apInfuse)
    advanceGameHours(state, 0.5)
    state.inventory.fragments[attribute] -= 1
    const map = { vaccine: 'hp', data: 'wis', virus: 'atk', free: 'spd' }
    const stat = map[attribute]
    instance.trained[stat] = (instance.trained[stat] ?? 0) + 2
    instance.noise = Math.max(0, instance.noise - (attribute === species?.attribute ? 2 : 0))
    grantExp(state, instance, 8)
    appendLog(state, 'data', `${instance.name} 融合了一份${attributeLabel(attribute)}数据碎片。`)
    summary = `${instance.name} 融合了${attributeLabel(attribute)}数据碎片，${stat.toUpperCase()} +2。`
  } else if (action === 'expedition') {
    summary = expeditionAction(state, input.region)
  } else if (action === 'regions') {
    summary = `可用区域：${regionListText(state)}。`
  } else if (action === 'dex') {
    summary = `图鉴共 ${SPECIES.length} 条；已见 ${Object.keys(state.dex.seen).length}，历史拥有 ${Object.keys(state.dex.owned).length}（现有 ${state.roster.length} 只，蛋 ${state.eggs.length} 颗），已吸收数据 ${Object.values(state.dex.absorbed).reduce((sum, value) => sum + value, 0)} 次。`
  } else {
    fail(`未知的 action「${action}」。`)
  }
  state.updatedAt = now
  return { ok: true, action, summary }
}

/** Dex page for the browser. */
export function dexPage(query, page = 1, limit = 24, scan = {}, elite = {}) {
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
      scan: Math.round(scan[species.id] ?? 0),
      elite: elite[species.id] === true,
    })),
  }
}

export { REGIONS, REGION_MAP, LEVEL_LABELS }
