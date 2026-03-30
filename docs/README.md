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
