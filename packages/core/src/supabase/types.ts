export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string;
          start_date: string;
          end_date: string;
          role: 'parents' | 'family' | 'couple' | 'friends' | 'soldier';
          status: 'draft' | 'planned' | 'traveling' | 'completed' | 'archived';
          budget: number | null;
          preferences: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      itineraries: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          date: string;
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['itineraries']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['itineraries']['Insert']>;
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          type: 'transport' | 'accommodation' | 'attraction' | 'restaurant' | 'break' | 'other';
          title: string;
          description: string | null;
          location: { lat: number; lng: number } | null;
          address: string | null;
          start_time: string | null;
          end_time: string | null;
          order: number;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['itinerary_items']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['itinerary_items']['Insert']>;
      };
      captures: {
        Row: {
          id: string;
          trip_id: string;
          type: 'photo' | 'voice' | 'note' | 'gpx';
          content: string;
          location: { lat: number; lng: number } | null;
          timestamp: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['captures']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['captures']['Insert']>;
      };
      memory_artifacts: {
        Row: {
          id: string;
          trip_id: string;
          type: 'handbook' | 'poster' | 'video';
          title: string;
          description: string | null;
          storage_url: string | null;
          file_path: string | null;
          metadata: Record<string, unknown> | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['memory_artifacts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['memory_artifacts']['Insert']>;
      };
      share_packages: {
        Row: {
          id: string;
          trip_id: string;
          channel: 'xhs' | 'moments' | 'weibo' | 'other';
          title: string;
          content: string;
          hashtags: string[];
          images: string[];
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['share_packages']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['share_packages']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          trace_id: string;
          actor_type: 'user' | 'system' | 'mcp' | 'cli';
          actor_id: string | null;
          tool_name: string | null;
          trip_id: string | null;
          status: 'success' | 'error' | 'denied';
          cost_ms: number | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_role: 'parents' | 'family' | 'couple' | 'friends' | 'soldier' | null;
          notification_enabled: boolean;
          theme: 'light' | 'dark' | 'auto';
          language: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
    };
  };
}
