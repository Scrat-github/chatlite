import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

export class RealtimeService {
  private supabase: SupabaseClient<Database>;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: Message) => void,
  ) {
    const channel = this.supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        },
      )
      .subscribe();

    this.channels.set(conversationId, channel);
    return () => this.unsubscribe(conversationId);
  }

  /**
   * Subscribe to all conversations for a workspace
   */
  subscribeToConversations(
    workspaceId: string,
    onNewConversation: (conversation: Conversation) => void,
    onUpdate: (conversation: Conversation) => void,
  ) {
    const channel = this.supabase
      .channel(`workspace:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onNewConversation(payload.new as Conversation);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          onUpdate(payload.new as Conversation);
        },
      )
      .subscribe();

    this.channels.set(`workspace:${workspaceId}`, channel);
    return () => this.unsubscribe(`workspace:${workspaceId}`);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelKey: string) {
    const channel = this.channels.get(channelKey);
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll() {
    for (const [key] of this.channels) {
      await this.unsubscribe(key);
    }
  }
}

/**
 * Create realtime service instance
 */
export function createRealtimeService(supabase: SupabaseClient<Database>) {
  return new RealtimeService(supabase);
}
