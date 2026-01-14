/**
 * Hook: useIssueCreateDialog
 * State management for Issue Create Dialog
 */

import { useState } from 'react';

interface IssueCreateDialogState {
	isOpen: boolean;
	projectId: string | null;
	workspaceId: string | null;
}

export function useIssueCreateDialog() {
	const [state, setState] = useState<IssueCreateDialogState>({
		isOpen: false,
		projectId: null,
		workspaceId: null,
	});

	const open = (projectId: string | null, workspaceId: string) => {
		setState({
			isOpen: true,
			projectId,
			workspaceId,
		});
	};

	const close = () => {
		setState({
			isOpen: false,
			projectId: null,
			workspaceId: null,
		});
	};

	return {
		isOpen: state.isOpen,
		projectId: state.projectId,
		workspaceId: state.workspaceId,
		open,
		close,
	};
}





