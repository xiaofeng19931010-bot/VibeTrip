# single-app 参考模板

本文件提供可复制的段落模板，便于在不同项目快速套用。

## Harness 章节模板

### 架构与依赖底线

- 语言：全栈 TypeScript（禁止新增其他后端语言）。
- 基础设施：Supabase（DB/Auth/Storage）+ Serverless 任务（Inngest/Trigger.dev）。
- 单体核心：所有业务逻辑在 `packages/core`，多端复用；禁止内部服务间 HTTP。

### 类型与合同

- `tsconfig`：`strict: true`、`noUncheckedIndexedAccess: true`、`exactOptionalPropertyTypes: true`。
- Schema：Zod 单一真源，类型通过 `zod.infer` 生成。
- DB Types：从 Supabase 自动生成，禁止手改。

### 错误与可观测

- 统一错误码 + 对外隐藏内部栈。
- `trace_id` 全链路贯穿。
- 结构化日志与最小审计表。

### 安全与权限

- RLS 开启且有测试。
- API Key/Token 鉴权 + 限流。

### 质量与验收

- No Tests No Merge。
- LLM 用 Golden tests。
- E2E 覆盖关键路径。

### 发布纪律

- 迁移与回滚策略。
- MCP/CLI/Web 版本一致性。

### AI 协作规则

- 先 Schema 后逻辑。
- 禁止 any/@ts-ignore。
- 避免过度抽象。

## Dev Tasks 任务ID 建议命名

- `D0.x` 工程与约束
- `D1.x` Core 领域与持久化
- `D2.x` MCP/CLI
- `D3.x` 采集与素材
- `D4.x` 生成与分享
- `D5.x` 安全/质量
- `D6.x` 文档/发布

