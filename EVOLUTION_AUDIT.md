# 数码兽进化路线一致性审计

- 进化数据来源：**wikimon**（Wikimon 官方来源汇总）
- 完整图鉴：1614 条
- 有像素图可上架：**595** 条
- 无图暂下架：1019 条
- 保留的官方进化边：9406 条（全部来自官方 evolvesTo）
- 因下架被裁掉的官方分支涉及：517 个物种
- 指向不存在物种的官方边：0（应为 0）
- 非法/杜撰边：0（应为 0）

## 各阶段可用数量

- 幼年期I：24
- 幼年期II：25
- 成长期：79
- 成熟期：123
- 完全体：142
- 究极体：159

## 初始蛋可进化到的阶段（幼年期I 起点）

- 幼年期I 总数：24
- 能到成熟期：23；能到完全体：23；能到究极体：23

## 进化目标广度（是否像官方单线）

- 平均每个可用物种可进化到：**10.4** 个目标（中位数 6，最多 60）
- 无任何可用进化目标：65 个物种
- 跨级直连（跳 2 级以上，如成长期→究极体）：**397** 条
- 示例：agnimon(hybrid)→ancient-greymon(ultimate)；agnimon(hybrid)→apollomon(ultimate)；agnimon(hybrid)→dukemon(ultimate)；agnimon(hybrid)→hououmon(ultimate)；agnimon(hybrid)→shine-greymon(ultimate)；agnimon(hybrid)→susanoomon(ultimate)

## 经典官方路线抽查

- 亚古兽线：`Agumon → Greymon → Metal Greymon → War Greymon` — 官方一致：是；全部有图：是
- 加布兽线：`Gabumon → Garurumon → Were Garurumon → Metal Garurumon` — 官方一致：是；全部有图：是
- 比丘兽线：`Piyomon → Birdramon → Garudamon` — 官方一致：是；全部有图：是
- 巴达兽线：`Patamon → Angemon` — 官方一致：是；全部有图：是

## 结论

进化数据全部来自 Wikimon 官方来源的 `Evolves To`，与官方来源一致。需要注意：官方进化本身是**多分支图**（平均 10.4 个目标、含 397 条跨级/特殊进化），并非单线；若产品要单线展示，需要另行指定标准线。
