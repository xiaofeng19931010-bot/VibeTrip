# VibeTrip A2UI 协议草案

本协议用于统一 VibeTrip 的 **CLI / MCP / Web Renderer** 之间的动态界面交互格式。目标不是定义传统页面，而是定义一套可由 LLM 输出、由渲染器解析、并由用户操作驱动下一轮推理的 **A2UI JSON 闭环协议**。

当前 Zod Schema 草案已落地到：[a2ui.ts](file:///Users/liam/trip/packages/core/src/schemas/a2ui.ts)

当前最小实现已落地到：

- Renderer：[a2ui-renderer.tsx](file:///Users/liam/trip/apps/web/src/components/a2ui-renderer.tsx)
- Renderer Registry：[a2ui-registry.tsx](file:///Users/liam/trip/apps/web/src/components/a2ui-registry.tsx)
- Envelope Builders：[a2ui-builders.ts](file:///Users/liam/trip/apps/web/src/lib/a2ui-builders.ts)
- Chat Runtime：[route.ts](file:///Users/liam/trip/apps/web/src/app/api/chat/route.ts)
- Upload Runtime：[route.ts](file:///Users/liam/trip/apps/web/src/app/api/upload/route.ts)

---

## 1. 闭环定义

标准交互流必须遵循：

`用户操作 → LLM 返回 A2UI JSON → Renderer 渲染 view/actions → 用户操作 actions → addToolResult 回传 → LLM 返回下一轮 A2UI JSON`

约束：

- Web 只负责解析与渲染，不负责硬编码业务流程。
- CLI 与 MCP 输出的结构化交互信息必须与本协议兼容。
- 所有进入主流程的卡片都必须支持“继续交互”，不允许只有静态展示而无回传能力。

---

## 2. 顶层结构

最小 A2UI JSON 结构如下：

```json
{
  "version": "1.0",
  "trace_id": "trace_123",
  "interaction_id": "ix_001",
  "server_state": {
    "trip_id": "trip_001",
    "step": "clarify-destination"
  },
  "client_state": {
    "role": "parents",
    "theme": "warm"
  },
  "view": {
    "type": "stack",
    "children": []
  },
  "actions": [],
  "tool_call": null,
  "tool_result": null
}
```

字段说明：

- `version`：协议版本，便于后续演进。
- `trace_id`：整条交互链路追踪 ID。
- `interaction_id`：当前这轮交互的唯一 ID，用于幂等控制。
- `server_state`：服务端业务状态，不可信给用户直接编辑。
- `client_state`：前端渲染状态，可用于角色、主题、展开折叠等。
- `view`：界面描述树。
- `actions`：当前界面允许的可执行操作清单。
- `tool_call`：当前轮如需显式描述工具调用，可在此挂载。
- `tool_result`：用户交互后回传给 LLM 的结果结构。

---

## 3. View 规范

`view` 是一个可递归节点树，最小定义如下：

```json
{
  "type": "stack",
  "props": {
    "gap": "md"
  },
  "children": [
    {
      "type": "message",
      "props": {
        "tone": "assistant",
        "content": "宝，我先帮你确认一下目的地～"
      }
    },
    {
      "type": "choice-card",
      "props": {
        "title": "请选择目的地",
        "description": "也可以继续输入自然语言"
      }
    }
  ]
}
```

当前建议的原子节点类型：

- `stack`
- `grid`
- `message`
- `card`
- `choice-card`
- `button-group`
- `input`
- `select`
- `upload`
- `timeline`
- `itinerary-card`
- `status`
- `error`

约束：

- `type` 必须来自受控白名单。
- `props` 只允许携带渲染信息，不得隐含业务流程跳转逻辑。
- 业务推进必须通过 `actions` 完成，而不是靠前端自行猜测。

当前最小实现已支持的节点：

- `stack`
- `grid`
- `message`
- `card`
- `choice-card`
- `button-group`
- `input`
- `select`
- `upload`
- `itinerary-card`
- `status`
- `error`

---

## 4. Actions 规范

`actions` 用于声明当前界面允许用户执行的动作：

```json
[
  {
    "id": "confirm_destination",
    "type": "submit",
    "label": "就去成都",
    "target": "llm",
    "payload": {
      "destination": "成都"
    }
  },
  {
    "id": "change_budget",
    "type": "open_input",
    "label": "修改预算",
    "target": "local",
    "payload": {
      "field": "budget"
    }
  }
]
```

字段说明：

- `id`：动作唯一标识。
- `type`：动作类型。
- `label`：展示给用户的文案。
- `target`：
  - `llm`：必须回传给 LLM。
  - `local`：仅本地状态更新。
- `payload`：动作携带的数据。

当前建议的动作类型：

- `submit`
- `select`
- `multi_select`
- `open_input`
- `upload_file`
- `confirm`
- `cancel`
- `retry`

动作约束：

- `target = llm`：必须通过 `tool_result` 回传给 LLM。
- `target = local`：只更新 Renderer 本地状态，不触发新一轮推理。
- 当 `action.payload.uploadField` 存在时，Renderer 必须先完成文件上传，再把上传后的资产元数据写入 `tool_result.uploadedAssets` 回传给 LLM。

上传型动作示例：

```json
{
  "id": "submit_media",
  "type": "upload_file",
  "label": "上传并继续",
  "target": "llm",
  "payload": {
    "intent": "submit_media",
    "uploadField": "photo"
  }
}
```

---

## 5. Tool Result 回传规范

当用户点击、选择、上传或确认时，Renderer 必须构造标准 `tool_result` 并通过 `addToolResult` 或等效机制回传：

```json
{
  "interaction_id": "ix_001",
  "action_id": "confirm_destination",
  "action_type": "submit",
  "submitted_at": "2026-04-01T12:00:00Z",
  "payload": {
    "destination": "成都"
  },
  "client_state": {
    "role": "parents",
    "theme": "warm"
  },
  "uploadedAssets": [
    {
      "bucket": "uploads",
      "path": "trace_123/ix_001-photo.jpg",
      "fileName": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 123456,
      "publicUrl": "https://..."
    }
  ]
}
```

约束：

- 同一个 `interaction_id + action_id` 只能成功提交一次。
- 回传失败时必须可重试，但不得重复执行服务端副作用。
- 纯视觉切换可只改 `client_state`，涉及业务推进必须进入 `tool_result`。

---

## 6. 幂等与恢复

交互 Runtime 必须支持：

- **重复点击去重**：同一 `interaction_id + action_id` 重复提交直接忽略或返回已处理状态。
- **中断恢复**：页面刷新或网络中断后，能够根据 `trace_id + interaction_id` 恢复最后一个可见界面。
- **失败重试**：回传失败后允许重新提交，但必须保证服务端语义幂等。

---

## 7. 上传与素材确认闭环

当前最小业务链路已支持：

`确认行程 → 上传素材(upload) → 受控上传接口落存 → tool_result.uploadedAssets 回传 → LLM 返回素材确认卡片 → 用户确认素材 → 选择记忆模板 → 触发 generate_memory → 返回记忆结果卡片 → 选择分享渠道/文案调性 → 触发 generate_share → 返回分享内容包预览`

约束：

- 上传成功后，回传给 LLM 的只能是资产元数据，不能是原始文件对象。
- 素材确认阶段应返回新的 A2UI JSON，而不是在前端本地直接“假确认”。
- 上传链路应优先复用 `trace_id` 与 `interaction_id` 组织存储路径与幂等行为。
- 记忆生成前必须经过一轮模板确认或参数确认，不应在素材确认后直接后台生成。
- 记忆生成完成后应返回新的 A2UI JSON，至少包含记忆结果摘要、产物标题或模板信息，以及下一步分享入口。
- 分享生成前必须经过一轮渠道与文案调性确认，不应默认按单一平台或单一风格直接生成。

---

## 8. 错误处理

LLM 返回内容在进入 Renderer 前必须经过以下处理：

- 剥离 Markdown 代码块包裹的 JSON。
- 去除前后空白字符。
- 进行 Zod schema 校验。
- 校验失败时回退到统一错误 view：

```json
{
  "view": {
    "type": "error",
    "props": {
      "title": "界面生成失败",
      "description": "请重试，或切换到 CLI 继续操作。"
    }
  },
  "actions": [
    {
      "id": "retry_render",
      "type": "retry",
      "label": "重试",
      "target": "llm",
      "payload": {}
    }
  ]
}
```

---

## 9. Renderer 建议实现

当前默认方案：

- **Web Renderer**：Next.js + Vercel AI SDK
- **组件库**：Shadcn UI + Tailwind CSS
- **实现原则**：
  - 只维护原子组件，不维护业务页面
  - 解析器负责 `view -> component tree`
  - Interaction Runtime 负责 `action -> tool_result`

不作为当前默认路线：

- Flutter GenUI

原因：

- 会引入第二套渲染体系与额外维护成本。
- 不符合当前“一人公司 + TypeScript 单栈 + Agent-first”的约束。

---

## 10. 最小示例

### 9.1 LLM 返回

```json
{
  "version": "1.0",
  "trace_id": "trace_001",
  "interaction_id": "ix_101",
  "server_state": {
    "step": "confirm_budget"
  },
  "client_state": {
    "role": "couple"
  },
  "view": {
    "type": "choice-card",
    "props": {
      "title": "预算想控制在什么区间？",
      "description": "我会按情侣出行帮你匹配氛围感行程"
    }
  },
  "actions": [
    {
      "id": "budget_3000",
      "type": "submit",
      "label": "3000 以内",
      "target": "llm",
      "payload": {
        "budget": 3000
      }
    },
    {
      "id": "budget_5000",
      "type": "submit",
      "label": "5000 左右",
      "target": "llm",
      "payload": {
        "budget": 5000
      }
    }
  ],
  "tool_call": null,
  "tool_result": null
}
```

### 9.2 用户点击后回传

```json
{
  "interaction_id": "ix_101",
  "action_id": "budget_5000",
  "action_type": "submit",
  "payload": {
    "budget": 5000
  },
  "client_state": {
    "role": "couple"
  }
}
```

---

## 11. 结论

VibeTrip 的 Web 不是传统前端，而是 **A2UI Renderer + Interaction Runtime**。只要协议稳定，MCP、CLI、Web 就能共享同一套业务能力与交互闭环。
