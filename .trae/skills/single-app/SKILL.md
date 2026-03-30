---
name: single-app
description: 生成“一人公司/Solo Founder”应用开发的 Harness（多维约束）与按顺序的明细开发任务。用户提到“一人公司/极简架构/Serverless/开发计划/任务拆解/roadmap/harness/约束条件”时使用。
---

# single-app

为“一人公司（Solo Founder）”场景生成**可直接执行**的开发计划与多维约束（Harness）。该 Skill 适用于任何应用项目：从 0 到 1 的 MVP、Agent 原生（CLI/MCP）产品、或需要极简运维/Serverless 的全栈应用。

## 产出物（默认生成 2 个文件）

- `harness.md`：开发过程的多维约束条件（架构底线、类型/合同、质量、安全、发布纪律、AI 协作规则）。
- `dev_tasks.md`：按顺序排列的明细开发任务（可直接拷贝到 Jira/Linear）。

如果用户只要其中之一，也可以只生成单文件。

## 适用触发词

- “一人公司原则/solo founder/单人开发/极简架构/低运维”
- “生成开发任务/roadmap/排期/计划任务/任务拆解”
- “生成 harness/约束条件/开发纪律/红线”

## 工作流（你必须严格遵守）

### 1) 先收集输入（不足就用默认假设，不要反问）

从用户消息与仓库上下文提取以下信息：

- 应用名称与领域（如旅行、记账、CRM）
- **必须保留的功能需求**（用户明确说“保持功能不变”时，禁止删减功能）
- 交互形态：Web / Mobile / CLI / MCP / Browser Extension
- 集成：支付、地图、日历、存储、第三方 API
- 合规/隐私：定位、相册、语音、个人信息

默认假设（用户没说就按这个）：

- 全栈 TypeScript，Serverless + BaaS（Supabase 优先）
- `packages/core` 单体核心被多端复用（Web/CLI/MCP）
- LLM 调用统一走单一 SDK（如 Vercel AI SDK），必须有无 Key 降级

### 2) 定义“不可逾越底线”（Harness 的核心）

你必须把以下维度写进 `harness.md`（可增删细节，但不可缺省）：

- 架构与依赖底线：语言收敛、BaaS/Serverless、禁止自建基础设施、禁止内部服务间 HTTP
- 类型与合同：TS strict、Zod 单一真源、数据库类型自动生成
- 错误与可观测：错误码统一、`trace_id` 贯穿、结构化日志
- 安全与权限：RLS/最小权限、鉴权/限流、审计日志
- 质量与验收：No Tests No Merge、Golden tests（对 LLM 不确定性）、E2E 关键路径
- 发布纪律：MCP/CLI/Web 版本对齐、迁移策略、回滚策略
- AI 协作规则：先写 schema 再写逻辑、拒绝 any/@ts-ignore、避免过度抽象

### 3) 输出“可直接执行”的任务清单（dev_tasks）

你必须输出两层结构：

1. **任务总览表**：按严格执行顺序排列（编号 1..N），每行包含：`顺序/任务ID/模块/任务/产出`。
2. **明细任务**：每个任务必须包含：
   - `任务内容`：3-8 条、可执行动作
   - `完成标准`：2-5 条、可验收指标

任务拆解必须覆盖（按最小可交付顺序）：

- 工程初始化（monorepo、CI、lint/test、tsconfig strict）
- 合同/schema（Zod）与数据库迁移（Supabase）
- Core：领域模型、状态机、策略引擎、持久化
- Agent 原生：MCP Server（stdio+SSE/HTTP）、最小工具集、CLI
- 隐私敏感功能（如定位/相册/语音）要单独任务并写清楚默认策略
- 生成类功能（记忆/分享/导出）优先做“图文/结构化输出”，重型视频后置
- 安全：最小鉴权/限流/审计必须在对外开放前完成
- 端到端联调测试与文档

### 4) 强制一致性检查

在输出前做一次自检（写在 dev_tasks 最末尾的“自检”小节）：

- 是否有“功能被删减/变更”的情况（必须为否）
- 是否存在“内部 HTTP 调用 Core”的设计（必须为否）
- 是否给 LLM 功能写了“无 Key 降级验收口径”（必须为是）
- 是否定义了 `trace_id` 与 `audit_logs` 最小字段（必须为是）

## 输出格式要求

- 默认中文输出（除非用户明确要求英文）。
- 不要给概念性空话；每条任务必须可直接执行。
- 文件名固定：`harness.md` 与 `dev_tasks.md`。

## 快速示例

用户："请按一人公司原则，为一个带 CLI/MCP 的应用生成 harness 和明细开发任务"

你：
- 生成 `harness.md`
- 生成 `dev_tasks.md`
- 在 `dev_tasks.md` 末尾附上“自检”结果
