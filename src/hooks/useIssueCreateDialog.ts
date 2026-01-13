/**
 * Hook: useIssueCreateDialog
 * State management for Issue Create Dialog
 */

import { useState } from 'react';

interface IssueCreateDialogState {
	isOpen: boolean;
	workspaceId: string | null;
}

export function useIssueCreateDialog() {
	const [state, setState] = useState<IssueCreateDialogState>({
		isOpen: false,
		workspaceId: null,
	});

	const open = (workspaceId: string) => {
		setState({
			isOpen: true,
			workspaceId,
		});
	};

	const close = () => {
		setState({
			isOpen: false,
			workspaceId: null,
		});
	};

	return {
		isOpen: state.isOpen,
		workspaceId: state.workspaceId,
		open,
		close,
	};
}
