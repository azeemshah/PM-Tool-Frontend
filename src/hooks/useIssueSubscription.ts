import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import io, { Socket } from 'socket.io-client';

interface UseIssueSubscriptionProps {
  workspaceId: string;
  projectId?: string;
  enabled?: boolean;
}

/**
 * Hook for real-time issue updates via Socket.IO
 * Listens for issue.created, issue.updated, issue.deleted events
 * Automatically invalidates React Query caches when events arrive
 */
export function useIssueSubscription({
  workspaceId,
  projectId,
  enabled = true,
}: UseIssueSubscriptionProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !workspaceId) return;

    // Socket.IO server URL
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      'http://localhost:5000/api/v1/issues';

    // Connect to WebSocket gateway
    const socket: Socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      // Subscribe to workspace room
      socket.emit('subscribe', { type: 'workspace', id: workspaceId });
      // Subscribe to project room if provided
      if (projectId) {
        socket.emit('subscribe', { type: 'project', id: projectId });
      }
    });

    // Listen for issue created event
    socket.on('issue.created', (payload) => {
      console.log('📦 New issue created:', payload);
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
      }
    });

    // Listen for issue updated event
    socket.on('issue.updated', (payload) => {
      console.log('✏️ Issue updated:', payload);
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
      }
    });

    // Listen for issue deleted event
    socket.on('issue.deleted', (payload) => {
      console.log('🗑️ Issue deleted:', payload);
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['all-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [workspaceId, projectId, enabled, queryClient]);
}
