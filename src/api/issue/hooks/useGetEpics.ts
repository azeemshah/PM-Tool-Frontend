/**
 * Hook: useGetEpics
 * Fetch all Epics in a project
 */

import { useQuery } from '@tanstack/react-query';
import { issueApiService } from '../services/issueApiService';
import { Epic } from '../types';

export function useGetEpics(projectId: string | null) {
	console.log('📡 useGetEpics called with projectId:', projectId);
	
	const query = useQuery({
		queryKey: ['epics', projectId],
		queryFn: async () => {
			console.log('📡 useGetEpics - queryFn executing with projectId:', projectId);
			if (!projectId) {
				console.log('📡 useGetEpics - projectId is null, returning empty array');
				return [];
			}
			try {
				const result: Epic[] = await issueApiService.getEpicsByWorkspace(projectId);
				console.log('📡 useGetEpics - API result:', result);
				return result;
			} catch (error) {
				console.error('❌ useGetEpics - API Error:', error);
				throw error;
			}
		},
		enabled: !!projectId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	console.log('📡 useGetEpics - query state:', {
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		dataLength: query.data?.length ?? 'undefined',
		data: query.data,
	});

	return query;
}





