/**
 * Browser half of `dsh-plugin-digital-world` v0.4.
 *
 * A fixed 1280×720 pixel stage:
 * - left: a hand-drawn pixel File Island map (960×720)
 * - right: active Digimon, care stats, party, action buttons (320×720)
 * - overlays: DigiNest, Dex, eggs, training, evolution, city, battle, log
 *
 * The browser talks to the same `/api/digital-world` route as the
 * `digital_world` tool. No Harness Client package is imported.
 *
 * Shipped prebuilt in the DSH lazy-CJS bundle format.
 */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-digital-world',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const h = React.createElement

    const NS = 'digital-world'
    const PANEL_ID = 'digital-world'
    const API = '/api/digital-world'
    const REFRESH_MS = 4000

    const ZH = {
      panel: '数码世界',
      kicker: 'DIGITAL WORLD',
      title: '文件岛',
      subtitle: '随机孵化 · 多数码兽 · 数据吸收',
      day: '第 {day} 天',
      time: '{hour}:00',
      season: '{season}',
      weather: '{weather}',
      data: '图鉴 {count}',
      sync: '岛同步率 {sync}%',
      noActive: '还没有出战的数码兽',
      noActiveHint: '孵化一颗数码蛋，开始你们的故事。',
      eggs: '蛋',
      hatch: '孵化',
      status: '状态',
      region: '区域',
      explore: '探索',
      battle: '战斗',
      train: '训练',
      feed: '喂食',
      clean: '清理',
      pet: '摸摸',
      sleep: '睡觉',
      heal: '治疗',
      evolve: '进化',
      nest: '数码巢',
      dex: '图鉴',
      city: '城市',
      expedition: '远征',
      infuse: '数据融合',
      log: '日志',
      rename: '改名',
      close: '关闭',
      back: '返回',
      busy: '处理中…',
      party: '出战队伍',
      capacity: '容量 {used}/{max}',
      level: 'Lv.{level}',
      stage: '阶段',
      bond: '羁绊',
      hp: 'HP',
      mp: 'MP',
      fullness: '饱食',
      cleanliness: '清洁',
      mood: '心情',
      energy: '体力',
      sleepValue: '睡眠',
      atk: '攻击',
      def: '防御',
      spd: '敏捷',
      wis: '智慧',
      bits: '比特',
      food: '食物',
      medicine: '药品',
      programs: '重构程序',
      cores: '数据核心',
      fragments: '数据碎片',
      trainTitle: '训练石碑',
      trainHint: '每次训练消耗 1 游戏小时。',
      hpTrain: '生命',
      mpTrain: '魔力',
      atkTrain: '攻击',
      defTrain: '防御',
      spdTrain: '敏捷',
      wisTrain: '智慧',
      nestTitle: '数码巢',
      nestHint: '存放在巢穴中的数码兽不会掉状态，可以随时更换出战。',
      current: '出战中',
      setActive: '出战',
      dexTitle: '数码图鉴',
      dexSearch: '搜索名字、类型或属性…',
      dexTotal: '共 {count} 条',
      dexEmpty: '没有找到匹配的数码兽。',
      eggTitle: '孵化器',
      eggEmpty: '孵化器里没有蛋。',
      eggReady: '可以孵化',
      eggRemaining: '还需 {hours} 个游戏小时',
      eggSignature: '数据波形：{attribute} / {type}',
      cityTitle: 'File City',
      cityHint: '消耗数据核心升级设施，提高岛同步率。',
      restore: '升级',
      maxed: '已满级',
      nextUnlock: '下一区域：{name}（{sync}%）',
      noUnlock: '所有区域都已解锁',
      evolutionTitle: '进化祭坛',
      evolutionHint: '只显示 Wikimon 记录的真实进化路线。',
      evolutionEmpty: '当前没有可预览的进化路线。',
      eligible: '可以进化',
      missing: '条件不足',
      requirements: 'Lv.{level} · 能力 {power}',
      battleTitle: '数据战斗',
      enemy: '野生',
      autoBattle: '自动战斗',
      attack: '攻击',
      skill: '必杀',
      scan: '扫描',
      defend: '防御',
      flee: '逃跑',
      won: '胜利！',
      lost: '战斗失败',
      absorb: '吸收数据',
      rebuild: '重构收服',
      battleLog: '战斗记录',
      reward: '战后选择：吸收数据或消耗重构程序收服为蛋。',
      expeditionDone: '远征完成',
      logTitle: '世界日志',
      renameTitle: '给数码兽改名',
      renamePlaceholder: '1-12 个字符',
      confirm: '确定',
      cancel: '取消',
      loading: '读取世界中…',
      loadFailed: '读取世界失败',
      retry: '重试',
      error: '错误',
      locked: '未解锁',
      regionLocked: '{name} 需要岛同步率 {sync}%',
      catalog: 'Wikimon 快照：{count} 条',
      battleVs: '{name} Lv.{level}',
      fragmentsHint: '疫苗 {vaccine} · 数据 {data} · 病毒 {virus} · 自由 {free}',
      links: '数据链接',
      noLinks: '暂无数据链接',
      sceneView: '场景',
      mapView: '地图',
      eventDataStorm: '数据风暴',
      eventNone: '平静',
      actionDone: '完成',
    }

    const EN = {
      panel: 'Digital World',
      kicker: 'DIGITAL WORLD',
      title: 'File Island',
      subtitle: 'Random eggs · Many partners · Data absorption',
      day: 'Day {day}',
      time: '{hour}:00',
      season: '{season}',
      weather: '{weather}',
      data: 'Dex {count}',
      sync: 'Island sync {sync}%',
      noActive: 'No active Digimon',
      noActiveHint: 'Hatch an egg to begin your story.',
      eggs: 'Eggs',
      hatch: 'Hatch',
      status: 'Status',
      region: 'Region',
      explore: 'Explore',
      battle: 'Battle',
      train: 'Train',
      feed: 'Feed',
      clean: 'Clean',
      pet: 'Pet',
      sleep: 'Sleep',
      heal: 'Heal',
      evolve: 'Evolve',
      nest: 'DigiNest',
      dex: 'Dex',
      city: 'City',
      expedition: 'Expedition',
      infuse: 'Infuse',
      log: 'Log',
      rename: 'Rename',
      close: 'Close',
      back: 'Back',
      busy: 'Working…',
      party: 'Party',
      capacity: '{used}/{max} slots',
      level: 'Lv.{level}',
      stage: 'Stage',
      bond: 'Bond',
      hp: 'HP',
      mp: 'MP',
      fullness: 'Fullness',
      cleanliness: 'Clean',
      mood: 'Mood',
      energy: 'Energy',
      sleepValue: 'Sleep',
      atk: 'ATK',
      def: 'DEF',
      spd: 'SPD',
      wis: 'WIS',
      bits: 'Bits',
      food: 'Food',
      medicine: 'Medicine',
      programs: 'Rebuild programs',
      cores: 'Data cores',
      fragments: 'Fragments',
      trainTitle: 'Training Stones',
      trainHint: 'One session costs one game hour.',
      hpTrain: 'HP',
      mpTrain: 'MP',
      atkTrain: 'ATK',
      defTrain: 'DEF',
      spdTrain: 'SPD',
      wisTrain: 'WIS',
      nestTitle: 'DigiNest',
      nestHint: 'Stored Digimon do not lose care stats. Swap the active one anytime.',
      current: 'Active',
      setActive: 'Set active',
      dexTitle: 'Digimon Dex',
      dexSearch: 'Search name, type, or attribute…',
      dexTotal: '{count} entries',
      dexEmpty: 'No matching Digimon.',
      eggTitle: 'Incubator',
      eggEmpty: 'No eggs in the incubator.',
      eggReady: 'Ready to hatch',
      eggRemaining: '{hours} game hours remaining',
      eggSignature: 'Data wave: {attribute} / {type}',
      cityTitle: 'File City',
      cityHint: 'Spend data cores to upgrade facilities and raise island sync.',
      restore: 'Upgrade',
      maxed: 'Max level',
      nextUnlock: 'Next region: {name} ({sync}%)',
      noUnlock: 'All regions unlocked',
      evolutionTitle: 'Evolution Altar',
      evolutionHint: 'Only real Wikimon evolution links are shown.',
      evolutionEmpty: 'No evolution preview available.',
      eligible: 'Eligible',
      missing: 'Missing requirements',
      requirements: 'Lv.{level} · Power {power}',
      battleTitle: 'Data Battle',
      enemy: 'Wild',
      autoBattle: 'Auto battle',
      attack: 'Attack',
      skill: 'Skill',
      scan: 'Scan',
      defend: 'Defend',
      flee: 'Flee',
      won: 'Victory!',
      lost: 'Defeat',
      absorb: 'Absorb data',
      rebuild: 'Rebuild as egg',
      battleLog: 'Battle log',
      reward: 'Choose: absorb the data, or spend a rebuild program to reconstruct an egg.',
      expeditionDone: 'Expedition complete',
      logTitle: 'World Log',
      renameTitle: 'Rename Digimon',
      renamePlaceholder: '1-12 characters',
      confirm: 'Confirm',
      cancel: 'Cancel',
      loading: 'Reading the world…',
      loadFailed: 'Could not read the world',
      retry: 'Retry',
      error: 'Error',
      locked: 'Locked',
      regionLocked: '{name} needs island sync {sync}%',
      catalog: 'Wikimon snapshot: {count} entries',
      battleVs: '{name} Lv.{level}',
      fragmentsHint: 'Vaccine {vaccine} · Data {data} · Virus {virus} · Free {free}',
      links: 'Data links',
      noLinks: 'No data links',
      sceneView: 'Scene',
      mapView: 'Map',
      eventDataStorm: 'Data storm',
      eventNone: 'Calm',
      actionDone: 'Done',
    }

    const CSS = `
      .dw-root { width:100%; height:100%; min-height:720px; overflow:hidden; background:#040a12; color:#d9f5ff; font-family:"Microsoft YaHei","Segoe UI",sans-serif; }
      .dw-root *, .dw-root *::before, .dw-root *::after { box-sizing:border-box; }
      .dw-scale-wrap { position:relative; width:100%; height:100%; min-height:720px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#040a12; }
      .dw-stage { position:relative; width:1280px; height:720px; flex:none; display:flex; background:#07111f; box-shadow:0 0 0 2px #203e58, 0 24px 80px rgba(0,0,0,.7); transform-origin:center center; }
      .dw-map-pane { position:relative; width:960px; height:720px; overflow:hidden; background:#071a2a; }
      .dw-map-canvas { display:block; width:960px; height:720px; image-rendering:pixelated; cursor:crosshair; }
      .dw-scene-canvas { display:block; width:960px; height:720px; image-rendering:pixelated; }
      .dw-view-toggle { display:flex; gap:5px; margin-top:7px; pointer-events:auto; }
      .dw-view-btn { border:1px solid #2d566d; background:rgba(5,18,30,.78); color:#8eb9ca; font:inherit; font-size:10px; padding:5px 9px; cursor:pointer; }
      .dw-view-btn.active { border-color:#f2c14e; color:#f2c14e; background:rgba(55,42,13,.7); }
      .dw-map-top { position:absolute; top:0; left:0; right:0; padding:16px 20px 28px; display:flex; justify-content:space-between; align-items:flex-start; pointer-events:none; background:linear-gradient(180deg,rgba(2,7,15,.9),rgba(2,7,15,0)); }
      .dw-brand { font-size:11px; letter-spacing:.28em; color:#f2c14e; font-weight:700; }
      .dw-map-title { margin-top:5px; font-size:22px; line-height:1.1; letter-spacing:.06em; color:#f6fbff; text-shadow:0 2px 0 #030b13; }
      .dw-map-sub { margin-top:4px; font-size:11px; color:#8db8ca; }
      .dw-top-right { text-align:right; display:flex; flex-direction:column; gap:4px; align-items:flex-end; }
      .dw-chip { display:inline-block; padding:4px 7px; border:1px solid #2a536b; background:rgba(6,20,33,.78); font-size:10px; color:#a9d8e9; letter-spacing:.05em; }
      .dw-chip.gold { border-color:#8d7438; color:#f2c14e; }
      .dw-map-bottom { position:absolute; left:16px; right:16px; bottom:14px; display:flex; gap:10px; align-items:stretch; pointer-events:none; }
      .dw-region-card { flex:1; min-width:0; padding:11px 13px; border:2px solid #24455d; background:rgba(5,17,28,.82); box-shadow:inset 0 0 0 2px #07111d; }
      .dw-region-name { font-size:14px; color:#e8fbff; font-weight:700; }
      .dw-region-desc { margin-top:4px; color:#83afc0; font-size:11px; line-height:1.5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .dw-ticker { width:300px; padding:11px 13px; border:2px solid #24455d; background:rgba(5,17,28,.82); box-shadow:inset 0 0 0 2px #07111d; font-size:10px; line-height:1.55; color:#a8d6e5; overflow:hidden; }
      .dw-hud { width:320px; height:720px; flex:none; display:flex; flex-direction:column; gap:10px; padding:14px; background:linear-gradient(180deg,#0b1a2b 0%,#07111e 100%); border-left:2px solid #294a62; overflow:auto; scrollbar-width:none; }
      .dw-hud::-webkit-scrollbar { display:none; }
      .dw-hud-head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
      .dw-hud-title { font-size:13px; letter-spacing:.18em; color:#f2c14e; font-weight:700; }
      .dw-hud-sub { margin-top:5px; color:#7299aa; font-size:11px; line-height:1.4; }
      .dw-hud-stats { text-align:right; color:#86b8c9; font-size:11px; line-height:1.7; }
      .dw-panel { border:2px solid #25465e; background:#091728; box-shadow:inset 0 0 0 2px #06101c; padding:10px; }
      .dw-active { display:flex; gap:10px; align-items:center; }
      .dw-portrait { width:92px; height:92px; flex:none; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at 50% 45%,#173c55 0%,#081522 72%); border:1px solid #2c566e; }
      .dw-active-body { min-width:0; flex:1; }
      .dw-name { font-size:20px; line-height:1.15; color:#f4fcff; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .dw-species { margin-top:3px; color:#8fbccc; font-size:11px; line-height:1.4; }
      .dw-stage-pill { display:inline-block; margin-top:5px; padding:3px 6px; border:1px solid #39627a; color:#8fe6bc; font-size:10px; }
      .dw-level { margin-top:6px; font-size:12px; color:#f2c14e; font-variant-numeric:tabular-nums; }
      .dw-bars { margin-top:10px; display:flex; flex-direction:column; gap:6px; }
      .dw-bar-head { display:flex; justify-content:space-between; gap:8px; font-size:10px; color:#88afc0; margin-bottom:3px; }
      .dw-bar-head strong { color:#d8f5ff; font-weight:500; font-variant-numeric:tabular-nums; }
      .dw-bar-track { height:7px; background:#142b3c; border:1px solid #203b4d; overflow:hidden; }
      .dw-bar-fill { height:100%; transition:width .25s ease; }
      .dw-care-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px 8px; margin-top:9px; }
      .dw-care-item { display:flex; justify-content:space-between; gap:4px; font-size:10px; color:#7fa5b5; }
      .dw-care-item strong { color:#ccebf4; font-weight:500; font-variant-numeric:tabular-nums; }
      .dw-mini-actions { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:6px; }
      .dw-btn { appearance:none; border:1px solid #355a70; background:#0e2232; color:#cceef8; padding:8px 5px; font:inherit; font-size:11px; font-weight:600; cursor:pointer; line-height:1.2; transition:background .12s,border-color .12s,color .12s; }
      .dw-btn:hover:not(:disabled) { border-color:#f2c14e; color:#f2c14e; background:#132c3d; }
      .dw-btn:disabled { opacity:.42; cursor:default; }
      .dw-btn.primary { background:#9b7427; border-color:#f2c14e; color:#fff7d7; }
      .dw-btn.primary:hover:not(:disabled) { background:#b4882e; color:#fff; }
      .dw-btn.danger { border-color:#79464a; color:#ffb1a8; }
      .dw-section-title { font-size:11px; letter-spacing:.12em; color:#6e9bad; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
      .dw-party { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:6px; }
      .dw-party-slot { min-height:58px; border:1px dashed #2b4a5d; background:#091523; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; cursor:pointer; }
      .dw-party-slot.filled { border-style:solid; border-color:#3f6c80; }
      .dw-party-slot.active { border-color:#f2c14e; box-shadow:inset 0 0 0 1px #f2c14e; }
      .dw-party-name { max-width:88px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:9px; color:#9fc8d7; }
      .dw-menu { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:6px; }
      .dw-menu .dw-btn { padding:7px 4px; background:#0a1926; font-weight:500; font-size:10px; color:#98c2d2; }
      .dw-region-line { display:flex; justify-content:space-between; gap:6px; font-size:10px; color:#8eb9c9; margin-bottom:5px; }
      .dw-region-line strong { color:#e4f9ff; font-weight:600; }
      .dw-explore { width:100%; margin-top:4px; padding:9px; }
      .dw-link { font-size:9px; color:#7ecfa9; margin-top:4px; }
      .dw-overlay { position:absolute; inset:0; z-index:20; background:rgba(2,7,14,.78); display:flex; align-items:center; justify-content:center; }
      .dw-modal { width:760px; max-width:calc(100% - 60px); max-height:640px; overflow:auto; border:2px solid #43667b; background:#0a1827; box-shadow:inset 0 0 0 2px #06101b, 0 12px 60px rgba(0,0,0,.6); padding:16px; }
      .dw-modal.narrow { width:520px; }
      .dw-modal-head { display:flex; justify-content:space-between; align-items:center; gap:12px; padding-bottom:10px; margin-bottom:12px; border-bottom:1px solid #27485b; }
      .dw-modal-title { font-size:16px; color:#f2c14e; letter-spacing:.08em; }
      .dw-modal-sub { color:#789fae; font-size:10px; margin-top:3px; }
      .dw-modal-close { appearance:none; border:1px solid #3b5e70; background:#0d2030; color:#b9e7f5; padding:5px 9px; font:inherit; font-size:10px; cursor:pointer; }
      .dw-modal-close:hover { border-color:#f2c14e; color:#f2c14e; }
      .dw-grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
      .dw-grid-3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
      .dw-card-row { border:1px solid #27495e; background:#0c1c2b; padding:9px; display:flex; gap:9px; align-items:center; min-width:0; }
      .dw-card-row.current { border-color:#f2c14e; box-shadow:inset 0 0 0 1px rgba(242,193,78,.35); }
      .dw-card-body { min-width:0; flex:1; }
      .dw-card-name { font-size:12px; color:#e7faff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .dw-card-meta { margin-top:3px; color:#7ca6b6; font-size:9px; line-height:1.4; }
      .dw-card-btn { appearance:none; border:1px solid #3e6173; background:#102737; color:#b9eaf6; font:inherit; font-size:9px; padding:5px 7px; cursor:pointer; white-space:nowrap; }
      .dw-card-btn:hover { border-color:#f2c14e; color:#f2c14e; }
      .dw-search { width:100%; padding:9px 10px; border:1px solid #35586d; background:#06111d; color:#d9f5ff; font:inherit; font-size:11px; outline:none; margin-bottom:9px; }
      .dw-search:focus { border-color:#f2c14e; }
      .dw-dex-item { border:1px solid #25475a; background:#0b1b2a; padding:8px; min-width:0; }
      .dw-dex-name { font-size:11px; color:#e4f8ff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .dw-dex-meta { margin-top:3px; font-size:9px; color:#7ca5b5; line-height:1.35; }
      .dw-pager { display:flex; gap:7px; justify-content:flex-end; align-items:center; margin-top:10px; font-size:9px; color:#86afbe; }
      .dw-egg-card { border:1px solid #2d5064; background:#0b1b2a; padding:10px; display:flex; gap:10px; align-items:center; }
      .dw-egg-art { width:56px; height:56px; flex:none; display:flex; align-items:center; justify-content:center; background:#081521; border:1px solid #284b60; }
      .dw-egg-body { flex:1; min-width:0; }
      .dw-egg-title { font-size:12px; color:#e8fbff; }
      .dw-egg-meta { font-size:9px; color:#7fa8b8; margin-top:3px; line-height:1.5; }
      .dw-progress { height:6px; background:#142b3c; border:1px solid #203b4d; margin-top:6px; }
      .dw-progress-fill { height:100%; background:#68d9a2; }
      .dw-city-row { display:flex; gap:8px; align-items:center; padding:7px 0; border-bottom:1px solid #1d3b4d; }
      .dw-city-row:last-child { border-bottom:none; }
      .dw-city-name { flex:1; font-size:11px; color:#d7f4ff; }
      .dw-city-lv { width:52px; color:#8fb9c8; font-size:10px; }
      .dw-city-row .dw-card-btn { flex:none; }
      .dw-evo-row { border:1px solid #2b4d61; background:#0b1b2a; padding:9px; margin-bottom:7px; }
      .dw-evo-top { display:flex; justify-content:space-between; gap:8px; align-items:center; }
      .dw-evo-name { font-size:12px; color:#e7faff; }
      .dw-evo-ok { color:#6fe0a1; font-size:9px; }
      .dw-evo-no { color:#f3a285; font-size:9px; }
      .dw-evo-missing { margin-top:4px; color:#c58a7d; font-size:9px; line-height:1.5; }
      .dw-battle { width:960px; max-width:calc(100% - 40px); border:2px solid #5a5d7c; background:linear-gradient(180deg,#10172d,#08111f); padding:18px; box-shadow:inset 0 0 0 2px #050b13, 0 14px 70px rgba(0,0,0,.7); }
      .dw-battle-top { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:6px 10px 16px; }
      .dw-battle-side { width:210px; text-align:center; }
      .dw-battle-name { font-size:14px; color:#eafaff; margin-top:5px; }
      .dw-battle-meta { font-size:9px; color:#8db3c2; margin-top:3px; }
      .dw-battle-log { max-height:170px; overflow:auto; padding:10px 12px; background:#06111c; border:1px solid #25465a; font-size:10px; line-height:1.7; color:#a9d5e3; }
      .dw-battle-actions { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; margin-top:12px; }
      .dw-battle-actions .dw-btn { padding:10px 6px; }
      .dw-battle-reward { border:1px solid #9a7730; background:#1b1b17; color:#f7d98c; padding:9px; font-size:10px; line-height:1.5; margin-top:10px; }
      .dw-toast { position:absolute; z-index:30; left:50%; top:16px; transform:translateX(-50%); max-width:720px; padding:9px 14px; border:1px solid #4b7587; background:rgba(7,20,31,.96); color:#d6f5ff; font-size:11px; line-height:1.5; box-shadow:0 6px 30px rgba(0,0,0,.4); pointer-events:none; }
      .dw-toast.error { border-color:#8c4e4b; color:#ffc1b2; }
      .dw-loading { height:720px; display:flex; align-items:center; justify-content:center; color:#9ec8d8; font-size:13px; letter-spacing:.08em; }
      .dw-error { height:720px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:#ffc1b2; font-size:12px; }
      .dw-empty { padding:20px; text-align:center; color:#779eae; font-size:11px; }
      .dw-key { color:#f2c14e; }
    `

    /** @returns a printable message. */
    function messageOf(error) {
      if (error !== null && typeof error === 'object' && typeof error.message === 'string' && error.message !== '') return error.message
      return String(error)
    }

    /** Page-owned stylesheet fallback (also inserted through styles in apply). */
    const styleTag = () => h('style', { key: 'digital-world-style' }, CSS)

    /** Translate and interpolate. */
    function tr(t, key, values) {
      const source = typeof t === 'function' ? t(key) : ZH[key]
      let text = typeof source === 'string' && source !== '' ? source : ZH[key] ?? key
      if (values !== undefined && values !== null) {
        text = text.replace(/\{(\w+)\}/g, (match, name) => values[name] === undefined ? match : String(values[name]))
      }
      return text
    }

    /** Call the Host route. */
    async function api(method, body) {
      const response = await fetch(API, {
        method,
        headers: body === undefined ? {} : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
      })
      let payload
      try { payload = await response.json() } catch { payload = undefined }
      if (!response.ok || payload === undefined || payload.ok !== true) {
        throw new Error(payload !== undefined && typeof payload.error === 'string' ? payload.error : `HTTP ${response.status}`)
      }
      return payload
    }

    /** Query the Dex. */
    async function fetchDex(query, page) {
      const url = `${API}?dex=1&q=${encodeURIComponent(query)}&page=${page}&limit=24`
      const response = await fetch(url, { cache: 'no-store' })
      const payload = await response.json().catch(() => undefined)
      if (!response.ok || payload === undefined || payload.ok !== true) throw new Error(payload?.error ?? `HTTP ${response.status}`)
      return payload
    }

    /** Polling hook. */
    function useWorld() {
      const [state, setState] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [loading, setLoading] = React.useState(true)
      const mounted = React.useRef(true)
      const reload = React.useCallback(async (soft) => {
        if (soft !== true) setLoading(true)
        try {
          const payload = await api('GET')
          if (!mounted.current) return
          setState(payload.state)
          setError(null)
        } catch (failure) {
          if (mounted.current) setError(messageOf(failure))
        } finally {
          if (mounted.current) setLoading(false)
        }
      }, [])
      React.useEffect(() => {
        mounted.current = true
        void reload(true)
        const timer = setInterval(() => void reload(true), REFRESH_MS)
        return () => { mounted.current = false; clearInterval(timer) }
      }, [reload])
      return { state, error, loading, reload, setState }
    }

    /** Stable hash for procedural pixel art. */
    function hashString(value) {
      let hash = 2166136261
      for (let i = 0; i < String(value).length; i += 1) {
        hash ^= String(value).charCodeAt(i)
        hash = Math.imul(hash, 16777619)
      }
      return Math.abs(hash)
    }

    const PALETTES = {
      vaccine: { body: '#7ce7ff', shade: '#2aa7e8', accent: '#d4fbff', ink: '#08233a' },
      data: { body: '#8ce5af', shade: '#37b77c', accent: '#d9ffe9', ink: '#0b2c22' },
      virus: { body: '#ff9d7a', shade: '#e3554f', accent: '#ffe0cf', ink: '#3a1116' },
      free: { body: '#efd88f', shade: '#c39c45', accent: '#fff6cc', ink: '#332612' },
      variable: { body: '#d9b8ff', shade: '#9c72e8', accent: '#f7ecff', ink: '#281a44' },
      unknown: { body: '#c8c8d5', shade: '#8f8fa8', accent: '#f4f4ff', ink: '#232333' },
    }

    /** Draw a procedural pixel Digimon. */
    function PixelMonster({ speciesId, attribute, type, stage, size = 96, egg = false }) {
      const ref = React.useRef(null)
      React.useEffect(() => {
        const canvas = ref.current
        if (canvas === null) return
        const ctx = canvas.getContext('2d')
        if (ctx === null) return
        ctx.clearRect(0, 0, 64, 64)
        ctx.imageSmoothingEnabled = false
        const palette = PALETTES[attribute] ?? PALETTES.unknown
        const hash = hashString(`${speciesId}-${stage}-${type}`)
        const stageIndex = ['baby1', 'baby2', 'child', 'adult', 'perfect', 'ultimate'].indexOf(stage)
        const index = stageIndex >= 0 ? stageIndex : 0
        if (egg) {
          ctx.fillStyle = '#0b2030'
          ctx.fillRect(20, 56, 24, 3)
          ctx.fillStyle = palette.body
          ctx.beginPath()
          ctx.ellipse(32, 34, 16, 21, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = palette.accent
          ctx.globalAlpha = 0.7
          ctx.fillRect(22, 30, 20, 3)
          ctx.fillRect(25, 44, 14, 2)
          ctx.globalAlpha = 1
          ctx.fillStyle = palette.shade
          ctx.fillRect(20, 20, 3, 3)
          ctx.fillRect(40, 34, 3, 2)
          return
        }
        const bodyW = 18 + index * 5 + (hash % 5)
        const bodyH = 16 + index * 4
        const centerX = 32
        const bodyTop = 31 - Math.floor(index / 2)
        // shadow
        ctx.fillStyle = '#04101b'
        ctx.globalAlpha = 0.55
        ctx.fillRect(centerX - bodyW / 2, 58, bodyW, 3)
        ctx.globalAlpha = 1
        // tail / wings / extras
        ctx.fillStyle = palette.shade
        if (String(type).toLowerCase().includes('dragon') || String(type).toLowerCase().includes('dinosaur') || String(type).toLowerCase().includes('reptile')) {
          ctx.fillRect(centerX + bodyW / 2 - 2, 38, 6 + index * 2, 4)
          ctx.fillRect(centerX + bodyW / 2 + 2, 34, 4, 4)
        }
        if (index >= 2) {
          ctx.fillStyle = palette.accent
          ctx.globalAlpha = 0.55
          ctx.fillRect(6, 28, 10, 12)
          ctx.fillRect(48, 28, 10, 12)
          ctx.globalAlpha = 1
        }
        // feet
        ctx.fillStyle = palette.shade
        ctx.fillRect(centerX - bodyW / 2 + 3, 52, 8, 5)
        ctx.fillRect(centerX + bodyW / 2 - 11, 52, 8, 5)
        // body
        ctx.fillStyle = palette.body
        ctx.fillRect(centerX - bodyW / 2, bodyTop, bodyW, bodyH)
        ctx.fillStyle = palette.accent
        ctx.globalAlpha = 0.5
        ctx.fillRect(centerX - bodyW / 2 + 4, bodyTop + 4, bodyW - 8, 5)
        ctx.globalAlpha = 1
        // head
        ctx.fillStyle = palette.body
        ctx.fillRect(centerX - 12 - index, bodyTop - 17, 24 + index * 2, 20)
        // horns / ears
        ctx.fillStyle = palette.accent
        if (index >= 1) {
          ctx.fillRect(centerX - 14, bodyTop - 22, 4, 8)
          ctx.fillRect(centerX + 10, bodyTop - 22, 4, 8)
        }
        if (index >= 3) {
          ctx.fillStyle = palette.shade
          ctx.fillRect(centerX - 18, bodyTop - 17, 5, 5)
          ctx.fillRect(centerX + 13, bodyTop - 17, 5, 5)
        }
        // eyes
        ctx.fillStyle = palette.ink
        ctx.fillRect(centerX - 8, bodyTop - 11, 4, 5)
        ctx.fillRect(centerX + 4, bodyTop - 11, 4, 5)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(centerX - 7, bodyTop - 10, 1, 2)
        ctx.fillRect(centerX + 5, bodyTop - 10, 1, 2)
        // mouth
        ctx.fillStyle = palette.ink
        ctx.fillRect(centerX - 2, bodyTop - 3, 4, 2)
        // shine pixels
        ctx.fillStyle = palette.accent
        ctx.globalAlpha = 0.75
        ctx.fillRect(centerX - bodyW / 2 + 3, bodyTop + 10, 2, 2)
        ctx.fillRect(centerX + bodyW / 2 - 7, bodyTop + 3, 2, 2)
        ctx.globalAlpha = 1
      }, [speciesId, attribute, type, stage, egg])
      return h('canvas', { ref, width: 64, height: 64, style: { width: size, height: size, imageRendering: 'pixelated', display: 'block' } })
    }

    /** One compact bar. */
    function Bar({ label, value, max, color }) {
      const pct = typeof max === 'number' && max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0
      return h('div', null,
        h('div', { className: 'dw-bar-head' }, h('span', null, label), h('strong', null, `${Math.round(value)}/${Math.round(max)}`)),
        h('div', { className: 'dw-bar-track' }, h('div', { className: 'dw-bar-fill', style: { width: `${pct}%`, background: color } })),
      )
    }

    const MAP_LAND = [[116, 80], [174, 50], [250, 54], [322, 72], [380, 112], [394, 178], [380, 242], [336, 300], [270, 330], [196, 330], [126, 300], [76, 248], [62, 182], [78, 120]]

    /** The island map Canvas. */
    function IslandMap({ state, onRegion }) {
      const ref = React.useRef(null)
      React.useEffect(() => {
        const canvas = ref.current
        if (canvas === null) return
        const ctx = canvas.getContext('2d')
        if (ctx === null) return
        // Draw the 480×360 map into a 960×720 backing store. This keeps the
        // pixel-art silhouette but gives labels and icons twice the pixel
        // budget, so they stay readable at browser scale.
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, 960, 720)
        ctx.scale(2, 2)
        ctx.imageSmoothingEnabled = false
        // sea
        const sea = ctx.createLinearGradient(0, 0, 0, 360)
        sea.addColorStop(0, '#071b30')
        sea.addColorStop(0.55, '#0a2e45')
        sea.addColorStop(1, '#071a2a')
        ctx.fillStyle = sea
        ctx.fillRect(0, 0, 480, 360)
        // sea pixel glints
        ctx.fillStyle = 'rgba(104,205,239,0.18)'
        for (let i = 0; i < 60; i += 1) {
          const x = (i * 83 + 29) % 480
          const y = (i * 47 + 17) % 360
          ctx.fillRect(x, y, 4, 1)
        }
        // island shadow and land
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.beginPath()
        for (let i = 0; i < MAP_LAND.length; i += 1) {
          const [x, y] = MAP_LAND[i]
          if (i === 0) ctx.moveTo(x + 4, y + 5)
          else ctx.lineTo(x + 4, y + 5)
        }
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#123e38'
        ctx.beginPath()
        for (let i = 0; i < MAP_LAND.length; i += 1) {
          const [x, y] = MAP_LAND[i]
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#2c7460'
        ctx.lineWidth = 3
        ctx.stroke()
        // inner island patches
        ctx.fillStyle = 'rgba(74,168,108,0.22)'
        ctx.fillRect(150, 90, 110, 120)
        ctx.fillStyle = 'rgba(173,142,73,0.16)'
        ctx.fillRect(290, 110, 75, 85)
        ctx.fillStyle = 'rgba(90,171,210,0.17)'
        ctx.fillRect(110, 220, 100, 72)
        // roads from File City
        const city = state.regions.find((region) => region.id === 'file-city')
        if (city !== undefined) {
          ctx.strokeStyle = '#a58a50'
          ctx.lineWidth = 3
          ctx.setLineDash([4, 5])
          for (const region of state.regions) {
            if (region.id === 'file-city') continue
            ctx.beginPath()
            ctx.moveTo(city.x, city.y)
            ctx.lineTo(region.x, region.y)
            ctx.stroke()
          }
          ctx.setLineDash([])
        }
        // region nodes
        for (const region of state.regions) {
          const locked = !region.unlocked
          ctx.globalAlpha = locked ? 0.42 : 1
          ctx.fillStyle = region.color
          ctx.beginPath()
          ctx.arc(region.x, region.y, region.safe ? 17 : 14, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'rgba(0,0,0,0.24)'
          ctx.beginPath()
          ctx.arc(region.x + 3, region.y + 4, region.safe ? 15 : 12, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = region.color
          ctx.beginPath()
          ctx.arc(region.x, region.y, region.safe ? 17 : 14, 0, Math.PI * 2)
          ctx.fill()
          // simple pixel icon inside
          ctx.fillStyle = 'rgba(5,18,24,0.78)'
          if (region.id === 'file-city') {
            ctx.fillRect(region.x - 10, region.y - 7, 7, 13)
            ctx.fillRect(region.x - 1, region.y - 11, 8, 17)
            ctx.fillRect(region.x + 8, region.y - 4, 5, 10)
          } else if (region.id === 'green-gym' || region.id === 'native-forest') {
            ctx.fillRect(region.x - 2, region.y - 3, 4, 8)
            ctx.fillRect(region.x - 6, region.y - 8, 12, 7)
            ctx.fillRect(region.x - 9, region.y - 3, 18, 4)
          } else if (region.id === 'gear-savanna') {
            ctx.fillRect(region.x - 7, region.y - 7, 14, 14)
            ctx.fillStyle = 'rgba(220,190,120,.5)'
            ctx.fillRect(region.x - 2, region.y - 2, 4, 4)
          } else if (region.id === 'amber-coast') {
            ctx.fillRect(region.x - 9, region.y + 2, 18, 3)
            ctx.fillRect(region.x - 6, region.y - 4, 12, 3)
          } else if (region.id === 'frost-ridge') {
            ctx.fillRect(region.x - 8, region.y - 6, 16, 3)
            ctx.fillRect(region.x - 5, region.y - 1, 10, 3)
          } else if (region.id === 'cloudmire') {
            ctx.fillRect(region.x - 8, region.y - 2, 16, 5)
            ctx.fillRect(region.x - 4, region.y - 6, 8, 4)
          } else if (region.id === 'factorial-ruins') {
            ctx.fillRect(region.x - 8, region.y - 6, 5, 14)
            ctx.fillRect(region.x + 1, region.y - 9, 5, 17)
            ctx.fillRect(region.x - 8, region.y - 9, 8, 3)
          } else {
            ctx.fillRect(region.x - 8, region.y - 4, 16, 4)
            ctx.fillRect(region.x - 5, region.y - 9, 10, 5)
          }
          if (locked) {
            ctx.globalAlpha = 1
            ctx.fillStyle = '#07111b'
            ctx.fillRect(region.x - 7, region.y - 7, 14, 12)
            ctx.strokeStyle = '#a6b2bc'
            ctx.lineWidth = 2
            ctx.strokeRect(region.x - 6, region.y - 6, 12, 10)
            ctx.beginPath()
            ctx.arc(region.x, region.y - 8, 4, Math.PI, 0)
            ctx.stroke()
          }
          ctx.globalAlpha = 1
          ctx.font = 'bold 10px "Microsoft YaHei","Segoe UI",sans-serif'
          ctx.textAlign = 'center'
          ctx.fillStyle = locked ? '#6f8998' : '#e8fbff'
          ctx.fillText(region.zh, region.x, region.y + 25)
          if (region.current) {
            ctx.fillStyle = '#fff6cf'
            ctx.beginPath()
            ctx.moveTo(region.x, region.y - 28)
            ctx.lineTo(region.x - 5, region.y - 36)
            ctx.lineTo(region.x + 5, region.y - 36)
            ctx.closePath()
            ctx.fill()
            ctx.strokeStyle = '#f2c14e'
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
        // fog at edges
        ctx.fillStyle = 'rgba(6,20,34,0.7)'
        ctx.fillRect(0, 0, 480, 18)
        ctx.fillRect(0, 342, 480, 18)
        ctx.font = '8px "Microsoft YaHei","Segoe UI",sans-serif'
        ctx.fillStyle = 'rgba(159,225,245,.55)'
        ctx.textAlign = 'left'
        ctx.fillText('FILE ISLAND // DATA SEA', 14, 351)
        ctx.textAlign = 'right'
        ctx.fillText(state.clock.event === 'data-storm' ? 'DATA STORM' : 'STABLE WAVE', 466, 351)
      }, [state.regions, state.clock.event])
      const click = (event) => {
        const canvas = ref.current
        if (canvas === null) return
        const rect = canvas.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 480
        const y = ((event.clientY - rect.top) / rect.height) * 360
        let best = null
        let bestDistance = 32
        for (const region of state.regions) {
          const distance = Math.hypot(x - region.x, y - region.y)
          if (distance < bestDistance) { best = region; bestDistance = distance }
        }
        if (best !== null) onRegion(best)
      }
      return h('canvas', { ref, className: 'dw-map-canvas', width: 960, height: 720, onClick: click })
    }

    /** Region-specific palettes for the live pixel diorama. */
    const SCENE_PALETTES = {
      'file-city': { sky: ['#16324c', '#49708a'], ground: ['#315c4b', '#1c3a31'], accent: '#f2c14e', kind: 'city' },
      'green-gym': { sky: ['#173a3d', '#4b7f72'], ground: ['#285b43', '#163b2d'], accent: '#7de0a4', kind: 'forest' },
      'native-forest': { sky: ['#0e302b', '#356d53'], ground: ['#1d4b37', '#0d2a21'], accent: '#9af5b8', kind: 'forest' },
      'gear-savanna': { sky: ['#3d301c', '#9b6f38'], ground: ['#73512c', '#3c2d1c'], accent: '#e6bd65', kind: 'desert' },
      'amber-coast': { sky: ['#173951', '#688ba0'], ground: ['#c99758', '#7a5734'], accent: '#ffd07a', kind: 'coast' },
      'frost-ridge': { sky: ['#1b3550', '#728fae'], ground: ['#b8d7e8', '#7694aa'], accent: '#d7f7ff', kind: 'snow' },
      'cloudmire': { sky: ['#1b2d43', '#536f86'], ground: ['#2c5349', '#18312d'], accent: '#a6d7e8', kind: 'swamp' },
      'factorial-ruins': { sky: ['#171c2b', '#3c485c'], ground: ['#3d4853', '#1c242d'], accent: '#9ec8e8', kind: 'machine' },
      'dragonbone-caldera': { sky: ['#331a20', '#8a3e31'], ground: ['#4a2922', '#1d1414'], accent: '#ff7b52', kind: 'volcano' },
    }

    /** Draw one little roaming silhouette in the live scene. */
    function drawSceneCritter(ctx, x, y, scale, seed, attribute, stage, time, alpha = 1) {
      const palette = PALETTES[attribute] ?? PALETTES.unknown
      const bob = Math.sin(time * 2.4 + seed * 0.7) * 3
      const stageIndex = ['baby1', 'baby2', 'child', 'adult', 'perfect', 'ultimate'].indexOf(stage)
      const size = (18 + Math.max(0, stageIndex) * 4) * scale
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(0,0,0,.28)'
      ctx.fillRect(x - size * 0.55, y + size * 0.45, size * 1.1, 4 * scale)
      ctx.fillStyle = palette.body
      ctx.fillRect(x - size * 0.42, y - size * 0.25 + bob, size * 0.84, size * 0.7)
      ctx.fillRect(x - size * 0.34, y - size * 0.75 + bob, size * 0.68, size * 0.55)
      ctx.fillStyle = palette.shade
      ctx.fillRect(x - size * 0.5, y + size * 0.05 + bob, size * 0.16, size * 0.2)
      ctx.fillRect(x + size * 0.34, y + size * 0.05 + bob, size * 0.16, size * 0.2)
      ctx.fillStyle = palette.ink
      ctx.fillRect(x - size * 0.2, y - size * 0.55 + bob, 3 * scale, 4 * scale)
      ctx.fillRect(x + size * 0.08, y - size * 0.55 + bob, 3 * scale, 4 * scale)
      ctx.fillStyle = palette.accent
      ctx.fillRect(x - size * 0.1, y - size * 0.02 + bob, size * 0.2, 2 * scale)
      ctx.globalAlpha = 1
    }

    /** A live, animated region diorama (the "scene" view). */
    function LocalScene({ state }) {
      const ref = React.useRef(null)
      const stateRef = React.useRef(state)
      stateRef.current = state
      React.useEffect(() => {
        const canvas = ref.current
        if (canvas === null) return undefined
        const ctx = canvas.getContext('2d')
        if (ctx === null) return undefined
        let frame = 0
        let last = 0
        const render = (now) => {
          const current = stateRef.current
          const time = now / 1000
          const region = current.regions.find((entry) => entry.current) ?? current.regions[0]
          const palette = SCENE_PALETTES[region.id] ?? SCENE_PALETTES['file-city']
          const hour = current.clock.hour
          const night = hour < 6 || hour >= 19
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, 960, 720)
          ctx.imageSmoothingEnabled = false
          // sky
          const sky = ctx.createLinearGradient(0, 0, 0, 470)
          sky.addColorStop(0, night ? '#071225' : palette.sky[0])
          sky.addColorStop(1, night ? '#16233c' : palette.sky[1])
          ctx.fillStyle = sky
          ctx.fillRect(0, 0, 960, 720)
          // stars
          if (night || current.clock.weather === 'aurora') {
            for (let i = 0; i < 70; i += 1) {
              const x = (i * 137 + 31) % 960
              const y = (i * 79 + 17) % 330
              const alpha = 0.25 + ((Math.sin(time * 1.7 + i) + 1) / 2) * 0.65
              ctx.fillStyle = `rgba(210,245,255,${alpha.toFixed(2)})`
              ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1)
            }
          }
          // sun / moon
          const orbX = 120 + ((hour - 6 + 24) % 24) / 24 * 720
          const orbY = 150 - Math.sin(((hour - 6 + 24) % 24) / 24 * Math.PI) * 78
          ctx.fillStyle = night ? '#dbe9ff' : '#ffe6a0'
          ctx.globalAlpha = 0.85
          ctx.beginPath()
          ctx.arc(orbX, orbY, night ? 22 : 30, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
          // clouds
          ctx.fillStyle = 'rgba(220,245,255,.16)'
          for (let i = 0; i < 5; i += 1) {
            const x = ((time * (8 + i * 2) + i * 230) % 1150) - 100
            const y = 110 + (i * 53) % 150
            ctx.fillRect(x, y, 90 + (i % 3) * 38, 12)
            ctx.fillRect(x + 20, y - 10, 40, 12)
            ctx.fillRect(x + 55, y - 6, 25, 8)
          }
          // far hills
          ctx.fillStyle = night ? '#0b1a26' : '#23463e'
          ctx.beginPath()
          ctx.moveTo(0, 390)
          for (let x = 0; x <= 960; x += 80) {
            const y = 360 + Math.sin(x * 0.012 + 1.4) * 34 + Math.sin(x * 0.031) * 12
            ctx.lineTo(x, y)
          }
          ctx.lineTo(960, 720)
          ctx.lineTo(0, 720)
          ctx.closePath()
          ctx.fill()
          // ground
          ctx.fillStyle = palette.ground[0]
          ctx.fillRect(0, 470, 960, 250)
          ctx.fillStyle = palette.ground[1]
          for (let i = 0; i < 30; i += 1) {
            ctx.fillRect((i * 71) % 960, 500 + ((i * 43) % 180), 22, 4)
          }
          // region props
          if (palette.kind === 'city') {
            ctx.fillStyle = '#5c432c'
            ctx.fillRect(80, 350, 150, 140)
            ctx.fillStyle = '#e0b54f'
            ctx.fillRect(96, 368, 38, 42)
            ctx.fillRect(156, 368, 38, 42)
            ctx.fillStyle = '#284c45'
            ctx.fillRect(640, 390, 190, 100)
            ctx.fillStyle = '#a6d7e8'
            ctx.fillRect(660, 410, 30, 28)
            ctx.fillRect(706, 410, 30, 28)
            ctx.fillStyle = '#6b5132'
            ctx.fillRect(430, 460, 100, 18)
          } else if (palette.kind === 'forest') {
            for (let i = 0; i < 12; i += 1) {
              const x = 40 + i * 78
              const h = 80 + (i % 4) * 22
              ctx.fillStyle = '#173b2d'
              ctx.fillRect(x, 460 - h, 10, h)
              ctx.fillStyle = i % 2 === 0 ? '#2d6b4d' : '#397c57'
              ctx.fillRect(x - 24, 430 - h, 58, 22)
              ctx.fillRect(x - 16, 410 - h, 42, 22)
            }
          } else if (palette.kind === 'desert') {
            for (let i = 0; i < 4; i += 1) {
              const x = 130 + i * 210
              ctx.fillStyle = '#5d482d'
              ctx.fillRect(x, 350, 8, 130)
              ctx.fillStyle = '#b99753'
              ctx.beginPath()
              ctx.moveTo(x + 4, 350)
              ctx.lineTo(x + 44, 378)
              ctx.lineTo(x + 4, 402)
              ctx.closePath()
              ctx.fill()
              ctx.fillRect(x - 2, 342, 12, 8)
            }
          } else if (palette.kind === 'coast') {
            ctx.fillStyle = '#216782'
            ctx.fillRect(0, 500, 960, 220)
            for (let i = 0; i < 18; i += 1) {
              ctx.fillStyle = 'rgba(157,235,255,.28)'
              ctx.fillRect(((i * 89 + time * 30) % 960), 530 + (i * 17) % 140, 38, 3)
            }
            ctx.fillStyle = '#8b6038'
            ctx.fillRect(60, 470, 300, 18)
          } else if (palette.kind === 'snow') {
            ctx.fillStyle = '#d9f4ff'
            ctx.fillRect(0, 500, 960, 220)
            for (let i = 0; i < 30; i += 1) {
              ctx.fillStyle = 'rgba(93,149,180,.35)'
              ctx.fillRect((i * 83) % 960, 520 + (i * 37) % 160, 28, 3)
            }
          } else if (palette.kind === 'machine') {
            ctx.fillStyle = '#202c37'
            ctx.fillRect(0, 470, 960, 250)
            for (let i = 0; i < 9; i += 1) {
              ctx.fillStyle = i % 2 === 0 ? '#3a5262' : '#2b3b49'
              ctx.fillRect(30 + i * 110, 410 - (i % 3) * 45, 24, 240)
              ctx.fillRect(46 + i * 110, 390 - (i % 3) * 45, 50, 10)
            }
          } else if (palette.kind === 'volcano') {
            ctx.fillStyle = '#2a1718'
            ctx.fillRect(0, 470, 960, 250)
            ctx.fillStyle = '#ff6d3b'
            ctx.beginPath()
            ctx.moveTo(300, 500)
            ctx.lineTo(420, 390)
            ctx.lineTo(540, 500)
            ctx.closePath()
            ctx.fill()
            ctx.fillStyle = '#ffd06a'
            ctx.fillRect(414, 420, 12, 80)
          } else {
            ctx.fillStyle = 'rgba(150,220,240,.18)'
            for (let i = 0; i < 8; i += 1) {
              ctx.fillRect(60 + i * 120, 510 + (i % 3) * 24, 80, 10)
            }
          }
          // roaming silhouettes
          const wildCount = region.safe ? 2 : 4
          for (let i = 0; i < wildCount; i += 1) {
            const x = 160 + ((i * 233 + Math.sin(time * 0.5 + i) * 60) % 640)
            const y = 540 + (i % 3) * 36
            drawSceneCritter(ctx, x, y, 1.15 + (i % 2) * 0.25, i + 1, i % 2 === 0 ? 'data' : 'virus', i === 0 ? 'child' : 'baby2', time, 0.5)
          }
          // active partner + trainer
          const active = current.active
          if (active === null) {
            const bob = Math.sin(time * 2) * 4
            ctx.fillStyle = PALETTES.unknown.body
            ctx.beginPath()
            ctx.ellipse(480, 555 + bob, 32, 42, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = PALETTES.unknown.accent
            ctx.fillRect(462, 542 + bob, 36, 5)
          } else {
            drawSceneCritter(ctx, 540, 548, 2.1, 7, active.attribute, active.stage, time, 1)
            ctx.fillStyle = '#e8ce87'
            ctx.fillRect(470, 552, 4, 8)
            ctx.fillRect(466, 552, 12, 4)
            ctx.fillStyle = '#dff6ff'
            ctx.fillRect(458, 560, 26, 20)
            ctx.fillStyle = '#304f60'
            ctx.fillRect(460, 564, 22, 8)
            ctx.fillStyle = '#2e4352'
            ctx.fillRect(455, 582, 12, 18)
            ctx.fillRect(473, 582, 12, 18)
          }
          // weather particles
          if (current.clock.weather === 'rain' || current.clock.weather === 'storm') {
            ctx.strokeStyle = 'rgba(180,230,255,.45)'
            ctx.lineWidth = 2
            for (let i = 0; i < 80; i += 1) {
              const x = ((i * 61 + time * 120) % 980) - 10
              const y = ((i * 97 + time * 360) % 760) - 20
              ctx.beginPath()
              ctx.moveTo(x, y)
              ctx.lineTo(x - 5, y + 16)
              ctx.stroke()
            }
          }
          if (palette.kind === 'snow') {
            ctx.fillStyle = 'rgba(245,253,255,.8)'
            for (let i = 0; i < 55; i += 1) {
              const x = ((i * 67 + time * 26) % 980) - 10
              const y = ((i * 53 + time * 44) % 760) - 20
              ctx.fillRect(x, y, 3, 3)
            }
          }
          if (palette.kind === 'forest' && (night || current.clock.weather === 'aurora')) {
            ctx.fillStyle = 'rgba(255,236,137,.8)'
            for (let i = 0; i < 22; i += 1) {
              const x = (i * 71 + Math.sin(time + i) * 20 + 40) % 900
              const y = 500 + (i * 37) % 120
              ctx.fillRect(x, y, 2, 2)
            }
          }
          if (current.clock.season === 'autumn') {
            ctx.fillStyle = 'rgba(240,159,79,.65)'
            for (let i = 0; i < 28; i += 1) {
              const x = ((i * 71 + time * 34) % 980) - 10
              const y = ((i * 43 + time * 60) % 760) - 20
              ctx.fillRect(x, y, 4, 2)
            }
          }
          // night tint
          if (night) {
            ctx.fillStyle = 'rgba(3,10,25,.32)'
            ctx.fillRect(0, 0, 960, 720)
          }
          // data storm glitch
          if (current.clock.event === 'data-storm') {
            ctx.fillStyle = 'rgba(156,94,232,.10)'
            ctx.fillRect(0, 0, 960, 720)
            for (let i = 0; i < 18; i += 1) {
              const y = (i * 41 + time * 90) % 720
              ctx.fillStyle = i % 2 === 0 ? 'rgba(158,231,255,.12)' : 'rgba(230,151,255,.09)'
              ctx.fillRect((i * 53) % 600, y, 300, 2)
            }
          }
        }
        const loop = (now) => {
          if (now - last > 38) {
            render(now)
            last = now
          }
          frame = requestAnimationFrame(loop)
        }
        frame = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frame)
      }, [])
      return h('canvas', { ref, className: 'dw-scene-canvas', width: 960, height: 720, 'aria-label': 'Live area scene' })
    }

    /** Generic overlay. */
    function Overlay({ title, subtitle, onClose, children, narrow }) {
      return h('div', { className: 'dw-overlay' },
        h('div', { className: `dw-modal${narrow ? ' narrow' : ''}` },
          h('div', { className: 'dw-modal-head' },
            h('div', null, h('div', { className: 'dw-modal-title' }, title), subtitle ? h('div', { className: 'dw-modal-sub' }, subtitle) : null),
            h('button', { type: 'button', className: 'dw-modal-close', onClick: onClose }, '✕'),
          ),
          children,
        ),
      )
    }

    /** Nest modal. */
    function NestModal({ state, t, onClose, onSelect }) {
      return h(Overlay, { title: tr(t, 'nestTitle'), subtitle: tr(t, 'nestHint'), onClose },
        h('div', { className: 'dw-section-title' }, h('span', null, tr(t, 'capacity', { used: state.roster.length, max: state.nestCapacity }))),
        state.roster.length === 0
          ? h('div', { className: 'dw-empty' }, tr(t, 'noActiveHint'))
          : h('div', { className: 'dw-grid-3' }, state.roster.map((entry) =>
              h('div', { key: entry.id, className: `dw-card-row${entry.active ? ' current' : ''}` },
                h(PixelMonster, { speciesId: entry.speciesId, attribute: entry.attribute, type: entry.type, stage: entry.stage, size: 48 }),
                h('div', { className: 'dw-card-body' },
                  h('div', { className: 'dw-card-name' }, entry.name),
                  h('div', { className: 'dw-card-meta' }, `${entry.speciesZh} · ${entry.stageLabel} Lv.${entry.level}`),
                  h('div', { className: 'dw-card-meta' }, `${tr(t, 'bond')} ${Math.round(entry.bond)} · HP ${entry.hp}/${entry.maxHp}`),
                  entry.active ? h('div', { className: 'dw-link' }, tr(t, 'current')) : h('button', { type: 'button', className: 'dw-card-btn', onClick: () => onSelect(entry.id) }, tr(t, 'setActive')),
                ),
              ),
            )),
      )
    }

    /** Dex modal with its own fetch. */
    function DexModal({ t, onClose }) {
      const [query, setQuery] = React.useState('')
      const [page, setPage] = React.useState(1)
      const [data, setData] = React.useState(null)
      const [error, setError] = React.useState(null)
      React.useEffect(() => {
        let live = true
        const timer = setTimeout(() => {
          fetchDex(query, page).then((payload) => { if (live) { setData(payload); setError(null) } }).catch((failure) => { if (live) setError(messageOf(failure)) })
        }, 250)
        return () => { live = false; clearTimeout(timer) }
      }, [query, page])
      return h(Overlay, { title: tr(t, 'dexTitle'), subtitle: data === null ? tr(t, 'loading') : tr(t, 'dexTotal', { count: data.total }), onClose },
        h('input', { className: 'dw-search', value: query, placeholder: tr(t, 'dexSearch'), onChange: (event) => { setQuery(event.target.value); setPage(1) } }),
        error !== null ? h('div', { className: 'dw-empty' }, error) : null,
        data === null ? h('div', { className: 'dw-empty' }, tr(t, 'loading')) : data.items.length === 0 ? h('div', { className: 'dw-empty' }, tr(t, 'dexEmpty')) : h('div', { className: 'dw-grid-3' }, data.items.map((item) =>
          h('div', { key: item.id, className: 'dw-dex-item' },
            h('div', { className: 'dw-dex-name' }, item.zh || item.name),
            h('div', { className: 'dw-dex-meta' }, `${item.levelLabel} · ${item.attributeLabel}`),
            h('div', { className: 'dw-dex-meta' }, item.type),
            h('div', { className: 'dw-dex-meta' }, item.moves?.slice(0, 2).join(' / ') ?? ''),
          ),
        )),
        data !== null ? h('div', { className: 'dw-pager' },
          h('button', { type: 'button', className: 'dw-card-btn', disabled: page <= 1, onClick: () => setPage((value) => Math.max(1, value - 1)) }, '‹'),
          h('span', null, `${data.page}/${data.pages}`),
          h('button', { type: 'button', className: 'dw-card-btn', disabled: page >= data.pages, onClick: () => setPage((value) => Math.min(data.pages, value + 1)) }, '›'),
        ) : null,
      )
    }

    /** Egg modal. */
    function EggModal({ state, t, onClose, onHatch, busy }) {
      return h(Overlay, { title: tr(t, 'eggTitle'), onClose },
        state.eggs.length === 0 ? h('div', { className: 'dw-empty' }, tr(t, 'eggEmpty')) : h('div', { className: 'dw-grid-2' }, state.eggs.map((egg) =>
          h('div', { key: egg.id, className: 'dw-egg-card' },
            h('div', { className: 'dw-egg-art' }, h(PixelMonster, { speciesId: egg.id, attribute: egg.signature.attribute, type: egg.signature.type, stage: 'baby1', size: 48, egg: true })),
            h('div', { className: 'dw-egg-body' },
              h('div', { className: 'dw-egg-title' }, egg.hint),
              h('div', { className: 'dw-egg-meta' }, tr(t, 'eggSignature', { attribute: egg.signature.attribute, type: egg.signature.type })),
              h('div', { className: 'dw-egg-meta' }, egg.canHatch ? tr(t, 'eggReady') : tr(t, 'eggRemaining', { hours: egg.remainingHours.toFixed(1) })),
              h('div', { className: 'dw-progress' }, h('div', { className: 'dw-progress-fill', style: { width: `${Math.round(egg.progress * 100)}%` } })),
            ),
            h('button', { type: 'button', className: 'dw-card-btn', disabled: !egg.canHatch || busy !== null, onClick: () => onHatch(egg.id) }, tr(t, 'hatch')),
          ),
        )),
      )
    }

    /** Training modal. */
    function TrainModal({ t, onClose, onTrain, busy }) {
      const stats = [
        ['hp', tr(t, 'hpTrain')], ['mp', tr(t, 'mpTrain')], ['atk', tr(t, 'atkTrain')],
        ['def', tr(t, 'defTrain')], ['spd', tr(t, 'spdTrain')], ['wis', tr(t, 'wisTrain')],
      ]
      return h(Overlay, { title: tr(t, 'trainTitle'), subtitle: tr(t, 'trainHint'), onClose, narrow: true },
        h('div', { className: 'dw-grid-3' }, stats.map(([stat, label]) =>
          h('button', { key: stat, type: 'button', className: 'dw-btn', disabled: busy !== null, onClick: () => onTrain(stat) }, label),
        )),
      )
    }

    /** Evolution modal. */
    function EvolutionModal({ state, t, onClose, onEvolve, busy }) {
      const options = state.evolutionOptions ?? []
      return h(Overlay, { title: tr(t, 'evolutionTitle'), subtitle: tr(t, 'evolutionHint'), onClose },
        options.length === 0 ? h('div', { className: 'dw-empty' }, tr(t, 'evolutionEmpty')) : options.map((option) =>
          h('div', { key: option.speciesId, className: 'dw-evo-row' },
            h('div', { className: 'dw-evo-top' },
              h('div', null, h('div', { className: 'dw-evo-name' }, option.zh || option.name), h('div', { className: 'dw-card-meta' }, `${option.stageLabel} · ${tr(t, 'requirements', { level: option.levelReq, power: option.powerReq })}`)),
              option.eligible ? h('button', { type: 'button', className: 'dw-card-btn', disabled: busy !== null, onClick: () => onEvolve(option.speciesId) }, tr(t, 'eligible')) : h('span', { className: 'dw-evo-no' }, tr(t, 'missing')),
            ),
            option.eligible ? null : h('div', { className: 'dw-evo-missing' }, option.reasons.join('；')),
          ),
        ),
      )
    }

    /** City modal. */
    function CityModal({ state, t, onClose, onRestore, busy }) {
      const names = { gym: '训练场', clinic: '诊所', shop: '商店', incubator: '孵化器', nest: '数码巢', lab: '研究所', farm: '农场' }
      const entries = Object.entries(state.city.facilities)
      return h(Overlay, { title: tr(t, 'cityTitle'), subtitle: tr(t, 'cityHint'), onClose },
        h('div', { className: 'dw-section-title' }, h('span', null, tr(t, 'sync', { sync: state.city.sync })), h('span', null, state.city.nextUnlock === null ? tr(t, 'noUnlock') : tr(t, 'nextUnlock', { name: state.city.nextUnlock.zh, sync: state.city.nextUnlock.unlockSync }))),
        entries.map(([id, level]) =>
          h('div', { key: id, className: 'dw-city-row' },
            h('div', { className: 'dw-city-name' }, names[id] ?? id),
            h('div', { className: 'dw-city-lv' }, `Lv.${level}`),
            h('button', { type: 'button', className: 'dw-card-btn', disabled: level >= 5 || busy !== null || state.inventory.dataCores < Math.max(1, level), onClick: () => onRestore(id) }, level >= 5 ? tr(t, 'maxed') : `${tr(t, 'restore')} · ${Math.max(1, level)} ◆`),
          ),
        ),
    )
    }

    /** Log modal. */
    function LogModal({ state, t, onClose }) {
      return h(Overlay, { title: tr(t, 'logTitle'), onClose },
        h('div', { className: 'dw-battle-log', style: { maxHeight: '480px' } }, state.log.slice().reverse().map((entry, index) =>
          h('div', { key: index, style: { padding: '4px 0', borderBottom: '1px solid #183447' } }, `· ${entry.text}`),
        )),
      )
    }

    /** Battle overlay. */
    function BattleOverlay({ state, t, busy, onCommand, onAbsorb, onRebuild, onClose }) {
      const battle = state.battle
      if (battle === null) return null
      const active = state.active
      const status = battle.status
      return h('div', { className: 'dw-overlay' },
        h('div', { className: 'dw-battle' },
          h('div', { className: 'dw-modal-head' },
            h('div', null, h('div', { className: 'dw-modal-title' }, tr(t, 'battleTitle')), h('div', { className: 'dw-modal-sub' }, tr(t, 'battleVs', { name: battle.enemy.name, level: battle.enemy.level }))),
            h('button', { type: 'button', className: 'dw-modal-close', onClick: onClose }, '✕'),
          ),
          h('div', { className: 'dw-battle-top' },
            h('div', { className: 'dw-battle-side' },
              active ? h(PixelMonster, { speciesId: active.speciesId, attribute: active.attribute, type: active.type, stage: active.stage, size: 128 }) : null,
              h('div', { className: 'dw-battle-name' }, active?.name ?? '—'),
              h('div', { className: 'dw-battle-meta' }, active ? `Lv.${active.level} · HP ${active.hp}/${active.maxHp}` : ''),
              active ? h('div', { className: 'dw-progress', style: { marginTop: '8px' } }, h('div', { className: 'dw-progress-fill', style: { width: `${Math.max(0, Math.min(100, (active.hp / active.maxHp) * 100))}%` } })) : null,
            ),
            h('div', { style: { color: '#f2c14e', fontSize: '22px' } }, 'VS'),
            h('div', { className: 'dw-battle-side' },
              h(PixelMonster, { speciesId: battle.enemy.speciesId, attribute: battle.enemy.attribute, type: battle.enemy.type, stage: battle.enemy.stage, size: 128 }),
              h('div', { className: 'dw-battle-name' }, battle.enemy.name),
              h('div', { className: 'dw-battle-meta' }, `Lv.${battle.enemy.level} · HP ${battle.enemy.hp}/${battle.enemy.maxHp}`),
              h('div', { className: 'dw-progress', style: { marginTop: '8px' } }, h('div', { className: 'dw-progress-fill', style: { width: `${Math.max(0, Math.min(100, (battle.enemy.hp / battle.enemy.maxHp) * 100))}%`, background: '#e46d5f' } })),
            ),
          ),
          h('div', { className: 'dw-battle-log' }, battle.log.map((line, index) => h('div', { key: index }, `· ${line}`))),
          status === 'active'
            ? h('div', { className: 'dw-battle-actions' },
                h('button', { type: 'button', className: 'dw-btn primary', disabled: busy !== null, onClick: () => onCommand('auto') }, tr(t, 'autoBattle')),
                h('button', { type: 'button', className: 'dw-btn', disabled: busy !== null, onClick: () => onCommand('attack') }, tr(t, 'attack')),
                h('button', { type: 'button', className: 'dw-btn', disabled: busy !== null, onClick: () => onCommand('skill') }, tr(t, 'skill')),
                h('button', { type: 'button', className: 'dw-btn', disabled: busy !== null, onClick: () => onCommand('scan') }, tr(t, 'scan')),
                h('button', { type: 'button', className: 'dw-btn danger', disabled: busy !== null, onClick: () => onCommand('flee') }, tr(t, 'flee')),
              )
            : null,
          status === 'won'
            ? h('div', null,
                h('div', { className: 'dw-battle-reward' }, tr(t, 'reward')),
                h('div', { className: 'dw-battle-actions' },
                  h('button', { type: 'button', className: 'dw-btn primary', disabled: busy !== null, onClick: onAbsorb }, tr(t, 'absorb')),
                  h('button', { type: 'button', className: 'dw-btn', disabled: busy !== null || state.inventory.rebuildPrograms <= 0, onClick: onRebuild }, `${tr(t, 'rebuild')} (${state.inventory.rebuildPrograms})`),
                ),
              )
            : status === 'lost' || status === 'fled'
              ? h('div', { className: 'dw-battle-reward' }, status === 'lost' ? tr(t, 'lost') : tr(t, 'flee'))
              : null,
        ),
      )
    }

    /** Main page. */
    function DigitalWorldPage(props) {
      const t = typeof props?.t === 'function' ? props.t : undefined
      const { state, error, loading, reload, setState } = useWorld()
      const [busy, setBusy] = React.useState(null)
      const [toast, setToast] = React.useState(null)
      const [modal, setModal] = React.useState(null)
      const [scale, setScale] = React.useState(1)
      const wrapRef = React.useRef(null)

      React.useEffect(() => {
        const wrap = wrapRef.current
        if (wrap === null) return undefined
        const update = () => {
          const rect = wrap.getBoundingClientRect()
          const fit = Math.min(rect.width / 1280, rect.height / 720, 1)
          setScale(Number.isFinite(fit) && fit > 0 ? fit : 1)
        }
        update()
        if (typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(update)
          observer.observe(wrap)
          return () => observer.disconnect()
        }
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
      }, [])

      React.useEffect(() => {
        if (toast === null) return undefined
        const timer = setTimeout(() => setToast(null), 5000)
        return () => clearTimeout(timer)
      }, [toast])

      const run = async (action, payload = {}) => {
        if (busy !== null) return
        setBusy(action)
        try {
          const payloadResult = await api('POST', { action, ...payload })
          setState(payloadResult.state)
          if (payloadResult.result?.summary) setToast({ text: payloadResult.result.summary, error: false })
          if (action === 'hatch') setModal(null)
        } catch (failure) {
          setToast({ text: messageOf(failure), error: true })
        } finally {
          setBusy(null)
        }
      }

      const onRegion = (region) => {
        if (!region.unlocked) {
          setToast({ text: tr(t, 'regionLocked', { name: region.zh, sync: region.unlockSync }), error: true })
          return
        }
        void run('travel', { region: region.id })
      }

      if (loading && state === null) return h('div', { className: 'dw-root' }, styleTag(), h('div', { className: 'dw-loading' }, tr(t, 'loading')))
      if (state === null) {
        return h('div', { className: 'dw-root' },
          styleTag(),
          h('div', { className: 'dw-error' },
            h('div', null, `${tr(t, 'loadFailed')}：${error ?? tr(t, 'error')}`),
            h('button', { type: 'button', className: 'dw-btn', onClick: () => void reload(false) }, tr(t, 'retry')),
          ),
        )
      }
      if (state.version !== 2 || !Array.isArray(state.regions)) {
        return h('div', { className: 'dw-root' },
          styleTag(),
          h('div', { className: 'dw-error' },
            h('div', null, '数码世界 v0.4 已安装。请重启 DeepSeek Harness 或重新打开应用，以加载新的 Host 服务。'),
            h('div', { className: 'dw-hint', style: { color: '#7fa8b8' } }, 'The v0.4 Host service needs one application restart after replacing the bundle.'),
          ),
        )
      }

      const active = state.active
      const currentRegion = state.regions.find((region) => region.current) ?? state.regions[0]
      const actionButtons = [
        ['feed', () => run('care', { mode: 'feed' })],
        ['clean', () => run('care', { mode: 'clean' })],
        ['pet', () => run('care', { mode: 'pet' })],
        ['sleep', () => run('care', { mode: 'sleep' })],
        ['heal', () => run('care', { mode: 'heal' })],
        ['train', () => setModal('train')],
        ['explore', () => run('explore')],
        ['evolve', () => setModal('evolution')],
        ['expedition', () => run('expedition')],
      ]

      return h('div', { className: 'dw-root', ref: wrapRef },
        h('style', null, CSS),
        h('div', { className: 'dw-scale-wrap' },
          h('div', { className: 'dw-stage', style: { transform: `scale(${scale})` } },
            h('div', { className: 'dw-map-pane' },
              h(IslandMap, { state, onRegion }),
              h('div', { className: 'dw-map-top' },
                h('div', null,
                  h('div', { className: 'dw-brand' }, tr(t, 'kicker')),
                  h('div', { className: 'dw-map-title' }, tr(t, 'title')),
                  h('div', { className: 'dw-map-sub' }, tr(t, 'subtitle')),
                ),
                h('div', { className: 'dw-top-right' },
                  h('span', { className: 'dw-chip gold' }, tr(t, 'day', { day: state.clock.day })),
                  h('span', { className: 'dw-chip' }, `${state.clock.hour}:00 · ${state.clock.seasonLabel} · ${state.clock.weatherLabel}`),
                  state.clock.event !== null ? h('span', { className: 'dw-chip' }, tr(t, 'eventDataStorm')) : null,
                  h('span', { className: 'dw-chip' }, tr(t, 'catalog', { count: state.catalog.count })),
                ),
              ),
              h('div', { className: 'dw-map-bottom' },
                h('div', { className: 'dw-region-card' },
                  h('div', { className: 'dw-region-name' }, currentRegion.zh),
                  h('div', { className: 'dw-region-desc' }, currentRegion.description),
                ),
                h('div', { className: 'dw-ticker' }, state.log.length === 0 ? '—' : state.log[state.log.length - 1].text),
              ),
            ),
            h('aside', { className: 'dw-hud' },
              h('div', { className: 'dw-hud-head' },
                h('div', null, h('div', { className: 'dw-hud-title' }, tr(t, 'panel')), h('div', { className: 'dw-hud-sub' }, tr(t, 'sync', { sync: state.city.sync }))),
                h('div', { className: 'dw-hud-stats' }, `◈ ${state.inventory.bits}`, h('br'), `${state.clock.weatherLabel}`),
              ),
              active === null
                ? h('div', { className: 'dw-panel' },
                    h('div', { className: 'dw-section-title' }, h('span', null, tr(t, 'noActive'))),
                    h('div', { className: 'dw-hint', style: { fontSize: '10px', color: '#87abb9', lineHeight: 1.5 } }, tr(t, 'noActiveHint')),
                    state.eggs.length > 0 ? h('button', { type: 'button', className: 'dw-btn primary', style: { width: '100%', marginTop: '10px' }, onClick: () => setModal('eggs') }, tr(t, 'hatch')) : null,
                  )
                : h('div', { className: 'dw-panel dw-active' },
                    h('div', { className: 'dw-portrait' }, h(PixelMonster, { speciesId: active.speciesId, attribute: active.attribute, type: active.type, stage: active.stage, size: 88 })),
                    h('div', { className: 'dw-active-body' },
                      h('div', { className: 'dw-name' }, active.name),
                      h('div', { className: 'dw-species' }, `${active.speciesZh} · ${active.stageLabel} · ${active.attributeLabel}`),
                      h('div', { className: 'dw-level' }, tr(t, 'level', { level: active.level })),
                      h('div', { className: 'dw-stage-pill' }, active.type),
                    ),
                  ),
              active !== null ? h('div', { className: 'dw-panel' },
                h('div', { className: 'dw-bars' },
                  h(Bar, { label: tr(t, 'hp'), value: active.hp, max: active.maxHp, color: '#e46d5f' }),
                  h(Bar, { label: tr(t, 'mp'), value: active.mp, max: active.maxMp, color: '#6bb9ff' }),
                  h(Bar, { label: tr(t, 'bond'), value: active.bond, max: 100, color: '#f2c14e' }),
                ),
                h('div', { className: 'dw-care-grid' },
                  h('div', { className: 'dw-care-item' }, h('span', null, tr(t, 'fullness')), h('strong', null, Math.round(active.care.fullness))),
                  h('div', { className: 'dw-care-item' }, h('span', null, tr(t, 'cleanliness')), h('strong', null, Math.round(active.care.cleanliness))),
                  h('div', { className: 'dw-care-item' }, h('span', null, tr(t, 'mood')), h('strong', null, Math.round(active.care.mood))),
                  h('div', { className: 'dw-care-item' }, h('span', null, tr(t, 'energy')), h('strong', null, Math.round(active.care.energy))),
                ),
                h('div', { className: 'dw-care-grid', style: { marginTop: '7px' } },
                  h('div', { className: 'dw-care-item' }, h('span', null, 'ATK'), h('strong', null, active.stats.atk)),
                  h('div', { className: 'dw-care-item' }, h('span', null, 'DEF'), h('strong', null, active.stats.def)),
                  h('div', { className: 'dw-care-item' }, h('span', null, 'SPD'), h('strong', null, active.stats.spd)),
                  h('div', { className: 'dw-care-item' }, h('span', null, 'WIS'), h('strong', null, active.stats.wis)),
                ),
              ) : null,
              h('div', { className: 'dw-panel' },
                h('div', { className: 'dw-section-title' }, h('span', null, tr(t, 'party')), h('span', null, `${state.party.length}/3`)),
                h('div', { className: 'dw-party' }, [0, 1, 2].map((index) => {
                  const member = state.party[index]
                  return h('div', { key: index, className: `dw-party-slot${member !== undefined ? ' filled' : ''}${member !== undefined && member.id === state.activeId ? ' active' : ''}`, onClick: member === undefined ? undefined : () => run('party', { instanceId: member.id }) },
                    member !== undefined ? h(PixelMonster, { speciesId: member.speciesId, attribute: member.attribute, type: member.type, stage: member.stage, size: 38 }) : h('span', { className: 'dw-party-name' }, '+'),
                    member !== undefined ? h('span', { className: 'dw-party-name' }, member.name) : null,
                  )
                })),
                state.links.length > 0 ? state.links.map((link) => h('div', { key: link.id, className: 'dw-link' }, `↳ ${link.name}：${link.effect}`)) : h('div', { className: 'dw-link', color: '#54798a' }, tr(t, 'noLinks')),
              ),
              h('div', { className: 'dw-mini-actions' }, actionButtons.map(([id, handler]) =>
                h('button', { key: id, type: 'button', className: `dw-btn${id === 'explore' ? ' primary' : ''}`, disabled: busy !== null || active === null, onClick: () => void handler() }, tr(t, id)),
              )),
              h('div', { className: 'dw-menu' },
                h('button', { type: 'button', className: 'dw-btn', onClick: () => setModal('nest') }, tr(t, 'nest')),
                h('button', { type: 'button', className: 'dw-btn', onClick: () => setModal('dex') }, tr(t, 'dex')),
                h('button', { type: 'button', className: 'dw-btn', onClick: () => setModal('eggs') }, `${tr(t, 'eggs')} ${state.eggs.length}`),
                h('button', { type: 'button', className: 'dw-btn', onClick: () => setModal('city') }, tr(t, 'city')),
                h('button', { type: 'button', className: 'dw-btn', disabled: busy !== null || active === null, onClick: () => void run('infuse', { attribute: active?.attribute }) }, tr(t, 'infuse')),
                h('button', { type: 'button', className: 'dw-btn', onClick: () => setModal('log') }, tr(t, 'log')),
                h('button', { type: 'button', className: 'dw-btn', onClick: () => setModal('rename') }, tr(t, 'rename')),
              ),
              h('div', { className: 'dw-section-title', style: { marginTop: '2px' } }, h('span', null, tr(t, 'region')), h('span', null, currentRegion.name)),
              h('div', { className: 'dw-hint', style: { fontSize: '9px', color: '#6e94a4', lineHeight: 1.5 } }, tr(t, 'fragmentsHint', state.inventory.fragments)),
            ),
            toast !== null ? h('div', { className: `dw-toast${toast.error ? ' error' : ''}` }, toast.text) : null,
            modal === 'nest' ? h(NestModal, { state, t, onClose: () => setModal(null), onSelect: (id) => { void run('party', { instanceId: id }); setModal(null) } }) : null,
            modal === 'dex' ? h(DexModal, { t, onClose: () => setModal(null) }) : null,
            modal === 'eggs' ? h(EggModal, { state, t, onClose: () => setModal(null), onHatch: (eggId) => void run('hatch', { eggId }), busy }) : null,
            modal === 'train' ? h(TrainModal, { t, onClose: () => setModal(null), onTrain: (stat) => void run('train', { stat }), busy }) : null,
            modal === 'evolution' ? h(EvolutionModal, { state, t, onClose: () => setModal(null), onEvolve: (target) => { void run('evolve', { target }); setModal(null) }, busy }) : null,
            modal === 'city' ? h(CityModal, { state, t, onClose: () => setModal(null), onRestore: (facility) => void run('restore', { facility }), busy }) : null,
            modal === 'log' ? h(LogModal, { state, t, onClose: () => setModal(null) }) : null,
            modal === 'rename' ? h(Overlay, { title: tr(t, 'renameTitle'), onClose: () => setModal(null), narrow: true },
              h('input', { className: 'dw-search', placeholder: tr(t, 'renamePlaceholder'), maxLength: 12, autoFocus: true, onKeyDown: (event) => { if (event.key === 'Enter') { void run('rename', { name: event.currentTarget.value }); setModal(null) } } }),
              h('button', { type: 'button', className: 'dw-btn primary', onClick: () => { const input = document.querySelector('.dw-search'); if (input) { void run('rename', { name: input.value }); setModal(null) } } }, tr(t, 'confirm')),
            ) : null,
            state.battle !== null ? h(BattleOverlay, { state, t, busy, onCommand: (command) => void run('battle', { command }), onAbsorb: () => void run('absorb'), onRebuild: () => void run('rebuild'), onClose: () => void run('battle', { command: state.battle?.status === 'active' ? 'flee' : 'dismiss' }) }) : null,
          ),
        ),
      )
    }

    /** Sidebar icon. */
    function DigitalWorldIcon(props) {
      const size = Number.isFinite(props?.size) ? props.size : 18
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true', style: { display: 'block' } },
        h('rect', { x: '3', y: '4', width: '18', height: '16', rx: '2', stroke: 'currentColor', strokeWidth: '1.4' }),
        h('rect', { x: '6', y: '7', width: '4', height: '4', fill: 'currentColor', opacity: '0.8' }),
        h('rect', { x: '14', y: '7', width: '4', height: '4', fill: 'currentColor', opacity: '0.5' }),
        h('rect', { x: '6', y: '13', width: '12', height: '2', fill: 'currentColor', opacity: '0.55' }),
        h('rect', { x: '9', y: '16', width: '6', height: '2', fill: 'currentColor', opacity: '0.35' }),
      )
    }

    /** Keeps a component error from blanking the whole main panel. */
    class Boundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null } }
      static getDerivedStateFromError(error) { return { error } }
      componentDidCatch(error) { try { console.error('digital-world: panel crashed', error) } catch { /* noop */ } }
      render() {
        if (this.state.error !== null) {
          return h('div', { className: 'dw-root' }, styleTag(), h('div', { className: 'dw-error' }, `Digital World failed to render: ${messageOf(this.state.error)}`))
        }
        return this.props.children
      }
    }

    const inject = ['slots', 'locale']

    function apply(ctx) {
      try {
        if (typeof styles !== 'undefined' && styles !== null && typeof styles.insert === 'function') {
          ctx.effect(() => styles.insert(CSS), 'digital-world: stylesheet')
        }
      } catch {
        // The page also carries its own `<style>` fallback.
      }
      ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'digital-world: dictionaries')
      const t = ctx.locale.bind(NS)
      ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, (props) => h(Boundary, null, h(DigitalWorldPage, props))))
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 30, locale: NS, label: () => t('panel') }, (props) => h(Boundary, null, h(DigitalWorldIcon, props))))
    }

    exports.apply = apply
    exports.inject = inject
    exports.__test__ = { NS, PANEL_ID, API, ZH, EN, PixelMonster, IslandMap, DigitalWorldPage }
    return module.exports
  },
})
