/**
 * Static game data and derived indexes for `dsh-plugin-digital-world`.
 *
 * The species catalog is a generated snapshot of Wikimon's Digimon list with
 * infobox fields and evolution links. Everything else here — regions, stage
 * mapping, and fallback starter lines — is our own game design.
 *
 * @module dsh-plugin-digital-world/game-data
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SPRITE_INDEX } from './sprite-index.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** Species that currently have a real sprite and may be used in the game. */
const AVAILABLE_SPECIES = new Set(SPRITE_INDEX.map((entry) => entry.id))
export const AVAILABLE_COUNT = AVAILABLE_SPECIES.size

/** Fallback used only when the generated data file is missing during development. */
const FALLBACK = {
  snapshotDate: '2026-11-04',
  source: 'fallback',
  count: 8,
  species: [
    { id: 'botamon', name: 'Botamon', kanji: 'ボタモン', zh: '滚球兽', level: 'baby1', attribute: 'data', type: 'Slime', moves: ['Bubble Blow'], profile: '', debut: '', evolvesTo: ['koromon'] },
    { id: 'koromon', name: 'Koromon', kanji: 'コロモン', zh: '科罗蒙', level: 'baby2', attribute: 'data', type: 'Slime', moves: ['Bubble Blow'], profile: '', debut: '', evolvesTo: ['agumon'] },
    { id: 'agumon', name: 'Agumon', kanji: 'アグモン', zh: '亚古兽', level: 'child', attribute: 'vaccine', type: 'Reptile', moves: ['Pepper Breath', 'Spirit Fire'], profile: '', debut: 'Digital Monster Ver. 1', evolvesTo: ['greymon'] },
    { id: 'greymon', name: 'Greymon', kanji: 'グレイモン', zh: '暴龙兽', level: 'adult', attribute: 'vaccine', type: 'Dinosaur', moves: ['Nova Blast', 'Great Antler'], profile: '', debut: '', evolvesTo: ['metalgreymon', 'skullgreymon'] },
    { id: 'metalgreymon', name: 'MetalGreymon', kanji: 'メタルグレイモン', zh: '机械暴龙兽', level: 'perfect', attribute: 'vaccine', type: 'Cyborg', moves: ['Giga Destroyer', 'Trident Arm'], profile: '', debut: '', evolvesTo: ['wargreymon'] },
    { id: 'wargreymon', name: 'WarGreymon', kanji: 'ウォーグレイモン', zh: '战斗暴龙兽', level: 'ultimate', attribute: 'vaccine', type: 'Dragon Man', moves: ['Terra Force', 'Great Tornado'], profile: '', debut: '', evolvesTo: [] },
    { id: 'tsunomon', name: 'Tsunomon', kanji: 'ツノモン', zh: '角兽', level: 'baby2', attribute: 'data', type: 'Lesser', moves: ['Bubble Blow'], profile: '', debut: '', evolvesTo: ['gabumon'] },
    { id: 'gabumon', name: 'Gabumon', kanji: 'ガブモン', zh: '加布兽', level: 'child', attribute: 'data', type: 'Reptile', moves: ['Blue Blaster'], profile: '', debut: '', evolvesTo: [] },
  ],
}

/** Load the generated catalog, falling back to a tiny development set. */
function loadCatalog() {
  try {
    const raw = readFileSync(path.join(HERE, '..', 'data', 'digimon.json'), 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.species) && parsed.species.length > 0) {
      return parsed
    }
  } catch {
    // Development without the generated data uses the fallback.
  }
  return FALLBACK
}

export const CATALOG = loadCatalog()
export const SPECIES_LIST = CATALOG.species

