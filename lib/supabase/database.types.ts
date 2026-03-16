export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          trial_ends_at: string | null;
          plan: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        };
      };
      visitors: {
        Row: {
          id: string;
          workspace_id: string;
          external_id: string | null;
          name: string | null;
          email: string | null;
          first_seen_at: string;
          last_seen_at: string;
          metadata: Json | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          workspace_id: string;
          visitor_id: string;
          visitor_name: string | null;
          visitor_email: string | null;
          status: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_type: string | null;
          sender_id: string;
          content: string;
          created_at: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
