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
import { ISSUE_TYPES_LIST } from './constants';
import { IssueTypeIcon } from './IssueTypeIcon';

interface IssueTypeSelectorProps {
	value: IssueType | '';
	onChange: (type: IssueType) => void;
	disabled?: boolean;
}

const ISSUE_DESCRIPTIONS: Record<string, string> = {
    epic: 'Large initiative',
    story: 'User story',
    task: 'Task under Epic',
    bug: 'Bug under Epic',
    subtask: 'Subtask under Story/Task/Bug',
};

const ISSUE_TYPES = ISSUE_TYPES_LIST.map(item => ({
    ...item,
    description: ISSUE_DESCRIPTIONS[item.value]
}));

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
								<IssueTypeIcon type={type.value} />
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





