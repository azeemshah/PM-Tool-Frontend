/**
 * Example: Issue Card Display
 * Shows how to display issues with the new hierarchy
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Issue, IssueType, IssuePriority } from '@/api/issue/types';

interface IssueCardProps {
  issue: Issue;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issueId: string) => void;
  showHierarchy?: boolean;
}

/**
 * Example component showing how to display an issue
 * with type, priority, hierarchy information
 */
export function IssueCard({
  issue,
  onEdit,
  onDelete,
  showHierarchy = true,
}: IssueCardProps) {
  const getTypeIcon = (type: IssueType) => {
    const icons: Record<IssueType, string> = {
      epic: '🎯',
      story: '📖',
      task: '✓',
      bug: '🐛',
      subtask: '→',
    };
    return icons[type];
  };

  const getPriorityColor = (priority?: IssuePriority) => {
    const colors: Record<IssuePriority, string> = {
      lowest: 'bg-gray-100 text-gray-800',
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      highest: 'bg-red-100 text-red-800',
    };
    return colors[priority as IssuePriority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'to-do': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'in-review': 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800',
    };
    return colors[status || 'to-do'] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      {/* Header with Type and Key */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(issue.type)}</span>
          <div>
            <h3 className="font-semibold text-sm">{issue.title}</h3>
            {issue.key && (
              <p className="text-xs text-gray-500">{issue.key}</p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(issue)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(issue._id)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {issue.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {issue.description}
        </p>
      )}

      {/* Hierarchy Information */}
      {showHierarchy && (
        <div className="text-xs text-gray-500 mb-3 space-y-1">
          {issue.epicId && (
            <div>📌 Part of Epic: {issue.epicId}</div>
          )}
          {issue.parentIssueId && (
            <div>📍 Subtask of: {issue.parentIssueId}</div>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Type Badge */}
        <Badge variant="secondary" className="text-xs">
          {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
        </Badge>

        {/* Priority Badge */}
        {issue.priority && (
          <Badge className={`text-xs ${getPriorityColor(issue.priority)}`}>
            {issue.priority}
          </Badge>
        )}

        {/* Status Badge */}
        {issue.status && (
          <Badge className={`text-xs ${getStatusColor(issue.status)}`}>
            {issue.status}
          </Badge>
        )}
      </div>

      {/* Assignee and Reporter */}
      <div className="text-xs text-gray-600 space-y-1">
        {issue.assignee && (
          <div>👤 Assigned: {issue.assignee.name}</div>
        )}
        {issue.reporter && (
          <div>👥 Reporter: {issue.reporter.name}</div>
        )}
      </div>

      {/* Due Date */}
      {issue.dueDate && (
        <div className="text-xs text-gray-600 mt-2">
          📅 Due: {new Date(issue.dueDate).toLocaleDateString()}
        </div>
      )}
    </Card>
  );
}

/**
 * Example: List of issues with hierarchy
 */
export function IssuesList({ issues }: { issues: Issue[] }) {
  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <IssueCard key={issue._id} issue={issue} />
      ))}
    </div>
  );
}

/**
 * Example: Grouped by Epic
 */
export function IssuesGroupedByEpic({ issues }: { issues: Issue[] }) {
  // Group stories, tasks, bugs by epic
  const epicMap = new Map<string, Issue[]>();
  const nonEpics = issues.filter(i => i.type !== 'epic');

  nonEpics.forEach(issue => {
    if (issue.epicId) {
      if (!epicMap.has(issue.epicId)) {
        epicMap.set(issue.epicId, []);
      }
      epicMap.get(issue.epicId)!.push(issue);
    }
  });

  // Get all epics
  const epics = issues.filter(i => i.type === 'epic');

  return (
    <div className="space-y-6">
      {epics.map((epic) => (
        <div key={epic._id}>
          {/* Epic Header */}
          <div className="mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              🎯 {epic.title}
            </h2>
            {epic.description && (
              <p className="text-sm text-gray-600">{epic.description}</p>
            )}
          </div>

          {/* Children of this Epic */}
          <div className="space-y-2 ml-4">
            {(epicMap.get(epic._id) || []).map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Tree view showing parent-child relationships
 */
export function IssuesTreeView({ issues }: { issues: Issue[] }) {
  const issuesById = new Map(issues.map(i => [i._id, i]));
  const renderIssue = (issue: Issue, level = 0) => (
    <div key={issue._id} style={{ marginLeft: `${level * 20}px` }} className="mb-2">
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
        <span>{issue.type === 'epic' ? '🎯' : issue.type === 'story' ? '📖' : issue.type === 'task' ? '✓' : issue.type === 'bug' ? '🐛' : '→'}</span>
        <span className="font-medium">{issue.title}</span>
      </div>

      {/* Show children */}
      {issue.children?.map((child) => renderIssue(child, level + 1))}
      {issue.subtasks?.map((subtask) => renderIssue(subtask, level + 1))}
    </div>
  );

  return (
    <div className="space-y-2">
      {issues.filter(i => i.type === 'epic').map((epic) => renderIssue(epic))}
    </div>
  );
}





