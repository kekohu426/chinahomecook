# 文档使用说明（单一入口）

目标：让文档可执行、可验收、可追踪，避免“只写不落地”。

## 单一入口（每天只看这些）
1. `docs/PROJECT_STATE.md` - 当前项目现状快照（开工必读）
2. `docs/TODO.md` - 当前迭代任务清单（执行入口）
3. `docs/PLAN.md` - 详细开发计划（分阶段、含验收标准）
4. `docs/TEST_PLAN.md` - 单元测试编写计划（含优先级与策略）

## 变更时必须同步更新
- 需求变更：更新 `prd.docx` + `docs/PROJECT_STATE.md` + `docs/TODO.md` + `docs/PLAN.md`
- 设计变更：更新 `docs/DESIGN_REFERENCE.md` + `docs/UI_DESIGN.md`
- Schema 变更：更新 `docs/SCHEMA_VALIDATION.md`
- 完成任务：勾选 `docs/TODO.md` + 同步 `docs/PROJECT_STATE.md`

## 参考文档（不作为执行入口）
- `docs/DESIGN_REFERENCE.md` - 设计稿与精确尺寸/色值
- `docs/UI_DESIGN.md` - 详情页布局与交互规范
- `docs/SCHEMA_VALIDATION.md` - PRD Schema 校验规则
- `docs/prd-images/` - 详情页设计稿

## 执行原则
- 所有任务必须带“验收标准”和“关联路径”
- UI 任务必须对照 `docs/prd-images/` 逐像素验证
- PRD Schema v1.1.0 是硬性约束
