/**
 * IssueCreateDialog Component
 * Complete dialog for creating issues with the new hierarchy
 */

import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { IssueTypeSelector } from './IssueTypeSelector';
import { ParentSelector } from './ParentSelector';
import { IssueType, IssuePriority } from '@/api/issue/types';
import {
	useCreateEpic,
	useCreateStory,
	useCreateTask,
	useCreateBug,
	useCreateSubtask,
	useGetEpics,
	useGetEpicChildren,
} from '@/api/issue/hooks';
import { useToast } from '@/hooks/use-toast';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';

interface IssueCreateDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: string;
	workspaceId: string;
	onSuccess?: () => void;
}

const PRIORITIES: IssuePriority[] = ['lowest', 'low', 'medium', 'high', 'highest'];

export function IssueCreateDialog({
	isOpen,
	onOpenChange,
	projectId,
	workspaceId,
	onSuccess,
}: IssueCreateDialogProps) {
	// Form state
	const [issueType, setIssueType] = useState<IssueType | ''>('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [priority, setPriority] = useState<IssuePriority>('medium');
	const [epicId, setEpicId] = useState('');
	const [parentIssueId, setParentIssueId] = useState('');
	const [reporterId, setReporterId] = useState('');

	// Queries and mutations
	const membersQuery = useGetWorkspaceMembers(workspaceId);
	const epicsQuery = useGetEpics(projectId && projectId !== 'default' ? projectId : null);
	const epicChildrenQuery = useGetEpicChildren(epicId || null);

	// Normalize responses: some hooks return an array directly, others return an object with a `members`/`roles` shape
	const members = Array.isArray(membersQuery.data) ? membersQuery.data : (membersQuery.data?.members ?? []);
	const epics = Array.isArray(epicsQuery.data) ? epicsQuery.data : (epicsQuery.data ?? []);
	const epicChildren = Array.isArray(epicChildrenQuery.data) ? epicChildrenQuery.data : (epicChildrenQuery.data ?? []);

	const { mutate: createEpic, isPending: epicPending } = useCreateEpic();
	const { mutate: createStory, isPending: storyPending } = useCreateStory();
	const { mutate: createTask, isPending: taskPending } = useCreateTask();
	const { mutate: createBug, isPending: bugPending } = useCreateBug();
	const { mutate: createSubtask, isPending: subtaskPending } = useCreateSubtask();

	const { toast } = useToast();

	const isLoading =
		epicPending || storyPending || taskPending || bugPending || subtaskPending;

	// Reset form when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setIssueType('');
			setTitle('');
			setDescription('');
			setPriority('medium');
			setEpicId('');
			setParentIssueId('');
			setReporterId('');
		}
	}, [isOpen]);

	// Set default reporter
	useEffect(() => {
		if (members.length > 0 && !reporterId) {
			setReporterId(members[0]?.userId?._id || '');
		}
	}, [members, reporterId]);

	const handleCreate = async () => {
		// Validate required fields
		if (!title.trim()) {
			toast({
				title: 'Error',
				description: 'Title is required',
				variant: 'destructive',
			});
			return;
		}

		if (!issueType) {
			toast({
				title: 'Error',
				description: 'Issue type is required',
				variant: 'destructive',
			});
			return;
		}

		if (!reporterId) {
			toast({
				title: 'Error',
				description: 'Reporter is required',
				variant: 'destructive',
			});
			return;
		}

		// Validate parent selections
		if (issueType === 'epic') {
			// Epic: no parent needed
			createEpic(
				{
					projectId,
					title: title.trim(),
					description: description.trim() || undefined,
					reporter: reporterId,
					priority,
				},
				{
					onSuccess: () => {
						onOpenChange(false);
						onSuccess?.();
					},
				}
			);
		} else if (['story', 'task', 'bug'].includes(issueType)) {
			// Story/Task/Bug: must have epicId
			if (!epicId) {
				toast({
					title: 'Error',
					description: `${issueType} must be assigned to an Epic`,
					variant: 'destructive',
				});
				return;
			}

			const createFn = issueType === 'story' ? createStory : issueType === 'task' ? createTask : createBug;
			createFn(
				{
					epicId,
					data: {
						projectId,
						title: title.trim(),
						description: description.trim() || undefined,
						reporter: reporterId,
						priority,
					},
				},
				{
					onSuccess: () => {
						onOpenChange(false);
						onSuccess?.();
					},
				}
			);
		} else if (issueType === 'subtask') {
			// Subtask: must have parentIssueId
			if (!parentIssueId) {
				toast({
					title: 'Error',
					description: 'Subtask must be assigned to a parent issue (Story/Task/Bug)',
					variant: 'destructive',
				});
				return;
			}

			createSubtask(
				{
					parentIssueId,
					data: {
						projectId,
						title: title.trim(),
						description: description.trim() || undefined,
						reporter: reporterId,
						priority,
					},
				},
				{
					onSuccess: () => {
						onOpenChange(false);
						onSuccess?.();
					},
				}
			);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Issue</DialogTitle>
					<DialogDescription>
						Create a new Epic, Story, Task, Bug, or Subtask with the correct hierarchy
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Issue Type Selection */}
					<IssueTypeSelector
						value={issueType}
						onChange={setIssueType}
						disabled={isLoading}
					/>

					{/* Parent Selection (based on type) */}
					{issueType === 'epic' && (
						<div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
							Epic is a top-level issue with no parent
						</div>
					)}

					{['story', 'task', 'bug'].includes(issueType as string) && (
						<ParentSelector
							issueType={issueType}
							parentId={epicId}
							onChange={setEpicId}
							projectId={projectId}
							disabled={isLoading}
						/>
					)}

					{issueType === 'subtask' && (
						<>
							{/* First select Epic to show its children */}
							{!epicId ? (
								<div className="space-y-2">
									<label className="text-sm font-medium">Step 1: Select Epic</label>
									<Select value={epicId} onValueChange={setEpicId}>
										<SelectTrigger>
											<SelectValue placeholder="Select an Epic..." />
										</SelectTrigger>
										<SelectContent>
											{epics.map((epic) => (
												<SelectItem key={epic._id} value={epic._id}>
													🎯 {epic.title}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							) : null}

							{/* Then select parent from epic children */}
							{epicId && (
								<ParentSelector
									issueType="subtask"
									parentId={parentIssueId}
									onChange={setParentIssueId}
									projectId={projectId}
									disabled={isLoading}
									epicChildren={epicChildren}
								/>
							)}
						</>
					)}

					{/* Title */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Title *</label>
						<Input
							placeholder="Enter issue title..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={isLoading}
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Description</label>
						<Textarea
							placeholder="Enter issue description..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isLoading}
							rows={4}
						/>
					</div>

					{/* Priority */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Priority</label>
						<Select value={priority} onValueChange={setPriority as any}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PRIORITIES.map((p) => (
									<SelectItem key={p} value={p}>
										{p.charAt(0).toUpperCase() + p.slice(1)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Reporter */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Reporter *</label>
						<Select value={reporterId} onValueChange={setReporterId}>
							<SelectTrigger>
								<SelectValue placeholder="Select reporter..." />
							</SelectTrigger>
							<SelectContent>
								{members.map((member) => (
									<SelectItem key={member._id} value={member.userId?._id || ''}>
										{member.userId?.name || 'Unknown'}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Create {issueType ? issueType.charAt(0).toUpperCase() + issueType.slice(1) : 'Issue'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
