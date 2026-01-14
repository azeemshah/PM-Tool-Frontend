/**
 * IssueTypeSelector Component
 * Select issue type: Epic, Story, Task, Bug, Subtask
 */

import React from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { IssueType } from '@/api/issue/types';
import { Badge } from '@/components/ui/badge';

interface IssueTypeSelectorProps {
	value: IssueType | '';
	onChange: (type: IssueType) => void;
	disabled?: boolean;
}

const ISSUE_TYPES = [
	{ value: 'epic' as IssueType, label: '🎯 Epic', description: 'Large initiative' },
	{ value: 'story' as IssueType, label: '📖 Story', description: 'User story' },
	{ value: 'task' as IssueType, label: '✓ Task', description: 'Task under Epic' },
	{ value: 'bug' as IssueType, label: '🐛 Bug', description: 'Bug under Epic' },
	{ value: 'subtask' as IssueType, label: '→ Subtask', description: 'Subtask under Story/Task/Bug' },
];

export function IssueTypeSelector({ value, onChange, disabled = false }: IssueTypeSelectorProps) {
	return (
		<div className="space-y-2">
			<label className="text-sm font-medium">Issue Type</label>
			<Select value={value} onValueChange={onChange as any} disabled={disabled}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select issue type..." />
				</SelectTrigger>
				<SelectContent>
					{ISSUE_TYPES.map((type) => (
						<SelectItem key={type.value} value={type.value}>
							<div className="flex items-center gap-2">
								<span>{type.label}</span>
								<span className="text-xs text-gray-500">({type.description})</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			
			{value && (
				<div className="mt-2 text-xs text-gray-600">
					{ISSUE_TYPES.find(t => t.value === value)?.description}
				</div>
			)}
		</div>
	);
}





