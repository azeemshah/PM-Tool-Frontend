import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { baseURL } from '@/lib/base-url';

interface UseCommentsSubscriptionProps {
  workspaceId?: string;
  workItemId?: string;
  enabled?: boolean;
}

export function useCommentsSubscription({
  workspaceId,
  workItemId,
  enabled = true,
}: UseCommentsSubscriptionProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !workspaceId || !workItemId) return;

    let socketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;

    if (socketUrl) {
      socketUrl = socketUrl.replace(/\/$/, '');
      socketUrl = `${socketUrl}/comments`;
    } else {
      try {
        const url = new URL(baseURL);
        socketUrl = `${url.origin}/comments`;
      } catch (e) {
        console.warn('Invalid baseURL for comments socket, falling back to /comments', e);
        socketUrl = '/comments';
      }
    }

    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('Comments WebSocket connected', socket.id);
    });

    socket.on('comment.created', (payload: any) => {
      console.log('comment.created event received', payload);
      if (payload?.workItemId && payload.workItemId !== workItemId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['comments', workItemId] });
    });

    socket.on('connect_error', (error) => {
      console.error('Comments WebSocket connection error', error);
    });

    socket.on('disconnect', () => {
      console.log('Comments WebSocket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [workspaceId, workItemId, enabled, queryClient]);
}

