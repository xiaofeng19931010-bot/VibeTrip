export type A2UIViewType =
  | 'stack'
  | 'grid'
  | 'message'
  | 'card'
  | 'choice-card'
  | 'button-group'
  | 'input'
  | 'select'
  | 'upload'
  | 'timeline'
  | 'itinerary-card'
  | 'status'
  | 'error';

export type A2UIActionType =
  | 'submit'
  | 'select'
  | 'multi_select'
  | 'open_input'
  | 'upload_file'
  | 'confirm'
  | 'cancel'
  | 'retry';

export type A2UIActionTarget = 'llm' | 'local';

export interface A2UIViewNode {
  type: A2UIViewType;
  props?: Record<string, unknown>;
  children?: A2UIViewNode[];
}

export interface A2UIAction {
  id: string;
  type: A2UIActionType;
  label: string;
  target: A2UIActionTarget;
  payload: Record<string, unknown>;
  disabled?: boolean;
}

export interface UploadedAsset {
  bucket: string;
  path: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  publicUrl?: string;
}

export interface A2UIToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface A2UIToolResult {
  interaction_id: string;
  action_id: string;
  action_type: A2UIActionType;
  submitted_at?: string;
  payload: Record<string, unknown>;
  client_state?: Record<string, unknown>;
  uploadedAssets?: UploadedAsset[];
}

export interface A2UIEnvelope {
  version: '1.0';
  trace_id: string;
  interaction_id: string;
  server_state: Record<string, unknown>;
  client_state: Record<string, unknown>;
  view: A2UIViewNode;
  actions: A2UIAction[];
  tool_call: A2UIToolCall | null;
  tool_result: A2UIToolResult | null;
}

export interface ItineraryItem {
  type: 'transport' | 'accommodation' | 'attraction' | 'restaurant' | 'break' | 'other';
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  order: number;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  summary: string;
  items: ItineraryItem[];
}

export interface TripPlan {
  tripId?: string;
  destination: string;
  days: number;
  role: RoleType;
  itinerary: DayPlan[];
  questions?: ClarifyingQuestion[];
}

export type RoleType = 'parents' | 'family' | 'couple' | 'friends' | 'soldier';

export interface ClarifyingQuestion {
  question: string;
  options?: string[];
  field?: string;
}

export interface ToolCall {
  toolName: string;
  args: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  plan?: TripPlan;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
  ui?: A2UIEnvelope;
}
