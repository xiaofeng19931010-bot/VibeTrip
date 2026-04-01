# VibeTrip Developer Documentation

## Overview

VibeTrip is an AI-native travel companion built with the Solo Founder principle - minimal operational overhead, maximum developer efficiency.

## Architecture

```
packages/core/      # Business logic (single source of truth)
apps/mcp-server/   # MCP Server (stdio + HTTP)
apps/cli/          # CLI tool
apps/web/          # Next.js Web application
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Build
pnpm build

# Test
pnpm test

# Run MCP Server
pnpm --filter @vibetrip/cli mcp
```

## Core Package

### Schemas (Zod)

```typescript
import { TripSchema, RoleType, TripStatus } from '@vibetrip/core/schemas';

// Trip
const trip = TripSchema.parse({
  id: 'uuid',
  user_id: 'user-123',
  title: '成都之旅',
  destination: '成都',
  role: 'couple',
  status: 'draft',
  // ...
});
```

### Repositories

```typescript
import { tripRepository } from '@vibetrip/core/repositories';

// Create trip
const trip = await tripRepository.create({
  user_id: 'user-123',
  title: '成都之旅',
  destination: '成都',
  start_date: '2024-03-15',
  end_date: '2024-03-18',
  role: 'couple',
});

// Find by ID
const found = await tripRepository.findById('trip-uuid');

// Update
await tripRepository.update('trip-uuid', { status: 'planned' });
```

### Role Strategy Engine

```typescript
import { getRoleProfile, getStrategyForContext } from '@vibetrip/core/engine';

// Get predefined profile
const profile = getRoleProfile('parents');
console.log(profile.pacing.activitiesPerDay); // 2

// Get with custom instructions
const strategy = getStrategyForContext({
  role: 'couple',
  customInstructions: ['不要早起', '多休息'],
});
```

### Planning Service

```typescript
import { PlanningService } from '@vibetrip/core/engine/services/planning';

const planning = new PlanningService({ apiKey: process.env.OPENAI_API_KEY });

const result = await planning.plan({
  description: '带父母去成都玩3天',
  userId: 'user-123',
  budget: 5000,
});

if (result.success) {
  console.log(result.itinerary);
} else {
  console.log(result.questions); // Clarifying questions
}
```

## MCP Server

### Tools

| Tool | Description |
|------|-------------|
| `plan_trip` | Plan a trip from natural language |
| `revise_itinerary` | Modify existing itinerary |
| `persist_trip` | Save trip to database |
| `start_capture` | Start travel recording |
| `stop_capture` | Stop travel recording |
| `ingest_media` | Import photos, voice, notes, GPX |
| `generate_memory` | Generate travel memory |
| `generate_share` | Generate social media content |

> `generate_memory` 当前返回 `{ id, url, title, format }`；`generate_share` 当前返回 `{ id, title, body, hashtags, images, memoryArtifactId, copyableText }`。MCP 与 CLI 共用这组结构化结果，便于后续接入 Web A2UI Runtime。

### Usage

```typescript
import { createMcpServer } from '@vibetrip/mcp-server';

const server = createMcpServer('vibetrip-mcp-server', '0.1.0');
```

### Running

```bash
# stdio mode (for local CLI)
vibetrip mcp --transport stdio

# HTTP mode
vibetrip mcp --transport http --port 3001
```

## CLI

### Commands

```bash
# Plan a trip
vibetrip plan "成都3天" --role couple --budget 5000

# Manage trips
vibetrip trip show <trip_id>
vibetrip trip export <trip_id> --format json

# Capture
vibetrip capture start <trip_id>
vibetrip capture stop <trip_id>

# Media
vibetrip media ingest photo1.jpg photo2.jpg --trip <trip_id>

# Memory
vibetrip memory generate <trip_id> --format handbook

# Share
vibetrip share generate <trip_id> --channel xhs
```

## Memory / Share Persistence

- `memory_artifacts` 以 `trip_id` 为主关联键，存储 `type/title/storage_url/file_path/metadata/status`
- `share_packages` 以 `trip_id` 为主关联键，存储 `channel/title/content/hashtags/images/metadata`
- 当前实现不在这两张表重复存 `user_id`，统一通过 `trip -> user_id` 追溯归属，降低单体维护复杂度
- `memory_artifacts.metadata` 当前采用显式结构，至少包含 `tripId/format/generatedAt/contentType/bucket/captureIds/captureCount/destination/role`
- 当已存在 `memory_artifact_id` 时，分享生成会显式记录它与 `share_packages` 的关联上下文，保证记忆产物与分享内容包可追溯
- `share_packages.metadata` 当前采用显式结构，至少包含 `tripId/channel/style/generatedAt`，并在适用时补充 `memoryArtifactId/memoryArtifactTitle/memoryArtifactUrl`

## Upload / Capture Persistence

- Web 上传接口先将文件写入 Supabase Storage，并回传 `uploadedAssets`
- Chat Runtime 在 `submit_media` 阶段继续把这些资产写入真实 `captures` 记录
- `captures.metadata` 当前采用显式结构，至少包含 `source`，并按来源补充 `bucket/path/fileName/mimeType/size/publicUrl` 或 `originalPath/filename/storagePath/hasTranscription/pointCount/startTime/endTime`
- Web 上传、CLI 导入、MCP `ingest_media` 与 Capture Session 当前共享底层 capture 持久化能力，减少多入口写库规则漂移
- 素材确认阶段允许用户按 `captureId` 保留或剔除素材，并把结果透传为 `selected_capture_ids`
- 后续 `generate_memory` 直接读取 `captures`，确保本轮 Web 上传素材进入真实记忆生成链路

## Web

```bash
cd apps/web
pnpm dev
```

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# LLM (optional, fallback planning available)
OPENAI_API_KEY=sk-xxx
# or
ANTHROPIC_API_KEY=sk-ant-xxx
```

## Database Schema

### Trips

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | string | Owner |
| title | string | Trip title |
| destination | string | Destination |
| role | enum | parents/family/couple/friends/soldier |
| status | enum | draft/planned/traveling/completed/archived |
| budget | number | Daily budget |
| start_date | datetime | Start date |
| end_date | datetime | End date |

### Status Flow

```
draft → planned → traveling → completed → archived
```

## Error Handling

```typescript
import { createError, ErrorCode, isVibeTripError } from '@vibetrip/core/services/errors';

try {
  throw createError(ErrorCode.NOT_FOUND, 'Trip not found', { tripId: '123' });
} catch (error) {
  if (isVibeTripError(error)) {
    console.log(error.code); // NOT_FOUND
    console.log(error.message); // Trip not found
  }
}
```

## TypeScript Configuration

All packages use strict mode with `noUncheckedIndexedAccess`.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Testing

```bash
# Run all tests
pnpm test

# Run core tests
pnpm --filter @vibetrip/core test

# Watch mode
pnpm --filter @vibetrip/core test:watch
```

## License

MIT
