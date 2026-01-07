/**
 * ParentSelector Component
 * Select parent issue based on type (Epic for Story/Task/Bug, Story/Task/Bug for Subtask)
 */

import React, { useMemo } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { IssueType, Epic, Story, Task, Bug } from '@/api/issue/types';
import { useGetEpics } from '@/api/issue/hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface ParentSelectorProps {
	issueType: IssueType | '';
	parentId: string;
	onChange: (parentId: string) => void;
	projectId: string | null;
	disabled?: boolean;
	epicChildren?: (Story | Task | Bug)[]; // For subtask parent selection
}

type ParentIssue = Epic | Story | Task | Bug;

export function ParentSelector({
	issueType,
	parentId,
	onChange,
	projectId,
	disabled = false,
	epicChildren = [],
}: ParentSelectorProps) {
	const { data: epics = [], isLoading: epicsLoading } = useGetEpics(projectId);

	// Determine what to show based on issue type
	const parentLabel = issueType === 'subtask' ? 'Parent Issue' : 'Epic';
	const showSelector = ['story', 'task', 'bug', 'subtask'].includes(issueType as string);

	// For Subtask: show Story/Task/Bug; for Story/Task/Bug: show Epics
	const parentOptions: ParentIssue[] = useMemo(() => {
		if (issueType === 'subtask') {
			return epicChildren; // Story/Task/Bug from epic
		}
		return epics; // All epics
	}, [issueType, epics, epicChildren]);

	if (!showSelector) {
		return null; // Epic has no parent
	}

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium">{parentLabel}</label>
			
			{epicsLoading ? (
				<Skeleton className="w-full h-10" />
			) : (
				<Select value={parentId} onValueChange={onChange} disabled={disabled || parentOptions.length === 0}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={`Select ${parentLabel.toLowerCase()}...`} />
					</SelectTrigger>
					<SelectContent>
						{parentOptions.length === 0 ? (
							<div className="p-2 text-sm text-gray-500">
								No {parentLabel.toLowerCase()} available
							</div>
						) : (
							parentOptions.map((parent) => (
								<SelectItem key={parent._id} value={parent._id}>
									<div className="flex items-center gap-2">
										<TypeIcon type={parent.type} />
										<span>{parent.title}</span>
									</div>
								</SelectItem>
							))
						)}
					</SelectContent>
				</Select>
			)}

			{parentOptions.length === 0 && !epicsLoading && (
				<div className="text-xs text-amber-600">
					{issueType === 'subtask'
						? 'Select an Epic first to see available parent issues'
						: 'No Epics available. Create an Epic first.'}
				</div>
			)}
		</div>
	);
}

/**
 * Type icon helper
 */
function TypeIcon({ type }: { type: IssueType }) {
	const icons: Record<IssueType, string> = {
		epic: '🎯',
		story: '📖',
		task: '✓',
		bug: '🐛',
		subtask: '→',
	};
	return <span>{icons[type]}</span>;
}
