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
	useCreateTaskWithoutEpic,
	useCreateBug,
	useCreateSubtask,
	useGetEpics,
	useGetEpicChildren,
} from '@/api/issue/hooks';
import { useToast } from '@/hooks/use-toast';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import useGetProjectsInWorkspaceQuery from '@/hooks/api/use-get-projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';
import { cn } from '@/lib/utils';

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
	const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
	const [issueType, setIssueType] = useState<IssueType | ''>('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [priority, setPriority] = useState<IssuePriority>('medium');
	const [epicId, setEpicId] = useState('');
	const [parentIssueId, setParentIssueId] = useState('');
	const [reporterId, setReporterId] = useState('');
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [status, setStatus] = useState('');

	const ISSUE_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

	// Queries and mutations
	const membersQuery = useGetWorkspaceMembers(workspaceId);
	const projectsQuery = useGetProjectsInWorkspaceQuery({
		workspaceId: workspaceId || '',
		pageSize: 100,
		pageNumber: 1,
		skip: false,
	});
	const epicsQuery = useGetEpics(selectedProjectId && selectedProjectId !== 'default' ? selectedProjectId : null);
	const epicChildrenQuery = useGetEpicChildren(epicId || null);

	// Normalize responses: some hooks return an array directly, others return an object with a `members`/`roles` shape
	const members = Array.isArray(membersQuery.data) ? membersQuery.data : (membersQuery.data?.members ?? []);
	const projectsData = Array.isArray(projectsQuery.data) ? projectsQuery.data : (projectsQuery.data?.projects ?? (projectsQuery.data?.data ?? []));
	const projects = Array.isArray(projectsData) ? projectsData : [];
	const epics = Array.isArray(epicsQuery.data) ? epicsQuery.data : (epicsQuery.data ?? []);
	const epicChildren = Array.isArray(epicChildrenQuery.data) ? epicChildrenQuery.data : (epicChildrenQuery.data ?? []);

	// Debug logging
	console.log('🔍 IssueCreateDialog Debug:', {
		selectedProjectId,
		projectId,
		epicsQueryKey: ['epics', selectedProjectId && selectedProjectId !== 'default' ? selectedProjectId : null],
		epicsQueryLoading: epicsQuery.isLoading,
		epicsQueryError: epicsQuery.error,
		epicsData: epicsQuery.data,
		epics: epics,
		epicCount: epics.length,
	});

	// Format options for project and reporter display
	const projectOptions = projects.map((project) => ({
		label: (
			<div className="flex items-center gap-2">
				<span>{project.emoji || '📁'}</span>
				<span>{project.name || project.projectName}</span>
			</div>
		),
		value: project._id,
	}));

	const reporterOptions = members.map((member) => {
		const name = member.userId?.name || 'Unknown';
		const initials = getAvatarFallbackText(name);
		const avatarColor = getAvatarColor(name);
		return {
			label: (
				<div className="flex items-center space-x-2">
					<Avatar className="h-6 w-6">
						<AvatarImage src={member.userId?.profilePicture || ''} alt={name} />
						<AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
					</Avatar>
					<span>{name}</span>
				</div>
			),
			value: member.userId?._id || '',
		};
	});

	const { mutate: createEpic, isPending: epicPending } = useCreateEpic();
	const { mutate: createStory, isPending: storyPending } = useCreateStory();
	const { mutate: createTask, isPending: taskPending } = useCreateTask();
	const { mutate: createTaskWithoutEpic, isPending: taskWithoutEpicPending } = useCreateTaskWithoutEpic();
	const { mutate: createBug, isPending: bugPending } = useCreateBug();
	const { mutate: createSubtask, isPending: subtaskPending } = useCreateSubtask();

	const { toast } = useToast();

	const isLoading =
		epicPending || storyPending || taskPending || taskWithoutEpicPending || bugPending || subtaskPending;

	// Reset form when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setSelectedProjectId(projectId || '');
			setIssueType('');
			setTitle('');
			setDescription('');
			setPriority('medium');
			setEpicId('');
			setParentIssueId('');
			setReporterId('');
			setDueDate(undefined);
			setStatus('');
		} else {
			// When dialog opens, set the projectId
			if (projectId && projectId !== 'default') {
				setSelectedProjectId(projectId);
			}
		}
	}, [isOpen, projectId]);

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

		if (!selectedProjectId) {
			toast({
				title: 'Error',
				description: 'Project is required',
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
					projectId: selectedProjectId,
					title: title.trim(),
					description: description.trim() || undefined,
					reporter: reporterId,
					priority,
					dueDate: dueDate?.toISOString(),
					status: status || undefined,
				},
				{
					onSuccess: () => {
						onOpenChange(false);
						onSuccess?.();
					},
				}
			);
		} else if (['story', 'task', 'bug'].includes(issueType)) {
			// Task: Epic is optional (can be created without Epic and added later)
			// Story/Bug: Epic is REQUIRED

			// Validate Epic requirement for Story and Bug
			if (['story', 'bug'].includes(issueType as string) && !epicId) {
				toast({
					title: 'Error',
					description: `${issueType.charAt(0).toUpperCase() + issueType.slice(1)} requires an Epic. Please select an Epic.`,
					variant: 'destructive',
				});
				return;
			}

			const data = {
				projectId: selectedProjectId,
				title: title.trim(),
				description: description.trim() || undefined,
				reporter: reporterId,
				priority,
				dueDate: dueDate?.toISOString(),
				status: status || undefined,
				epicId: epicId || undefined,
			};

			// For Task: can be with or without Epic
			// For Story/Bug: must have Epic
			if (epicId) {
				// Epic is selected - use endpoints with Epic
				const createFn = issueType === 'story' ? createStory : issueType === 'task' ? createTask : createBug;
				createFn(
					{
						epicId,
						data: data,
					},
					{
						onSuccess: () => {
							onOpenChange(false);
							onSuccess?.();
						},
					}
				);
			} else if (issueType === 'task') {
				// Task without Epic (ONLY Task allows this)
				createTaskWithoutEpic(data, {
					onSuccess: () => {
						onOpenChange(false);
						onSuccess?.();
					},
				});
			}
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
						projectId: selectedProjectId,
						title: title.trim(),
						description: description.trim() || undefined,
						reporter: reporterId,
						priority,
						dueDate: dueDate?.toISOString(),
						status: status || undefined,
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
				{/* Project Selection */}
				{!projectId || projectId === 'default' ? (
					<div className="space-y-2">
						<label className="text-sm font-medium">Project *</label>
						<Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
							<SelectTrigger>
								<SelectValue placeholder={projectsQuery.isPending ? 'Loading projects...' : 'Select a project...'} />
							</SelectTrigger>
					<SelectContent>
						<div className="w-full max-h-[250px] overflow-y-auto">
							{projectsQuery.isPending ? (
								<div className="p-2 text-center text-sm text-muted-foreground">
									Loading projects...
								</div>
							) : projectOptions.length > 0 ? (
								projectOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))
							) : (
								<div className="p-2 text-center text-sm text-muted-foreground">
									No projects found
								</div>
							)}
						</div>
					</SelectContent>
						</Select>
					</div>
				) : null}

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
							projectId={selectedProjectId}
							disabled={isLoading}
							optional={true}
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
								projectId={selectedProjectId}
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

			{/* Due Date */}
			<div className="space-y-2">
				<label className="text-sm font-medium">Due Date</label>
				<input
					type="date"
					value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
					onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
					disabled={isLoading}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
				/>
			</div>

			{/* Status */}
			<div className="space-y-2">
				<label className="text-sm font-medium">Status</label>
				<Select value={status} onValueChange={setStatus}>
					<SelectTrigger>
						<SelectValue placeholder="Select a status" />
					</SelectTrigger>
					<SelectContent>
						{ISSUE_STATUSES.map((s) => (
							<SelectItem key={s} value={s}>
								{s.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
						<SelectValue placeholder="Select a reporter..." />
					</SelectTrigger>
					<SelectContent>
						<div className="w-full max-h-[250px] overflow-y-auto">
							{reporterOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</div>
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
