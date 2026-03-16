// Database schema types

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: "trial" | "active" | "canceled" | "past_due";
  trial_ends_at?: string;
  plan: "free" | "pro";
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: "admin" | "agent";
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  visitor_id: string;
  visitor_name?: string;
  visitor_email?: string;
  status: "open" | "closed";
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "visitor" | "agent";
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Visitor {
  id: string;
  workspace_id: string;
  external_id?: string;
  name?: string;
  email?: string;
  first_seen_at: string;
  last_seen_at: string;
  metadata?: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Widget types
export interface WidgetConfig {
  workspaceId: string;
  primaryColor: string;
  greetingMessage: string;
  position: "bottom-right" | "bottom-left";
}
