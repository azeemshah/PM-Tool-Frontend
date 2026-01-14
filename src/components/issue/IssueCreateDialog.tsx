/**
 * IssueCreateDialog (DTO-driven)
 */

import React, { useEffect, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';

import { getAvatarColor, getAvatarFallbackText } from '@/lib/helper';

import {
	ItemPriority,
	ItemStatus,
	ItemType,
	CreateItemDto,
} from '../../api/issue/types/index';
import { issueApiService } from '../../api/issue/services/issueApiService';

interface IssueCreateDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	onSuccess?: () => void;
}

/* --------------------------------------------
 * Types
 * ------------------------------------------ */
type CreateItemFormState = Omit<
	CreateItemDto,
	'assignedTo' | 'column' | 'parent'
>;

/* --------------------------------------------
 * Constants
 * ------------------------------------------ */
const PRIORITIES: ItemPriority[] = [
	'lowest',
	'low',
	'medium',
	'high',
	'highest',
];

const STATUSES: ItemStatus[] = [
	'Backlog',
	'Todo',
	'In Progress',
	'Review',
	'Done',
];

/* --------------------------------------------
 * Helpers
 * ------------------------------------------ */
function mapFormToDto(form: CreateItemFormState): CreateItemDto {
	return {
		...form,
		description: form.description?.trim() || undefined,
		dueDate: form.dueDate || undefined,
		status: form.status || undefined,
		priority: form.priority || undefined,
	};
}

/* --------------------------------------------
 * Component
 * ------------------------------------------ */
export function IssueCreateDialog({
	isOpen,
	onOpenChange,
	workspaceId,
	onSuccess,
}: IssueCreateDialogProps) {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	/* --------------------------------------------
	 * DTO-backed form state
	 * ------------------------------------------ */
	const [form, setForm] = useState<CreateItemFormState>({
		title: '',
		description: '',
		type: 'task',
		status: 'Todo',
		priority: 'medium',
		assignedTo: '',
		dueDate: undefined,
		workspace: workspaceId,
	});

	/* --------------------------------------------
	 * Members
	 * ------------------------------------------ */
	const membersQuery = useGetWorkspaceMembers(workspaceId);
	const members = Array.isArray(membersQuery.data)
		? membersQuery.data
		: membersQuery.data?.members ?? [];

	// Default selection for assignedTo
	useEffect(() => {
		if (!form.assignedTo && members.length > 0) {
			setForm((prev) => ({
				...prev,
				assignedTo: members[0].userId?._id,
			}));
		}
	}, [members, form.assignedTo]);

	/* --------------------------------------------
	 * Reset on close
	 * ------------------------------------------ */
	useEffect(() => {
		if (!isOpen) {
			setForm({
				title: '',
				description: '',
				type: 'task',
				status: 'Todo',
				priority: 'medium',
				assignedTo: '',
				dueDate: undefined,
				workspace: workspaceId,
			});
		}
	}, [isOpen, workspaceId]);

	/* --------------------------------------------
	 * Mutation
	 * ------------------------------------------ */
	const { mutate: createItem, isLoading } = useMutation({
		mutationFn: (data: CreateItemDto) => issueApiService.createEpic(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['items', 'workspace', workspaceId],
			});
			onOpenChange(false);
			onSuccess?.();
		},
		onError: () => {
			toast({
				title: 'Error',
				description: 'Failed to create issue',
				variant: 'destructive',
			});
		},
	});

	/* --------------------------------------------
	 * Submit
	 * ------------------------------------------ */
	const handleSubmit = () => {
		if (!form.title.trim()) {
			toast({
				title: 'Error',
				description: 'Title is required',
				variant: 'destructive',
			});
			return;
		}

		if (!form.type) {
			toast({
				title: 'Error',
				description: 'Type is required',
				variant: 'destructive',
			});
			return;
		}

		if (!form.assignedTo) {
			toast({
				title: 'Error',
				description: 'Assigned To is required',
				variant: 'destructive',
			});
			return;
		}

		const dto = mapFormToDto(form);
		createItem(dto);
	};

	/* --------------------------------------------
	 * UI
	 * ------------------------------------------ */
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Issue</DialogTitle>
					<DialogDescription>
						Create a new issue using a unified DTO-based form
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Title */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Title *</label>
						<Input
							value={form.title}
							onChange={(e) =>
								setForm({ ...form, title: e.target.value })
							}
							disabled={isLoading}
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Description</label>
						<Textarea
							rows={4}
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
						/>
					</div>

					{/* Type */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Type *</label>
						<Select
							value={form.type}
							onValueChange={(v) =>
								setForm({ ...form, type: v as ItemType })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{['epic', 'story', 'task', 'bug', 'subtask'].map((t) => (
									<SelectItem key={t} value={t}>
										{t.toUpperCase()}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Priority */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Priority</label>
						<Select
							value={form.priority}
							onValueChange={(v) =>
								setForm({ ...form, priority: v as ItemPriority })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PRIORITIES.map((p) => (
									<SelectItem key={p} value={p}>
										{p.toUpperCase()}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Status */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Status</label>
						<Select
							value={form.status}
							onValueChange={(v) =>
								setForm({ ...form, status: v as ItemStatus })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{s.toUpperCase()}
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
							value={form.dueDate?.split('T')[0] || ''}
							onChange={(e) =>
								setForm({
									...form,
									dueDate: e.target.value
										? new Date(e.target.value).toISOString()
										: undefined,
								})
							}
							className="w-full px-3 py-2 border rounded-lg"
						/>
					</div>

					{/* Assigned To */}
					<div className="space-y-2">
						<label className="text-sm font-medium">Assigned To *</label>
						<Select
							value={form.assignedTo}
							onValueChange={(v) =>
								setForm({ ...form, assignedTo: v })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="max-h-[250px] overflow-y-auto">
								{members.map((m) => {
									const name = m.userId?.name || 'Unknown';
									return (
										<SelectItem key={m.userId?._id} value={m.userId?._id}>
											<div className="flex items-center gap-2">
												<Avatar className="h-6 w-6">
													<AvatarImage src={m.userId?.profilePicture} />
													<AvatarFallback
														className={getAvatarColor(name)}
													>
														{getAvatarFallbackText(name)}
													</AvatarFallback>
												</Avatar>
												{name}
											</div>
										</SelectItem>
									);
								})}
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
					<Button onClick={handleSubmit} disabled={isLoading}>
						{isLoading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Create Issue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
