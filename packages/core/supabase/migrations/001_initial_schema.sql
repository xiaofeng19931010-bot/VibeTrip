-- VibeTrip Database Schema Migration
-- Version: 001
-- Date: 2026-03-30
-- Description: Initial schema for trips, itineraries, captures, memory artifacts, share packages, and audit logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE trip_status AS ENUM ('draft', 'planned', 'traveling', 'completed', 'archived');
CREATE TYPE role_type AS ENUM ('parents', 'family', 'couple', 'friends', 'soldier');
CREATE TYPE capture_type AS ENUM ('photo', 'voice', 'note', 'gpx', 'location');
CREATE TYPE memory_format AS ENUM ('handbook', 'poster');
CREATE TYPE share_channel AS ENUM ('xhs', 'moments', 'weibo', 'other');
CREATE TYPE artifact_type AS ENUM ('memory', 'share', 'export');

-- Users table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
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
  location POINT,
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
  content JSONB NOT NULL,
  storage_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  content JSONB NOT NULL,
  copyable_text TEXT,
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

-- API Keys table (for BYOK and external integrations)
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

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Trips policies
CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Itineraries policies (via trip access)
CREATE POLICY "Users can view itineraries via trip" ON public.itineraries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can insert itineraries via trip" ON public.itineraries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update itineraries via trip" ON public.itineraries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete itineraries via trip" ON public.itineraries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

-- Itinerary Items policies (via itinerary -> trip)
CREATE POLICY "Users can manage items via itinerary" ON public.itinerary_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      JOIN public.trips ON trips.id = itineraries.trip_id
      WHERE itineraries.id = itinerary_items.itinerary_id AND trips.user_id = auth.uid()
    )
  );

-- Captures policies (via trip access)
CREATE POLICY "Users can manage captures via trip" ON public.captures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = captures.trip_id AND trips.user_id = auth.uid())
  );

-- Memory Artifacts policies
CREATE POLICY "Users can manage own artifacts" ON public.memory_artifacts
  FOR ALL USING (auth.uid() = user_id);

-- Share Packages policies
CREATE POLICY "Users can manage own shares" ON public.share_packages
  FOR ALL USING (auth.uid() = user_id);

-- Audit Logs policies (read via service role only, append via service)
CREATE POLICY "Service can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- API Keys policies
CREATE POLICY "Users can manage own api keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

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
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
