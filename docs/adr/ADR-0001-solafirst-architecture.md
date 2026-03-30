# ADR-0001: VibeTrip 极简架构决策

**状态**: 已接受
**日期**: 2026-03-30

## 背景

VibeTrip 是一个面向"一人公司（Solo Founder）"的 AI 原生旅行应用，需要在极简运维负担下交付完整功能。传统架构（自建 Postgres + Redis + Sidekiq + REST API）会带来显著的运维复杂度和成本。

## 决策

### 1. 单体核心（packages/core）

所有业务逻辑集中在 `packages/core`，供 MCP Server、CLI 和 Web 直接导入。**禁止在内部服务间使用 HTTP 调用**。

**理由**：
- 消除服务间通信开销（序列化/反序列化/网络延迟）
- 单一代码库，单一真源，一人维护
- 便于测试和调试

### 2. 全栈 TypeScript

废弃 Ruby/Sorbet，所有组件统一使用 TypeScript。

**理由**：
- 统一的类型系统、工具链和生态系统
- 便于代码复用（schemas、utilities）
- AI 辅助开发效率最大化

### 3. BaaS 基础设施

- **数据库/鉴权/存储**: Supabase (Postgres + Auth + Storage)
- **禁止自建** Postgres、Redis、Sidekiq、S3

**理由**：
- Serverless 友好，无需运维服务器
- 按使用量付费，成本可控
- 内置 Auth 和 RLS，安全性有保障

### 4. 异步任务与队列

采用 Trigger.dev（或 Inngest）替代 Sidekiq/Redis。

**理由**：
- Serverless 友好的后台任务
- 内置重试、幂等和监控
- 无需维护 Redis

### 5. 部署策略

- **前端/CLI**: Vercel
- **MCP Server**: Cloudflare Workers 或 Vercel Edge Functions
- **禁止** Docker/Kubernetes 自建

**理由**：
- 极简部署，零运维
- 全球边缘分发
- 按请求计费

### 6. MCP/CLI 架构

MCP Server 与 Core 逻辑同构（在同一个包中），CLI 直接调用本地 Core 逻辑或远程 MCP 接口。

**理由**：
- 复用同一套业务逻辑
- 支持 stdio（本地/CLI）和 SSE/HTTP（远程）两种模式
- 符合 Agent 原生设计

### 7. BYOK (Bring Your Own Key) 安全策略

外部 LLM 秘钥（OpenAI/Anthropic/DeepSeek 等）的流转必须遵循以下原则：

**核心原则**：
- **禁止落库存储**：用户提供的 API Key 严禁写入数据库
- **内存级传递**：Key 仅在请求生命周期内存在于内存
- **传输加密**：所有 Key 必须通过 TLS/HTTPS 传输
- **日志脱敏**：日志中禁止出现 Key 内容

**实现要求**：
1. CLI/MCP 接受用户通过 `--api-key` 传入自定义 Key
2. Key 仅传递给 LLM 服务调用层，不持久化
3. 若必须存储（可选功能），必须使用 KMS 或端到端加密
4. 服务端不存储用户 Key，仅存储 Key 的哈希用于验证

**降级路径**：
- 未配置 Key 时，返回澄清问题清单 + 基础模板行程骨架
- 确保核心流程可跑，保证用户体验

**安全防护**：
- 提示注入基础防护
- 敏感信息（信用卡、密码等）自动剥离

## 约束

1. **禁止引入新的基础设施依赖**（如 Redis、RabbitMQ、自建 Postgres）
2. **禁止在内部服务间使用 REST API 通信**
3. **所有配置必须通过环境变量注入**
4. **必须实现 trace_id 贯穿整个请求链路**
5. **禁止将用户 API Key 写入数据库**
6. **所有日志必须脱敏，不得包含敏感信息**

## 后果

**正面**：
- 运维成本极低
- 开发效率高
- 部署简单

**负面**：
- 供应商锁定（Supabase、Trigger.dev）
- 冷启动延迟（Serverless）
- 复杂查询受限（需要优化 Supabase 查询）
