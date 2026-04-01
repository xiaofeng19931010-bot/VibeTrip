# VibeTrip 开发约束 Harness (Development Harness)

本 Harness 基于“一人公司”原则与 Agent 原生架构（CLI/MCP）设定，旨在为 VibeTrip 项目建立不可逾越的**多维开发纪律**。在引入 AI 辅助编程（如 Cursor / Trae / GPT-4o）时，必须将此 Harness 作为全局 System Prompt 或 `.cursorrules` 的核心内容，确保 AI 生成的代码不偏离架构底线。

协议参考见：[a2ui-protocol.md](file:///Users/liam/trip/a2ui-protocol.md)

---

## 1. 架构与依赖底线 (Architecture & Dependencies)

- **语言单一化**：绝对禁止引入 TypeScript / Node.js 之外的后端语言（如 Python、Ruby、Go）。所有代码必须是 TypeScript。
- **A2UI 渲染器 (Shadcn + Tailwind) 优先**：项目为面向 Agent 的原生项目，**绝对禁止编写传统的固定路由页面或 CRUD 表单**。Web 端必须作为薄壳，遵循 A2UI 设计规范：`用户操作 → LLM 返回 A2UI 标准 JSON → Shadcn/Tailwind 动态解析渲染 → 用户操作`。所有组件（如行程卡片、按钮组）必须能响应 A2UI JSON 的指令并具备双向回传能力。
- **强制支持工具回调双向交互 (Interactive Tool Results)**：渲染的组件必须不仅仅是“只读卡片”。在行程规划、澄清问题等场景中，动态生成的组件内部必须有交互元素（按钮/选择器）。用户的点击行为必须通过 `addToolResult` (或对应的 Vercel AI SDK 方法) 实时传递给 LLM 作为执行结果，从而触发下一轮的智能编排。
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
- **Memory / Share 合同一致性**：
  - `memory_artifacts` 与 `share_packages` 的迁移文件、Supabase generated types、Zod schema、Repository 入参必须保持一致。
  - `captures` 的迁移文件、Supabase generated types、Zod schema、Repository 入参也必须保持一致，避免上传链路与记忆生成链路出现素材字段漂移。
  - 对于旅行记忆与分享内容包，默认以 `trip_id` 作为主归属键，不重复维护额外的归属字段；需要追溯用户时统一通过 `trip -> user_id` 解析，避免单体内多份归属真源漂移。
  - `captures.metadata` 禁止长期保持松散 `record` 结构，必须显式约束至少包含 `source`，并根据素材来源补充 `bucket/path/fileName/mimeType/size/publicUrl/originalPath/filename/storagePath/hasTranscription/pointCount/startTime/endTime`。
  - 素材入库禁止长期存在多套写法：Web、CLI、MCP、Capture Session 的持久化应尽量复用单一领域入口或共享底层 `persistCapture` 能力，避免规则漂移。
  - 素材入库语义必须分清：通用导入入口不得依赖 capture session；会话内采集入口必须显式表达 session 依赖，禁止把两类语义混在同一个外部接口名下。
  - `memory_artifacts.metadata` 禁止长期保持松散 `record` 结构，必须显式约束至少包含 `tripId/format/generatedAt/contentType/bucket/captureIds/captureCount/destination/role`。
  - `share_packages.metadata` 禁止长期保持松散 `record` 结构，必须显式约束至少包含 `tripId/channel/style/generatedAt`，并在存在旅行记忆产物时补充 `memoryArtifactId/memoryArtifactTitle/memoryArtifactUrl`。
- **A2UI 协议单一真源**：
  - A2UI JSON 协议必须以 Zod schema 形式定义在 `packages/core/schemas` 中，至少包含：`version`, `trace_id`, `interaction_id`, `view`, `actions`, `tool_call`, `tool_result`, `client_state`, `server_state`。
  - Web Renderer、CLI 和 MCP 在消费或输出交互结构时，必须共用同一份协议定义，禁止各自维护私有 JSON 格式。

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
- **A2UI 闭环验收**：
  - 任一动态卡片都必须通过验收链路：`LLM 返回 A2UI JSON → Renderer 渲染 → 用户点击/选择 → addToolResult 回传 → LLM 返回下一轮 A2UI JSON`。
  - 只读卡片不算完成；没有交互回传能力的组件不得进入主流程。

## 6. 动态 UI 生成约束 (Dynamic UI Generation Rules)

- **目标**：本节只保留 A2UI 动态界面生成的硬约束，不承载具体视觉主题实现细节。
- **允许的固定界面范围**：仅允许认证页、设置页、文件上传页、错误页和调试页使用固定 UI；业务流程页必须由 A2UI JSON 动态驱动。
- **Renderer 边界**：
  - Web 端只负责解析 `view/actions` 并渲染原子组件，不得在前端硬编码业务流程。
  - 渲染器允许维护少量原子组件：按钮、卡片、选择器、上传器、消息块、进度块。
- **交互 Runtime 边界**：
  - 所有按钮点击、单选、多选、上传、确认/取消，都必须转换为标准 `action payload`。
  - 只有纯视觉状态可留在本地；涉及业务推进的交互必须通过 `addToolResult` 或等效机制回传给 LLM。
  - `target=local` 与 `target=llm` 必须严格区分：本地动作不得误触发推理，请求级动作不得只停留在前端状态。
  - 上传型动作必须先通过受控上传接口完成文件落存，再将 `bucket/path/publicUrl` 等资产元数据回填到 `tool_result.uploadedAssets`，禁止把原始 File 对象直接塞进协议回传。
  - 上传型动作在进入素材确认卡片前，必须进一步写入真实 `captures` 持久化层，并把 `captureId` 或等价引用保存在后续 `server_state` 中；禁止只有 Storage 落存没有领域入库。
  - 素材确认卡片不得是纯展示；必须允许用户显式保留/剔除素材，并把最终保留集合以 `selected_capture_ids` 或等价字段透传给记忆生成链路。
  - 推荐实现拆层：`Renderer`（渲染）、`Registry`（节点映射）、`Envelope Builders`（服务端界面生成）、`Interaction Runtime`（回传闭环），禁止把所有逻辑塞进单个页面文件。
- **协议健壮性**：
  - 所有 A2UI JSON 在渲染前必须先经过 schema 校验。
  - 对 LLM 返回的 Markdown 包裹 JSON、空白字符、字段缺失要有容错预处理。
  - 上传类场景必须形成二段式界面：先上传，再返回素材确认界面；禁止“上传即默认确认”。
  - 生成类场景必须形成参数确认界面：例如旅行记忆生成前必须让用户确认模板/风格，禁止素材确认后直接开始后台生成。
  - 结果类场景必须形成显式结果卡片：例如 `generate_memory` 完成后必须先返回记忆结果卡片，再进入分享参数确认；禁止后台生成后直接跳转到下一业务阶段。
  - 分享类场景必须形成前置确认界面：例如 `generate_share` 前必须让用户确认渠道与文案调性，禁止直接按默认平台静默生成。
  - 当 `trip_id` 等关键上下文已存在时，Web Chat Runtime 必须优先调用真实 Core Service（如 `memoryService`、`shareService`）生成结果，再由 A2UI 渲染；禁止长期停留在前端拼装的假结果卡片阶段。
  - 当 `memory_artifact_id` 已存在时，分享链路必须显式把该 artifact 透传给 `shareService` 或等价领域服务，禁止只依赖 trip/captures 做“脱钩式”分享生成。

## 7. 实战错误总结与避坑指南 (Lessons Learned)

在项目的实际开发中，我们遇到并修复了以下核心错误，这些教训必须作为未来开发的硬性约束：

1. **数据库 Schema 与 Zod 验证不匹配**
   - **错误场景**：数据库使用 `DATE` 类型（如 `2026-03-30`），而 Zod schema 使用了 `.datetime()` 验证，导致数据保存时被 Zod 拦截报错。
   - **约束**：Zod schema 必须与数据库实际类型完全一致。对于 Postgres 的 `DATE` 类型，Zod 应使用简单的 `.string()` 或自定义的日期格式验证，而非强求 ISO datetime。

2. **外键关联与列缺失 (Schema Cache 踩坑)**
   - **错误场景**：在 Supabase 中通过 SQL 修改表结构（如给 `itinerary_items` 添加 `day_number` 列）后，应用立即报错 `Could not find the 'day_number' column`。
   - **约束**：Supabase 的 PostgREST 存在 schema 缓存（通常需要 5-10 分钟自动刷新）。在修改表结构后，如果通过 API 访问报错，应在 Supabase Dashboard 强制刷新缓存，或等待缓存过期。

3. **LLM 输出格式的不确定性 (Markdown 陷阱)**
   - **错误场景**：要求 LLM 输出 JSON，但 LLM 实际返回了带有 Markdown 代码块包裹的格式（如 \`\`\`json\n{...}\n\`\`\`），导致 `JSON.parse()` 崩溃。
   - **约束**：所有处理 LLM 结构化输出的代码，必须包含预处理逻辑，能够健壮地剥离 Markdown 代码块（正则匹配）并处理两端的空白字符，绝不能直接信任 `JSON.parse`。

4. **RLS 策略阻塞数据写入**
   - **错误场景**：在 MVP 测试阶段，使用 `anon_key` 写入数据时，因触发了未正确配置或默认封闭的 RLS 策略导致 `new row violates row-level security policy`。
   - **约束**：本地开发或 MVP 测试阶段，可以通过禁用 RLS 快速验证核心业务链路。但在正式上线前，必须设计完备的 RLS 策略，确保每个用户只能操作 `auth.uid() = user_id` 的数据。

5. **未正确处理空值 (Null vs Undefined)**
   - **错误场景**：TypeScript 接口定义为可选的 `number | undefined`，但传递给 Supabase/Zod 的值是 `null`，导致类型校验报错 `Expected number, received null`。
   - **约束**：在 Zod schema 中，如果数据库允许 NULL，必须显式声明 `.nullable().optional()`，在代码传参时要统一处理 `?? null` 或 `?? undefined` 的转换。

6. **Monorepo Vercel 部署配置冲突 (Next.js 14+ 陷阱)**
   - **错误场景**：在 pnpm workspace monorepo 中，为了部署 `apps/web` (Next.js 14 App Router) 而在根目录添加 `vercel.json` 使用 `builds` 配置，导致部署成功但访问报 404 `NOT_FOUND`，且提示 `Due to builds existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply`。
   - **约束**：对于 Next.js 14+ 的 Monorepo 项目，**绝对禁止**在项目根目录使用包含 `builds` 字段的 `vercel.json` 进行传统部署。必须直接在 Vercel 控制台（或通过 API/CLI）将项目的 **Root Directory** 设置为子应用目录（如 `apps/web`），由 Vercel 自动推断并执行 Monorepo 根目录的依赖安装与子目录构建。

## 8. AI 辅助编程法则 (AI Coding Rules)

*注：将此段落喂给 Cursor/Trae 等 AI 助手*

1. **先看 Schema，再写逻辑**：实现任何功能前，先去 `packages/core/schemas` 查找或定义 Zod schema，再开始写实现代码。
2. **避免传统 UI 思维**：在前端开发中，**禁止创建固定的表单组件**。所有业务卡片（如：行程预览、选项确认）必须作为 Generative UI 的 `toolInvocation` 渲染产物，且**必须包含双向交互能力**（通过 `addToolResult` 返回用户操作结果给 LLM），绝不仅仅是只读视图。
3. **避免过度抽象**：不需要写复杂的面向对象继承（如 Abstract Base Class），多用纯函数（Pure Functions）和组合模式，保持代码极简。
4. **保持状态机清晰**：在修改 Trip 或 Itinerary 状态时，不要散落式地 update，必须调用 `packages/core` 中统一的状态流转函数（State Machine）。
5. **拒绝“假设性修复”**：如果发现类型不匹配或逻辑缺失，**停下来询问或直接去修复根源**，不要在当前文件里写临时补丁（Workaround）。
