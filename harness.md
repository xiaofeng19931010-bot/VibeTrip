# VibeTrip 开发约束 Harness (Development Harness)

本 Harness 基于“一人公司”原则与 Agent 原生架构（CLI/MCP）设定，旨在为 VibeTrip 项目建立不可逾越的**多维开发纪律**。在引入 AI 辅助编程（如 Cursor / Trae / GPT-4o）时，必须将此 Harness 作为全局 System Prompt 或 `.cursorrules` 的核心内容，确保 AI 生成的代码不偏离架构底线。

---

## 1. 架构与依赖底线 (Architecture & Dependencies)

- **语言单一化**：绝对禁止引入 TypeScript / Node.js 之外的后端语言（如 Python、Ruby、Go）。所有代码必须是 TypeScript。
- **BaaS 优先**：禁止在本地或云端手写 `docker-compose.yml` 部署数据库、Redis、MQ 等基础设施。
  - **数据库/鉴权/存储**：只能使用 Supabase API，禁止直连原生 Postgres 协议绕过 RLS（Row Level Security）。
  - **异步队列**：只能使用 Inngest 或 Trigger.dev，禁止引入 BullMQ、Celery 等需要 Redis 的传统队列。
- **单体核心 (Monolith Core)**：`packages/core` 必须是纯粹的业务逻辑库（Library）。
  - 内部绝对禁止使用 HTTP/REST/gRPC 互相调用。
  - `apps/mcp-server` 和 `apps/cli` 必须直接 `import` 并调用 `core` 中的函数。
- **LLM 接入收敛**：所有模型调用必须通过 `Vercel AI SDK` 进行，禁止直接手写 `fetch` 请求 OpenAI/Anthropic 原生接口。

## 2. 类型与合同约束 (Types & Contracts)

- **Strict TypeScript**：
  - `tsconfig.json` 必须开启 `strict: true`、`noUncheckedIndexedAccess: true`、`exactOptionalPropertyTypes: true`。
  - 遇到类型报错，**绝对禁止使用 `@ts-ignore`、`@ts-expect-error` 或 `any`** 强行绕过，必须从根本上修复类型定义。
- **单一真源 (Single Source of Truth)**：
  - 所有的领域模型（Trip, Itinerary 等）、API 入参、MCP Tool 的入参，必须且只能在 `packages/core/schemas` 中使用 **Zod** 定义。
  - TypeScript 的 `type` 或 `interface` 必须通过 `zod.infer<typeof schema>` 自动推导，禁止双写。
- **数据库类型自动同步**：
  - 数据库表结构变更后，必须执行 `supabase gen types typescript` 覆盖本地文件，禁止手动修改 `database.types.ts`。

## 3. 错误处理与日志纪律 (Error Handling & Observability)

- **错误收敛**：
  - `packages/core` 抛出的错误必须继承自自定义的 `VibeTripError`（包含 `code`, `message`, `details`）。
  - MCP Server 和 API 边界必须有一层全局 Try-Catch 拦截器，将 `VibeTripError` 转换为标准的响应格式，**严禁将数据库敏感报错或 Stack Trace 暴露给外部调用方**。
- **可观测性 (Traceability)**：
  - 所有跨组件请求（如 CLI -> MCP，或 Web -> Core -> LLM）必须生成并透传 `trace_id`。
  - 日志必须是结构化 JSON 格式，至少包含：`timestamp`, `level`, `trace_id`, `user_id/app_id`, `action`。

## 4. 安全与权限红线 (Security & Auth)

- **RLS 兜底**：Supabase 中所有业务表（Trips, Captures 等）必须开启 Row Level Security (RLS)。确保即使业务层存在漏洞，用户也绝对无法越权读取他人的行程数据。
- **最小权限原则**：MCP Server 对外暴露的 Tools 在执行写操作（如 `persist_trip`, `ingest_media`）前，必须校验当前 `api_key` 的配额与权限范围。
- **LLM 秘钥安全 (BYOK)**：当支持用户传入自定义大模型 API Key 时，**绝对禁止明文落库存储**。Key 仅允许存在于当前请求的内存中；如业务强需持久化，必须使用加密 KMS 方案或严格的端到端加密机制。
- **防注入 (Prompt Injection)**：所有来自用户的“一句话规划”输入，在拼接进 System Prompt 之前，必须进行基础的敏感词/越权指令清洗。
- **内容与版权红线**：MVP 阶段 BGM 仅输出“推荐/播放列表/链接”，默认不下载与内嵌到产物中；仅处理用户上传的照片/音频素材。

## 5. 质量与验收红线 (Quality & Testing)

- **无测试不合并 (No Tests, No Merge)**：
  - `packages/core` 中的核心业务逻辑（特别是“角色策略引擎”和“状态机”）必须有 100% 的单元测试覆盖率。
  - 增加新的 MCP Tool 前，必须先在 `packages/core/schemas` 写好 Zod 测试。
- **Golden Test 策略**：
  - 对于 LLM 输出这种非确定性结果，必须录制一套标准的“Golden Data”（如针对不同角色的标准行程输出结构），在 CI 中验证 schema 解析和降级路径是否永远不会崩溃。
- **本地零配置启动**：
  - 新人（或换电脑后的你）拉下代码后，执行 `pnpm install && pnpm dev` 必须能直接跑起全套服务（结合 Supabase local），禁止需要复杂的手动环境变量配置。

## 6. AI 辅助编程法则 (AI Coding Rules)

*注：将此段落喂给 Cursor/Trae 等 AI 助手*

1. **先看 Schema，再写逻辑**：实现任何功能前，先去 `packages/core/schemas` 查找或定义 Zod schema，再开始写实现代码。
2. **避免过度抽象**：不需要写复杂的面向对象继承（如 Abstract Base Class），多用纯函数（Pure Functions）和组合模式，保持代码极简。
3. **保持状态机清晰**：在修改 Trip 或 Itinerary 状态时，不要散落式地 update，必须调用 `packages/core` 中统一的状态流转函数（State Machine）。
4. **拒绝“假设性修复”**：如果发现类型不匹配或逻辑缺失，**停下来询问或直接去修复根源**，不要在当前文件里写临时补丁（Workaround）。
