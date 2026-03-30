-- VibeTrip Database Schema Migration
-- Version: 001
-- Date: 2026-03-30

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE trip_status AS ENUM ('draft', 'planned', 'traveling', 'completed', 'archived');
CREATE TYPE role_type AS ENUM ('parents', 'family', 'couple', 'friends', 'soldier');
CREATE TYPE capture_type AS ENUM ('photo', 'voice', 'note', 'gpx', 'location');
CREATE TYPE memory_format AS ENUM ('handbook', 'poster');
CREATE TYPE share_channel AS ENUM ('xhs', 'moments', 'weibo', 'other');
CREATE TYPE artifact_type AS ENUM ('memory', 'share', 'export');

-- Users table (standalone, not requiring Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  external_id TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  role role_type NOT NULL DEFAULT 'friends',
  status trip_status NOT NULL DEFAULT 'draft',
  budget DECIMAL(10, 2),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for trips
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_destination ON public.trips(destination);

-- Itineraries table
CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- Indexes for itineraries
CREATE INDEX idx_itineraries_trip_id ON public.itineraries(trip_id);

-- Itinerary Items table
CREATE TABLE public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transport', 'accommodation', 'attraction', 'restaurant', 'break', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  "order" INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for itinerary_items
CREATE INDEX idx_itinerary_items_itinerary_id ON public.itinerary_items(itinerary_id);

-- Captures table
CREATE TABLE public.captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type capture_type NOT NULL,
  content TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for captures
CREATE INDEX idx_captures_trip_id ON public.captures(trip_id);
CREATE INDEX idx_captures_type ON public.captures(type);
CREATE INDEX idx_captures_captured_at ON public.captures(captured_at);

-- Memory Artifacts table
CREATE TABLE public.memory_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type artifact_type NOT NULL,
  format memory_format,
  title TEXT,
  description TEXT,
  content JSONB NOT NULL,
  storage_url TEXT,
  file_path TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for memory_artifacts
CREATE INDEX idx_memory_artifacts_trip_id ON public.memory_artifacts(trip_id);
CREATE INDEX idx_memory_artifacts_user_id ON public.memory_artifacts(user_id);

-- Share Packages table
CREATE TABLE public.share_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel share_channel NOT NULL,
  title TEXT,
  content TEXT,
  hashtags TEXT[],
  images TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for share_packages
CREATE INDEX idx_share_packages_trip_id ON public.share_packages(trip_id);
CREATE INDEX idx_share_packages_channel ON public.share_packages(channel);

-- Audit Logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trace_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  tool_name TEXT,
  trip_id UUID,
  status TEXT NOT NULL,
  cost_ms INTEGER,
  request_summary JSONB,
  response_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_trace_id ON public.audit_logs(trace_id);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_trip_id ON public.audit_logs(trip_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- API Keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  provider TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for api_keys
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);

-- Row Level Security (RLS) Policies - DISABLED for MVP testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_artifacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
