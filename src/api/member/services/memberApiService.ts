/**
 * Member API Service
 * Handles all member-related API calls
 */

import API from '@/lib/axios-client';
import type {
  Member,
  CreateMemberDTO,
  UpdateMemberDTO,
  JoinWorkspaceDTO,
  MemberStats,
  MemberResponse,
  UserRole,
  JoinWorkspaceResponse,

} from '../types';

const MEMBER_ENDPOINT = '/members';

export const memberApiService = {
  /**
   * Add a new member to a workspace
   */
  async addMember(data: CreateMemberDTO): Promise<Member> {
    try {
      const response = await API.post(
        MEMBER_ENDPOINT,
        data
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('addMember error:', error);
      throw error;
    }
  },

  /**
   * Invite a member to a workspace
   */
  async inviteMember(data: { email: string; role: "USER" | "VIEWER"; workspaceId: string }): Promise<Member> {
    try {
      const response = await API.post(
        `${MEMBER_ENDPOINT}/invite`,
        { email: data.email, role: data.role, workspaceId: data.workspaceId }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('inviteMember error:', error);
      throw error;
    }
  },

  /**
   * Get all members in a workspace
   */
  async getWorkspaceMembers(workspaceId: string): Promise<Member[]> {
    try {
      const response = await API.get(
        `${MEMBER_ENDPOINT}/workspace/${workspaceId}`
      );
      
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('getWorkspaceMembers error:', error);
      throw error;
    }
  },

  /**
   * Get member details
   */
  async getMember(memberId: string): Promise<Member> {
    try {
      const response = await API.get(
        `${MEMBER_ENDPOINT}/${memberId}`
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('getMember error:', error);
      throw error;
    }
  },

  /**
   * Get current user's role in a workspace
   */
  async getUserRoleInWorkspace(workspaceId: string): Promise<UserRole> {
    try {
      const response = await API.get(
        `${MEMBER_ENDPOINT}/me/role/${workspaceId}`
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('getUserRoleInWorkspace error:', error);
      throw error;
    }
  },

  /**
   * Update member's role
   */
  async updateMemberRole(
    memberId: string,
    data: UpdateMemberDTO
  ): Promise<Member> {
    try {
      const response = await API.put(
        `${MEMBER_ENDPOINT}/${memberId}`,
        data
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('updateMemberRole error:', error);
      throw error;
    }
  },

  /**
   * Remove member from workspace
   */
  async removeMember(memberId: string): Promise<void> {
    try {
      await API.delete(`${MEMBER_ENDPOINT}/${memberId}`);
    } catch (error) {
      console.error('removeMember error:', error);
      throw error;
    }
  },

  /**
   * Join workspace by invite code
   */
  async joinWorkspaceByInvite(inviteCode: string): Promise<JoinWorkspaceResponse> {
    try {
      const response = await API.post(
        `${MEMBER_ENDPOINT}/join/${inviteCode}`
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('joinWorkspaceByInvite error:', error);
      throw error;
    }
  },

  /**
   * Get member statistics for a workspace
   */
  async getMemberStats(workspaceId: string): Promise<MemberStats> {
    try {
      const response = await API.get(
        `${MEMBER_ENDPOINT}/workspace/${workspaceId}/stats`
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('getMemberStats error:', error);
      throw error;
    }
  },
};
