/**
 * Hook for Member management
 */

import { useState, useCallback } from 'react';
import { memberApiService } from '@/api/member/services/memberApiService';
import type { Member, CreateMemberDTO, UpdateMemberDTO, UserRole, MemberStats } from '@/api/member/types';

interface UseMemberReturn {
  members: Member[];
  loading: boolean;
  error: string | null;
  fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;
  addMember: (data: CreateMemberDTO) => Promise<Member | null>;
  getMember: (memberId: string) => Promise<Member | null>;
  updateMember: (memberId: string, data: UpdateMemberDTO) => Promise<Member | null>;
  removeMember: (memberId: string) => Promise<boolean>;
  getUserRole: (workspaceId: string) => Promise<UserRole | null>;
  getMemberStats: (workspaceId: string) => Promise<MemberStats | null>;
}

export const useMember = (): UseMemberReturn => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceMembers = useCallback(async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberApiService.getWorkspaceMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(message);
      console.error('fetchWorkspaceMembers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (data: CreateMemberDTO): Promise<Member | null> => {
    setLoading(true);
    setError(null);
    try {
      const newMember = await memberApiService.addMember(data);
      setMembers((prev) => [...prev, newMember]);
      return newMember;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      setError(message);
      console.error('addMember error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMember = useCallback(async (memberId: string): Promise<Member | null> => {
    setLoading(true);
    setError(null);
    try {
      const member = await memberApiService.getMember(memberId);
      return member;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get member';
      setError(message);
      console.error('getMember error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMember = useCallback(
    async (memberId: string, data: UpdateMemberDTO): Promise<Member | null> => {
      setLoading(true);
      setError(null);
      try {
        const updatedMember = await memberApiService.updateMemberRole(memberId, data);
        setMembers((prev) =>
          prev.map((member) => (member._id === memberId ? updatedMember : member))
        );
        return updatedMember;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update member';
        setError(message);
        console.error('updateMember error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await memberApiService.removeMember(memberId);
      setMembers((prev) => prev.filter((member) => member._id !== memberId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setError(message);
      console.error('removeMember error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserRole = useCallback(async (workspaceId: string): Promise<UserRole | null> => {
    setLoading(true);
    setError(null);
    try {
      const role = await memberApiService.getUserRoleInWorkspace(workspaceId);
      return role;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get user role';
      setError(message);
      console.error('getUserRole error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMemberStatsCall = useCallback(async (workspaceId: string): Promise<MemberStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const stats = await memberApiService.getMemberStats(workspaceId);
      return stats;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get member stats';
      setError(message);
      console.error('getMemberStats error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    members,
    loading,
    error,
    fetchWorkspaceMembers,
    addMember,
    getMember,
    updateMember,
    removeMember,
    getUserRole,
    getMemberStats: getMemberStatsCall,
  };
};
