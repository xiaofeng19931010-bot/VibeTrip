# VibeTrip 明细开发任务清单（一人公司极简架构，Agent 原生 CLI/MCP）

本清单基于 [trip.md](file:///Users/liam/trip/trip.md) 的方案，按照**“一人公司（Solo Founder）”**原则重构。目标是：**保持功能需求完全不变，但将运维成本、技术栈复杂度、部署心智负担降到最低。**

## 技术约束（一人公司极简落地）

- **语言收敛（全栈 TypeScript）**：废弃 Ruby/Sorbet。所有组件（Core、MCP Server、CLI、Web）统一使用 TypeScript（Node.js/Edge）。一份代码，一种生态，一人维护。
- **BaaS 化基础设施**：废弃自建 Postgres/Sidekiq/S3。全面拥抱 Serverless 与 BaaS。
  - 数据库/鉴权/存储：**Supabase**（Postgres + Auth + Storage）。
  - 异步任务与队列：**Inngest** 或 **Trigger.dev**（Serverless 友好的后台任务，无需维护 Redis）。
  - 部署：Vercel / Cloudflare 部署前端与 MCP Server（HTTP）。
- **MCP/CLI 架构**：MCP Server 与 Core 逻辑同构（在一个包里），CLI 直接调用本地 Core 逻辑或远程 MCP 接口，消除内部 REST API 带来的序列化与通信开销。

## 仓库结构（Monorepo）

- `packages/core/`：核心业务逻辑、Supabase 客户端封装、AI 编排（单人维护的单一真源）。
- `apps/mcp-server/`：TypeScript MCP Server（SSE/HTTP 部署在 Vercel/Edge，stdio 供本地使用）。
- `apps/cli/`：TypeScript CLI（引用 `core` 或调用远端 MCP）。
- `apps/web/`：TypeScript Web（Next.js，直接与 Supabase 和 `mcp-server` 交互）。

---

## 任务总览（按一人开发流）

|顺序|任务ID|模块|任务|产出|
|---:|---|---|---|---|
|1|D0.1|工程|建立 monorepo 结构与工具链|目录结构、CI、lint/test 可跑|
|2|D0.2|工程|全栈 TS 落地与 Supabase 初始化|环境就绪、鉴权可通|
|3|D0.3|合同|定义统一数据模型（Zod）|`Trip/Itinerary/Capture/Memory/Share` schema|
|4|D0.4|工程|一人公司极简架构记录（ADR）|固化 Serverless 选型|
|5|D1.1|Core|实现 Trip/Itinerary/Capture 的持久化与状态机|DB schema + Repository + 状态流转|
|6|D1.2|Core|实现“角色策略引擎”（参数化 + 冲突优先级）|可配置策略、单测覆盖|
|7|D1.3|Core|实现“一句话规划”编排（LLM + 降级 + BYOK）|`plan_trip` 核心链路跑通，支持传 Key|
|8|D1.4|Core|异步任务与存储基建（Serverless）|队列/幂等/存储约定|
|8.5|D1.5|Core|偏好学习引擎：用户纠偏行为记录与画像更新|记录手动修改并持久化偏好|
|9|D2.1|MCP|实现 MCP Server 框架（stdio + SSE/HTTP）|可被 Cursor/Claude 挂载|
|10|D2.0|Security|最小安全骨架（鉴权/限流/错误码）|可安全联调、可控成本|
|11|D2.2|MCP|实现最小 8 个 MCP Tools（直调 Core）|工具可用、复用 core|
|12|D2.3|CLI|实现 CLI 命令（复用 MCP）|`vibetrip plan/capture/memory/share`|
|12.2|D2.4|Web|实现最小 Web 动态 GUI (A2UI)|流式渲染规划结果与对话界面|
|12.5|D2.5|Web/MCP|氛围感适配器：目的地/角色关联主题色与BGM|UI 主题配置与音乐推荐接口|
|13|D3.1|Capture|自动记录：采集策略与数据来源（MVP）|start/stop/status + 策略配置|
|14|D3.2|Capture|媒体采集：照片/语音/笔记 ingest 流程|素材入库、引用可追溯|
|14.5|D3.3|Capture|停留点识别算法：从坐标到行程摘要的聚合|基于时间与距离的聚类算法|
|15|D4.1|Memory|旅行记忆 MVP：图文手账/长图生成|`generate_memory` 可产出文件|
|16|D4.2|Share|一键分享：渠道模板 + 文案生成 + 素材打包|`generate_share` 可交付内容|
|16.5|D4.3|Web|角色化 UI 响应式开发：长辈大字号/情侣浪漫主题|不同角色下 UI 动态切换|
|17|D5.1|Security|对外开放增强：审计/权限边界/灰度|Key 管理、审计追溯、灰度策略|
|18|D5.2|Quality|端到端联调测试（CLI→Core→Supabase）|E2E 测试通过、覆盖核心路径|
|19|D6.1|Docs|开发者文档：MCP 接入、CLI 用法、合同说明|可复制粘贴对接|
|20|D6.2|Release|灰度发布与监控（日志/告警/指标）|可观测性面板、灰度流程|
|21|D6.3|Release|运营活动与种子用户反馈|配置运营策略并支持分析反馈|

---

## 明细任务（可直接建 Jira/Linear）

### D0.1 建立 monorepo 结构与工具链

- 任务内容
  - 使用 Turborepo 或 pnpm workspace 初始化 monorepo。
  - 建立基础 CI：格式化 (Prettier)、lint (ESLint)、单测 (Vitest)、类型检查。
- 完成标准
  - `packages/core`、`apps/mcp-server`、`apps/cli`、`apps/web` 骨架建立，可独立编译。
  - CI 能在 PR 中执行并失败阻断。

### D0.2 全栈 TS 落地与 Supabase 初始化

- 任务内容
  - TypeScript：全仓开启 `strict`、`noUncheckedIndexedAccess`。
  - **基础设施初始化**：在 Supabase 创建项目，配置本地开发环境 (`supabase init`)，导出 Database Types。
- 完成标准
  - CI 中包含 `tsc --noEmit`。
  - Core 可以无缝使用生成的 Supabase 类型与数据库通信。

### D0.3 定义统一数据模型（Zod）

- 任务内容
  - 在 `packages/core/schemas` 定义 zod schema（TS 单一真源）：
    - `Trip`、`Itinerary`、`ItineraryItem`、`Capture`、`MemoryArtifact`、`SharePackage`。
- 完成标准
  - Web/CLI/MCP 共用一份 Schema 校验输入。

### D0.4 一人公司极简架构记录（ADR）

- 任务内容
  - 以 ADR 形式固化极简选型：
    - **单体核心**：所有业务逻辑写在 `packages/core`，供 MCP、CLI 和 Web 直接导入，**废弃内部 REST API**，消除服务间通信开销。
    - **BaaS 依赖**：全盘使用 Supabase (DB/Auth/Storage)。
    - **异步与队列**：采用 Serverless 方案（如 Inngest/Trigger.dev），不维护 Redis。
    - **BYOK (Bring Your Own Key) 策略**：明确外部 LLM 秘钥的流转边界，仅允许在请求生命周期内驻留内存，或通过端到端加密/KMS 存储，保障开发者安全接入自由的 LLM。
- 完成标准
  - 架构决策文档明确并指导后续开发，消除运维与安全焦虑。

### D1.1 Core：持久化与状态机（基于 Supabase）

- 任务内容
  - 使用 Supabase CLI 编写并执行迁移文件 (SQL)：Trips、Itineraries 等。
  - 在 `packages/core` 中实现 Repository 模式，封装 Supabase 客户端。
  - 状态机：`draft → planned → traveling → completed → archived`。
- 完成标准
  - 具备单测，可以直接连接本地 Supabase 容器跑通增删改查。

### D1.2 Core：多角色策略引擎（参数化 + 冲突优先级）

- 任务内容
  - 定义 `RoleProfile`（parents/family/couple/friends/soldier 等）与可配置策略项：
    - 节奏（每天活动数）、步行强度、起床/午休、预算分配、无障碍、亲子设施、浪漫偏好、拍照机位。
  - 规则冲突优先级：用户明确指令 > 角色策略 > 通用安全规则。
  - 支持旅途中切换角色并自动重算。
- 完成标准
  - 给定同一输入，不同角色输出明显不同（可用 golden test 验证）。

### D1.3 Core：一句话规划编排（LLM + 降级 + BYOK 安全接入）

- 任务内容
  - 输入：自然语言 + 可选 role + 天数/预算。
  - 输出：结构化行程（按天分组），并通过 Supabase 落库。
  - 引入 Vercel AI SDK：统一对接 OpenAI/Claude/DeepSeek 等。
  - **BYOK (Bring Your Own Key) 安全机制**：支持开发者/用户传入自己的 LLM API Key，该 Key 必须在客户端或内存中传递，**禁止落库存储**（若必须存储，须采用 KMS 或端到端加密机制）。
  - **无 Key 降级路径**：当未配置系统默认 LLM 且用户未传入自定义 Key 时，返回“澄清问题清单 + 基础模板行程骨架”（规则驱动），保证核心流程可跑。
  - 安全防护：提示注入基础防护、敏感信息剥离。
- 完成标准
  - 本地可完成一次端到端规划并保存到 DB。
  - 支持传入自定义 `api_key` 并成功路由至对应模型（如 OpenAI 或 Claude）。
  - `OPENAI_API_KEY`（或其他 Provider Key）缺失时给出明确错误与降级路径。
  - 降级输出必须可落库且可渲染：至少返回 `questions`（≥3 条澄清问题）与 `itinerary`（按天分组的骨架项，包含最少的交通/住宿/景点占位）。

### D1.4 Core：异步任务与存储基建（Serverless）

- 任务内容
  - 异步任务框架落地：集成 Inngest 或 Trigger.dev，定义任务幂等键与重试策略（替代 Sidekiq）。
  - 产物与素材存储约定：
    - 直接使用 Supabase Storage API 进行上传/下载。
  - 建立 `Artifacts` 与 `AuditLogs` 的写入路径（生成/分享均写审计）。
- 完成标准
  - `generate_memory`/`generate_share` 可通过 Serverless 异步执行并可查询状态。

### D1.5 Core：偏好学习引擎

- 任务内容
  - 记录用户对系统生成行程的纠偏行为（如：修改起床时间、替换景点）。
  - 将纠偏数据持久化为用户的长期画像（Preferences），用于指导后续规划。
- 完成标准
  - 用户修改行程后，后续相同角色的规划会自动应用该偏好。

### D2.1 MCP：实现 MCP Server 框架（stdio + SSE/HTTP）

- 任务内容
  - 使用 `@modelcontextprotocol/sdk`（TypeScript）。
  - 支持 stdio（供本地 CLI/Cursor 挂载）与 SSE/HTTP（部署在 Vercel Edge 供远端调用）。
- 完成标准
  - 能在支持 MCP 的 Agent 中成功列出 tools 并完成一次调用。

### D2.0 Security：最小安全骨架（鉴权/限流/错误码）

- 任务内容
  - 鉴权：利用 Supabase Auth 或自定义 API Key 校验（部署在 Edge 端）。
  - 限流：使用 Upstash/Vercel KV 进行基础限流。
  - 错误码：建立统一错误码表。
  - 追踪与审计：
    - 所有请求生成并贯穿 `trace_id`（CLI/MCP/Web/Core/DB）。
    - 写入最小审计记录（Supabase `audit_logs`）：`trace_id`, `actor_type`, `actor_id`, `tool_name`, `trip_id`, `status`, `cost_ms`。
- 完成标准
  - 未授权调用被拒绝；限流命中可观察。
  - 任一 MCP Tool 调用在审计表中可追溯到一次完整链路。

### D2.2 MCP：实现最小 8 个 MCP Tools（直调 Core）

- 工具清单（MVP）
  - `plan_trip`
  - `revise_itinerary`
  - `persist_trip`
  - `start_capture`
  - `stop_capture`
  - `ingest_media`
  - `generate_memory`
  - `generate_share`
- 完成标准
  - 每个工具直接 `import` 并调用 `packages/core` 的业务逻辑，无中间 HTTP 请求开销。

### D2.3 CLI：实现 CLI（复用 MCP）

- 任务内容
  - `vibetrip plan "…" --role parents|family|couple --days 3 --budget 5000 --model claude-3-5-sonnet --api-key sk-...`
  - `vibetrip trip save|show|export`
  - `vibetrip capture start|stop|status`
  - `vibetrip media ingest <paths...> --trip <trip_id>`
  - `vibetrip memory generate --format handbook|poster`
  - `vibetrip share generate --channel xhs|moments`
- 完成标准
  - CLI 默认走 stdio MCP（本地），可切换远程 MCP 地址。
  - CLI 支持直接通过 `--api-key` 和 `--model` 传入用户自定义 LLM 凭证。

### D2.4 Web：实现最小 Web 动态 GUI (A2UI)

- 任务内容
  - 基于 Next.js 与 Vercel AI SDK 实现对话式 UI。
  - 实现流式渲染（Streaming UI），在 LLM 规划行程时，动态展示规划过程与卡片。
  - 支持“一句话规划”的 Web 端输入，并优雅降级处理澄清问题（Clarifying Questions）。
- 完成标准
  - 用户可在浏览器中输入自然语言，实时看到行程卡片的动态生成。

### D2.5 Web/MCP：氛围感适配器

- 任务内容
  - 根据目的地和所选角色，计算并返回推荐的 UI 主题色。
  - 提供与场景匹配的 BGM（背景音乐）推荐列表/播放链接。
- 完成标准
  - API 或工具能够返回包含色彩和音乐链接的元数据包。

### D3.1 Capture：自动记录（低功耗 + 隐私）

- 任务内容
  - 定义采集策略：低频定位、地理围栏、停留点聚合、防抖。
  - 权限与隐私：用户授权文案、随时暂停、数据删除/导出。
  - 记录结构：位置点/停留点/时间范围。
  - **MVP 数据来源定义**（避免依赖原生 App）：
    - 优先：照片导入（EXIF 时间/地点）+ 手动补充点位/心情
    - 可选：导入 GPX/轨迹文件
    - 后续：原生 App 或系统定位接入（不阻塞 MVP）
  - 默认入口明确：Web 提供“上传照片/导入 GPX”的入口；CLI 提供 `ingest_media` 对应命令，保证用户知道从哪里开始记录。
- 完成标准
  - 记录可回放为“当天轨迹摘要”（不要求地图 UI，先数据正确）。

### D3.2 Capture：媒体 ingest（照片/语音/笔记）

- 任务内容
  - 照片：提取 EXIF 时间/地理位置（如有），建立与 Trip 的关联。
  - 语音：转写（可选）、时间戳与摘要。
  - 笔记：结构化存储（markdown/plain）。
- 完成标准
  - `ingest_media` 返回素材引用 ID，可用于记忆生成。

### D3.3 Capture：停留点识别算法

- 任务内容
  - 开发轨迹聚合算法：将密集的 LBS 坐标点或照片 EXIF 坐标，基于时间窗口和空间距离聚类为“停留点”。
  - 关联行程：将识别出的停留点与原计划的 Itinerary 匹配对比。
- 完成标准
  - 输入一组原始坐标与时间，输出结构化的“实际访问景点/地点”列表。

### D4.1 Memory：旅行记忆 MVP（图文手账/长图）

- 任务内容
  - MVP 仅做图文：按天自动挑选“停留点+照片+一句话感受”。
  - 模板系统：按角色选择手账模板（亲子更活泼、情侣更浪漫、带父母更温和大字）。
  - 产物存储：使用 Supabase Storage（生成可下载 URL），并在 `artifacts` 表写入元数据。
- 完成标准
  - `generate_memory` 输出可下载的文件路径/URL + 元数据。

### D4.2 Share：一键分享（小红书/朋友圈）

- 任务内容
  - 渠道模板：标题、正文结构、标签、emoji 风格开关。
  - 文案生成：基于 itinerary+captures+memory 产物，生成 2-3 版备选。
  - 素材打包：长图+封面+文案 JSON。
- 完成标准
  - `generate_share` 返回可直接复制发布的内容包。

### D4.3 Web：角色化 UI 响应式开发

- 任务内容
  - 实现基于角色偏好的动态 UI：如“带父母”模式的超大字号和高对比度；“情侣”模式的浪漫色调。
  - 将 D2.4 的氛围感主题色和 BGM 挂载到前端页面。
- 完成标准
  - Web 端在切换角色时，界面视觉与交互排版发生明显针对性改变。

### D5.1 Security：对外开放增强（审计/权限边界/灰度）

- 任务内容
  - API Key 机制（按用户/应用）。
  - 审计日志（谁在何时调用了什么工具、参数摘要、结果摘要）。
  - 权限边界：tool 能访问的数据范围（按 trip_id/user_id）。
  - 灰度策略：按 API Key 分组开放新工具/新模型/新模板。
- 完成标准
  - 审计可追溯；权限隔离可验证；灰度可开关且可回滚。

### D5.2 Quality：端到端联调测试（CLI→Core→Supabase）

- 任务内容
  - 合同测试：schema 变更触发兼容性检查。
  - E2E 流程：plan → persist → start_capture → ingest_media → generate_memory → generate_share。
- 完成标准
  - CI 中 E2E 全绿；核心业务路径完全被单测/集成测试覆盖。

### D6.1 Docs：开发者文档（MCP 接入/CLI/合同）

- 任务内容
  - MCP：如何挂载、如何鉴权、tool 列表与示例。
  - CLI：常用命令与输出示例。
  - 合同：字段解释、错误码。
- 完成标准
  - 开发者从零到调用成功 ≤ 10 分钟。

### D6.2 Release：灰度发布与监控

- 任务内容
  - 日志：结构化日志（trace_id/tool_name/user_key）。
  - 指标：调用量、延迟、错误率、LLM 成本、限流命中。
  - 灰度：按 API Key 灰度开放。
- 完成标准
  - 可定位线上问题、可回滚、可控制成本。

### D6.3 Release：运营活动与种子用户反馈

- 任务内容
  - 开发简单的裂变或激励机制（如：分享行程获得额外 LLM 额度）。
  - 配置数据看板，收集并分析首批 100 名核心用户的使用路径与反馈。
- 完成标准
  - 产出首批用户数据分析报告，并输出下一迭代（V1.1）的需求池。