/** Curated skill numbers for iconic moves (others are derived deterministically). */
export const SKILL_OVERRIDES = (() => {
  try {
    const raw = readFileSync(path.join(HERE, '..', 'data', 'skills-overrides.json'), 'utf8')
    const parsed = JSON.parse(raw)
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
})()

/** Simplified-Chinese display-name overrides for species whose zh was English. */
export const ZH_NAMES = (() => {
  try {
    const raw = readFileSync(path.join(HERE, '..', 'data', 'zh-names.json'), 'utf8')
    const parsed = JSON.parse(raw)
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
})()

/** Optional official-source evolution graph (Wikimon Evolves To), if built. */
export const WIKIMON_EVOLUTIONS = (() => {
  try {
    const raw = readFileSync(path.join(HERE, '..', 'data', 'wikimon-evolutions.json'), 'utf8')
    const parsed = JSON.parse(raw)
    return parsed !== null && typeof parsed === 'object' && parsed.graph ? parsed.graph : null
  } catch {
    return null
  }
})()

/** Level key -> numeric stage index. */
export const LEVEL_ORDER = Object.freeze({
  baby1: 0,
  baby2: 1,
  child: 2,
  adult: 3,
  perfect: 4,
  ultimate: 5,
  armor: 3,
  hybrid: 3,
  'xros-wars': 2,
  unknown: 1,
})

/** Display labels. */
export const LEVEL_LABELS = Object.freeze({
  baby1: '幼年期 I',
  baby2: '幼年期 II',
  child: '成长期',
  adult: '成熟期',
  perfect: '完全体',
  ultimate: '究极体',
  armor: '装甲体',
  hybrid: '混合体',
  'xros-wars': 'Xros Wars',
  unknown: '未知',
})

/** Base combat stats by stage. Our own tuning, not official game data. */
const STAGE_BASE = Object.freeze({
  baby1: 8,
  baby2: 16,
  child: 30,
  adult: 58,
  perfect: 112,
  ultimate: 210,
  armor: 50,
  hybrid: 50,
  'xros-wars': 36,
  unknown: 18,
})

/** Type/attribute tendencies, derived from official type and attribute text. */
const ATTRIBUTE_MOD = {
  vaccine: { hp: 1.1, mp: 1.0, atk: 1.0, def: 1.1, spd: 1.0, wis: 1.02 },
  data: { hp: 1.0, mp: 1.08, atk: 1.0, def: 1.0, spd: 1.0, wis: 1.1 },
  virus: { hp: 1.0, mp: 1.0, atk: 1.12, def: 0.95, spd: 1.06, wis: 0.95 },
  free: { hp: 1.04, mp: 1.04, atk: 1.04, def: 1.04, spd: 1.04, wis: 1.04 },
  variable: { hp: 1.02, mp: 1.02, atk: 1.02, def: 1.02, spd: 1.02, wis: 1.02 },
  unknown: { hp: 1, mp: 1, atk: 1, def: 1, spd: 1, wis: 1 },
}

const TYPE_MOD = {
  dragon: { atk: 1.2, hp: 1.08 },
  dinosaur: { atk: 1.18, hp: 1.1 },
  reptile: { atk: 1.08, hp: 1.06 },
  beast: { atk: 1.08, hp: 1.12 },
  'machine': { def: 1.2, hp: 1.06 },
  cyborg: { def: 1.18, atk: 1.06 },
  aquatic: { hp: 1.15, mp: 1.16, spd: 0.95 },
  plant: { wis: 1.15, hp: 1.04 },
  bird: { spd: 1.2, atk: 1.06 },
  holy: { wis: 1.18, def: 1.08 },
  dark: { atk: 1.16, wis: 1.06 },
  insect: { spd: 1.12, def: 1.08 },
}

/** Normalize one raw species record from the data pack. */
export function normalizeSpecies(species) {
  const level = String(species.level ?? '').toLowerCase().replace(/\s+/g, '-')
  const attribute = String(species.attribute ?? '').toLowerCase().replace(/\s+/g, '-')
  const moves = Array.isArray(species.moves) ? species.moves.filter((move) => typeof move === 'string' && move.trim() !== '') : []
  return {
    ...species,
    level: Object.prototype.hasOwnProperty.call(LEVEL_ORDER, level) ? level : 'unknown',
    attribute: Object.prototype.hasOwnProperty.call(ATTRIBUTE_MOD, attribute) ? attribute : 'unknown',
    moves: moves.length > 0 ? moves.slice(0, 4) : ['Data Bite'],
    evolvesTo: Array.isArray(species.evolvesTo) ? species.evolvesTo.filter((id) => typeof id === 'string') : [],
    type: typeof species.type === 'string' ? species.type : 'Unknown',
  }
}

// Normalize once, then keep only species that currently have a real pixel
// sprite. No-art species are hidden until their art is added; evolution links
// are pruned to the same set so nothing can evolve into a hidden species.
export const SPECIES = SPECIES_LIST
  .map(normalizeSpecies)
  .filter((species) => AVAILABLE_SPECIES.has(species.id))
  .map((species) => {
    const wikiEntry = WIKIMON_EVOLUTIONS?.[species.id]
    const source = wikiEntry !== undefined && Array.isArray(wikiEntry.to) ? wikiEntry.to : species.evolvesTo
    const seen = new Set()
    const evolvesTo = []
    for (const id of source) {
      if (!AVAILABLE_SPECIES.has(id) || seen.has(id)) continue
      seen.add(id)
      evolvesTo.push(id)
    }
    return { ...species, zh: ZH_NAMES[species.id] || species.zh, evolvesTo }
  })
export const SPECIES_MAP = new Map(SPECIES.map((species) => [species.id, species]))
export const SPECIES_BY_ID = SPECIES_MAP
export const SPECIES_BY_NAME = new Map(SPECIES.map((species) => [species.name.toLowerCase(), species]))

/** @returns a species record by id, or undefined. */
export function getSpecies(id) {
  return SPECIES_MAP.get(id)
}

/** @returns the stage index for a species or instance. */
export function stageIndex(level) {
  return LEVEL_ORDER[level] ?? 1
}

/** @returns a readable label for a level key. */
export function levelLabel(level) {
  return LEVEL_LABELS[level] ?? '未知'
}

/** All species grouped by level key. */
export const SPECIES_BY_LEVEL = SPECIES.reduce((groups, species) => {
  if (!groups[species.level]) groups[species.level] = []
  groups[species.level].push(species)
  return groups
}, {})

/** Reverse evolution map (target id -> [source ids]). */
export const EVOLVED_FROM = new Map()
for (const species of SPECIES) {
  for (const target of species.evolvesTo) {
    if (!SPECIES_MAP.has(target)) continue
    if (!EVOLVED_FROM.has(target)) EVOLVED_FROM.set(target, [])
    const sourceList = EVOLVED_FROM.get(target)
    if (!sourceList.includes(species.id)) sourceList.push(species.id)
  }
}

/** @returns a species's actual evolution targets, filtered to real species. */
export function evolutionTargets(speciesId) {
  const species = SPECIES_MAP.get(speciesId)
  if (species === undefined) return []
  return species.evolvesTo.map((id) => SPECIES_MAP.get(id)).filter(Boolean)
}

/** @returns true when `fromId` can reach a species at or above `minStage` within `maxDepth` steps. */
export function canReachStage(fromId, minStage, maxDepth = 6) {
  const queue = [{ id: fromId, depth: 0 }]
  const seen = new Set([fromId])
  while (queue.length > 0) {
    const current = queue.shift()
    const species = SPECIES_MAP.get(current.id)
    if (species !== undefined && stageIndex(species.level) >= minStage && current.id !== fromId) return true
    if (current.depth >= maxDepth) continue
    for (const target of species?.evolvesTo ?? []) {
      if (seen.has(target)) continue
      seen.add(target)
      queue.push({ id: target, depth: current.depth + 1 })
    }
  }
  return false
}

/** @returns the base (lowest-stage) species in a lineage, if one exists. */
export function findBaseForm(speciesId) {
  const queue = [{ id: speciesId, depth: 0 }]
  const seen = new Set([speciesId])
  const candidates = []
  while (queue.length > 0) {
    const current = queue.shift()
    const species = SPECIES_MAP.get(current.id)
    if (species === undefined) continue
    if (species.level === 'baby1' || species.level === 'baby2') candidates.push({ species, depth: current.depth })
    if (current.depth >= 7) continue
    for (const source of EVOLVED_FROM.get(current.id) ?? []) {
      if (seen.has(source)) continue
      seen.add(source)
      queue.push({ id: source, depth: current.depth + 1 })
    }
  }
  candidates.sort((a, b) => stageIndex(a.species.level) - stageIndex(b.species.level) || a.depth - b.depth)
  return candidates[0]?.species
}

/** A curated fallback used if the generated graph is unexpectedly thin. */
const FALLBACK_STARTERS = ['botamon', 'poyomon', 'punimon', 'yuramon']

/** @returns the pool of Baby I species with a full growth path. */
export function starterPool() {
  const baby1 = SPECIES.filter((species) => species.level === 'baby1')
  const complete = baby1.filter((species) => canReachStage(species.id, 3, 7) && canReachStage(species.id, 4, 8))
  if (complete.length >= 3) return complete
  const shorter = baby1.filter((species) => canReachStage(species.id, 2, 6))
  if (shorter.length >= 3) return shorter
  const fallback = FALLBACK_STARTERS.map((id) => SPECIES_MAP.get(id)).filter(Boolean)
  if (fallback.length > 0) return fallback
  return SPECIES.filter((species) => species.level === 'child')
}

/** All species with a given level. */
export function speciesAtLevel(level) {
  return SPECIES_BY_LEVEL[level] ?? []
}

/** Our original island regions. Positions are in the 480×360 map coordinate space. */
export const REGIONS = Object.freeze([
  {
    id: 'file-city',
    name: 'File City',
    zh: '文件城',
    x: 240,
    y: 178,
    color: '#f2c14e',
    safe: true,
    wildStages: [],
    eggStages: [],
    typeBias: [],
    attributeBias: [],
    unlockSync: 0,
    description: '巨树与旧终端塔围绕的中央据点，File City 的心脏。',
  },
  {
    id: 'green-gym',
    name: 'Green Gym',
    zh: '苍苔训练场',
    x: 154,
    y: 205,
    color: '#65c18c',
    safe: false,
    wildStages: ['baby2', 'child'],
    eggStages: ['baby1'],
    typeBias: ['Plant', 'Beast', 'Insect'],
    attributeBias: ['data', 'vaccine'],
    unlockSync: 0,
    description: '苔藓森林中的六座训练石碑，回荡着拳击木桩的声音。',
  },
  {
    id: 'native-forest',
    name: 'Native Forest',
    zh: '原初森林',
    x: 242,
    y: 252,
    color: '#3d9b6d',
    safe: false,
    wildStages: ['baby1', 'baby2', 'child'],
    eggStages: ['baby1'],
    typeBias: ['Plant', 'Insect', 'Beast'],
    attributeBias: ['data', 'free'],
    unlockSync: 0,
    description: '发光孢子与古树覆盖的初始探索区域。',
  },
  {
    id: 'gear-savanna',
    name: 'Gear Savanna',
    zh: '齿轮荒原',
    x: 332,
    y: 188,
    color: '#c99a4a',
    safe: false,
    wildStages: ['child', 'adult'],
    eggStages: ['baby1'],
    typeBias: ['Machine', 'Dragon', 'Cyborg'],
    attributeBias: ['virus', 'data'],
    unlockSync: 0,
    description: '风车与废弃齿轮构成的锈色草原，旧时代的能量仍在流动。',
  },
  {
    id: 'amber-coast',
    name: 'Amber Coast',
    zh: '琥珀海岸',
    x: 312,
    y: 278,
    color: '#e0a354',
    safe: false,
    wildStages: ['baby2', 'child'],
    eggStages: ['baby1'],
    typeBias: ['Aquatic', 'Bird'],
    attributeBias: ['free', 'data'],
    unlockSync: 0,
    description: '琥珀色沙滩与潮汐洞窟，海风里带着数据盐的味道。',
  },
  {
    id: 'frost-ridge',
    name: 'Frost Ridge',
    zh: '霜脊高地',
    x: 242,
    y: 92,
    color: '#9ed8ef',
    safe: false,
    wildStages: ['child', 'adult'],
    eggStages: ['baby1'],
    typeBias: ['Beast', 'Machine', 'Aquatic'],
    attributeBias: ['data', 'vaccine'],
    unlockSync: 15,
    description: '雪原、冰洞和冒着热气的温泉，冷得让数据都变慢。',
  },
  {
    id: 'cloudmire',
    name: 'Cloudmire',
    zh: '云泽湿地',
    x: 146,
    y: 112,
    color: '#7faecf',
    safe: false,
    wildStages: ['child', 'adult'],
    eggStages: ['baby1'],
    typeBias: ['Bird', 'Aquatic', 'Plant'],
    attributeBias: ['free', 'data'],
    unlockSync: 25,
    description: '漂浮的水洼和低云，稀有鸟系与水系数码兽在这里筑巢。',
  },
  {
    id: 'factorial-ruins',
    name: 'Factorial Ruins',
    zh: '机械废都',
    x: 352,
    y: 96,
    color: '#8a8f9a',
    safe: false,
    wildStages: ['adult', 'perfect'],
    eggStages: ['baby1'],
    typeBias: ['Machine', 'Cyborg'],
    attributeBias: ['virus', 'data'],
    unlockSync: 40,
    description: '废弃工厂与数据电缆，机械系数码兽的旧圣地。',
  },
  {
    id: 'dragonbone-caldera',
    name: 'Dragonbone Caldera',
    zh: '龙骸火山',
    x: 176,
    y: 306,
    color: '#b65d47',
    safe: false,
    wildStages: ['adult', 'perfect'],
    eggStages: ['baby1'],
    typeBias: ['Dragon', 'Dinosaur', 'Dark'],
    attributeBias: ['virus', 'free'],
    unlockSync: 60,
    description: '龙骨与黑曜石构成的火山口，龙系与病毒种的终盘猎场。',
  },
])

export const REGION_MAP = new Map(REGIONS.map((region) => [region.id, region]))

/** @returns whether a region is unlocked by city sync. */
export function regionUnlocked(region, sync) {
  return sync >= region.unlockSync
}

/** @returns a printable attribute label. */
export function attributeLabel(attribute) {
  const labels = { vaccine: '疫苗', data: '数据', virus: '病毒', free: '自由', variable: '可变', unknown: '未知' }
  return labels[attribute] ?? '未知'
}

/** @returns the stage base used for stat derivation. */
export function stageBase(level) {
  return STAGE_BASE[level] ?? 16
}

/** Apply attribute + type tendency multipliers to a base stat block. */
export function tendencyFor(species) {
  const attr = ATTRIBUTE_MOD[species.attribute] ?? ATTRIBUTE_MOD.unknown
  const typeKey = String(species.type ?? '').toLowerCase()
  const type = TYPE_MOD[typeKey] ?? {}
  const result = { hp: 1, mp: 1, atk: 1, def: 1, spd: 1, wis: 1 }
  for (const key of Object.keys(result)) {
    result[key] = (attr[key] ?? 1) * (type[key] ?? 1)
  }
  return result
}

export { CATALOG as DIGIMON_CATALOG }
