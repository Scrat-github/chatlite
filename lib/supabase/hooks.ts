'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createRealtimeService } from '@/lib/supabase/realtime';

/**
 * Hook for realtime messages in a conversation
 */
export function useRealtimeMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    // Load initial messages
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const realtime = createRealtimeService(supabase);
    const unsubscribe = realtime.subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, supabase]);

  return { messages, isLoading, error };
}

/**
 * Hook for realtime conversations
 */
export function useRealtimeConversations(workspaceId: string | null) {
  const [conversations, setConversations] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!workspaceId) return;

    // Load initial conversations
    const loadConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false });

      if (data) setConversations(data);
    };

    loadConversations();

    // Subscribe to conversation updates
    const realtime = createRealtimeService(supabase);
    const unsubscribe = realtime.subscribeToConversations(
      workspaceId,
      (newConv) => {
        setConversations((prev) => [newConv, ...prev]);
      },
      (updatedConv) => {
        setConversations((prev) =>
          prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [workspaceId, supabase]);

  return { conversations };
}
