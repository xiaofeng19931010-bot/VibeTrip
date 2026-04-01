# VibeTrip MCP Server Documentation

## Overview

VibeTrip MCP Server provides tools for AI agents (like Claude, Cursor) to interact with VibeTrip functionality.

## Connection

### stdio Mode (Local)

```json
{
  "mcpServers": {
    "vibetrip": {
      "command": "npx",
      "args": ["@vibetrip/cli", "mcp"]
    }
  }
}
```

### HTTP Mode (Remote)

```json
{
  "mcpServers": {
    "vibetrip": {
      "url": "https://your-mcp-server.vercel.app/mcp"
    }
  }
}
```

## Tools

### plan_trip

Plan a trip from natural language description.

**Parameters:**
```typescript
{
  description: string;      // "带父母去成都玩3天预算5000"
  role?: "parents" | "family" | "couple" | "friends" | "soldier";
  days?: number;
  budget?: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  tripId?: string;
  questions?: Array<{ question: string; options?: string[]; required: boolean }>;
  itinerary?: Array<{
    dayNumber: number;
    date: string;
    summary: string;
    items: Array<{
      type: "transport" | "accommodation" | "attraction" | "restaurant" | "break";
      title: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
    }>;
  }>;
  isFallback: boolean;
}
```

**Example:**
```json
{
  "name": "plan_trip",
  "arguments": {
    "description": "带父母去成都玩3天",
    "role": "parents",
    "days": 3,
    "budget": 5000
  }
}
```

---

### revise_itinerary

Modify an existing itinerary based on instructions.

**Parameters:**
```typescript
{
  trip_id: string;        // UUID of the trip
  instructions: string;     // "不要早起，多休息"
}
```

---

### persist_trip

Save/persist a trip to database.

**Parameters:**
```typescript
{
  trip_id: string;         // UUID of the trip
}
```

---

### start_capture

Start automatic travel recording.

**Parameters:**
```typescript
{
  trip_id: string;         // UUID of the trip
}
```

---

### stop_capture

Stop automatic travel recording.

**Parameters:**
```typescript
{
  trip_id: string;         // UUID of the trip
}
```

---

### ingest_media

Import photos, voice notes, or GPX files.

**Parameters:**
```typescript
{
  trip_id: string;
  type: "photo" | "voice" | "note" | "gpx";
  content: string;         // URL, file path, or text content
  timestamp?: string;      // ISO datetime
}
```

> `captures.metadata` 当前采用显式结构：至少记录 `source`，并按不同 ingest 场景补充 `bucket/path/fileName/mimeType/size/publicUrl` 或 `originalPath/filename/storagePath/hasTranscription/pointCount/startTime/endTime` 等上下文。
>
> 当前 `ingest_media` 与 Web 上传后的素材入库已共享底层 capture 持久化能力，避免不同入口各自维护独立写库规则。
>
> `ingest_media` 现在代表“通用素材导入”语义，不依赖 capture session；若是自动采集或会话中上报的位置/素材，应走 capture session 相关入口。

**Response:**
```typescript
{
  content: [{
    type: "text",
    text: "{\"success\":true,\"captureId\":\"capture-uuid\"}"
  }]
}
```

---

### generate_memory

Generate travel memory (handbook or poster).

**Parameters:**
```typescript
{
  trip_id: string;
  format?: "handbook" | "poster";  // default: "handbook"
}
```

**Response:**
```typescript
{
  content: [{
    type: "text",
    text: "{\"id\":\"artifact-uuid\",\"url\":\"https://storage.example/memories/...\",\"title\":\"成都旅行手账\",\"format\":\"handbook\"}"
  }]
}
```

> `generate_memory` 的持久化结果会把 `format`、`generatedAt`、`contentType`、`bucket`、`captureIds`、`captureCount`、`destination`、`role` 等上下文写入 `memory_artifacts.metadata`，便于后续追溯记忆产物来源。

---

### generate_share

Generate share content for social media.

**Parameters:**
```typescript
{
  trip_id: string;
  channel: "xhs" | "moments" | "weibo" | "other";
  memory_artifact_id?: string;
}
```

**Response:**
```typescript
{
  content: [{
    type: "text",
    text: "{\"id\":\"package-uuid\",\"title\":\"成都旅行手账分享版\",\"body\":\"...\",\"hashtags\":[\"#成都\"],\"images\":[\"https://...\"],\"memoryArtifactId\":\"artifact-uuid\",\"copyableText\":\"标题\\n\\n正文\\n\\n#标签\"}"
  }]
}
```

> 当前 MCP 返回的是可 JSON 解析的文本内容，便于 CLI、Agent Runtime 和 Web Renderer 统一消费，而不是仅返回描述性字符串。
>
> `generate_share` 的持久化结果会把 `memoryArtifactId`、`memoryArtifactTitle`、`memoryArtifactUrl`、`style` 等上下文写入 `share_packages.metadata`，便于后续追溯分享内容包来源。

## Role Types

| Role | Description | Characteristics |
|------|-------------|-----------------|
| `parents` | 带父母出行 | 2 activities/day, rest breaks, no early wakeup |
| `family` | 亲子出行 | 3 activities/day, baby facilities, nap time |
| `couple` | 情侣出行 | 2 activities/day, romantic spots, sunset views |
| `friends` | 闺蜜/特种兵 | 5 activities/day, photo spots, compact schedule |
| `soldier` | 特种兵 | 8 activities/day, maximum打卡, tight schedule |

## Status Codes

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Invalid parameters |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `RATE_LIMITED` | Too many requests |
| `LLM_ERROR` | LLM service error |
| `STORAGE_ERROR` | Storage service error |
| `DATABASE_ERROR` | Database error |

## Examples

### Plan a Family Trip

```json
{
  "name": "plan_trip",
  "arguments": {
    "description": "带孩子去三亚玩5天",
    "role": "family",
    "days": 5,
    "budget": 8000
  }
}
```

### Import Photos

```json
{
  "name": "ingest_media",
  "arguments": {
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "photo",
    "content": "https://storage.example.com/photo1.jpg"
  }
}
```

### Generate Travel Memory

```json
{
  "name": "generate_memory",
  "arguments": {
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "format": "handbook"
  }
}
```

### Share to 小红书

```json
{
  "name": "generate_share",
  "arguments": {
    "trip_id": "550e8400-e29b-41d4-a716-446655440000",
    "channel": "xhs"
  }
}
```
