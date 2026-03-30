# VibeTrip CLI Documentation

## Installation

```bash
# From source
pnpm build
pnpm --filter @vibetrip/cli bin/vibetrip.js --help
```

## Commands

### plan

Plan a trip from natural language description.

```bash
vibetrip plan <description> [options]

Arguments:
  description    Trip description in natural language

Options:
  -r, --role <role>     Role: parents, family, couple, friends, soldier
  -d, --days <days>     Number of days
  -b, --budget <budget> Budget in CNY
```

**Examples:**

```bash
# Basic usage
vibetrip plan "去成都玩3天"

# With options
vibetrip plan "带父母去成都" --role parents --days 3 --budget 5000

# Couple trip
vibetrip plan "情侣去三亚" --role couple --days 5 --budget 10000
```

---

### trip

Manage trips.

#### trip save

Save current trip.

```bash
vibetrip trip save <trip_id>
```

#### trip show

Show trip details.

```bash
vibetrip trip show <trip_id>
```

#### trip export

Export trip.

```bash
vibetrip trip export <trip_id> [options]

Options:
  -f, --format <format>  Export format: json, pdf (default: json)
```

**Examples:**

```bash
vibetrip trip show 550e8400-e29b-41d4-a716-446655440000
vibetrip trip export 550e8400-e29b-41d4-a716-446655440000 --format json
```

---

### capture

Manage travel capture.

#### capture start

Start travel recording.

```bash
vibetrip capture start <trip_id>
```

#### capture stop

Stop travel recording.

```bash
vibetrip capture stop <trip_id>
```

#### capture status

Check capture status.

```bash
vibetrip capture status <trip_id>
```

**Examples:**

```bash
vibetrip capture start 550e8400-e29b-41d4-a716-446655440000
vibetrip capture status 550e8400-e29b-41d4-a716-446655440000
vibetrip capture stop 550e8400-e29b-41d4-a716-446655440000
```

---

### media

Manage media.

#### media ingest

Import photos, voice notes, or GPX files.

```bash
vibetrip media ingest <paths...> [options]

Arguments:
  paths              File paths to import

Options:
  -t, --trip <trip_id>  Trip ID
  -m, --type <type>      Media type: photo, voice, note, gpx (default: photo)
```

**Examples:**

```bash
# Import photos
vibetrip media ingest photo1.jpg photo2.jpg --trip 550e8400-e29b-41d4-a716-446655440000

# Import GPX
vibetrip media ingest track.gpx --trip 550e8400-e29b-41d4-a716-446655440000 --type gpx

# Import voice note
vibetrip media ingest voice.m4a --trip 550e8400-e29b-41d4-a716-446655440000 --type voice
```

---

### memory

Generate travel memories.

#### memory generate

Generate travel memory.

```bash
vibetrip memory generate <trip_id> [options]

Arguments:
  trip_id            Trip ID

Options:
  -f, --format <format>  Format: handbook, poster (default: handbook)
```

**Examples:**

```bash
# Generate handbook
vibetrip memory generate 550e8400-e29b-41d4-a716-446655440000

# Generate poster
vibetrip memory generate 550e8400-e29b-41d4-a716-446655440000 --format poster
```

---

### share

Generate share content.

#### share generate

Generate share content.

```bash
vibetrip share generate <trip_id> [options]

Arguments:
  trip_id            Trip ID

Options:
  -c, --channel <channel>  Channel: xhs, moments, weibo, other (default: xhs)
```

**Examples:**

```bash
# Generate for 小红书
vibetrip share generate 550e8400-e29b-41d4-a716-446655440000 --channel xhs

# Generate for 朋友圈
vibetrip share generate 550e8400-e29b-41d4-a716-446655440000 --channel moments

# Generate for 微博
vibetrip share generate 550e8400-e29b-41d4-a716-446655440000 --channel weibo
```

---

### mcp

Run MCP server.

```bash
vibetrip mcp [options]

Options:
  -t, --transport <transport>  Transport: stdio, http (default: stdio)
```

**Examples:**

```bash
# Run in stdio mode (for Claude Desktop, Cursor)
vibetrip mcp --transport stdio

# Run HTTP server
vibetrip mcp --transport http
```

---

## Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
OPENAI_API_KEY=sk-xxx
```

---

## Configuration File

Create `~/.vibetrip.json`:

```json
{
  "supabase": {
    "url": "https://xxx.supabase.co",
    "anonKey": "xxx"
  },
  "llm": {
    "provider": "openai",
    "apiKey": "sk-xxx"
  },
  "mcp": {
    "transport": "stdio"
  }
}
```

---

## Troubleshooting

### "Supabase client not initialized"

Set environment variables:
```bash
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_ANON_KEY=xxx
```

### "LLM planning failed, falling back"

This is expected behavior. The system will return a template itinerary when LLM is unavailable.

### MCP tools not appearing

Make sure you're running the correct transport mode for your client:
- Claude Desktop / Cursor: use `--transport stdio`
- Remote: use `--transport http`
