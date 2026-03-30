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
  role: string;
  itinerary: DayPlan[];
  questions?: ClarifyingQuestion[];
}

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
}
